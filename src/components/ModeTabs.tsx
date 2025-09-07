import type { Mode } from "../lib/types.ts";

interface Props {
  mode: Mode;
  setMode: (m: Mode) => void;
  onOpenSettings: () => void;
}

export default function ModeTabs({ mode, setMode, onOpenSettings }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
      <div className="inline-flex rounded-xl border border-zinc-300 overflow-hidden fixed top-3 left-1/2 -translate-x-1/2 z-40 sm:static sm:translate-x-0 sm:top-auto sm:left-auto bg-white/95 shadow-xl sm:bg-white sm:shadow-none">
        <button
          className={
            "px-2 py-2 text-sm " +
            (mode === "word" ? "bg-zinc-900 text-white" : "bg-white hover:bg-zinc-100")
          }
          onClick={() => setMode("word")}
          title="単語クリックで即時再生"
        >
          単語モード
        </button>
        <button
          className={
            "px-2 py-2 text-sm border-l border-zinc-300 " +
            (mode === "range" ? "bg-zinc-900 text-white" : "bg-white hover:bg-zinc-100")
          }
          onClick={() => setMode("range")}
          title="2点クリックでフレーズを選択"
        >
          フレーズモード
        </button>
      </div>

      {/* Desktop settings button */}
      <button
        aria-label="詳細設定"
        className="hidden sm:inline-flex items-center justify-center rounded-xl bg-white border border-zinc-300 px-3 py-2 text-sm shadow-sm"
        onClick={onOpenSettings}
        title="詳細設定"
      >
        設定
      </button>

      {/* Mobile settings icon button */}
      <button
        aria-label="詳細設定"
        className="sm:hidden fixed top-3 right-3 z-50 inline-flex items-center justify-center rounded-xl bg-white border border-zinc-300 p-2 shadow-md"
        onClick={onOpenSettings}
        title="詳細設定"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
        </svg>
      </button>
    </div>
  );
}
