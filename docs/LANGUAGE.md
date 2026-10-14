# MyLang Language Design (v0.1)

MyLang is a dynamically typed, tree-walk interpreted language. Version 0.1 focuses on a small syntax, lexical scope, functions, and understandable errors.

## Documentation

- **[Language Reference](REFERENCE.md)** — syntax, types, operators, variables, control flow, functions, built-ins, examples, and limitations.
- **[Architecture and Source-Code Guide](ARCHITECTURE.md)** — what the functions in each source file do and how the lexer, parser, interpreter, and CLI work together.
- **[Formal Grammar](GRAMMAR.md)** — compact EBNF grammar.
- **[Roadmap](ROADMAP.md)** — planned features and development phases.

## Current design decisions

- **Runtime:** Node.js 20+, with no third-party runtime dependencies.
- **Execution model:** source text is tokenized, parsed into AST nodes, then evaluated by a tree-walk interpreter.
- **Types:** numbers, strings, booleans, and `null`; values are dynamically typed.
- **Bindings:** `let` is mutable; `const` cannot be reassigned. Names use lexical scope.
- **Functions:** named functions, exact argument counts, return values, recursion, and lexical closures.
- **Control flow:** `if/else`, `while`, blocks, and `return`.
- **Output:** `print expression;` is a statement. `clock()` is the current native callable.
- **Errors:** lexer, parser, and runtime errors carry source locations where available.

## Compatibility policy

MyLang is a prototype. Until v1.0, syntax and semantics may change. A language feature should have tests and documentation before it is considered stable.