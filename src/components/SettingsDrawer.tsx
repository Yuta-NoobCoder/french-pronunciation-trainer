import type { Mode } from "../lib/types.ts";

interface Props {
  open: boolean;
  onClose: () => void;
  voices: SpeechSynthesisVoice[];
  voiceURI: string;
  setVoiceURI: (id: string) => void;
  rate: number;
  setRate: (n: number) => void;
  pitch: number;
  setPitch: (n: number) => void;
  mode: Mode;
  autoPlayOnSelect: boolean;
  setAutoPlayOnSelect: (b: boolean) => void;
}

export default function SettingsDrawer({
  open,
  onClose,
  voices,
  voiceURI,
  setVoiceURI,
  rate,
  setRate,
  pitch,
  setPitch,
  mode,
  autoPlayOnSelect,
  setAutoPlayOnSelect,
}: Props) {
  return (
    <div>
      <div
        className={
          "fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 " +
          (open ? "opacity-100" : "opacity-0 pointer-events-none")
        }
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={
          "fixed top-0 right-0 h-full w-72 sm:w-96 bg-white z-50 shadow-2xl p-4 space-y-4 transform transition-transform duration-300 " +
          (open ? "translate-x-0" : "translate-x-full pointer-events-none invisible")
        }
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">詳細設定</h2>
          <button
            className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
            onClick={onClose}
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
            <span className="tabular-nums w-10 text-right">{rate.toFixed(2)}</span>
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
            <span className="tabular-nums w-10 text-right">{pitch.toFixed(2)}</span>
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
  );
}
