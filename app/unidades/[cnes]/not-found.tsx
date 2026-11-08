import Link from "next/link";
export default function UnitNotFound() {
  return <main className="mx-auto max-w-3xl p-8 text-ink"><h1 className="text-2xl font-semibold">Unidade indisponível para sua conta</h1>
    <p className="my-4 text-sm text-stone-600">Confira a unidade escolhida ou solicite à coordenação acesso aos trabalhos disponíveis.</p>
    <Link href="/unidades" className="text-folha underline">Escolher outra unidade</Link></main>;
}

