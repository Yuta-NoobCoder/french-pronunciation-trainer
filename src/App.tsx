import { useEffect, useMemo, useState } from "react";
import type { Mode } from "./lib/types.ts";
import { tokenizeFrench } from "./lib/tokenize.ts";
import { useSpeech } from "./hooks/useSpeech.ts";
import ModeTabs from "./components/ModeTabs.tsx";
import SettingsDrawer from "./components/SettingsDrawer.tsx";
import TextInput from "./components/TextInput.tsx";
import WordMode from "./components/WordMode.tsx";
import RangeMode from "./components/RangeMode.tsx";

export default function FrenchPracticeApp() {
  const [raw, setRaw] = useState("");
  const tokens = useMemo(() => tokenizeFrench(raw), [raw]);

  // ---- Mode ----
  const [mode, setMode] = useState<Mode>("word");
  const [autoPlayOnSelect, setAutoPlayOnSelect] = useState(false);

  // ---- Voice settings (persisted in App) ----
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1);
  const { voices, isSpeaking, speak, stopSpeaking } = useSpeech({
    voiceURI,
    rate,
    pitch,
  });

  const [settingsOpen, setSettingsOpen] = useState(false);

  // persist minimal settings
  const CFG_KEY = "fr_pron_cfg";
  const TEXT_KEY = "fr_pron_text";
  useEffect(() => {
    try {
      // migrate from old keys if present
      const legacyCfg = localStorage.getItem("french_pronounciation_trainer_cfg");
      const legacyText = localStorage.getItem("french_pronounciation_trainer_text");
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

  // Set default voice when voices arrive and voiceURI isn't set
  useEffect(() => {
    if (!voiceURI && voices.length) {
      const fr = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("fr"));
      const v = (fr[0] || voices[0]) as SpeechSynthesisVoice | undefined;
      if (v) setVoiceURI(v.voiceURI || v.name);
    }
  }, [voices, voiceURI]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 sm:pt-0 pt-14 pb-24 sm:pb-0">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-center">フランス語発音トレーナー</h1>
          <ModeTabs mode={mode} setMode={setMode} onOpenSettings={() => setSettingsOpen(true)} />
        </header>

        <div className="space-y-6">
          <TextInput value={raw} onChange={setRaw} />

          {mode === "word" ? (
            <WordMode tokens={tokens} speak={speak} />
          ) : (
            <RangeMode
              tokens={tokens}
              speak={speak}
              stopSpeaking={stopSpeaking}
              isSpeaking={isSpeaking}
              autoPlayOnSelect={autoPlayOnSelect}
            />
          )}

          <p className="text-xs text-zinc-500">
            ※ iOS/Safari は初回のみ操作直後でないと音声が出ないことがあります。最初にいずれかの単語をクリックしてください。
          </p>
        </div>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        voices={voices}
        voiceURI={voiceURI}
        setVoiceURI={setVoiceURI}
        rate={rate}
        setRate={setRate}
        pitch={pitch}
        setPitch={setPitch}
        mode={mode}
        autoPlayOnSelect={autoPlayOnSelect}
        setAutoPlayOnSelect={setAutoPlayOnSelect}
      />
    </div>
  );
}
