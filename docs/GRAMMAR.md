# MyLang Grammar (v0.1)

Notation: `*` means zero or more; `+` means one or more; `?` means optional. Terminals are written literally.

```ebnf
program        = declaration* EOF ;
declaration    = variableDecl | functionDecl | statement ;
variableDecl   = ("let" | "const") IDENTIFIER "=" expression ";" ;
functionDecl   = "fn" IDENTIFIER "(" parameters? ")" block ;
parameters     = IDENTIFIER ("," IDENTIFIER)* ;
statement      = printStmt | ifStmt | whileStmt | returnStmt | block | expressionStmt ;
printStmt      = "print" expression ";" ;
ifStmt         = "if" "(" expression ")" statement ("else" statement)? ;
whileStmt      = "while" "(" expression ")" statement ;
returnStmt     = "return" expression? ";" ;
block          = "{" declaration* "}" ;
expressionStmt = expression ";" ;
expression     = assignment ;
assignment     = logicalOr ("=" assignment)? ;
logicalOr      = logicalAnd ("||" logicalAnd)* ;
logicalAnd     = equality ("&&" equality)* ;
equality       = comparison (("==" | "!=") comparison)* ;
comparison     = term ((">" | ">=" | "<" | "<=") term)* ;
term           = factor (("+" | "-") factor)* ;
factor         = unary (("*" | "/" | "%") unary)* ;
unary          = ("!" | "-") unary | call ;
call           = primary ("(" arguments? ")")* ;
arguments      = expression ("," expression)* ;
primary        = NUMBER | STRING | "true" | "false" | "null"
               | IDENTIFIER | "(" expression ")" ;
```

Comments start with `//` and continue to the end of the line. Statements end with semicolons. Both single-quoted and double-quoted strings are supported.
