export type TokenKind = "word" | "punct" | "ws";

export interface Token {
  kind: TokenKind;
  text: string;
}

export type Mode = "word" | "range";

