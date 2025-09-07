import { useEffect, useState } from "react";

interface UseSpeechOptions {
  voiceURI: string;
  rate: number;
  pitch: number;
}

export function useSpeech(opts: UseSpeechOptions) {
  const { voiceURI, rate, pitch } = opts;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    function load() {
      const all = window.speechSynthesis.getVoices();
      const fr = all.filter((v) => v.lang && v.lang.toLowerCase().startsWith("fr"));
      setVoices(fr.length ? fr : all);
    }
    load();
    const prev = window.speechSynthesis.onvoiceschanged;
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = prev ?? null;
    };
  }, []);

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

  return { voices, isSpeaking, speak, stopSpeaking };
}

