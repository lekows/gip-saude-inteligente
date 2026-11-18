import type { ProcessContent } from "@/types/processReview";

export function directorBrief(content: ProcessContent, version: number) {
  return {
    version,
    activities: content.activities.length,
    questions: content.questions.length,
    sources: content.sources.map(source => source.title),
    macros: content.macros.map(macro => ({
      id: macro.id, title: macro.title, account: String(macro.account || ""),
      activities: content.activities.filter(activity => activity.macro === macro.id).map(activity => ({
        id: activity.id, title: String(activity.short || activity.title),
        account: String(activity.account || ""),
        risk: String(activity.risk || ""), proposal: String(activity.proposal || ""),
        question: String(activity.question || ""),
      })),
    })),
  };
}

export type DirectorBrief = ReturnType<typeof directorBrief>;
