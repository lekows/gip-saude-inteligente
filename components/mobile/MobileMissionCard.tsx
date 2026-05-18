import { Activity, AlertTriangle, Target, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MobileMissionStats } from "@/types/mobile";

export function MobileMissionCard({
  theme,
  neighborhood,
  stats
}: {
  theme: string;
  neighborhood: string;
  stats: MobileMissionStats;
}) {
  const progress = Math.round((stats.approachesDone / stats.dailyTarget) * 100);

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-folha">
          Missao do dia
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight">{theme}</h2>
        <p className="mt-1 text-sm text-stone-500">{neighborhood}</p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Meta {stats.dailyTarget}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="mt-2 h-4" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Metric icon={<Activity size={17} />} label="Realizadas" value={stats.approachesDone} />
          <Metric icon={<Target size={17} />} label="Faltam" value={stats.remainingApproaches} />
          <Metric icon={<AlertTriangle size={17} />} label="Alto risco" value={stats.highRiskPeople} danger />
          <Metric icon={<UserPlus size={17} />} label="Convidados" value={stats.invitedToCampaign} />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  danger
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-[#fbfbf7] p-3">
      <div className={danger ? "text-alerta" : "text-folha"}>{icon}</div>
      <p className="mt-2 text-xs text-stone-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
