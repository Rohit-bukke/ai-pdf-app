import { connectToDatabase } from "../db/mongodb";
import { Concept } from "@/models/Concept";
import { Mastery } from "@/models/Mastery";
import { Question, IQuestion } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Chunk } from "@/models/Chunk";
import { aiProvider } from "../ai";
import { ActivityEvent } from "@/models/ActivityEvent";
import { inngest } from "../inngest/client";
import { z } from "zod";
import mongoose from "mongoose";

const GeneratedQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      conceptName: z.string(),
      questionText: z.string().min(5),
      type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
      options: z.array(z.string()).min(2),
      correctAnswer: z.string(),
      explanation: z.string(),
      citationHint: z.string().optional(),
    })
  ),
});

/**
 * Generates an adaptive quiz based on the user's current concept mastery and prerequisite graph.
 */
export async function generateAdaptiveQuiz(options: {
  userId: string;
  projectId: string;
  questionCount?: number;
}) {
  await connectToDatabase();
  const count = options.questionCount || 4;

  // 1. Fetch concepts for the project
  const concepts = await Concept.find({ projectId: options.projectId }).lean();
  if (concepts.length === 0) {
    throw new Error("No concepts found for this project. Please upload study materials first.");
  }

  // 2. Fetch current user masteries
  const masteries = await Mastery.find({
    userId: options.userId,
    projectId: options.projectId,
  }).lean();

  const masteryMap = new Map(masteries.map((m) => [m.conceptId.toString(), m]));

  // 3. Sort concepts by priority: Needs Attention (< 50) -> Unassessed -> Learning -> Mastered
  const prioritizedConcepts = [...concepts].sort((a, b) => {
    const scoreA = masteryMap.get(a._id.toString())?.masteryScore ?? -1;
    const scoreB = masteryMap.get(b._id.toString())?.masteryScore ?? -1;
    return scoreA - scoreB;
  });

  const targetConcepts = prioritizedConcepts.slice(0, count);

  // 4. Retrieve reference chunk content for grounding
  const sampleChunks = await Chunk.find({ projectId: options.projectId })
    .limit(8)
    .lean();

  const materialContext = sampleChunks
    .map((c) => `[${c.metadata?.documentName || "Doc"} Page ${c.pageNumber}]: ${c.content}`)
    .join("\n\n")
    .substring(0, 4000);

  // 5. Generate structured questions using Gemini
  const prompt = `Generate a ${count}-question assessment for these specific concepts: ${targetConcepts.map((c) => c.name).join(", ")}.

Reference study material:
<retrieved_content>
${materialContext}
</retrieved_content>

Ensure questions test genuine understanding rather than superficial recall. Provide 4 distinct options for multiple choice questions with exactly one correct option.`;

  const structuredResult = await aiProvider.generateStructured({
    prompt,
    schema: GeneratedQuestionsSchema,
    systemInstruction: "You are an expert psychometric assessment developer. Generate rigorous, clear questions based on provided material.",
    userId: options.userId,
    projectId: options.projectId,
    feature: "QUIZ_GENERATION",
  });

  // 6. Persist generated questions in database linked to concepts
  const savedQuestions = [];
  for (const q of structuredResult.data.questions) {
    const matchedConcept =
      targetConcepts.find(
        (c) => c.name.toLowerCase() === q.conceptName.toLowerCase()
      ) || targetConcepts[0];

    const newQuestion = await Question.create({
      projectId: options.projectId,
      conceptId: matchedConcept._id,
      questionText: q.questionText,
      type: q.type,
      difficulty: q.difficulty,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      citationHint: q.citationHint || `Page ${sampleChunks[0]?.pageNumber || 1}`,
    });

    savedQuestions.push(newQuestion);
  }

  return savedQuestions;
}

export interface QuizSubmissionItem {
  questionId: string;
  userAnswer: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

/**
 * Evaluates quiz attempt, computes metacognitive calibration, and updates mastery.
 */
export async function evaluateQuizSubmission(options: {
  userId: string;
  projectId: string;
  answers: QuizSubmissionItem[];
}) {
  await connectToDatabase();
  const { userId, projectId, answers } = options;

  let totalQuestions = answers.length;
  let correctCount = 0;
  let highConfidenceErrors = 0;
  let calibrationSum = 0;

  const evaluatedItems = [];

  for (const item of answers) {
    const question = await Question.findById(item.questionId).populate("conceptId");
    if (!question) continue;

    const isCorrect =
      item.userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    if (isCorrect) correctCount++;

    // Metacognitive analysis:
    // High Confidence + Correct = Calibrated mastery boost (+15)
    // High Confidence + Incorrect = Severe Overconfidence penalty (-20)
    // Low Confidence + Correct = Lucky / partial understanding (+5)
    // Low Confidence + Incorrect = Calibrated awareness of gap (-5)
    let scoreDelta = 0;
    let calibrationItemScore = 100;

    if (item.confidence === "HIGH") {
      if (isCorrect) {
        scoreDelta = 18;
        calibrationItemScore = 100;
      } else {
        scoreDelta = -22;
        highConfidenceErrors++;
        calibrationItemScore = 20; // Poor calibration
      }
    } else if (item.confidence === "MEDIUM") {
      scoreDelta = isCorrect ? 10 : -10;
      calibrationItemScore = 80;
    } else {
      // LOW
      scoreDelta = isCorrect ? 5 : -5;
      calibrationItemScore = isCorrect ? 60 : 90; // Aware of uncertainty
    }

    calibrationSum += calibrationItemScore;

    // Update Concept Mastery
    let mastery = await Mastery.findOne({
      userId,
      projectId,
      conceptId: question.conceptId,
    });

    if (!mastery) {
      mastery = new Mastery({
        userId,
        projectId,
        conceptId: question.conceptId,
        masteryScore: 50,
        attemptsCount: 0,
        correctCount: 0,
        highConfidenceMistakes: 0,
        history: [],
      });
    }

    const prevScore = mastery.masteryScore;
    const newScore = Math.min(100, Math.max(0, prevScore + scoreDelta));

    mastery.masteryScore = newScore;
    mastery.attemptsCount += 1;
    if (isCorrect) mastery.correctCount += 1;
    if (item.confidence === "HIGH" && !isCorrect) {
      mastery.highConfidenceMistakes += 1;
    }
    mastery.status =
      newScore >= 80 ? "MASTERED" : newScore < 50 ? "NEEDS_ATTENTION" : "LEARNING";
    mastery.lastAssessedAt = new Date();
    mastery.history.push({ score: newScore, delta: scoreDelta, timestamp: new Date() });

    await mastery.save();

    evaluatedItems.push({
      questionId: question._id,
      conceptId: question.conceptId,
      questionText: question.questionText,
      userAnswer: item.userAnswer,
      correctAnswer: question.correctAnswer,
      confidence: item.confidence,
      isCorrect,
      score: isCorrect ? 100 : 0,
      aiFeedback: question.explanation,
    });
  }

  const overallScore = Math.round((correctCount / (totalQuestions || 1)) * 100);
  const averageCalibration = Math.round(calibrationSum / (totalQuestions || 1));

  const attempt = await QuizAttempt.create({
    userId,
    projectId,
    items: evaluatedItems,
    totalQuestions,
    correctCount,
    overallScore,
    highConfidenceErrors,
    calibrationScore: averageCalibration,
    completedAt: new Date(),
  });

  // Log activity event
  await ActivityEvent.create({
    userId,
    projectId,
    eventType: "QUIZ_COMPLETED",
    title: `Completed quiz (${correctCount}/${totalQuestions} correct, ${overallScore}%)`,
    metadata: {
      attemptId: attempt._id,
      score: overallScore,
      highConfidenceErrors,
      calibrationScore: averageCalibration,
    },
  });

  // Trigger background context & recommendation evaluation
  try {
    await inngest.send([
      {
        name: "quiz/completed",
        data: { userId, projectId, attemptId: attempt._id.toString() },
      },
      {
        name: "mastery/updated",
        data: { userId, projectId },
      },
    ]);
  } catch (inngestErr) {
    console.warn("[Inngest] Local event trigger warning:", inngestErr);
  }

  return {
    attemptId: attempt._id,
    overallScore,
    correctCount,
    totalQuestions,
    highConfidenceErrors,
    calibrationScore: averageCalibration,
    items: evaluatedItems,
  };
}
