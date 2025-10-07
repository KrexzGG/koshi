"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Rocket, ShieldCheck, ArrowRight, UserRoundCog } from "lucide-react";

export default function OnboardingRequired() {
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-2xl border border-border/60">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <UserRoundCog className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-3xl">Complete your onboarding</CardTitle>
          <CardDescription>
            We need a few details about your industry and background to personalize your growth tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-md border p-3 flex items-center gap-2">
              <Badge variant="secondary">1</Badge>
              <span className="text-sm">Choose industry & specialization</span>
            </div>
            <div className="rounded-md border p-3 flex items-center gap-2">
              <Badge variant="secondary">2</Badge>
              <span className="text-sm">Add experience & skills</span>
            </div>
            <div className="rounded-md border p-3 flex items-center gap-2">
              <Badge variant="secondary">3</Badge>
              <span className="text-sm">Get tailored insights</span>
            </div>
          </div>

          <div className="rounded-md border bg-muted/40 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 mt-0.5 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              Onboarding ensures your interview prep, resume, and cover letters are aligned with your industry trends and in-demand skills.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link href="/onboarding">
              <Button className="gap-2">
                Start Onboarding
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Go to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


