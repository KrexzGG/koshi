import { Suspense } from "react";
import { BarLoader } from "react-spinners";
import { redirect } from "next/navigation";
import { getUserOnboardingStatus } from "@/actions/user";

export default async function Layout({ children }) {
  const { isOnboarded } = await getUserOnboardingStatus();
  if (!isOnboarded) {
    redirect("/onboarding-required");
  }

  return (
    <div className="container mx-auto max-w-screen-2xl px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="gray" />}
      >
        {children}
      </Suspense>
    </div>
  );
}
