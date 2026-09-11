import { connectToDatabase } from "../db/mongodb";
import { Mastery } from "@/models/Mastery";
import { Concept } from "@/models/Concept";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Recommendation } from "@/models/Recommendation";
import { ActivityEvent } from "@/models/ActivityEvent";
import { AiRequestLog } from "@/models/AiRequestLog";
import mongoose from "mongoose";

export async function getProjectAnalytics(userId: string, projectId: string) {
  await connectToDatabase();
  const userObjId = new mongoose.Types.ObjectId(userId);
  const projectObjId = new mongoose.Types.ObjectId(projectId);

  // 1. Mastery Breakdown
  const masteries = await Mastery.find({
    userId: userObjId,
    projectId: projectObjId,
  }).populate("conceptId").lean();

  const mastered = masteries.filter((m) => m.masteryScore >= 80);
  const learning = masteries.filter((m) => m.masteryScore >= 50 && m.masteryScore < 80);
  const needsAttention = masteries.filter((m) => m.masteryScore < 50);

  const averageMastery =
    masteries.length > 0
      ? Math.round(masteries.reduce((acc, m) => acc + m.masteryScore, 0) / masteries.length)
      : 0;

  // 2. Quiz Performance Over Time
  const quizHistory = await QuizAttempt.find({
    userId: userObjId,
    projectId: projectObjId,
  })
    .sort({ completedAt: 1 })
    .limit(15)
    .lean();

  // 3. Metacognitive Overconfidence Metrics
  const totalHighConfidenceErrors = quizHistory.reduce(
    (acc, q) => acc + (q.highConfidenceErrors || 0),
    0
  );

  // 4. Actionable Recommendations
  const recommendations = await Recommendation.find({
    userId: userObjId,
    projectId: projectObjId,
    isResolved: false,
  })
    .sort({ priority: 1, createdAt: -1 })
    .lean();

  // 5. Recent Activity
  const activities = await ActivityEvent.find({
    userId: userObjId,
    projectId: projectObjId,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    summary: {
      averageMastery,
      totalConcepts: masteries.length,
      masteredCount: mastered.length,
      learningCount: learning.length,
      needsAttentionCount: needsAttention.length,
      quizzesTaken: quizHistory.length,
      totalHighConfidenceErrors,
    },
    masteryList: masteries,
    quizHistory: quizHistory.map((q) => ({
      id: q._id.toString(),
      score: q.overallScore,
      calibrationScore: q.calibrationScore,
      date: q.completedAt,
    })),
    recommendations,
    activities,
  };
}

export async function getAdminPlatformAnalytics() {
  await connectToDatabase();

  // Aggregate AI Token Usage and Costs
  const aiStats = await AiRequestLog.aggregate([
    {
      $group: {
        _id: "$feature",
        totalCalls: { $sum: 1 },
        totalTokens: { $sum: "$totalTokens" },
        avgLatencyMs: { $avg: "$latencyMs" },
        successCount: { $sum: { $cond: ["$success", 1, 0] } },
        errorCount: { $sum: { $cond: ["$success", 0, 1] } },
      },
    },
  ]);

  const recentLogs = await AiRequestLog.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const recentErrors = await AiRequestLog.find({ success: false })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    aiStats,
    recentLogs,
    recentErrors,
  };
}
