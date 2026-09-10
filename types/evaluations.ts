export type EvaluationKind = "self" | "program";
export type EvaluationAnswers = Record<string, number | string | null>;
export type EvaluationCampaign = {
  id: string; cycle_id: string; class_id: string | null; title: string;
  kind: EvaluationKind; stage: "initial" | "module" | "final";
  opens_at: string; closes_at: string; status: "draft" | "open" | "closed";
  version: number; created_by: string;
};
export type EvaluationResponse = {
  id: string; campaign_id: string; profile_id: string; answers: EvaluationAnswers;
  status: "draft" | "submitted"; revision: number;
  submitted_at: string | null; updated_at: string;
};
export type EvaluationFeedback = {
  id: string; response_id: string; author_id: string; message: string; created_at: string;
};
export type EvaluationVersion = {
  id: string; response_id: string; revision: number; answers: EvaluationAnswers; submitted_at: string;
};
export type SuggestionStatus = "received" | "reviewing" | "planned" | "implemented" | "declined";
export type AnonymousSuggestion = {
  id: string; category: string; message: string; proposal: string | null;
  submitted_month: string; status: SuggestionStatus; resolution_summary: string | null;
  owner_label: string | null; due_date: string | null;
};
export type SuggestionPublication = {
  id: string; summary: string; category: string; published_month: string; status: SuggestionStatus;
  resolution_summary: string; owner_label: string | null; due_date: string | null;
};
export type EvaluationActionResult = { success?: boolean; message?: string; error?: string };
