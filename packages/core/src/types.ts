export interface Workspace {
  id: string;
  name: string;
  worldBooks: WorldBook[];
  stories: Story[];
  activeStoryId: string;
  settings: Settings;
}

export interface Story {
  id: string;
  title: string;
  session: string;
  systemInsertPrompt: string;
  openWorldBookIds: string[];
  stateSet: StateSet;
  historyBuffer: HistoryEntry[];
  userInputDraft: string;
}

export interface StateSet {
  documents: StateDocument[];
}

export interface StateDocument {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface WorldBook {
  id: string;
  name: string;
  fixedEntries: WorldBookFixedEntry[];
  keywordEntries: WorldBookKeywordEntry[];
}

export interface WorldBookFixedEntry {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface WorldBookKeywordEntry {
  id: string;
  title: string;
  keywordText: string;
  keywords: string[];
  content: string;
  order: number;
}

export type HistoryRole = "user" | "assistant";
export type EntryStatus = "complete" | "interrupted";

export interface HistoryEntry {
  id: string;
  role: HistoryRole;
  content: string;
  reasoningContent: string;
  hidden: boolean;
  status: EntryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  historyLimit: number;
  historyDisplayLimit: number;
  modelProvider: string;
  model: string;
  deepSeekBaseUrl: string;
  stream: boolean;
  thinking: boolean;
  reasoningEffort: string;
  deepSeekApiKey: string;
}

export const DEFAULT_SETTINGS: Settings = {
  historyLimit: 200,
  historyDisplayLimit: 200,
  modelProvider: "deepseek",
  model: "deepseek-v4-flash",
  deepSeekBaseUrl: "https://api.deepseek.com",
  stream: true,
  thinking: true,
  reasoningEffort: "high",
  deepSeekApiKey: "",
};

export const PROMPT_LAYER_ORDER = [
  "Session",
  "System Insert Prompt",
  "WorldBook.fixed",
  "WorldBook.keyword",
  "StateSet",
  "History Buffer",
  "User Input",
] as const;

export type PromptLayer = (typeof PROMPT_LAYER_ORDER)[number];
