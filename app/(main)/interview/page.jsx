import { getAssessments, generateQuiz } from "@/actions/interview";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performace-chart";
import QuizList from "./_components/quiz-list";

export default async function InterviewPrepPage() {
  const assessments = await getAssessments();

  // Kick off quiz generation in the background to warm cache for mock page
  // Don't await to avoid blocking page render
  try {
    // fire-and-forget
    // @ts-ignore - intentionally not awaiting
    generateQuiz();
  } catch (e) {
    // ignore background warmup errors
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradient-title animate-gradient">
          Interview Preparation
        </h1>
      </div>
      <div className="space-y-6">
        <StatsCards assessments={assessments} />
        <PerformanceChart assessments={assessments} />
        <QuizList assessments={assessments} />
      </div>
    </div>
  );
}
