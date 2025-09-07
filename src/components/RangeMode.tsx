import { useEffect, useMemo, useState } from "react";
import type { Token } from "../lib/types.ts";
import { normalizeQuotes } from "../lib/tokenize.ts";

interface Props {
  tokens: Token[];
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  autoPlayOnSelect: boolean;
}

export default function RangeMode({
  tokens,
  speak,
  stopSpeaking,
  isSpeaking,
  autoPlayOnSelect,
}: Props) {
  const [anchor, setAnchor] = useState<number | null>(null);
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);

  const selectedRange = (): [number, number] | null => {
    if (selStart === null || selEnd === null) return null;
    const a = Math.min(selStart, selEnd);
    const b = Math.max(selStart, selEnd);
    return [a, b];
  };
  const isIndexInSelection = (i: number) => {
    const r = selectedRange();
    return r ? i >= r[0] && i <= r[1] : false;
  };
  const selectedText = (): string | null => {
    const r = selectedRange();
    if (!r) return null;
    return normalizeQuotes(tokens.slice(r[0], r[1] + 1).map((t) => t.text).join(""));
  };
  const clearSelection = () => {
    setAnchor(null);
    setSelStart(null);
    setSelEnd(null);
  };

  function selectedTextAfter(a: number, b: number): string {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return normalizeQuotes(tokens.slice(lo, hi + 1).map((t) => t.text).join(""));
  }

  function clickToken(i: number) {
    if (isIndexInSelection(i) && anchor === null) {
      clearSelection();
      return;
    }
    if (anchor === null) {
      setAnchor(i);
      setSelStart(i);
      setSelEnd(i);
      return;
    }
    setSelStart(anchor);
    setSelEnd(i);
    const text = selectedTextAfter(anchor, i);
    setAnchor(null);
    if (autoPlayOnSelect && text && text.trim()) speak(text);
  }

  function togglePlaySelected() {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const t = selectedText();
    if (t && t.trim()) speak(t);
  }

  // Reset selection whenever tokens change (e.g., text edited)
  useEffect(() => {
    clearSelection();
  }, [tokens]);

  const empty = useMemo(
    () => tokens.length === 0 || tokens.every((t) => t.text.trim() === ""),
    [tokens]
  );

  return (
    <section className="space-y-2 select-none">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          フレーズモード：2点クリックでフレーズを選択（余白クリックで解除）
        </label>
        <button
          className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={togglePlaySelected}
          disabled={!isSpeaking && (!selectedText() || !selectedText()!.trim())}
          title={isSpeaking ? "停止" : "選択部分を再生"}
        >
          {isSpeaking ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {isSpeaking ? "停止" : "再生"}
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 p-3 bg-white min-h-24">
        {empty ? (
          <span className="text-zinc-400 select-none text-sm">
            テキストを入力すると読み上げるフレーズが選択できるようになります。
          </span>
        ) : null}

        {tokens.map((t, i) => {
          const selected = isIndexInSelection(i);
          if (t.kind === "ws") {
            return (
              <span
                key={i}
                className="whitespace-pre-wrap"
                onClick={() => {
                  if (selectedRange() && anchor === null) clearSelection();
                }}
                title={selectedRange() ? "クリックで選択解除" : undefined}
              >
                {t.text}
              </span>
            );
          }

          const prevSel = isIndexInSelection(i - 1);
          const nextSel = isIndexInSelection(i + 1);
          const rounded =
            selected && prevSel && nextSel
              ? "rounded-none"
              : selected && prevSel && !nextSel
              ? "rounded-r-md"
              : selected && !prevSel && nextSel
              ? "rounded-l-md"
              : selected
              ? "rounded-md"
              : "rounded-sm";
          const base =
            "inline-block px-1 transition-colors cursor-pointer align-baseline touch-none";

          return (
            <span
              key={i}
              onClick={() => clickToken(i)}
              className={
                base +
                " " +
                rounded +
                (selected
                  ? " bg-yellow-200"
                  : t.kind === "punct"
                  ? " text-zinc-500 hover:bg-zinc-100"
                  : " hover:bg-zinc-100")
              }
            >
              {t.text}
            </span>
          );
        })}
      </div>

      {/* Mobile bottom fixed play/pause for range mode */}
      <div className="sm:hidden">
        <button
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white px-5 py-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={togglePlaySelected}
          disabled={!isSpeaking && (!selectedText() || !selectedText()!.trim())}
          title={isSpeaking ? "停止" : "選択部分を再生"}
        >
          {isSpeaking ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {isSpeaking ? "停止" : "再生"}
        </button>
      </div>
    </section>
  );
}
