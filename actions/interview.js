"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.6,
    maxOutputTokens: 1024,
  },
});

// Simple in-memory cache for generated quizzes per user
const quizCache = new Map(); // key: userId, value: { expiresAt: number, questions: any[] }

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  // Serve from cache if fresh
  const cached = quizCache.get(userId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.questions;
  }

  const prompt = `
    Generate 10 technical interview questions for a ${user.industry} professional$${
      user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
    }.

    Each question should be multiple choice with 4 options.

    IMPORTANT: Do NOT include explanations. Explanations will be requested later per question.

    Return strictly JSON with this schema (no code fences, no prose):
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const quiz = JSON.parse(text);

    // cache for 5 minutes
    quizCache.set(userId, {
      expiresAt: now + 5 * 60 * 1000,
      questions: quiz.questions,
    });

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 5 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);

      improvementTip = tipResult.response.text().trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function explainQuestion(question, correctAnswer) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    Provide a concise explanation for why the following answer is correct in a ${user.industry} interview context.
    Keep under 4 sentences, practical and clear.

    Question: ${question}
    Correct Answer: ${correctAnswer}
  `;

  try {
    const freeformModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await freeformModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error explaining question:", error);
    throw new Error("Failed to generate explanation");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) return []; // Return empty array instead of throwing

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) return []; // Return empty array instead of throwing

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return []; // Return empty array instead of throwing
  }
}
