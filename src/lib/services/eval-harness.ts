import { connectToDatabase } from "../db/mongodb";
import { Evaluation } from "@/models/Evaluation";
import { askAiTutor } from "./rag-tutor";
import { env } from "../env";
import evalData from "@/eval/evaluation-dataset.json";
import crypto from "crypto";

export interface EvaluationSummary {
  runId: string;
  totalTests: number;
  passCount: number;
  failCount: number;
  averageGroundedness: number;
  averageCitationAccuracy: number;
  averageUnsupportedHandling: number;
  results: any[];
}

export async function runEvaluationSuite(options: {
  projectId: string;
  userId: string;
  promptVersion?: string;
}): Promise<EvaluationSummary> {
  await connectToDatabase();
  const runId = `eval-run-${crypto.randomUUID().substring(0, 8)}`;
  const promptVersion = options.promptVersion || "v1.0.0-production";
  const aiModel = env.GEMINI_MODEL;

  const results = [];
  let groundednessSum = 0;
  let citationSum = 0;
  let unsupportedSum = 0;
  let passCount = 0;

  for (const testCase of evalData) {
    const start = Date.now();
    try {
      const response = await askAiTutor({
        userId: options.userId,
        projectId: options.projectId,
        question: testCase.question,
      });

      const latencyMs = Date.now() - start;
      const answer = response.answer;
      const citations = response.citations;

      let groundednessScore = 100;
      let citationAccuracyScore = 100;
      let unsupportedHandlingScore = 100;
      let passed = true;

      if (testCase.isUnsupported) {
        // Must recognize that material lacks info
        const declinedGracefully =
          !response.hasSufficientSupport ||
          answer.toLowerCase().includes("not contain sufficient") ||
          answer.toLowerCase().includes("couldn't find") ||
          answer.toLowerCase().includes("does not provide");

        if (declinedGracefully) {
          unsupportedHandlingScore = 100;
          groundednessScore = 100;
          citationAccuracyScore = 100;
        } else {
          unsupportedHandlingScore = 20; // Hallucination penalty
          passed = false;
        }
      } else {
        // Grounded test case
        const hasCitations = citations.length > 0 || answer.includes("Page");
        citationAccuracyScore = hasCitations ? 95 : 30;
        groundednessScore = response.hasSufficientSupport ? 90 : 40;

        if (citationAccuracyScore < 70 || groundednessScore < 70) {
          passed = false;
        }
      }

      if (passed) passCount++;

      groundednessSum += groundednessScore;
      citationSum += citationAccuracyScore;
      unsupportedSum += unsupportedHandlingScore;

      const evalDoc = await Evaluation.create({
        runId,
        testCaseId: testCase.id,
        promptVersion,
        aiModel,
        question: testCase.question,
        expectedAnswer: testCase.expectedBehavior,
        actualAnswer: answer,
        expectedCitation: testCase.expectedCitation,
        actualCitation: citations.map((c) => `${c.documentName} P.${c.pageNumber}`).join("; "),
        groundednessScore,
        citationAccuracyScore,
        unsupportedHandlingScore,
        latencyMs,
        passed,
      });

      results.push(evalDoc);
    } catch (err: any) {
      const evalDoc = await Evaluation.create({
        runId,
        testCaseId: testCase.id,
        promptVersion,
        aiModel,
        question: testCase.question,
        expectedAnswer: testCase.expectedBehavior,
        actualAnswer: `Error: ${err.message}`,
        groundednessScore: 0,
        citationAccuracyScore: 0,
        unsupportedHandlingScore: 0,
        latencyMs: 0,
        passed: false,
        notes: err.message,
      });
      results.push(evalDoc);
    }
  }

  const total = evalData.length || 1;

  return {
    runId,
    totalTests: evalData.length,
    passCount,
    failCount: evalData.length - passCount,
    averageGroundedness: Math.round(groundednessSum / total),
    averageCitationAccuracy: Math.round(citationSum / total),
    averageUnsupportedHandling: Math.round(unsupportedSum / total),
    results,
  };
}
