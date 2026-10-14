# MyLang Reference Manual

**Version:** 0.1.0  
**Status:** Prototype  
**Runtime:** Node.js 20+

This is the practical reference for writing MyLang programs. It documents the language that the current interpreter actually implements. For implementation internals, see [Architecture and source-code guide](ARCHITECTURE.md). For the formal grammar, see [Grammar](GRAMMAR.md).

## 1. Running programs

Run a source file:

```powershell
node .\src\cli.js .\examples\hello.my
```

Start the interactive REPL:

```powershell
node .\src\cli.js
```

Exit the REPL with `.exit`. Run tests with `npm test`.

Source files conventionally use the `.my` extension, but the runner reads the path you provide; it does not enforce an extension.

## 2. Values and types

| Type | Examples | Notes |
|---|---|---|
| Number | `42`, `3.14`, `0` | JavaScript IEEE-754 number; integer and decimal literals are supported. |
| String | `"hello"`, `'hello'` | Both quote styles are supported. |
| Boolean | `true`, `false` | Used by conditions and logical operators. |
| Null | `null` | Represents an absent value. |

MyLang is dynamically typed. A variable can be assigned a value of a different type unless an operation rejects that type.

There are **no arrays, objects, classes, modules, or user-defined types** in v0.1.0.

## 3. Comments and names

A comment begins with `//` and continues to the end of that line:

```mylang
// This is a comment.
let score = 10; // Inline comments are supported.
```

Identifiers are case-sensitive. They must start with an ASCII letter or underscore and may then contain ASCII letters, digits, and underscores. Examples: `score`, `_temp`, `player2`. A name cannot start with a digit.

## 4. Variables and constants

```mylang
let score = 10;
score = score + 5;
const maximum = 100;
print score;
print maximum;
```

- `let name = expression;` creates a mutable variable.
- `const name = expression;` creates a binding that cannot be reassigned.
- Every declaration needs an initializer and a trailing semicolon.
- A name can be declared only once in the same scope.
- Blocks create nested lexical scopes. Inner scopes can read outer variables.
- Assigning to an undeclared name is an error.
- Assigning to a `const` binding is an error.

## 5. Operators

The following table is ordered from highest to lowest precedence.

| Precedence | Operators | Meaning |
|---:|---|---|
| 1 | `()`, function call `()` | Grouping and calls |
| 2 | `!`, unary `-` | Logical NOT and numeric negation |
| 3 | `*`, `/`, `%` | Multiply, divide, remainder |
| 4 | `+`, `-` | Add, subtract |
| 5 | `>`, `>=`, `<`, `<=` | Numeric comparisons |
| 6 | `==`, `!=` | Strict equality and inequality |
| 7 | `&&` | Logical AND |
| 8 | `||` | Logical OR |
| 9 | `=` | Assignment |

Parentheses can make evaluation order explicit: `(2 + 3) * 4`.

### Arithmetic

```mylang
print 8 + 4;   // 12
print 8 - 4;   // 4
print 8 * 4;   // 32
print 8 / 4;   // 2
print 5 % 2;   // 1
print -5;      // -5
```

Arithmetic operands must be numbers, except for `+`: if either operand is a string, `+` converts both values to their display text and concatenates them. For example, `"level " + 5` produces `"level 5"`.

Division and remainder by zero raise a runtime error. Numeric literals may contain a decimal point when digits appear on both sides, for example `12.5`. Scientific notation is not supported by the current lexer.

### Comparisons and equality

```mylang
print 5 > 3;       // true
print 5 <= 3;      // false
print 5 == 5;      // true
print "a" != "b"; // true
```

Comparison operators require numeric operands. Equality compares primitive values strictly: different types are not coerced to match.

### Logical operators and truthiness

```mylang
print !false;        // true
print true && false; // false
print true || false; // true
```

Only `false` and `null` are falsey. All numbers (including `0`), strings (including `""`), and other supported values are truthy. `&&` and `||` short-circuit and return an operand value, not necessarily a Boolean.

## 6. Printing output

`print expression;` evaluates the expression and writes its display value to standard output:

```mylang
print "Hello, world!";
print 6 * 7;
print true;
print null;
```

The REPL also displays the result of a bare expression typed interactively, such as `6 * 7`. In a source file, use `print` when you want output.

Although `print("hello");` works, it is parsed as the `print` statement followed by a parenthesized expression. In v0.1.0, `print` is a reserved keyword, not a normal callable built-in function.

## 7. Conditional statements

```mylang
let score = 78;

if (score >= 50) {
  print "pass";
} else {
  print "try again";
}
```

- The condition must be enclosed in parentheses.
- The body can be one statement or a block in braces.
- The `else` branch is optional.
- Conditions use the truthiness rules above.

## 8. Loops

```mylang
let count = 3;
while (count > 0) {
  print count;
  count = count - 1;
}
```

A `while` loop checks its parenthesized condition before each iteration. There is no `for`, `break`, or `continue` statement in v0.1.0.

## 9. Functions, arguments, and return values

Declare a function with `fn`, a name, comma-separated parameters, and a braced body:

```mylang
fn add(a, b) {
  return a + b;
}

print add(2, 3); // 5
```

- Functions can call other functions and themselves recursively.
- Functions capture the lexical environment where they were declared (closures).
- Arguments are evaluated from left to right.
- Calls must provide exactly the number of arguments declared.
- A function can have at most 255 parameters; a call can have at most 255 arguments.
- `return expression;` ends the current function and returns the value.
- `return;` returns `null`.
- Reaching the end of a function without returning also returns `null`.
- Using `return` outside a function raises a runtime error.

Example of recursion:

```mylang
fn factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

print factorial(5); // 120
```

## 10. Built-ins

### `clock()`

Returns the current Unix timestamp in **seconds** as a number. The value is based on the host system clock and includes a fractional part.

```mylang
print clock();
```

There is no standard-library API for files, networks, dates, collections, or operating-system commands in v0.1.0.

## 11. Strings and escape sequences

Strings can use either single or double quotes:

```mylang
print "double quoted";
print 'single quoted';
print "first line\nsecond line";
print "tab\there";
print "quote: \\"";
print 'it\'s escaped';
```

Recognized escapes include `\n` (newline), `\r` (carriage return), `\t` (tab), `\\` (backslash), `\'` (single quote), and `\"` (double quote). For an unrecognized escape, the backslash is discarded and the following character is kept. A literal newline inside a quoted string is not allowed.

## 12. Errors and diagnostics

Errors are reported with a phase and source location when available, for example:

```text
runtime error at 1:7: Undefined variable 'missing'.
```

- **Lexer errors**: invalid characters, unterminated strings, or unsupported numeric literals.
- **Parser errors**: missing punctuation, malformed expressions, or invalid assignment targets.
- **Runtime errors**: undefined variables, reassigned constants, wrong argument counts, invalid operand types, calling a non-function, or division/remainder by zero.

The current implementation does not provide stack traces for nested function calls. Some internal errors may be reported at line 1, column 1.

## 13. REPL behavior and limitations

The REPL keeps one interpreter alive so declarations and function definitions persist between input lines. It recognizes a small set of statement prefixes; other lines are treated as expressions and their values are printed automatically.

Because the REPL is currently line-based, enter a complete function or block on one line when using the REPL. For multi-line programs, save the code in a `.my` file and run it. The REPL's statement detection is a convenience heuristic, not a full interactive parser.

## 14. Current language limits

- Dynamically typed; no static type checker.
- No arrays, maps, object properties, classes, imports, or modules.
- No `for`, `break`, `continue`, exceptions, or custom error handling.
- No file-system, network, or shell access from MyLang programs.
- No bytecode VM, compiler, formatter, debugger, or language server yet.
- Syntax and behavior may change before v1.0.

