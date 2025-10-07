import { getIndustryInsights, getGlobalInsights, getGlobalTechStacks } from "@/actions/dashboard";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import DashboardView from "./_components/dashboard-view";

const IndustryInsightsPage = async () => {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const [insights, globalInsights, techStacks] = await Promise.all([
    getIndustryInsights(),
    getGlobalInsights(),
    getGlobalTechStacks(),
  ]);

  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} globalInsights={globalInsights} techStacks={techStacks} />
    </div>
  )
}

export default IndustryInsightsPage