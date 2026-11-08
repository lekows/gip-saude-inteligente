import { notFound, redirect } from "next/navigation";
export default async function LegacyPanel({params}:{params:Promise<{cnes:string}>}) {
  const {cnes}=await params;
  if (!/^\d{7}$/.test(cnes)) notFound();
  redirect(`/unidades/${cnes}`);
}
