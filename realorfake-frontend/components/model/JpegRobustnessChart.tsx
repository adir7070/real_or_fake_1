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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JpegRobustnessChartProps {
  data: Record<string, number>;
}

export function JpegRobustnessChart({ data }: JpegRobustnessChartProps) {
  if (Object.keys(data).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>עמידות לדחיסת JPEG</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">אין נתונים זמינים</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(data)
    .map(([k, v]) => ({
      quality: parseInt(k.replace("Q", ""), 10),
      accuracy: Math.round(v * 100),
    }))
    .sort((a, b) => a.quality - b.quality);

  return (
    <Card>
      <CardHeader>
        <CardTitle>עמידות לדחיסת JPEG</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="quality"
              label={{ value: "JPEG Quality", position: "insideBottom", offset: -4 }}
            />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, "דיוק"]} />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="hsl(220 47% 27%)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
