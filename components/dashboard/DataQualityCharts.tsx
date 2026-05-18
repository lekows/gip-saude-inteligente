"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataQualityReport, DataQualitySeverity } from "@/types/dataQuality";

const badgeColors = {
  publico_real: "#1f7a4d",
  agregado: "#1c5f9f",
  simulado: "#c9912d",
  mvp_seed: "#78716c"
};

const severityColors: Record<DataQualitySeverity, string> = {
  info: "#1c5f9f",
  warning: "#c9912d",
  critical: "#c24a2c"
};

export function DataQualityCharts({ report }: { report: DataQualityReport }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fileRecords = useMemo(
    () =>
      report.files.map((file) => ({
        name: file.source,
        registros: file.records,
        arquivo: file.fileName
      })),
    [report.files]
  );

  const badgeDistribution = useMemo(() => {
    const counts = report.files.reduce<Record<string, number>>((acc, file) => {
      file.trustBadges.forEach((badge) => {
        acc[badge] = (acc[badge] ?? 0) + 1;
      });
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: badgeColors[name as keyof typeof badgeColors]
    }));
  }, [report.files]);

  const issueDistribution = useMemo(() => {
    const severities: DataQualitySeverity[] = ["info", "warning", "critical"];
    return severities.map((severity) => ({
      name: severity,
      value: report.issues.filter((issue) => issue.severity === severity).length,
      color: severityColors[severity]
    }));
  }, [report.issues]);

  const coverageData = [
    {
      name: "Qualidade",
      value: report.qualityScore,
      fill: report.qualityScore >= 85 ? "#1f7a4d" : "#c9912d"
    }
  ];

  if (!mounted) {
    return (
      <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </section>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Confianca geral</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="68%"
              outerRadius="94%"
              barSize={20}
              data={coverageData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={10} background />
              <text
                x="50%"
                y="48%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-ink text-4xl font-semibold"
              >
                {report.qualityScore}%
              </text>
              <text
                x="50%"
                y="62%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-stone-500 text-xs"
              >
                score de qualidade
              </text>
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volume por fonte</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fileRecords} margin={{ left: 4, right: 14, bottom: 42 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-30}
                textAnchor="end"
                height={68}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [Number(value).toLocaleString("pt-BR"), "Registros"]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.arquivo ?? "Fonte"}
              />
              <Bar dataKey="registros" fill="#1f7a4d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Natureza dos dados</CardTitle>
        </CardHeader>
        <CardContent className="grid h-[280px] grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={badgeDistribution} dataKey="value" nameKey="name" outerRadius={86}>
                {badgeDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, "Arquivos"]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Alertas por severidade</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {issueDistribution.map((item) => (
            <div key={item.name} className="rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold capitalize">{item.name}</p>
                <span className="text-2xl font-semibold" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-stone-200">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, item.value * 34)}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="grid h-[280px] place-items-center text-sm text-stone-500">
        Carregando grafico...
      </CardContent>
    </Card>
  );
}
