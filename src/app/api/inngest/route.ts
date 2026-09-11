import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  pdfProcessingJob,
  distillLearnerContextJob,
  generateRecommendationsJob,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    pdfProcessingJob,
    distillLearnerContextJob,
    generateRecommendationsJob,
  ],
});
