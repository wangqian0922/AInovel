# Local Web App with TypeScript and Node

The first implementation will be a single-user local web app built with Vite, React, and TypeScript, backed by a local Node service for project JSON persistence and model-provider adapters. This keeps the UI iteration fast while letting the deterministic prompt assembly core share typed data structures across the browser, service, and tests.

## Considered Options

- Vite, React, TypeScript, and local Node service.
- CLI-first implementation.
- Native desktop application.

## Consequences

The project can prioritize multi-panel editing and prompt preview from the start without committing to a database or desktop packaging. Browser code should not directly own local persistence or API keys; those responsibilities belong behind the local Node service boundary.

