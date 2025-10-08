"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Compute current date in a readable business format (e.g., "October 7, 2025")
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `
    Write a professional cover letter for a ${data.jobTitle} position at ${data.companyName}.

    Include a contact header at the top using these values if provided, otherwise leave blank lines:
    - Name: ${data.fullName || user.name || ""}
    - Address: ${data.address || ""}
    - Phone: ${data.phone || ""}
    - Email: ${data.email || user.email || ""}

    About the candidate:
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience}
    - Skills: ${user.skills?.join(", ")}
    - Professional Background: ${user.bio}

    Job Description:
    ${data.jobDescription}

    Requirements:
    1. Use a professional, enthusiastic tone.
    2. Highlight relevant skills and experience with 2–3 concise bullet points for key achievements.
    3. Show understanding of the company's needs and tailor to the role.
    4. Keep it concise (max 400 words total).
    5. Use clean, standards-compliant business letter formatting in markdown (no HTML).
    6. Do NOT wrap the output in triple backticks.
    7. Relate the candidate's background to job requirements.
    8. Start with the contact header, then date, greeting, body, closing signature including the same name.

    Today's date is: ${formattedDate}. Use exactly this date in the letter.

    Use this EXACT markdown structure (no headings unless specified, and one blank line between blocks):

    [Full Name]
    [Address]
    [Phone]
    [Email]

    ${formattedDate}

    Dear Hiring Manager${data.companyName ? ` at ${data.companyName}` : ""},

    [Opening paragraph: 2–3 sentences summarizing fit and interest.]

    - [Achievement bullet 1: quantified, role-relevant]
    - [Achievement bullet 2: quantified, role-relevant]
    - [Achievement bullet 3 (optional): quantified, role-relevant]

    [Closing paragraph: reaffirm fit, appreciation, and call to action.]

    Sincerely,
    [Full Name]
  `;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error.message);
    throw new Error("Failed to generate cover letter");
  }
}

export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) return []; // Return empty array instead of throwing

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) return []; // Return empty array instead of throwing

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) return null; // Return null instead of throwing

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) return null; // Return null instead of throwing

  // Use findFirst with both id and userId to ensure proper scoping
  return await db.coverLetter.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Delete scoped to both id and userId; deleteMany avoids unique constraint errors
  await db.coverLetter.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  return { success: true };
}

export async function updateCoverLetter(id, content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const existing = await db.coverLetter.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Cover letter not found");

  const updated = await db.coverLetter.update({
    where: { id },
    data: { content, status: "completed" },
  });

  return updated;
}
