import type { Workspace } from "./types";

export interface ValidationWarning {
  layer: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  errors: string[];
}

export function validateProject(project: Workspace): ValidationResult {
  const errors: string[] = [];
  const warnings: ValidationWarning[] = [];

  if (project.stories.length === 0) {
    errors.push("Workspace must have at least one Story");
  }

  const activeStory = project.stories.find(
    (s) => s.id === project.activeStoryId
  );
  if (!activeStory) {
    errors.push("Active Story not found");
    return { valid: errors.length === 0, warnings, errors };
  }

  const visibleHistory = activeStory.historyBuffer.filter((e) => !e.hidden);
  const canGenerate =
    activeStory.userInputDraft.length > 0 || visibleHistory.length > 0;
  if (!canGenerate) {
    errors.push(
      "Cannot generate: User Input is empty and there are no visible History Entries"
    );
  }

  return { valid: errors.length === 0, warnings, errors };
}
