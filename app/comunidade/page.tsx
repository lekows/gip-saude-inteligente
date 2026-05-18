import Link from "next/link";
import { HeartPulse, MapPin, ShieldCheck, Smartphone, UsersRound } from "lucide-react";
import { CommunityInviteCard } from "@/components/mobile/CommunityInviteCard";
import { getMobileMvpData } from "@/lib/mobileMvpService";

export default function ComunidadePage() {
  const { communityCampaign } = getMobileMvpData();

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-ink">
      <section className="mx-auto max-w-md px-4 pb-10 pt-5">
        <header className="rounded-3xl bg-ink p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-folha">
              <HeartPulse size={25} />
            </span>
            <div>
              <p className="text-sm font-semibold">GIP Saude Inteligente</p>
              <h1 className="text-3xl font-semibold leading-tight">Programa GIP</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/75">
            Uma iniciativa de cuidado territorial para aproximar equipes de saude,
            comunidades e acoes preventivas em Luziania.
          </p>
        </header>

        <section className="mt-4 grid gap-3">
          <InfoCard
            icon={<UsersRound size={20} />}
            title="O que e"
            text="Busca ativa, orientacao e triagem preventiva por bairro, usando dados agregados para priorizar acoes."
          />
          <InfoCard
            icon={<ShieldCheck size={20} />}
            title="Privacidade"
            text="O MVP nao exibe pacientes, enderecos residenciais ou dados identificaveis."
          />
          <InfoCard
            icon={<MapPin size={20} />}
            title="Territorio"
            text="O mapa ajuda a organizar bairros, UBS e locais de mutirao conforme risco coletivo."
          />
        </section>

        <section className="mt-4">
          <CommunityInviteCard campaign={communityCampaign} />
        </section>

        <section id="participar" className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-folha">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <Smartphone size={18} />
            Quero participar
          </div>
          Procure a equipe no dia do mutirao ou acompanhe os avisos da UBS do seu bairro.
          Esta versao e demonstrativa e usa dados simulados.
        </section>

        <section id="ubs" className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-folha">
            UBS mais proxima
          </p>
          <h2 className="mt-2 text-xl font-semibold">UBS Jardim Inga</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Unidade de referencia simulada para a acao atual. Confirme sempre
            os dados oficiais junto a Secretaria Municipal de Saude.
          </p>
          <Link
            href="/mobile"
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-ink px-4 text-sm font-semibold text-white"
          >
            Ver demonstracao mobile
          </Link>
        </section>
      </section>
    </main>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-folha">{icon}</div>
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-stone-600">{text}</p>
    </article>
  );
}
