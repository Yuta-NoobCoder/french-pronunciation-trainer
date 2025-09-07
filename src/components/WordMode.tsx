import type { Token } from "../lib/types.ts";
import { normalizeQuotes } from "../lib/tokenize.ts";

interface Props {
  tokens: Token[];
  speak: (text: string) => void;
}

export default function WordMode({ tokens, speak }: Props) {
  return (
    <section className="space-y-2 select-none">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">単語モード：単語をクリックして再生</label>
      </div>

      <div className="rounded-xl border border-zinc-200 p-3 bg-white min-h-24">
        {tokens.length === 0 || tokens.every((t) => t.text.trim() === "") ? (
          <span className="text-zinc-400 select-none text-sm">
            テキストを入力すると読み上げる単語が選択できるようになります。
          </span>
        ) : null}
        {tokens.map((t, i) => {
          if (t.kind === "ws") {
            return (
              <span key={i} className="whitespace-pre-wrap">
                {t.text}
              </span>
            );
          }
          const base =
            "inline-block px-1 transition-colors cursor-pointer align-baseline touch-none";
          return (
            <span
              key={i}
              onClick={() => {
                if (t.kind === "word") speak(normalizeQuotes(t.text));
              }}
              className={
                base + (t.kind === "punct" ? " text-zinc-500 hover:bg-zinc-100" : " hover:bg-zinc-100")
              }
            >
              {t.text}
            </span>
          );
        })}
      </div>
    </section>
  );
}
