"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

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

// Fallback quiz when API is not available
function getFallbackQuiz(industry, skills) {
  const baseQuestions = [
    {
      question: "What is the primary purpose of version control systems like Git?",
      options: [
        "To store large files",
        "To track changes in code and collaborate with others",
        "To compile code faster",
        "To debug applications"
      ],
      correctAnswer: "To track changes in code and collaborate with others"
    },
    {
      question: "Which of the following is NOT a programming paradigm?",
      options: [
        "Object-Oriented Programming",
        "Functional Programming",
        "Procedural Programming",
        "Database Programming"
      ],
      correctAnswer: "Database Programming"
    },
    {
      question: "What does API stand for?",
      options: [
        "Application Programming Interface",
        "Advanced Programming Integration",
        "Automated Program Interface",
        "Application Process Integration"
      ],
      correctAnswer: "Application Programming Interface"
    },
    {
      question: "Which HTTP method is typically used to retrieve data?",
      options: ["POST", "PUT", "GET", "DELETE"],
      correctAnswer: "GET"
    },
    {
      question: "What is the main advantage of using a database?",
      options: [
        "Faster internet connection",
        "Organized storage and retrieval of data",
        "Better user interface",
        "Automatic code generation"
      ],
      correctAnswer: "Organized storage and retrieval of data"
    }
  ];

  // Add industry-specific questions if available
  if (industry) {
    const industryQuestions = [
      {
        question: `In ${industry}, what is the most important skill for career growth?`,
        options: [
          "Memorizing all tools",
          "Continuous learning and adaptation",
          "Working alone",
          "Avoiding new technologies"
        ],
        correctAnswer: "Continuous learning and adaptation"
      }
    ];
    baseQuestions.push(...industryQuestions);
  }

  return baseQuestions.slice(0, 10); // Return up to 10 questions
}

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) {
    console.error("Unauthorized user trying to generate quiz");
    return getFallbackQuiz("Software Development", []);
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) {
    console.error("User not found for quiz generation");
    return getFallbackQuiz("Software Development", []);
  }

  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set. Returning fallback quiz.");
    return getFallbackQuiz(user.industry, user.skills);
  }

  // Serve from cache if fresh
  const cached = quizCache.get(userId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.questions;
  }

  const prompt = `
    Generate 10 technical interview questions for a ${user.industry} professional${
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
    
    console.log("Raw Gemini response:", text);
    
    // Clean the response text more aggressively
    let cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/^[^{]*/, "") // Remove any text before the first {
      .replace(/[^}]*$/, "") // Remove any text after the last }
      .trim();
    
    // If still no valid JSON, try to extract JSON from the text
    if (!cleanedText.startsWith('{')) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
    }
    
    console.log("Cleaned text for parsing:", cleanedText);
    
    let quiz;
    try {
      quiz = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Original text:", text);
      console.error("Cleaned text:", cleanedText);
      
      // Try to return fallback quiz instead of throwing
      console.log("Returning fallback quiz due to parse error");
      return getFallbackQuiz(user.industry, user.skills);
    }

    // Validate the response structure
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      console.error("Invalid quiz structure:", quiz);
      console.log("Returning fallback quiz due to invalid structure");
      return getFallbackQuiz(user.industry, user.skills);
    }

    // cache for 5 minutes
    quizCache.set(userId, {
      expiresAt: now + 5 * 60 * 1000,
      questions: quiz.questions,
    });

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    if (error.message.includes("parse") || error.message.includes("structure")) {
      throw error;
    }
    throw new Error("Failed to generate quiz questions");
  }
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) {
    console.error("Unauthorized user trying to save quiz result");
    return null;
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    console.error("User not found for saving quiz result");
    return null;
  }

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
    return null; // Return null instead of throwing
  }
}

export async function explainQuestion(question, correctAnswer) {
  const { userId } = await auth();
  if (!userId) {
    console.error("Unauthorized user trying to get explanation");
    return "This is the correct answer based on industry best practices.";
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true },
  });

  if (!user) {
    console.error("User not found for explanation");
    return "This is the correct answer based on industry best practices.";
  }

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
    return "This is the correct answer based on industry best practices."; // Return fallback instead of throwing
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
