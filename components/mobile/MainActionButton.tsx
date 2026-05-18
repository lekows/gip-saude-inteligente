import { PlusCircle } from "lucide-react";

export function MainActionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-folha px-6 text-lg font-semibold text-white shadow-lg shadow-green-900/20 active:scale-[0.99]"
    >
      <PlusCircle size={24} />
      Registrar abordagem
    </button>
  );
}
