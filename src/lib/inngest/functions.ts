import { inngest } from "./client";
import { connectToDatabase } from "../db/mongodb";
import { Material } from "@/models/Material";
import { Mastery } from "@/models/Mastery";
import { Concept } from "@/models/Concept";
import { LearnerContext } from "@/models/LearnerContext";
import { Recommendation } from "@/models/Recommendation";
import { QuizAttempt } from "@/models/QuizAttempt";
import { processPdfDocument } from "../services/pdf-processor";
import { aiProvider } from "../ai";
import { z } from "zod";

/**
 * Background PDF Processing Workflow
 */
export const pdfProcessingJob = inngest.createFunction(
  { id: "process-pdf-workflow", retries: 2 },
  { event: "material/uploaded" },
  async ({ event, step }) => {
    const { materialId, base64Buffer } = event.data;

    return await step.run("extract-chunk-and-embed", async () => {
      const buffer = Buffer.from(base64Buffer, "base64");
      return await processPdfDocument(materialId, buffer);
    });
  }
);

/**
 * Distills persistent learner context from recent quiz performance and interactions.
 */
export const distillLearnerContextJob = inngest.createFunction(
  { id: "distill-learner-context", retries: 1 },
  { event: "quiz/completed" },
  async ({ event, step }) => {
    const { userId, projectId, attemptId } = event.data;

    await step.run("update-learner-memory", async () => {
      await connectToDatabase();
      const attempt = await QuizAttempt.findById(attemptId).populate("items.conceptId");
      if (!attempt) return;

      let learnerContext = await LearnerContext.findOne({ userId, projectId });
      if (!learnerContext) {
        learnerContext = await LearnerContext.create({
          userId,
          projectId,
          goals: ["Master study material"],
          strengths: [],
          weaknesses: [],
          learnedFacts: [],
        });
      }

      // Find strong vs weak concepts from this attempt
      const correctConcepts = attempt.items
        .filter((i) => i.isCorrect)
        .map((i) => (i.conceptId as any)?.name || "Concept")
        .filter(Boolean);

      const weakConcepts = attempt.items
        .filter((i) => !i.isCorrect)
        .map((i) => (i.conceptId as any)?.name || "Concept")
        .filter(Boolean);

      // Overconfidence indicator: high confidence mistakes
      const overconfidenceDelta = attempt.highConfidenceErrors > 0 ? 1 : -0.5;
      const newTendency = Math.min(
        10,
        Math.max(0, (learnerContext.metacognitiveProfile.overconfidenceTendency || 0) + overconfidenceDelta)
      );

      // Merge unique sets
      const strengths = Array.from(new Set([...learnerContext.strengths, ...correctConcepts])).slice(0, 10);
      const weaknesses = Array.from(new Set([...learnerContext.weaknesses, ...weakConcepts])).slice(0, 10);

      learnerContext.strengths = strengths;
      learnerContext.weaknesses = weaknesses;
      learnerContext.metacognitiveProfile.overconfidenceTendency = newTendency;
      learnerContext.metacognitiveProfile.lastUpdated = new Date();
      learnerContext.summary = `Learner has demonstrated grasp in [${strengths.slice(0, 3).join(", ")}] with focal review needed on [${weaknesses.slice(0, 3).join(", ")}]. Overconfidence index: ${newTendency.toFixed(1)}/10.`;

      await learnerContext.save();
    });
  }
);

/**
 * Generates actionable, concept-dependency-aware learning recommendations.
 */
export const generateRecommendationsJob = inngest.createFunction(
  { id: "generate-recommendations", retries: 1 },
  { event: "mastery/updated" },
  async ({ event, step }) => {
    const { userId, projectId } = event.data;

    await step.run("evaluate-dependency-recommendations", async () => {
      await connectToDatabase();

      // Find concepts with low mastery (< 60)
      const weakMasteries = await Mastery.find({
        userId,
        projectId,
        masteryScore: { $lt: 60 },
      }).populate("conceptId");

      for (const mastery of weakMasteries) {
        const concept = mastery.conceptId as any;
        if (!concept) continue;

        // Check if concept has prerequisite dependencies in the DAG
        if (concept.dependencies && concept.dependencies.length > 0) {
          const prereqMastery = await Mastery.findOne({
            userId,
            projectId,
            conceptId: { $in: concept.dependencies },
            masteryScore: { $lt: 70 },
          }).populate("conceptId");

          if (prereqMastery) {
            const prereqConcept = prereqMastery.conceptId as any;
            const existingRec = await Recommendation.findOne({
              userId,
              projectId,
              conceptId: prereqConcept._id,
              isResolved: false,
            });

            if (!existingRec) {
              await Recommendation.create({
                userId,
                projectId,
                conceptId: prereqConcept._id,
                title: `Review Prerequisite: ${prereqConcept.name}`,
                description: `Before advancing in "${concept.name}", strengthen your grasp of foundational concept "${prereqConcept.name}".`,
                priority: "HIGH",
                actionType: "REVIEW_PREREQUISITE",
                rationale: `Struggling in ${concept.name} is frequently caused by gaps in foundational prerequisite ${prereqConcept.name}.`,
              });
            }
            continue;
          }
        }

        // Standard targeted recommendation
        const existingRec = await Recommendation.findOne({
          userId,
          projectId,
          conceptId: concept._id,
          isResolved: false,
        });

        if (!existingRec) {
          await Recommendation.create({
            userId,
            projectId,
            conceptId: concept._id,
            title: `Practice Concept: ${concept.name}`,
            description: `Your mastery score is ${mastery.masteryScore}%. Review the core definitions and take a focused quiz.`,
            priority: mastery.masteryScore < 40 ? "HIGH" : "MEDIUM",
            actionType: "PRACTICE_QUESTIONS",
            rationale: `Targeted practice on weak concepts produces the highest learning velocity.`,
          });
        }
      }
    });
  }
);
