/**
 * Minimal Luau tokenizer for short, curated snippets. Runs at build/render
 * time on the server, so no highlighting library ships to the browser.
 */

export type TokenKind =
  | "plain"
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "constant"
  | "builtin"
  | "function"
  | "type"
  | "operator";

export type Token = { kind: TokenKind; text: string };

const KEYWORDS = new Set([
  "and", "break", "continue", "do", "else", "elseif", "end", "export", "for",
  "function", "if", "in", "local", "not", "or", "repeat", "return", "then",
  "until", "while",
]);

const CONSTANTS = new Set(["true", "false", "nil", "self"]);

const BUILTINS = new Set([
  "game", "workspace", "script", "task", "math", "string", "table", "coroutine",
  "buffer", "bit32", "utf8", "os", "debug", "Instance", "Vector3", "Vector2",
  "CFrame", "Color3", "UDim", "UDim2", "Enum", "Random", "TweenInfo", "RaycastParams",
  "OverlapParams", "DateTime", "typeof", "require", "pcall", "xpcall", "error",
  "assert", "print", "warn", "ipairs", "pairs", "next", "select", "setmetatable",
  "getmetatable", "rawget", "rawset", "rawequal", "tostring", "tonumber",
]);

const NUMBER = /^(?:0[xX][\da-fA-F_]+|0[bB][01_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?)/;
const IDENT = /^[A-Za-z_]\w*/;
const OPERATOR = /^(?:\.\.\.|\.\.=?|->|::|[=~<>]=|[+\-*/%^]=|\/\/=?|[+\-*/%^#<>=&|?])/;

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const push = (kind: TokenKind, text: string) => {
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind && kind === "plain") last.text += text;
    else tokens.push({ kind, text });
  };

  const readLongBracket = (start: number): number | null => {
    const open = /^\[(=*)\[/.exec(source.slice(start));
    if (!open) return null;
    const close = `]${open[1]}]`;
    const end = source.indexOf(close, start + open[0].length);
    return end === -1 ? source.length : end + close.length;
  };

  while (i < source.length) {
    const rest = source.slice(i);
    const ch = source[i]!;

    if (rest.startsWith("--")) {
      const long = readLongBracket(i + 2);
      const end = long ?? (source.indexOf("\n", i) === -1 ? source.length : source.indexOf("\n", i));
      push("comment", source.slice(i, end));
      i = end;
      continue;
    }

    if (ch === "[") {
      const long = readLongBracket(i);
      if (long !== null) {
        push("string", source.slice(i, long));
        i = long;
        continue;
      }
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < source.length && source[j] !== ch && source[j] !== "\n") {
        j += source[j] === "\\" ? 2 : 1;
      }
      const end = Math.min(j + 1, source.length);
      push("string", source.slice(i, end));
      i = end;
      continue;
    }

    const number = NUMBER.exec(rest);
    if (number && !/[\w]/.test(source[i - 1] ?? "")) {
      push("number", number[0]);
      i += number[0].length;
      continue;
    }

    const ident = IDENT.exec(rest);
    if (ident) {
      const word = ident[0];
      const before = source.slice(Math.max(0, i - 48), i);
      const after = source.slice(i + word.length, i + word.length + 48);
      const isMember = /[.:]$/.test(before) && !/:\s+$/.test(before);

      let kind: TokenKind = "plain";
      if (word === "type" && /^\s+[A-Za-z_]/.test(after)) kind = "keyword";
      else if (KEYWORDS.has(word)) kind = "keyword";
      else if (CONSTANTS.has(word)) kind = "constant";
      else if (/(?::|->)\s+$/.test(before) || /\btype\s+$/.test(before)) kind = "type";
      else if (/^\s*\(/.test(after)) kind = "function";
      else if (!isMember && BUILTINS.has(word)) kind = "builtin";

      push(kind, word);
      i += word.length;
      continue;
    }

    const operator = OPERATOR.exec(rest);
    if (operator) {
      push("operator", operator[0]);
      i += operator[0].length;
      continue;
    }

    push("plain", ch);
    i += 1;
  }

  return tokens;
}

/** Tokenize and split into lines, breaking multi-line tokens at newlines. */
export function highlightLines(source: string): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokenize(source.replace(/\r\n/g, "\n"))) {
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1]!.push({ kind: token.kind, text: part });
    });
  }
  return lines;
}
