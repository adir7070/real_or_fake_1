"use client";

import type { CrossGeneratorResult } from "@/lib/api/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CrossGeneratorChartProps {
  results: CrossGeneratorResult[];
}

export function CrossGeneratorChart({ results }: CrossGeneratorChartProps) {
  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ביצועים על מחוללים שלא נראו באימון</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">אין נתונים זמינים</p>
        </CardContent>
      </Card>
    );
  }

  const data = results.map((r) => ({
    name: r.generator_name,
    accuracy: Math.round(r.accuracy * 100),
    n_samples: r.n_samples,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>ביצועים על מחוללים שלא נראו באימון</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical" margin={{ right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} unit="%" />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip
              formatter={(v, _, props) => [
                `${v}% (n=${props.payload.n_samples})`,
                "דיוק",
              ]}
            />
            <Bar dataKey="accuracy" radius={4}>
              {data.map((_, i) => (
                <Cell key={i} fill="hsl(220 47% 27%)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
