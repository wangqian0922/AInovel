# DeepSeek Official API for Generation

The first implementation will use the DeepSeek official API as the only model provider, configured at the Workspace level and called from the local Node service. DeepSeek provides an OpenAI-compatible base URL, so the adapter can use the OpenAI-style streaming Chat Completions shape while keeping API keys out of browser code. Thinking mode is part of the first version: streamed `reasoning_content` is captured separately from visible `content`.

## Consequences

The UI does not need model-provider selection in the first version. Provider-specific details remain isolated in the Node adapter, so the deterministic prompt assembly core stays independent of DeepSeek and can be tested without network access. Streaming is part of the first-version experience, so generation state must handle in-progress, completed, failed, and cancelled outputs explicitly. Reasoning content is stored for inspection but excluded from future prompt assembly and API messages.
