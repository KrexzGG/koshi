"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function PerformanceChart({ assessments }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (assessments && assessments.length > 0) {
      // Sort assessments by date ascending for proper chart display
      const sortedAssessments = [...assessments].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      const formattedData = sortedAssessments.map((assessment, index) => {
        const date = new Date(assessment.createdAt);
        // If multiple assessments on same day, add time to make them unique
        const isSameDay = index > 0 && 
          format(date, "MMM dd") === format(new Date(sortedAssessments[index - 1].createdAt), "MMM dd");
        
        return {
          date: isSameDay ? `${format(date, "MMM dd")} ${format(date, "HH:mm")}` : format(date, "MMM dd"),
          score: Math.round(assessment.quizScore),
          fullDate: format(date, "MMM dd, yyyy 'at' HH:mm"),
        };
      });
      
      setChartData(formattedData);
    } else {
      setChartData([]);
    }
  }, [assessments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="gradient-title animate-gradient text-3xl md:text-4xl">
          Performance Trend
        </CardTitle>
        <CardDescription>Your quiz scores over time</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>No quiz data available. Take a quiz to see your performance trend!</p>
          </div>
        ) : chartData.length === 1 ? (
          <div className="h-[300px] flex flex-col items-center justify-center">
            <div className="text-center mb-4">
              <p className="text-muted-foreground mb-2">You have completed 1 quiz</p>
              <p className="text-2xl font-bold">Score: {chartData[0].score}%</p>
              <p className="text-sm text-muted-foreground">Date: {chartData[0].fullDate}</p>
            </div>
            <p className="text-sm text-muted-foreground">Take more quizzes to see your performance trend!</p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} className="text-primary">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-md">
                          <p className="text-sm font-medium">
                            Score: {payload[0].value}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Date: {data.fullDate || data.date}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={{ fill: 'currentColor', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
