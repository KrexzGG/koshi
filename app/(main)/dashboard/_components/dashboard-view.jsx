"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BriefcaseIcon,
  LineChart,
  TrendingUp,
  TrendingDown,
  Brain,
  Globe2,
  Sparkles,
  Building2,
  Star,
  Award,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DashboardView = ({ insights, globalInsights, techStacks = [] }) => {
  const active = insights;
  const globalData = globalInsights || insights;

  // Transform salary data for the chart
  const makeSalaryData = (src) => (src.salaryRanges || []).map((range) => ({
    name: range.role,
    min: range.min / 1000,
    max: range.max / 1000,
    median: range.median / 1000,
  }));
  const salaryDataUser = makeSalaryData(active);
  const salaryDataGlobal = makeSalaryData(globalData);
  

  const getDemandLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMarketOutlookInfo = (outlook) => {
    switch (outlook.toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-green-500" };
      case "neutral":
        return { icon: LineChart, color: "text-yellow-500" };
      case "negative":
        return { icon: TrendingDown, color: "text-red-500" };
      default:
        return { icon: LineChart, color: "text-gray-500" };
    }
  };

  const getOutlookMeta = (src) => {
    const info = getMarketOutlookInfo(src.marketOutlook || "neutral");
    return { OutlookIcon: info.icon, outlookColor: info.color };
  };

  // Format dates using date-fns
  const dateMeta = (src) => ({
    lastUpdatedDate: src.lastUpdated ? format(new Date(src.lastUpdated), "dd/MM/yyyy") : "",
    nextUpdateDistance: src.nextUpdate ? formatDistanceToNow(new Date(src.nextUpdate), { addSuffix: true }) : "",
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="user" className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="user">My Industry</TabsTrigger>
            <TabsTrigger value="global">Global Trends</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="user" className="space-y-6">
          {(() => {
            const { OutlookIcon, outlookColor } = getOutlookMeta(active);
            const { lastUpdatedDate, nextUpdateDistance } = dateMeta(active);
            return (
              <>
      <div className="flex justify-between items-center">
        <Badge variant="outline">Last updated: {lastUpdatedDate}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Market Outlook</CardTitle>
            <OutlookIcon className={`h-4 w-4 ${outlookColor}`} />
          </CardHeader>
          <CardContent>
                      <div className="text-2xl font-bold">{active.marketOutlook}</div>
                      <p className="text-xs text-muted-foreground">Next update: {active.nextUpdate ? format(new Date(active.nextUpdate), "dd/MM/yyyy") : ""}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Industry Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                      <div className="text-2xl font-bold">{Number(active.growthRate || 0).toFixed(1)}%</div>
                      <Progress value={Number(active.growthRate || 0)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Level</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                      <div className="text-2xl font-bold">{active.demandLevel}</div>
                      <div className={`h-2 w-full rounded-full mt-2 ${getDemandLevelColor(active.demandLevel || "Medium")}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
                        {(active.topSkills || []).map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Salary Ranges by Role</CardTitle>
                    <CardDescription>Displaying minimum, median, and maximum salaries (in thousands)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salaryDataUser}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-md">
                          <p className="font-medium">{label}</p>
                          {payload.map((item) => (
                                      <p key={item.name} className="text-sm">{item.name}: ${item.value}K</p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="min" fill="#94a3b8" name="Min Salary (K)" />
                <Bar dataKey="median" fill="#64748b" name="Median Salary (K)" />
                <Bar dataKey="max" fill="#475569" name="Max Salary (K)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Key Industry Trends</CardTitle>
                      <CardDescription>Current trends shaping the industry</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
                        {(active.keyTrends || []).map((trend, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Skills</CardTitle>
            <CardDescription>Skills to consider developing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
                        {(active.recommendedSkills || []).map((skill) => (
                          <Badge key={skill} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="global" className="space-y-6">
          {(() => {
            const { lastUpdatedDate, nextUpdateDistance } = dateMeta(globalData);
            const topCompanies = [
              { name: "Google", rating: 4.8, sector: "Tech" },
              { name: "Microsoft", rating: 4.7, sector: "Tech" },
              { name: "Amazon", rating: 4.5, sector: "E‑Commerce / Cloud" },
              { name: "NVIDIA", rating: 4.6, sector: "Semiconductors / AI" },
              { name: "OpenAI", rating: 4.6, sector: "AI Research" },
              { name: "Salesforce", rating: 4.4, sector: "SaaS / CRM" },
            ];
            const popularCerts = [
              "AWS Solutions Architect",
              "Google Cloud Professional",
              "Azure Administrator",
              "Scrum Master (PSM)",
              "PMP",
              "Security+",
            ];
            const hiringHotspots = ["USA", "EU", "India", "SEA", "UK", "Canada", "UAE"];
            return (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Global Trends</span>
                  </div>
                  <Badge variant="outline">Updated: {lastUpdatedDate}</Badge>
                </div>

                {/* Top Global Skills + Emerging Technologies */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-muted-foreground" />
                        <CardTitle>Top Global Skills</CardTitle>
                      </div>
                      <CardDescription>What’s most in demand across industries</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {(globalData.topSkills || []).map((skill) => (
                          <Badge key={skill} variant="secondary" className="px-3 py-1">{skill}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <CardTitle>Emerging Technologies</CardTitle>
                      </div>
                      <CardDescription>Shaping the worldwide market</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {(globalData.keyTrends || []).map((trend, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                            <span className="text-sm">{trend}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Global Salary Chart */}
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Global Salary Ranges by Role</CardTitle>
                    <CardDescription>Aggregated averages across industries (in thousands)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salaryDataGlobal}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-background border rounded-lg p-2 shadow-md">
                                    <p className="font-medium">{label}</p>
                                    {payload.map((item) => (
                                      <p key={item.name} className="text-sm">{item.name}: ${item.value}K</p>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="min" fill="#94a3b8" name="Min Salary (K)" />
                          <Bar dataKey="median" fill="#64748b" name="Median Salary (K)" />
                          <Bar dataKey="max" fill="#475569" name="Max Salary (K)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Popular Tech Stacks (AI-generated) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Tech Stacks</CardTitle>
                    <CardDescription>AI-curated stacks with quick use-case descriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!techStacks || techStacks.length === 0) ? (
                      <div className="text-sm text-muted-foreground">Tech stacks are loading...</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {techStacks.map((stack, idx) => (
                          <Card key={idx} className="bg-muted/30">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base gradient-title">{stack.name}</CardTitle>
                              <CardDescription>{stack.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap items-center gap-2">
                                {stack.items.map((tech, i) => (
                                  <React.Fragment key={`${tech}-${i}`}>
                                    <Badge variant="secondary" className="px-3 py-1">{tech}</Badge>
                                    {i < stack.items.length - 1 && <span className="text-muted-foreground">+</span>}
                                  </React.Fragment>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                

                

                {/* Top Companies */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <CardTitle>Highly Rated Companies</CardTitle>
                    </div>
                    <CardDescription>Based on global reputation and employee ratings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topCompanies.map((c) => (
                        <Card key={c.name} className="bg-muted/30">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{c.name}</CardTitle>
                            <CardDescription>{c.sector}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-1 text-yellow-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < Math.round(c.rating) ? '' : 'opacity-30'}`} />
                              ))}
                              <span className="ml-2 text-xs text-muted-foreground">{c.rating.toFixed(1)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                

                {/* Certifications & Hotspots */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <CardTitle>Popular Certifications</CardTitle>
                      </div>
                      <CardDescription>Boost credibility with these credentials</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {popularCerts.map((cert) => (
                          <Badge key={cert} variant="secondary" className="px-3 py-1">{cert}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Global Recommended Skills</CardTitle>
                      <CardDescription>Great bets to learn next</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {(globalData.recommendedSkills || []).map((skill) => (
                          <Badge key={skill} variant="outline" className="px-3 py-1">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
              </>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardView;