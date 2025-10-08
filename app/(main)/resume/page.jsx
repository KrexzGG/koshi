import { getResume } from "@/actions/resume";
import ResumeBuilder from "./_components/resume-builder";

export const dynamic = 'force-dynamic';

export default async function ResumePage() {
  const resume = await getResume();
  if (!resume) {
    // Avoid crashing Server Component tree; show empty builder
    return (
      <div className="container mx-auto py-6">
        <ResumeBuilder initialContent="" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ResumeBuilder initialContent={resume?.content || ""} />
    </div>
  );
}
