# AGENTS.md

## Project

This repository is for an AI novel generation system. The intended product is a deterministic prompt assembly tool for long-running serialized fiction, not an autonomous writing agent. One local workspace can manage multiple stories.

## Source Documents

- Read `ai_novel_system.md` first. It is the current stable architecture note.
- Read `CONTEXT.md` before changing domain terms.
- Read `docs/implementation-plan.md` before implementation work.
- Read `docs/adr/` before changing core architectural boundaries.

## Non-Negotiable Architecture

- No agent behavior.
- No tool calls inside the generation loop.
- No automatic state writing.
- All story state is externally and manually maintained.
- The LLM only generates text.
- Generated assistant output may be automatically appended to `History Buffer`.
- Generated assistant output must never automatically update `StateSet`.
- Interrupted streaming output is retained as an assistant `History Entry` marked `interrupted`.
- Prompt assembly order is fixed:
  1. Session
  2. System Insert Prompt
  3. WorldBook.fixed
  4. WorldBook.keyword
  5. StateSet
  6. History Buffer
  7. User Input
- Each assembled prompt layer must be wrapped with a fixed Markdown heading, such as `# Session`.
- Empty prompt layers still output their fixed Markdown headings with empty content.
- User-authored prompt content should not use H1 headings; H1 is reserved for fixed prompt layer headings.
- User-authored prompt content may use H2 and deeper Markdown headings, and the system should not parse or manage that internal structure.
- Do not automatically insert WorldBook entry titles or separators into assembled prompts.

## Domain Rules

- `Session` holds the story charter and highest-priority constraints.
- Each `Story` owns its own `Session`.
- `Session` content is Markdown text.
- `System Insert Prompt` controls output behavior only, such as length, style, and pacing.
- Each `Story` owns its own `System Insert Prompt`.
- `System Insert Prompt` content is Markdown text.
- `WorldBook` is a workspace-level named book containing world knowledge entries.
- Each Workspace may have multiple WorldBooks.
- Each `Story` remembers which WorldBook ids are open.
- A Story opens or closes entire WorldBooks, not individual entries.
- WorldBook injection order follows each entry's global `order`; Story-specific ordering is out of scope for the first version.
- Open `WorldBook.fixed` entries contain always-injected foundational setting knowledge, such as core premise, background, and power or realm systems. They are manually editable, not technically locked.
- Open `WorldBook.keyword` entries are injected only by strict keyword hits in `User Input`.
- WorldBook entry content is plain Markdown prompt text and should not be structurally parsed.
- A `WorldBook.keyword` entry may define multiple keywords separated by whitespace.
- A single keyword cannot contain spaces in the first version.
- Strict keyword matching means raw substring containment in `User Input`.
- Closed `WorldBook` entries must not participate in prompt assembly.
- `StateSet` is the current truth snapshot and is overwrite-only.
- Each `Story` owns its own `StateSet`.
- `StateSet` contains one or more Markdown state documents, not structured state fields.
- StateDocuments have no open/closed toggle. All documents always participate in prompt assembly.
- The state-management button opens a right-side panel with Markdown state document editing and recent output reference.
- `History Buffer` stores history entries. FIFO trimming applies only to the prompt context window, not stored history deletion.
- Each `Story` owns its own `History Buffer`.
- `History Entry` content is Markdown text.
- `historyLimit` counts visible History Entries, not conversation rounds.
- FIFO trimming does not preserve user/assistant pairs; the first retained entry may be an assistant entry.
- Prompt assembly wraps visible history entry content in fixed role tags: `<user>...</user>` or `<assistant>...</assistant>`.
- The current `User Input` layer is not wrapped in `<user>` tags.
- API messages must preserve roles: Session, System Insert Prompt, WorldBook, and StateSet become separate system messages; the WorldBook system message contains `# WorldBook.fixed` then `# WorldBook.keyword`; History Buffer entries become user or assistant messages by role; current User Input becomes the final user message.
- DeepSeek reasoning content must never be sent back in API messages.
- `User Input` is the current generation instruction.
- Each `Story` saves its own `User Input` draft.
- `hidden` history entries must not participate in prompt assembly.
- Hidden assistant entries may still show their visible content and reasoning content in history management.
- Empty `User Input` may trigger generation, but empty user records must not be added to `History Buffer`.
- Empty `User Input` must not create a final empty user API message.
- Empty `User Input` generation is allowed only when the active Story has visible history context.
- Non-empty `User Input` is appended to `History Buffer` before the generated assistant output.
- Clear the `User Input` draft after appending non-empty `User Input` to `History Buffer`.
- If generation fails after a non-empty `User Input` was appended, keep that user entry; retry uses empty `User Input`.
- Editing a history entry must not change its stable `id`.
- DeepSeek `reasoning_content` is stored separately from visible assistant `content`.
- Store `reasoning_content` with the assistant `History Entry` long-term.
- Reasoning content may be shown in the UI, but must not participate in future prompt assembly or API messages.
- The reasoning UI is collapsed by default and can be opened at any time.
- Editing assistant visible content must not rewrite stored reasoning content.
- Deleting an assistant `History Entry` also deletes its stored reasoning content.

## Conflict Handling

When two prompt layers conflict, the higher-priority layer wins. Do not add automatic repair, reconciliation, or inferred state updates unless the architecture document is deliberately changed.

## Implementation Guidance

- Build the first version as a single-user local web app.
- Treat the local workspace as the top-level container; it may contain multiple stories. Do not add multi-project management in the first version.
- Use Vite, React, and TypeScript for the UI.
- Use a local Node service for workspace JSON persistence and the DeepSeek official API adapter.
- DeepSeek API keys must stay on the Node side and must not be sent to external clients. The Node service holds the key and proxies DeepSeek API calls. The web UI may provide a settings form to configure the key, which is then sent to the Node service for use.
- Use streaming generation in the first version; non-streaming generation is not the target experience.
- Capture DeepSeek streaming `reasoning_content` separately from final `content`.
- Prefer a small deterministic core with pure functions for prompt assembly, keyword matching, buffer trimming, and validation.
- Keep prompt preview assembly separate from API message construction.
- Keyword matching scans only `User Input`.
- Keep model-provider calls behind an adapter so the assembly rules can be tested without network access.
- Store project data in explicit structured files at first. Do not introduce a database until workflows require concurrent access, indexing, or multi-user durability.
- Use tests around ordering, hidden-entry exclusion, FIFO trimming, strict keyword matching, and conflict visibility.
- Any UI should make manual control obvious: users edit state, worldbook entries, session text, and history directly.
- The generation view should provide a direct state-management button so the user can quickly edit `StateSet` after reading output.
- The first History Buffer UI should show recent entries with scrolling; search is out of scope for the first version.

## Documentation Rules

- Update `CONTEXT.md` when a domain term is clarified.
- Create an ADR only for decisions that are hard to reverse, surprising without context, and based on a real trade-off.
- Keep implementation plans out of `CONTEXT.md`.
