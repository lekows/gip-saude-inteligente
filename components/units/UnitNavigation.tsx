import s from "./UnitNavigation.module.css";

export type UnitSection = "painel" | "acoes" | "processos";
export function UnitNavigation({ cnes, current }: { cnes: string; current: UnitSection }) {
  const base = `/unidades/${cnes}`;
  const links = [
    { section: "painel", href: base, title: "Painel da unidade" },
    { section: "acoes", href: base + "/acoes", title: "Ações e projetos" },
    { section: "processos", href: base + "/processos", title: "Processos" },
  ];
  return <nav className={s.nav} aria-label="Navegação da unidade">
    {links.map(link => <a key={link.section} href={link.href} aria-current={link.section === current ? "page" : undefined}>{link.title}</a>)}
  </nav>;
}

