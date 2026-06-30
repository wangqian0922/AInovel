# AI Novel Generation

This context defines the language of a deterministic prompt assembly system for long-running serialized fiction. It exists to keep the product boundary clear: the system assembles generation context, while the user owns story state.

## Language

**Prompt Assembly**:
The deterministic construction of the full LLM input from ordered prompt layers.
_Avoid_: orchestration, agent workflow

**API Message Construction**:
The deterministic construction of role-preserving messages sent to the LLM.
_Avoid_: chat memory, provider-managed history

**Prompt Layer Heading**:
A fixed Markdown heading that marks the start of a prompt layer in assembled output.
_Avoid_: decorative title

**User-authored Prompt Content**:
The manually written Markdown content inside prompt layers and entries.
_Avoid_: parsed document structure

**Session**:
The fixed per-session story charter and highest-priority constraints.
_Avoid_: project config, system prompt

**Session Content**:
The Markdown text representing a Story's charter and top-priority constraints.
_Avoid_: structured story config

**Workspace**:
The local writing workbench that contains one or more Stories.
_Avoid_: account, project library

**Story**:
A single long-running fiction work with its own prompt layers and history.
_Avoid_: project

**System Insert Prompt**:
The fixed per-session output-behavior instruction layer.
_Avoid_: world setting, story bible

**System Insert Prompt Content**:
The Markdown text representing output behavior constraints.
_Avoid_: structured model config

**WorldBook**:
A workspace-level named book containing world knowledge entries. Each Workspace may have multiple WorldBooks. A Story opens or closes entire books, not individual entries.
_Avoid_: memory, retrieval system

**WorldBook Entry Content**:
The Markdown prompt text stored inside a WorldBook entry.
_Avoid_: structured fact record, schema

**WorldBook.fixed**:
The open foundational setting entries that are always injected for core premise, background, and realm or power systems.
_Avoid_: locked data, global memory

**WorldBook.keyword**:
The open world knowledge entries included when User Input contains one of an entry's configured keywords as raw text.
_Avoid_: semantic retrieval, fuzzy recall

**Open WorldBook Entry**:
A WorldBook entry currently available for a Story's prompt assembly.
_Avoid_: shared entry, enabled memory

**Closed WorldBook Entry**:
A WorldBook entry retained in the library but unavailable for a Story's prompt assembly.
_Avoid_: deleted entry, private entry

**Keyword List**:
A whitespace-separated set of trigger keywords configured on a WorldBook.keyword entry; empty items are ignored and a single keyword cannot contain whitespace in the first version.
_Avoid_: query, search expression

**StateSet**:
The current manually maintained set of story-state documents and single source of truth.
_Avoid_: memory, event history

**State Document**:
A Markdown text document inside StateSet representing part of the current story-state snapshot. All documents always participate in prompt assembly; there is no open/closed toggle. Documents can only be deleted, not hidden or archived. A new Story is created with a single default empty StateDocument titled "State".
_Avoid_: state database, structured fields, optional context

**History Buffer**:
The stored set of prior interaction entries available for editing and prompt context selection.
_Avoid_: chat log, transcript

**History Entry**:
A stable record inside the History Buffer with an id, role, content, and hidden flag.
_Avoid_: message, row

**History Entry Content**:
The Markdown text stored as a user or assistant History Entry.
_Avoid_: structured message payload

**History Role Wrapper**:
The fixed role tag pair used to serialize a visible History Entry into Prompt Assembly.
_Avoid_: Markdown heading

**Assistant Reasoning**:
The optional DeepSeek reasoning text streamed separately from the assistant's visible story content.
_Avoid_: History content, prompt context

**Interrupted Entry**:
An assistant History Entry whose streaming generation stopped before normal completion.
_Avoid_: failed entry, deleted entry

**Hidden Entry**:
A History Entry retained for editing or audit but excluded from prompt assembly.
_Avoid_: deleted entry

**Prompt Context Window**:
The subset of visible History Entries that participates in Prompt Assembly after FIFO trimming.
_Avoid_: storage limit

**User Input**:
The current generation instruction supplied by the user.
_Avoid_: command, prompt

**User Input Draft**:
The Story-specific saved draft of User Input before generation.
_Avoid_: History Entry, stored prompt

## Relationships

- A **Workspace** contains one or more **Stories**.
- A **Workspace** may have multiple **WorldBooks**.
- Each **Story** remembers which **WorldBook** ids are open.
- A Story opens or closes entire WorldBooks, not individual entries.
- Each **Story** owns its own **Session**.
- Each **Story** owns its own **System Insert Prompt**.
- **Session Content** and **System Insert Prompt Content** are Markdown text.
- Each **Story** owns its own **StateSet**.
- Each **Story** owns its own **History Buffer**.
- WorldBook injection order follows the entry's Workspace-level order, not a Story-specific order.
- **Prompt Assembly** combines exactly one **Story**'s **Session**, one **System Insert Prompt**, zero or more open **WorldBook.fixed** entries, zero or more open and matched **WorldBook.keyword** entries, one **StateSet**, visible **History Entries**, and one **User Input**.
- **Prompt Assembly** wraps each layer with a fixed **Prompt Layer Heading**.
- Empty prompt layers still keep their **Prompt Layer Heading**.
- **API Message Construction** sends **Session**, **System Insert Prompt**, **WorldBook**, and **StateSet** as separate system messages.
- The **WorldBook** system message contains **WorldBook.fixed** before **WorldBook.keyword**.
- **API Message Construction** sends visible **History Entries** as user or assistant messages according to their role.
- **API Message Construction** sends current **User Input** as the final user message.
- Empty **User Input** does not create a final user message in **API Message Construction**.
- **Assistant Reasoning** is never sent in **API Message Construction**.
- **Prompt Layer Headings** use H1, while **User-authored Prompt Content** starts at H2 or deeper.
- **User-authored Prompt Content** is not parsed or managed internally by the system.
- WorldBook entries are concatenated by content only; entry titles are not automatically inserted into **Prompt Assembly**.
- **WorldBook.fixed** has higher priority than **WorldBook.keyword**.
- **WorldBook.fixed** is manually editable even though it represents stable foundational knowledge.
- **WorldBook Entry Content** is Markdown text and is injected as prompt text without internal structural parsing.
- **WorldBook.keyword** scans only **User Input** and may use a **Keyword List**.
- **WorldBook.keyword** matching is raw substring containment with no segmentation, regex, case folding, fuzzy matching, or semantic expansion.
- **Closed WorldBook Entries** do not participate in **Prompt Assembly**.
- **StateSet** is maintained outside the LLM and does not preserve historical versions.
- **StateSet** contains one or more **State Documents**.
- **State Documents** are Markdown text and are not parsed as structured state.
- **History Buffer** contains many **History Entries** and excludes **Hidden Entries** during **Prompt Assembly**.
- **History Entry Content** is Markdown text.
- Visible **History Entry Content** is serialized with a **History Role Wrapper**, either `<user>...</user>` or `<assistant>...</assistant>`.
- Current **User Input** is not serialized with a **History Role Wrapper**.
- Generated assistant output may become a **History Entry** automatically, but it never changes **StateSet** automatically.
- Streaming assistant output interrupted by user stop or connection failure remains as an **Interrupted Entry**.
- **Assistant Reasoning** is stored with the assistant **History Entry** and viewed on demand, but it does not participate in future **Prompt Assembly**.
- Editing assistant visible content does not change **Assistant Reasoning**.
- Deleting an assistant **History Entry** also deletes its **Assistant Reasoning**.
- **Hidden Entries** remain in stored history but do not count toward the **Prompt Context Window**.
- Hidden assistant entries may still show visible content and **Assistant Reasoning** in history management.
- FIFO trimming applies to the **Prompt Context Window**, not to stored **History Buffer** deletion.
- **Prompt Context Window** size is counted by visible **History Entry** count, not conversation rounds.
- FIFO trimming does not preserve user/assistant pairs; the first retained **History Entry** may be an assistant entry.
- **User Input** has the lowest priority in conflict resolution.
- Each **Story** owns its own **User Input Draft**.
- Empty **User Input** may trigger generation, but it does not become a **History Entry**.
- Empty **User Input** generation requires existing visible **History Entries**.
- Non-empty **User Input** becomes a user **History Entry** before the generated assistant output becomes an assistant **History Entry**.
- After non-empty **User Input** becomes a **History Entry**, the **User Input Draft** is cleared.
- If generation fails after storing non-empty **User Input**, that user **History Entry** remains and the retry can use empty **User Input**.

## Example Dialogue

> **Dev:** "If the latest generated chapter says a character moved to another city, should the system update the StateSet automatically?"
> **Domain expert:** "No. The generated reply can enter History Buffer, but the user must manually update the StateSet before that move becomes current truth."

## Flagged Ambiguities

- "memory" is avoided because it can mean **WorldBook**, **StateSet**, or **History Buffer**. Use the specific term instead.
- "prompt" is overloaded. Use **Prompt Assembly** for the full constructed input and **User Input** for the current instruction.
- "project" is avoided for story data because the first product has one local **Workspace** that can contain multiple **Stories**.
- `historyLimit` was clarified to mean the **Prompt Context Window** limit, not the stored **History Buffer** size.
- `historyLimit` was clarified as visible **History Entry** count, not conversation-round count.
- FIFO trimming was clarified as not preserving user/assistant pairs.
- **WorldBook.keyword** matching was clarified to scan only **User Input**, not **Session**, **StateSet**, or **History Buffer**.
- **WorldBook.keyword** matching was clarified as raw substring containment in **User Input**.
- **Keyword List** parsing was clarified as whitespace-separated with empty items ignored; single keywords cannot contain whitespace in the first version.
- **WorldBook Entry Content** was clarified as Markdown prompt text, not structured data.
- **StateSet** was clarified as one or more Markdown **State Documents**, not structured state fields.
- **Session Content** and **System Insert Prompt Content** were clarified as Markdown text.
- **History Entry Content** was clarified as Markdown text.
- **Prompt Assembly** output was clarified as Markdown text with fixed layer headings.
- Empty prompt layers were clarified as still rendering fixed headings.
- H1 was reserved for fixed prompt layer headings; user-authored content starts at H2 or deeper.
- WorldBook entry titles were clarified as management metadata, not automatic prompt text.
- History serialization was clarified as fixed role wrappers around Markdown content.
- Current **User Input** was clarified as unwrapped because it already has its own prompt layer.
- API messages were clarified as role-preserving messages, not a single user message containing the entire prompt preview.
- Empty **User Input** was clarified as producing no final user API message.
- Empty **User Input** with no visible history was clarified as invalid for generation.
- "fixed" in **WorldBook.fixed** means always injected and foundational, not technically immutable.
- Empty **User Input** was clarified as valid for regeneration but not stored as an empty user **History Entry**.
- Non-empty **User Input** was clarified as automatically stored before the generated assistant **History Entry**.
- Failed generation keeps any already-stored non-empty user **History Entry** so retry can reuse the same context with empty **User Input**.
- FIFO trimming was clarified as prompt-time context selection, not automatic deletion from stored **History Buffer**.
- **WorldBook** was clarified as a workspace-level named book containing entries. A Workspace may have multiple books.
- A Story opens or closes entire WorldBooks, not individual entries.
- **Open WorldBook** status was clarified as Story-specific, while WorldBook entry content belongs to the Workspace pool.
- WorldBook ordering was clarified as Workspace-level only for the first version.
- **User Input Draft** was clarified as Story-specific and not a **History Entry** until generation starts.
- **User Input Draft** is cleared after non-empty **User Input** is appended to **History Buffer**.
- Interrupted streaming output was clarified as retained assistant history with an `interrupted` status.
- **Assistant Reasoning** was clarified as viewable metadata, not future prompt context.
- **Assistant Reasoning** is collapsed by default in the UI but can be opened at any time.
- **Assistant Reasoning** is retained long-term with the assistant **History Entry**.
- Editing assistant content was clarified as preserving original **Assistant Reasoning** unchanged.
- Deleting assistant history was clarified as deleting attached **Assistant Reasoning** as well.
- Hidden assistant history was clarified as still allowing **Assistant Reasoning** inspection.
- **StateDocument** was clarified as having no open/closed toggle; all documents always participate in prompt assembly.
- **Settings** is a **Workspace**-level concern, not **Story**-level, in the first version.
