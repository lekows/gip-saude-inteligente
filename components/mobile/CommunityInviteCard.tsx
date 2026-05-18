import { CalendarDays, MapPin, QrCode, UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CommunityCampaign } from "@/types/mobile";

export function CommunityInviteCard({ campaign }: { campaign: CommunityCampaign }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-folha">
          Proximo mutirao
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight">{campaign.title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">{campaign.focus}</p>

        <div className="mt-5 space-y-3">
          <Info icon={<MapPin size={18} />} label="Local" value={campaign.location} />
          <Info icon={<CalendarDays size={18} />} label="Data" value={campaign.date} />
          <Info icon={<UsersRound size={18} />} label="Horario" value={campaign.time} />
        </div>

        <div className="mt-5 grid grid-cols-[1fr_112px] gap-3">
          <div className="space-y-3">
            <a
              href="#participar"
              className="flex h-12 items-center justify-center rounded-xl bg-folha px-4 text-sm font-semibold text-white"
            >
              Quero participar
            </a>
            <a
              href="#ubs"
              className="flex h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold"
            >
              Ver UBS mais proxima
            </a>
          </div>
          <div className="grid place-items-center rounded-xl border border-dashed border-stone-300 bg-[#fbfbf7] text-center text-xs text-stone-500">
            <QrCode size={42} className="mb-1 text-stone-400" />
            QR Code em breve
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-stone-200 bg-[#fbfbf7] p-3">
      <div className="mt-0.5 text-folha">{icon}</div>
      <div>
        <p className="text-xs text-stone-500">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
