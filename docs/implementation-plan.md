# Implementation Plan

## Goal

Build a deterministic prompt assembly tool for long-running serialized fiction. The first usable version should let a user manage multiple stories in one local workspace, maintain all prompt layers manually, preview the assembled prompt, send it to an LLM provider, automatically keep generated replies in history, and manually update story state when desired.

## Product Shape

The system should start as a single-user local web application with one local workspace containing multiple stories and one WorldBook entry pool. This matches the architecture because manual control, transparent state, and deterministic assembly matter more than collaboration or automation in the first version.

The first interface is a local web app with panels for Session, System Insert Prompt, WorldBook, StateSet, History Buffer, User Input, assembled prompt preview, and generation output.

## Technology Stack

- Vite, React, and TypeScript for the local web UI.
- A local Node service for workspace JSON persistence and the DeepSeek official API adapter.
- Shared TypeScript domain types between UI, service, and deterministic core.
- Unit tests around the deterministic core before UI behavior depends on it.

## Core Data Model

- `Workspace`
  - `id`
  - `name`
  - `worldBooks`
  - `stories`
  - `activeStoryId`
  - `settings`
- `Story`
  - `id`
  - `title`
  - `session`, Markdown text
  - `systemInsertPrompt`, Markdown text
  - `openWorldBookIds`
  - `stateSet`
  - `historyBuffer`
  - `userInputDraft`
- `StateSet`
  - `documents`
- `StateDocument`
  - `id`
  - `title`
  - `content`, Markdown text
  - `order`
- `WorldBook`
  - `id`
  - `name`
  - `fixedEntries`
  - `keywordEntries`
- `WorldBookFixedEntry`
  - `id`
  - `title`
  - `content`, Markdown text
  - `order`
- `WorldBookKeywordEntry`
  - `id`
  - `title`
  - `keywordText`
  - `keywords`, parsed from `keywordText` by whitespace
  - `content`, Markdown text
  - `order`
- `HistoryEntry`
  - `id`
  - `role`
  - `content`, Markdown text
  - `reasoningContent`, assistant entries only
  - `hidden`
  - `status`, `complete` or `interrupted`
  - `createdAt`
  - `updatedAt`
- `Settings`
  - `historyLimit`, default `200`
  - `historyDisplayLimit`, default `200`
  - `modelProvider`, fixed to `deepseek` for the first version
  - `model`
  - `deepSeekBaseUrl`, default `https://api.deepseek.com`
  - `stream`, default `true`
  - `thinking`, default `enabled`
  - `reasoningEffort`, default `high`

## Deterministic Core

Implement the core as pure functions before UI work:

1. `matchKeywordEntries(worldBookKeywordEntries, userInput)`
   - Uses raw substring containment only.
   - Scans only User Input.
   - Considers only WorldBook.keyword entries whose ids are open for the active Story.
   - Supports multiple keywords per entry.
   - Parses configured keywords from whitespace-separated text.
   - Ignores empty parsed items.
   - Does not support whitespace inside a single keyword in the first version.
   - No segmentation, regex, case folding, embedding, semantic expansion, fuzzy matching, stemming, or synonym matching.
   - Returns open matched entries in stable configured order.
   - Uses the Workspace-level WorldBook entry `order`; Story-specific WorldBook ordering is out of scope.

2. `selectVisibleHistory(historyEntries)`
   - Removes hidden entries.
   - Preserves stable ids.
   - Does not create empty user records.

3. `trimHistory(historyEntries, historyLimit)`
   - Applies FIFO trimming only to the prompt context window.
   - Counts only visible History Entries toward the prompt context window.
   - Counts entries, not conversation rounds.
   - Does not preserve user/assistant pairs; the first retained entry may be assistant.
   - Does not delete stored History Entries.
   - Retains Hidden Entries in storage even when they do not participate in prompt assembly.

4. `assemblePrompt(input)`
   - Produces the fixed layer order:
     1. `# Session`
     2. `# System Insert Prompt`
     3. `# WorldBook.fixed`
     4. `# WorldBook.keyword`
     5. `# StateSet`
     6. `# History Buffer`
     7. `# User Input`
   - Wraps each layer with its fixed Markdown heading.
   - Renders headings even when a layer has no content.
   - Reserves H1 headings for fixed prompt layers.
   - Treats user-authored Markdown content as opaque text that may use H2 and deeper headings.
   - Concatenates WorldBook entry content only; does not insert entry titles or separators.
   - Concatenates State Documents by their `order` inside the `# StateSet` layer.
   - Serializes visible history entries with fixed role wrappers:
     ```md
     <user>
     ...
     </user>

     <assistant>
     ...
     </assistant>
     ```
   - Does not wrap the current User Input layer in `<user>` tags.
   - Does not resolve conflicts.
   - Does not mutate project data.

5. `validateProject(project)`
   - Reports missing required layers, empty open entries, duplicate ids, invalid roles, and configuration problems.
   - Reports conflicts as warnings only when they are mechanically detectable.
   - Prevents generation when User Input is empty and the active Story has no visible History Entries.

6. `buildApiMessages(input)`
   - Builds the complete DeepSeek request messages deterministically.
   - Sends Session, System Insert Prompt, WorldBook, and StateSet as separate system messages.
   - Builds the WorldBook system message with `# WorldBook.fixed` before `# WorldBook.keyword`.
   - Keeps fixed Markdown headings inside each system message for readability and debugging.
   - Sends visible History Buffer entries as user or assistant messages according to each History Entry role.
   - Sends non-empty current User Input as the final user message.
   - Does not send a final user message when current User Input is empty.
   - Excludes hidden History Entries.
   - Excludes assistant reasoning content.
   - Uses the same WorldBook keyword matching and prompt context window selection rules as prompt preview assembly.

## Storage

Start with explicit local JSON files:

- `workspace.json`
- Story data embedded in the workspace file for the first version.
- Optional exports as Markdown for prompt review.

Do not start with a database. A database becomes relevant when the product needs multi-user editing, large searchable libraries, concurrent writes, or versioned state history.

## UI Layout

- Left sidebar: Story list (create, select, delete). Collapsible.
- Main area:
  - Top bar: Story title + Settings + Prompt Preview buttons.
  - Tab bar: 会话 | 系统提示 | 世界书 (Session, System Insert Prompt, WorldBook).
    - Clicking a tab opens its editor panel. Clicking again closes it.
    - Only one tab open at a time. Tab editors are above the generation area.
  - Generation area (always visible below tabs):
    - StateSet (summary card + "管理状态" button opening right-side drawer)
    - History Buffer (scrollable entries with hidden toggle, thinking tab)
    - User Input (textarea with draft persistence + Generate button)
- Prompt Preview: button-triggered overlay card showing the assembled prompt in exact layer order.
- Generated output: appears as an assistant History Entry appended to the end of History Buffer.

The tab-based layout keeps the generation interface clean and immersive while providing access to configuration panels on demand.

## UI Workflow

1. User opens the local workspace.
2. User creates or selects a Story from the left sidebar.
3. User opens or closes WorldBook entries needed for the current Story or scene.
4. User edits the Story's Session, System Insert Prompt, StateSet, and History Buffer directly in the main area.
5. User optionally clicks Prompt Preview to inspect the full assembled prompt in an overlay card.
6. User writes User Input.
7. User clicks Generate.
8. App builds complete role-preserving API messages and sends them to the configured LLM adapter.
9. If User Input is non-empty, app appends it to History Buffer as a user History Entry.
10. App streams DeepSeek `reasoning_content` and visible `content` separately.
11. Generated assistant output is streamed directly into a new assistant History Entry at the end of History Buffer. Visible content updates in real time. Reasoning content is shown in a collapsible thinking tab (collapsed by default) on the assistant History Entry.
12. On successful completion, the assistant History Entry is marked complete.
13. If the user stops generation or the stream connection fails after partial output, app retains the partial assistant History Entry with `status: interrupted`.
14. If the user dislikes the result, they can delete that generated History Entry and generate again without entering new User Input.
15. User manually decides whether to hide entries, edit entries, or update StateSet.

The UI may automatically add generated assistant output to History Buffer. It must never silently update StateSet from generated output.
Empty User Input may trigger generation for regeneration workflows, but the app must not add an empty user History Entry.
Empty User Input also must not create an empty final user API message.
Empty User Input is valid only when there is at least one visible History Entry; otherwise the UI prompts the user to enter content.
Non-empty User Input is added before the generated assistant output.
If generation fails after adding non-empty User Input, the user History Entry is retained. The user can retry by leaving User Input empty and clicking Generate again.
User Input is saved as a Story-specific draft before generation. The draft is not a History Entry until generation starts and the input is non-empty.
After non-empty User Input is appended to History Buffer, clear the Story's User Input draft.
DeepSeek reasoning content is stored long-term with the assistant History Entry, separately from assistant visible content. It is available in the UI but is excluded from future prompt assembly and API message construction.
Editing assistant visible content preserves the original reasoning content unchanged.
Deleting an assistant History Entry also deletes its stored reasoning content.
Hidden assistant History Entries keep their reasoning content viewable in history management.

## Suggested Milestones

### Milestone 1: Project Skeleton

- Create a Vite, React, and TypeScript app.
- Add a local Node service boundary.
- Add formatting, linting, and test runner.
- Add domain types and fixture project data.
- Add deterministic core tests.

### Milestone 2: Prompt Assembly Core

- Implement strict keyword matching.
- Implement visible history selection.
- Implement FIFO trimming.
- Implement prompt assembly.
- Implement API message construction.
- Implement project validation.
- Add golden tests for assembled prompt output.
- Add golden tests for role-preserving API messages.

### Milestone 3: Local Project Persistence

- On first launch with no `workspace.json`, auto-create an empty Workspace with one default Story.
- Load and save workspace JSON.
- Auto-save with debounce (2-second delay after last edit).
- Validate workspace files on load.
- Add import/export path for Markdown prompt previews.
- Add migration boundary, even if the first migration is version `1`.
- Do not delete stored History Entries as part of prompt context trimming.

### Milestone 4: Manual Editing UI

- Left sidebar: Story list with create, select, and delete controls. Deleting a Story shows a confirmation dialog and is irreversible; WorldBook entries are unaffected. Sidebar is collapsible to give more space to the main area.
- Main area: vertical scroll layout with panels in fixed order: Session, System Insert Prompt, WorldBook, StateSet, History Buffer, User Input.
- Add WorldBook panel: list of named books with create/rename/delete.
- Each book contains fixed and keyword entry editors.
- Treat WorldBook entry content as Markdown prompt text with no internal schema parsing.
- Do not auto-insert WorldBook entry titles into assembled prompts.
- Reserve H1 for assembled prompt layer headings; user-authored Markdown content should start at H2 or deeper.
- Add Story-specific open and close controls for entire WorldBooks (not individual entries).
- Use Workspace-level WorldBook entry order for injection and display; do not add Story-specific ordering in the first version.
- Allow users to manually edit WorldBook.fixed entries; fixed means always-injected foundational setting knowledge, not read-only storage.
- In the keyword entry editor, accept multiple keywords separated by whitespace.
- Add history entry editor with hidden toggle.
- Treat History Entry content as Markdown text.
- Treat StateSet as one or more Markdown State Documents with no internal schema parsing.
- Deleting the last remaining StateDocument auto-creates a new default empty StateDocument titled "State".
- Treat Session and System Insert Prompt as Markdown text with no internal schema parsing.
- Show recent History Entries by default according to `historyDisplayLimit`.
- Allow scrolling through displayed History Entries.
- Do not include history search in the first version.
- Preserve entry ids across edits.
- Show validation warnings without auto-repair.
- Add a prominent state-management button near the top of the StateSet panel so the user can quickly edit StateSet manually.
- Open StateSet editing in a right-side panel with Markdown State Document editing and recent generated output shown as reference.
- Persist User Input as a Story-specific draft.
- History Buffer entries show generated assistant output with collapsible thinking tab on each assistant entry.

### Milestone 5: Preview and Generation

- Provide a Prompt Preview button that opens an overlay card showing the assembled prompt in exact layer order.
- Show matched keyword entries on demand before generation.
- Switching to a different Story during active generation cancels the current stream and retains partial output as an `interrupted` History Entry.
- Add DeepSeek official API adapter behind the local Node service.
- Use DeepSeek's OpenAI-compatible streaming Chat Completions API through the Node service.
- Enable DeepSeek thinking mode and capture streaming `reasoning_content`.
- Keep the DeepSeek API key out of browser code.
- Add streaming generation output panel.
- Add a collapsible thinking tab that is collapsed by default and can be opened at any time for the current assistant output.
- Persist reasoning content with assistant History Entries.
- Keep reasoning content unchanged when assistant visible content is edited.
- Delete reasoning content when its assistant History Entry is deleted.
- Keep reasoning content viewable for hidden assistant History Entries.
- Automatically add successful generated assistant output to History Buffer.
- Retain stopped or connection-interrupted assistant output as `status: interrupted`.
- Automatically add non-empty User Input to History Buffer before the generated assistant output.
- Clear the User Input draft after adding non-empty User Input to History Buffer.
- Allow deleting the generated assistant History Entry and regenerating with empty User Input.
- Do not add an empty user History Entry when generating with empty User Input.
- Preserve an already-added user History Entry when generation fails.

### Milestone 6: Hardening

- Add sample project.
- Add end-to-end tests for core workflows.
- Add error states for invalid project files and failed generation.
- Add documentation for manual state maintenance.

## Test Plan

- Prompt assembly preserves exact layer order.
- Prompt assembly uses fixed Markdown headings for each layer.
- Prompt assembly renders headings for empty layers.
- Prompt assembly reserves H1 for fixed layer headings and does not parse user-authored H2+ content.
- Prompt assembly does not auto-insert WorldBook entry titles or separators.
- Prompt assembly wraps visible history entries in fixed user/assistant role tags.
- Prompt assembly does not wrap the current User Input layer in user tags.
- API message construction sends Session, System Insert Prompt, WorldBook, and StateSet as separate system messages.
- API message construction combines WorldBook.fixed and WorldBook.keyword in one WorldBook system message, in that order.
- API message construction preserves History Entry user/assistant roles.
- API message construction sends current User Input as the final user message.
- API message construction omits the final user message when current User Input is empty.
- API message construction excludes reasoning content.
- Higher-priority layers appear before lower-priority layers.
- Hidden history entries are excluded.
- Empty User Input can trigger generation.
- Empty User Input generation is rejected when there are no visible History Entries.
- Empty user records are not added to History Buffer.
- Non-empty User Input is added before generated assistant output.
- User Input draft is Story-specific and does not become history until generation starts.
- User Input draft is cleared after non-empty User Input enters History Buffer.
- Generation failure preserves the already-added user History Entry and does not add an assistant History Entry.
- History trimming removes oldest entries first.
- History trimming counts visible History Entries, not conversation rounds.
- History trimming does not preserve user/assistant pairs.
- History trimming affects only prompt assembly and does not delete stored history.
- Editing a History Entry preserves id.
- Keyword matching is exact and deterministic.
- Keyword matching uses raw substring containment in User Input.
- Keyword matching scans only User Input.
- A WorldBook.keyword entry matches if any configured whitespace-separated keyword matches User Input.
- Empty keyword items are ignored.
- Single keywords cannot contain whitespace in the first version.
- WorldBook entries not open for the active Story are not injected.
- Generation appends assistant output to History Buffer.
- Generation streams output in the first version.
- Streaming separates visible content from reasoning content.
- Reasoning content is viewable but not included in future prompt assembly.
- Editing assistant visible content preserves original reasoning content.
- Deleting assistant History Entry deletes its reasoning content.
- Hidden assistant entries keep reasoning content viewable in history management.
- Stopped or connection-interrupted streams are retained with `status: interrupted`.
- Generation does not mutate StateSet.

## Open Decisions

No product-shaping decisions are currently open. Implementation choices remain below the architecture boundary and should follow the simplest local web app approach unless new requirements appear.
