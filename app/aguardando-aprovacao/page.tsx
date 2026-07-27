import Link from "next/link";
import { Clock3, ShieldCheck } from "lucide-react";

export default function AguardandoAprovacaoPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f2] p-6 text-ink">
      <section className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-700"><Clock3 size={28} /></span>
        <h1 className="mt-5 text-2xl font-semibold">Cadastro recebido</h1>
        <p className="mt-3 leading-7 text-stone-600">Seu acesso foi criado e está aguardando aprovação da coordenação do GIP. Você não precisa realizar outro cadastro.</p>
        <div className="mt-6 flex items-start gap-3 rounded-lg bg-green-50 p-4 text-left text-sm text-green-900">
          <ShieldCheck className="mt-0.5 shrink-0" size={19} />
          <p>Essa etapa ajuda a proteger os dados e garante que cada participante receba apenas as permissões necessárias.</p>
        </div>
        <Link href="/" className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-semibold hover:border-[#1f7a4d]">Voltar ao início</Link>
      </section>
    </main>
  );
}
