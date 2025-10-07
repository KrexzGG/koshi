"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    // Start a transaction to handle both operations
    const result = await db.$transaction(
      async (tx) => {
        // First check if industry exists
        let industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: data.industry,
          },
        });

        // If industry doesn't exist, create it with default values
        if (!industryInsight) {
          try {
            // Add timeout wrapper for AI generation
            const insightsPromise = generateAIInsights(data.industry);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AI generation timeout')), 10000)
            );
            
            const insights = await Promise.race([insightsPromise, timeoutPromise]);

            industryInsight = await tx.industryInsight.create({
              data: {
                industry: data.industry,
                ...insights,
                nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            });
          } catch (aiError) {
            console.warn("AI generation failed during onboarding, creating with default values:", aiError);
            // Create with default values if AI generation fails
            industryInsight = await tx.industryInsight.create({
              data: {
                industry: data.industry,
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
                recommendedSkills: ["TypeScript", "Docker", "Kubernetes", "GraphQL", "Machine Learning"],
                nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            });
          }
        }

        // Now update the user
        const updatedUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });

        return { updatedUser, industryInsight };
      },
      {
        timeout: 30000, // Increased to 30 seconds
      }
    );

    revalidatePath("/");
    return { success: true, user: result.updatedUser };
  } catch (error) {
    console.error("Error updating user and industry:", error);
    
    // Provide more specific error messages
    if (error.message.includes("Unique constraint")) {
      throw new Error("This industry already exists. Please try again.");
    } else if (error.message.includes("timeout")) {
      throw new Error("Request timed out. Please try again.");
    } else if (error.message.includes("AI")) {
      throw new Error("Failed to generate industry insights. Please try again.");
    } else {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true,
      },
    });

    return {
      isOnboarded: !!user?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
}
