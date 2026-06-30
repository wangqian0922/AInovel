# Deterministic Prompt Assembly Instead of Agent Orchestration

This project deliberately uses a fixed prompt assembly pipeline for long-running serialized fiction instead of an autonomous agent, tool-calling workflow, or automatic memory system. The decision preserves manual control and reproducible context construction: the LLM generates prose only, while the user owns all state, world knowledge, history editing, and conflict resolution.

## Considered Options

- Deterministic prompt assembly with manual state maintenance.
- Agent-based orchestration with tool calls.
- Automatic memory or state extraction from generated text.

## Consequences

The system is easier to reason about and test, but it shifts responsibility for state maintenance to the user. Future changes must not add automatic state mutation or semantic retrieval without an explicit architecture decision.

