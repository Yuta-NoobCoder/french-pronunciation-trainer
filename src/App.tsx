import { useEffect, useMemo, useState } from "react";

type TokenKind = "word" | "punct" | "ws";
interface Token {
  kind: TokenKind;
  text: string;
}
type Mode = "word" | "range";

export default function FrenchPracticeApp() {
  const [raw, setRaw] = useState("");

  const tokens = useMemo(() => tokenizeFrench(raw), [raw]);

  // ---- Mode ----
  const [mode, setMode] = useState<Mode>("word");

  // ---- Range selection (2点クリック & ドラッグ対応) ----
  const [anchor, setAnchor] = useState<number | null>(null); // 1回目のクリック位置
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);
  const [autoPlayOnSelect, setAutoPlayOnSelect] = useState(false);

  // ---- Voice ----
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false); // mobile only

  // persist minimal settings
  const CFG_KEY = "fr_pron_cfg";
  const TEXT_KEY = "fr_pron_text";
  useEffect(() => {
    try {
      // migrate from old keys if present
      const legacyCfg = localStorage.getItem(
        "french_pronounciation_trainer_cfg"
      );
      const legacyText = localStorage.getItem(
        "french_pronounciation_trainer_text"
      );
      if (!localStorage.getItem(CFG_KEY) && legacyCfg) {
        localStorage.setItem(CFG_KEY, legacyCfg);
        localStorage.removeItem("french_pronounciation_trainer_cfg");
      }
      if (!localStorage.getItem(TEXT_KEY) && legacyText != null) {
        localStorage.setItem(TEXT_KEY, legacyText);
        localStorage.removeItem("french_pronounciation_trainer_text");
      }

      const saved = JSON.parse(localStorage.getItem(CFG_KEY) || "{}");
      if (saved.voiceURI) setVoiceURI(saved.voiceURI);
      if (typeof saved.rate === "number") setRate(saved.rate);
      if (typeof saved.pitch === "number") setPitch(saved.pitch);
      if (typeof saved.autoPlayOnSelect === "boolean")
        setAutoPlayOnSelect(saved.autoPlayOnSelect);
      if (saved.mode === "word" || saved.mode === "range") setMode(saved.mode);
      const savedRaw = localStorage.getItem(TEXT_KEY);
      if (savedRaw != null) setRaw(savedRaw);
    } catch {}
  }, []);
  useEffect(() => {
    const cfg = { voiceURI, rate, pitch, autoPlayOnSelect, mode };
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }, [voiceURI, rate, pitch, autoPlayOnSelect, mode]);
  useEffect(() => {
    localStorage.setItem(TEXT_KEY, raw);
  }, [raw]);

  // load voices
  useEffect(() => {
    function load() {
      const all = window.speechSynthesis.getVoices();
      const fr = all.filter(
        (v) => v.lang && v.lang.toLowerCase().startsWith("fr")
      );
      setVoices(fr.length ? fr : all);
      if (!voiceURI && fr.length) setVoiceURI(fr[0].voiceURI || fr[0].name);
    }
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voiceURI]);

  // ---- Helpers ----
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
    return normalizeQuotes(
      tokens
        .slice(r[0], r[1] + 1)
        .map((t) => t.text)
        .join("")
    );
  };
  const clearSelection = () => {
    setAnchor(null);
    setSelStart(null);
    setSelEnd(null);
  };
  const normalizeQuotes = (s: string) => s.replace(/[’]/g, "'");

  function speak(text: string) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find((vv) => (vv.voiceURI || vv.name) === voiceURI);
    if (v) u.voice = v;
    u.lang = v?.lang || "fr-FR";
    u.rate = rate;
    u.pitch = pitch;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }
  function stopSpeaking() {
    try {
      window.speechSynthesis.cancel();
    } finally {
      setIsSpeaking(false);
    }
  }
  function togglePlaySelected() {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const t = selectedText();
    if (t && t.trim()) speak(t);
  }

  // ---- Interaction ----
  function clickToken(i: number) {
    const t = tokens[i];

    // 単語モード：クリックで即時再生
    if (mode === "word") {
      if (t.kind === "word") speak(normalizeQuotes(t.text));
      return;
    }

    // 範囲モード：2点クリックのみ
    // 既存選択上をクリック → 解除
    if (isIndexInSelection(i) && anchor === null) {
      clearSelection();
      return;
    }

    // 1点目
    if (anchor === null) {
      setAnchor(i);
      setSelStart(i);
      setSelEnd(i);
      return;
    }

    // 2点目 → 範囲確定
    setSelStart(anchor);
    setSelEnd(i);
    const text = selectedTextAfter(anchor, i);
    setAnchor(null);
    if (autoPlayOnSelect && text && text.trim()) speak(text);
  }

  // ドラッグ機能は廃止（2点クリックのみ）

  // anchorとiから即時プレビュー用テキストを作る
  function selectedTextAfter(a: number, b: number): string {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return normalizeQuotes(
      tokens
        .slice(lo, hi + 1)
        .map((t) => t.text)
        .join("")
    );
  }

  // mode切替時に範囲をクリア
  useEffect(() => {
    if (mode === "word") clearSelection();
  }, [mode]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 sm:pt-0 pt-14 pb-24 sm:pb-0">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-center">
            フランス語発音トレーナー
          </h1>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Mode toggle */}
            <div className="inline-flex rounded-xl border border-zinc-300 overflow-hidden fixed top-3 left-1/2 -translate-x-1/2 z-40 sm:static sm:translate-x-0 sm:top-auto sm:left-auto bg-white/95 shadow-xl sm:bg-white sm:shadow-none">
              <button
                className={
                  "px-3 py-2 text-sm " +
                  (mode === "word"
                    ? "bg-zinc-900 text-white"
                    : "bg-white hover:bg-zinc-100")
                }
                onClick={() => setMode("word")}
                title="単語クリックで即時再生"
              >
                単語モード
              </button>
              <button
                className={
                  "px-3 py-2 text-sm border-l border-zinc-300 " +
                  (mode === "range"
                    ? "bg-zinc-900 text-white"
                    : "bg-white hover:bg-zinc-100")
                }
                onClick={() => setMode("range")}
                title="2点クリックで範囲選択"
              >
                範囲選択モード
              </button>
              {/* settings gear moved outside segmented control */}
            </div>
            {/* Desktop settings button inline next to tabs */}
            <button
              aria-label="詳細設定"
              className="hidden sm:inline-flex items-center justify-center rounded-xl bg-white border border-zinc-300 px-3 py-2 text-sm shadow-sm"
              onClick={() => setSettingsOpen(true)}
              title="詳細設定"
            >
              設定
            </button>
            {/* Separate settings button near tabs (mobile only) */}
            <button
              aria-label="詳細設定"
              className="sm:hidden fixed top-3 right-3 z-50 inline-flex items-center justify-center rounded-xl bg-white border border-zinc-300 p-2 shadow-md"
              onClick={() => setSettingsOpen(true)}
              title="詳細設定"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
              </svg>
            </button>
            {/* Settings trigger moved to floating button (mobile) */}
          </div>
        </header>

        {/* Single-column layout on all screens for consistent UX */}
        <div className="space-y-6">
          <section>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                テキスト（フランス語）
              </label>
              <textarea
                className="w-full h-56 rounded-2xl border border-zinc-300 p-3"
                value={raw}
                onChange={(e) => {
                  setRaw(e.target.value);
                  clearSelection();
                }}
                placeholder="ここにフランス語のテキストを貼り付けてください"
              />
            </div>
          </section>

          <section className="space-y-2 select-none">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {mode === "word"
                  ? "単語モード：単語をクリックして再生"
                  : "範囲選択モード：2点クリックで範囲選択（余白クリックで解除）"}
              </label>
              {mode === "range" && (
                <button
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={togglePlaySelected}
                  disabled={
                    !isSpeaking && (!selectedText() || !selectedText()!.trim())
                  }
                  title={isSpeaking ? "停止" : "選択部分を再生"}
                >
                  {isSpeaking ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="5" width="4" height="14" />
                      <rect x="14" y="5" width="4" height="14" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                  {isSpeaking ? "停止" : "再生"}
                </button>
              )}
            </div>

            <div
              className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm leading-8 min-h-24 sm:min-h-28"
              onClick={(e) => {
                if (mode !== "range") return;
                if (
                  e.target === e.currentTarget &&
                  selectedRange() &&
                  anchor === null
                ) {
                  // 背景（余白）クリックで解除
                  clearSelection();
                }
              }}
              title={
                mode === "range" && selectedRange()
                  ? "余白クリックで選択解除"
                  : undefined
              }
            >
              {tokens.length === 0 && (
                <span className="text-zinc-400 select-none text-sm">
                  テキストを入力するとここに単語が表示され、読み上げる
                  {mode == "range" ? "範囲" : "単語"}
                  を選択できるようになります。
                </span>
              )}
              {tokens.map((t, i) => {
                const selected = mode === "range" && isIndexInSelection(i);

                if (t.kind === "ws") {
                  return (
                    <span
                      key={i}
                      className="whitespace-pre-wrap"
                      onClick={() => {
                        if (
                          mode === "range" &&
                          selectedRange() &&
                          anchor === null
                        )
                          clearSelection();
                      }}
                      title={
                        mode === "range" && selectedRange()
                          ? "クリックで選択解除"
                          : undefined
                      }
                    >
                      {t.text}
                    </span>
                  );
                }

                // つながったピル状ハイライト
                const prevSel = mode === "range" && isIndexInSelection(i - 1);
                const nextSel = mode === "range" && isIndexInSelection(i + 1);

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

                // レイアウトが縮まって改行が変わるのを防ぐため、
                // 選択時でもマージンは変えない（見た目の連結は角丸のみで表現）
                const joiner = "";

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
                      joiner +
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

            <p className="text-xs text-zinc-500">
              ※ iOS/Safari
              は初回のみ操作直後でないと音声が出ないことがあります。最初にいずれかの単語をクリックしてください。
            </p>
          </section>
        </div>
      </div>

      {/* Mobile bottom fixed play/pause for range mode */}
      {mode === "range" && (
        <div className="sm:hidden">
          <button
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white px-5 py-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={togglePlaySelected}
            disabled={
              !isSpeaking && (!selectedText() || !selectedText()!.trim())
            }
            title={isSpeaking ? "停止" : "選択部分を再生"}
          >
            {isSpeaking ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            {isSpeaking ? "停止" : "再生"}
          </button>
          {/* Floating settings button removed; settings icon is in tab bar */}
        </div>
      )}
      {/* Settings drawer (animated) */}
      <div>
        <div
          className={
            "fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 " +
            (settingsOpen ? "opacity-100" : "opacity-0 pointer-events-none")
          }
          onClick={() => setSettingsOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-hidden={!settingsOpen}
          className={
            "fixed top-0 right-0 h-full w-72 sm:w-96 bg-white z-50 shadow-2xl p-4 space-y-4 transform transition-transform duration-300 " +
            (settingsOpen
              ? "translate-x-0"
              : "translate-x-full pointer-events-none")
          }
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">詳細設定</h2>
            <button
              className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
              onClick={() => setSettingsOpen(false)}
            >
              閉じる
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500">スピーチエンジン</label>
              <select
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                value={voiceURI}
                onChange={(e) => setVoiceURI(e.target.value)}
                title="Voice"
              >
                {voices.map((v) => {
                  const id = v.voiceURI || v.name;
                  const label = `${v.name} ${v.lang ? `(${v.lang})` : ""}`;
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm justify-between">
              <span>速度</span>
              <input
                className="flex-1 mx-2"
                type="range"
                min={0.5}
                max={1.2}
                step={0.05}
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
              />
              <span className="tabular-nums w-10 text-right">
                {rate.toFixed(2)}
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm justify-between">
              <span>ピッチ</span>
              <input
                className="flex-1 mx-2"
                type="range"
                min={0.8}
                max={1.4}
                step={0.05}
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
              />
              <span className="tabular-nums w-10 text-right">
                {pitch.toFixed(2)}
              </span>
            </label>
            {mode === "range" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={autoPlayOnSelect}
                  onChange={(e) => setAutoPlayOnSelect(e.target.checked)}
                />
                選択で自動再生
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// === Utilities ===
function tokenizeFrench(text: string): Token[] {
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
