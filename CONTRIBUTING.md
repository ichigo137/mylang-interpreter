# Contributing to MyLang

## Development requirements
- Node.js 20 or newer
- Git
- An editor

There are no third-party npm dependencies in the current prototype.

## Before changing the language
1. Read `docs/LANGUAGE.md` and `docs/GRAMMAR.md`.
2. Make the smallest focused change that implements the feature.
3. Add tests for expected behavior and error cases.
4. Run `npm test` and execute relevant examples.
5. Update the language documentation and roadmap.

## Code conventions
- Use ES modules and two-space indentation.
- Keep lexing, parsing, evaluation, and CLI concerns separated.
- Prefer helpful source-positioned language errors over generic exceptions.
- Do not add filesystem, network, shell, or other powerful runtime access without an explicit design and security review.

## Pull requests
Describe the behavior change, tests run, compatibility impact, and any remaining limitations. Until v1.0, language changes may be breaking.
