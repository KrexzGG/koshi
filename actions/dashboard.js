"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `Provide ${industry} industry insights in this exact JSON format:
{
  "salaryRanges": [
    {"role": "Junior Developer", "min": 50000, "max": 80000, "median": 65000, "location": "US"},
    {"role": "Senior Developer", "min": 80000, "max": 120000, "median": 100000, "location": "US"},
    {"role": "Lead Developer", "min": 100000, "max": 150000, "median": 125000, "location": "US"},
    {"role": "Manager", "min": 90000, "max": 140000, "median": 115000, "location": "US"},
    {"role": "Director", "min": 120000, "max": 200000, "median": 160000, "location": "US"}
  ],
  "growthRate": 15,
  "demandLevel": "High",
  "topSkills": ["JavaScript", "Python", "React", "Node.js", "AWS"],
  "marketOutlook": "Positive",
  "keyTrends": ["Remote Work", "AI Integration", "Cloud Migration", "DevOps", "Security"],
  "recommendedSkills": ["TypeScript", "Docker", "Kubernetes", "GraphQL", "Machine Learning"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("AI generation failed, using fallback:", error);
    // Return fallback data if AI generation fails
    return {
      salaryRanges: [
        {"role": "Junior Developer", "min": 50000, "max": 80000, "median": 65000, "location": "US"},
        {"role": "Senior Developer", "min": 80000, "max": 120000, "median": 100000, "location": "US"},
        {"role": "Lead Developer", "min": 100000, "max": 150000, "median": 125000, "location": "US"},
        {"role": "Manager", "min": 90000, "max": 140000, "median": 115000, "location": "US"},
        {"role": "Director", "min": 120000, "max": 200000, "median": 160000, "location": "US"}
      ],
      growthRate: 12,
      demandLevel: "High",
      topSkills: ["JavaScript", "Python", "React", "Node.js", "AWS"],
      marketOutlook: "Positive",
      keyTrends: ["Remote Work", "AI Integration", "Cloud Migration", "DevOps", "Security"],
      recommendedSkills: ["TypeScript", "Docker", "Kubernetes", "GraphQL", "Machine Learning"]
    };
  }
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) return null; // Return null instead of throwing

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) return null; // Return null instead of throwing

  // Check if user has an industry set
  if (!user.industry) {
    return null; // Return null instead of throwing
  }

  // If no insights exist, generate them with a timeout fallback to keep load fast
  if (!user.industryInsight) {
    let insights;
    try {
      const timeoutMs = 10000;
      const aiPromise = generateAIInsights(user.industry);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), timeoutMs)
      );
      insights = await Promise.race([aiPromise, timeout]);
    } catch (e) {
      // Fallback defaults if AI is slow or fails
      insights = {
        salaryRanges: [
          { role: "Junior Developer", min: 50000, max: 80000, median: 65000, location: "US" },
          { role: "Senior Developer", min: 80000, max: 120000, median: 100000, location: "US" },
          { role: "Lead Developer", min: 100000, max: 150000, median: 125000, location: "US" },
          { role: "Manager", min: 90000, max: 140000, median: 115000, location: "US" },
          { role: "Director", min: 120000, max: 200000, median: 160000, location: "US" },
        ],
        growthRate: 12,
        demandLevel: "High",
        topSkills: ["JavaScript", "Python", "React", "Node.js", "AWS"],
        marketOutlook: "Positive",
        keyTrends: ["Remote Work", "AI Integration", "Cloud Migration", "DevOps", "Security"],
        recommendedSkills: ["TypeScript", "Docker", "Kubernetes", "GraphQL", "Machine Learning"],
      };
    }

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return industryInsight;
  }

  return user.industryInsight;
}

// Generate popular tech stacks with short descriptions using Gemini
export async function getGlobalTechStacks() {
  // Simple in-memory cache to avoid repeated AI calls
  if (!globalThis.__techStacksCache) {
    globalThis.__techStacksCache = { data: null, expiresAt: 0 };
  }
  const now = Date.now();
  if (globalThis.__techStacksCache.data && globalThis.__techStacksCache.expiresAt > now) {
    return globalThis.__techStacksCache.data;
  }
  const prompt = `
    Generate a JSON array named stacks that lists popular software tech stacks used by teams today.
    Return ONLY valid JSON, no markdown.
    Each item must have this exact shape:
    {
      "name": string,              // e.g., "React + Node + AWS"
      "items": [string, ...],     // e.g., ["React", "Node.js", "AWS"]
      "description": string       // One sentence on typical use cases and strengths
    }
    Include 8-10 stacks spanning web, mobile, backend, cloud-native, data/ML.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
    const data = JSON.parse(cleaned);
    // Basic validation and trimming
    const stacks = Array.isArray(data.stacks) ? data.stacks : data;
    const normalized = (stacks || []).map((s) => ({
      name: String(s.name || "").slice(0, 80),
      items: Array.isArray(s.items) ? s.items.slice(0, 6) : [],
      description: String(s.description || "").slice(0, 200),
    }));
    globalThis.__techStacksCache = {
      data: normalized,
      // cache for 12 hours
      expiresAt: now + 12 * 60 * 60 * 1000,
    };
    return normalized;
  } catch (error) {
    console.error("Error generating tech stacks:", error);
    // Fallback minimal set
    const fallback = [
      {
        name: "React + Node + AWS",
        items: ["React", "Node.js", "AWS"],
        description: "Full‑stack web apps with scalable serverless/backend services on AWS.",
      },
      {
        name: "Python + Django + Postgres",
        items: ["Python", "Django", "PostgreSQL"],
        description: "Rapid backend development with a batteries‑included framework and SQL database.",
      },
    ];
    globalThis.__techStacksCache = {
      data: fallback,
      expiresAt: now + 2 * 60 * 60 * 1000, // shorter cache on fallback
    };
    return fallback;
  }
}

// Generate concise learning paths for trending roles
// (reverted) getGlobalLearningPaths removed on request

// Aggregate global insights across all industries to show worldwide trends
export async function getGlobalInsights() {
  // No auth required data here, but keep parity with protected pages usage
  const insights = await db.industryInsight.findMany();
  if (!insights || insights.length === 0) {
    // Fallback minimal structure
    return {
      salaryRanges: [],
      growthRate: 0,
      demandLevel: "Medium",
      topSkills: [],
      marketOutlook: "Neutral",
      keyTrends: [],
      recommendedSkills: [],
      lastUpdated: new Date(),
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  // Helper to count frequency and take top N
  const topN = (arr, n = 8) => {
    const counts = new Map();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k);
  };

  // Aggregate salary ranges grouped by role
  const roleToStats = new Map();
  for (const ins of insights) {
    for (const s of ins.salaryRanges || []) {
      const key = s.role;
      if (!roleToStats.has(key)) {
        roleToStats.set(key, { count: 0, min: 0, max: 0, median: 0, location: "Global" });
      }
      const agg = roleToStats.get(key);
      agg.count += 1;
      agg.min += Number(s.min || 0);
      agg.max += Number(s.max || 0);
      agg.median += Number(s.median || 0);
    }
  }
  const aggregatedSalaryRanges = [...roleToStats.entries()].map(([role, v]) => ({
    role,
    min: Math.round(v.min / v.count),
    max: Math.round(v.max / v.count),
    median: Math.round(v.median / v.count),
    location: "Global",
  }));

  // Average growth, most common demand/outlook, top skills/trends/recommended
  const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
  const growthRate = avg(insights.map((i) => Number(i.growthRate || 0)));

  const demandLevel = topN(insights.map((i) => i.demandLevel || "Medium"), 1)[0] || "Medium";
  const marketOutlook = topN(insights.map((i) => i.marketOutlook || "Neutral"), 1)[0] || "Neutral";

  const topSkills = topN(insights.flatMap((i) => i.topSkills || []), 10);
  const keyTrends = topN(insights.flatMap((i) => i.keyTrends || []), 10);
  const recommendedSkills = topN(insights.flatMap((i) => i.recommendedSkills || []), 10);

  // Timestamps: use most recent lastUpdated and nearest nextUpdate
  const lastUpdated = new Date(Math.max(...insights.map((i) => new Date(i.lastUpdated).getTime())));
  const nextUpdate = new Date(Math.min(...insights.map((i) => new Date(i.nextUpdate).getTime())));

  return {
    salaryRanges: aggregatedSalaryRanges,
    growthRate,
    demandLevel,
    topSkills,
    marketOutlook,
    keyTrends,
    recommendedSkills,
    lastUpdated,
    nextUpdate,
  };
}