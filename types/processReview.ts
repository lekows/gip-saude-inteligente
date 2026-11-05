export type ProcessMap = { id: string; health_unit_id: string; title: string; version: number; status: "open" | "closed"; created_at: string };
export type ProcessFeedback = { id: string; map_id: string; map_version: number; author_id: string; item_id: string; kind: "understood" | "question" | "change" | "new_step"; message: string; proposal: string; created_at: string };
export type ProcessFeedbackReview = { id: number; feedback_id: string; revision: number; decision: "accepted" | "declined" | "needs_information"; message: string; reviewer_id: string; created_at: string };
export type ProcessMember = { profile_id: string; participation: "viewer" | "reviewer"; active: boolean };
export type ProcessPerson = { id: string; full_name: string; role: string };
export type ProcessItem = { id: string; title: string; macro?: string; [key: string]: unknown };
export type ProcessContent = { schema: string; unitName: string; macros: ProcessItem[]; activities: ProcessItem[]; questions: ProcessItem[]; systems: ProcessItem[]; sources: ProcessItem[]; decisionNodes?: ProcessItem[]; flows: Record<string, unknown> };
export type ProcessActionResult = { success?: string; error?: string };
