import type { Token } from "./types";

export const normalizeQuotes = (s: string) => s.replace(/[’]/g, "'");

export function tokenizeFrench(text: string): Token[] {
  const s = text.replace(/\r\n?/g, "\n");
  const tokens: Token[] = [];
  const re =
    /(\s+)|([\.,:;!?…\-—\(\)\[\]«»\"])|([A-Za-zÀ-ÖØ-öø-ÿœŒæÆçÇ'’\-]+)|([^\s])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[1]) tokens.push({ kind: "ws", text: m[1] });
    else if (m[2]) tokens.push({ kind: "punct", text: m[2] });
    else if (m[3]) tokens.push({ kind: "word", text: m[3] });
    else tokens.push({ kind: "punct", text: m[0] });
  }
  return tokens;
}

