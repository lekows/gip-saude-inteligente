"use client";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
    >
      Imprimir / salvar PDF
    </button>
  );
}
