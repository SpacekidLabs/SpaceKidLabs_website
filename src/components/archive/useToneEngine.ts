import { useEffect, useRef, useState } from 'react';

/**
 * Tiny Web Audio engine shared by the archive's sine-tone, vowel-formant and interval-ratio players.
 * Everything stops and the AudioContext closes when the component using it unmounts.
 */
export function useToneEngine() {
  const [activeVowel, setActiveVowel] = useState<string | null>(null);
  const [activeFreq, setActiveFreq] = useState<number | null>(null);
  const [activeRatioId, setActiveRatioId] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const vowelOscsRef = useRef<{ osc1: OscillatorNode; gain: GainNode } | null>(null);
  const ratioOscsRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch (e) {}
      }
      if (vowelOscsRef.current) {
        try { vowelOscsRef.current.osc1.stop(); } catch (e) {}
      }
      if (ratioOscsRef.current) {
        try { ratioOscsRef.current.osc1.stop(); } catch (e) {}
        try { ratioOscsRef.current.osc2.stop(); } catch (e) {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  const playFrequency = (freq: number) => {
    try {
      stopVowel();

      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (oscRef.current && gainRef.current) {
        const now = ctx.currentTime;
        oscRef.current.frequency.cancelScheduledValues(now);
        oscRef.current.frequency.exponentialRampToValueAtTime(freq, now + 0.04);
        gainRef.current.gain.cancelScheduledValues(now);
        const targetGain = freq > 1800 ? 0.015 : freq > 900 ? 0.025 : 0.04;
        gainRef.current.gain.exponentialRampToValueAtTime(targetGain, now + 0.04);
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const targetGain = freq > 1800 ? 0.015 : freq > 900 ? 0.025 : 0.04;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(targetGain, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  };

  const stopFrequency = () => {
    if (audioCtxRef.current && oscRef.current && gainRef.current) {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const gain = gainRef.current;
      const osc = oscRef.current;

      gain.gain.cancelScheduledValues(now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      setTimeout(() => {
        try {
          if (oscRef.current === osc) {
            osc.stop();
            osc.disconnect();
            oscRef.current = null;
          }
          if (gainRef.current === gain) {
            gain.disconnect();
            gainRef.current = null;
          }
        } catch (err) {}
      }, 90);
    }
  };

  const playVowel = (f1: number, f2: number, f3: number) => {
    try {
      stopFrequency();
      stopVowel();

      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.05, now + 0.08);

      const bp1 = ctx.createBiquadFilter();
      bp1.type = 'bandpass';
      bp1.frequency.setValueAtTime(f1, now);
      bp1.Q.setValueAtTime(14, now);

      const bp2 = ctx.createBiquadFilter();
      bp2.type = 'bandpass';
      bp2.frequency.setValueAtTime(f2, now);
      bp2.Q.setValueAtTime(14, now);

      const bp3 = ctx.createBiquadFilter();
      bp3.type = 'bandpass';
      bp3.frequency.setValueAtTime(f3, now);
      bp3.Q.setValueAtTime(14, now);

      const glottalSource = ctx.createOscillator();
      glottalSource.type = 'sawtooth';
      glottalSource.frequency.setValueAtTime(115, now);

      const f1Gain = ctx.createGain();
      f1Gain.gain.setValueAtTime(0.6, now);

      const f2Gain = ctx.createGain();
      f2Gain.gain.setValueAtTime(0.4, now);

      const f3Gain = ctx.createGain();
      f3Gain.gain.setValueAtTime(0.2, now);

      glottalSource.connect(bp1);
      glottalSource.connect(bp2);
      glottalSource.connect(bp3);

      bp1.connect(f1Gain);
      bp2.connect(f2Gain);
      bp3.connect(f3Gain);

      f1Gain.connect(masterGain);
      f2Gain.connect(masterGain);
      f3Gain.connect(masterGain);

      masterGain.connect(ctx.destination);
      glottalSource.start();

      vowelOscsRef.current = {
        osc1: glottalSource,
        gain: masterGain
      };
    } catch (e) {
      console.warn("Vowel hook error:", e);
    }
  };

  const stopVowel = () => {
    if (audioCtxRef.current && vowelOscsRef.current) {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const currentRef = vowelOscsRef.current;

      currentRef.gain.gain.cancelScheduledValues(now);
      currentRef.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      setTimeout(() => {
        try {
          currentRef.osc1.stop();
          currentRef.osc1.disconnect();
          currentRef.gain.disconnect();
          if (vowelOscsRef.current === currentRef) {
            vowelOscsRef.current = null;
          }
        } catch (e) {}
      }, 130);
    }
  };

  const handleToggleVowel = (name: string, f1: number, f2: number, f3: number) => {
    // Resume/create audio context inside a direct click callback context to unlock audio context in all browsers
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (activeVowel === name) {
      stopVowel();
      setActiveVowel(null);
    } else {
      setActiveFreq(null);
      stopFrequency();
      playVowel(f1, f2, f3);
      setActiveVowel(name);
    }
  };

  const handleToggleFreq = (freq: number) => {
    // Resume/create audio context inside a direct click callback context to unlock audio context in all browsers
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (activeFreq === freq) {
      stopFrequency();
      setActiveFreq(null);
    } else {
      setActiveVowel(null);
      setActiveRatioId(null);
      stopRatio();
      stopVowel();
      playFrequency(freq);
      setActiveFreq(freq);
    }
  };

  const playRatio = (cents: number) => {
    try {
      stopFrequency();
      stopVowel();
      stopRatio();

      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const baseFreq = 220; // Beautiful rich lower A3 Root tone
      const targetFreq = baseFreq * Math.pow(2, cents / 1200);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const masterGain = ctx.createGain();

      // Use sweet pure sine waves for the acoustic ratio test
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(targetFreq, now);

      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);

      osc1.connect(masterGain);
      osc2.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      ratioOscsRef.current = {
        osc1,
        osc2,
        gain: masterGain
      };
    } catch (e) {
      console.warn("Play ratio error:", e);
    }
  };

  const stopRatio = () => {
    if (audioCtxRef.current && ratioOscsRef.current) {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const currentRef = ratioOscsRef.current;

      currentRef.gain.gain.cancelScheduledValues(now);
      currentRef.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      setTimeout(() => {
        try {
          currentRef.osc1.stop();
          currentRef.osc1.disconnect();
          currentRef.osc2.stop();
          currentRef.osc2.disconnect();
          currentRef.gain.disconnect();
          if (ratioOscsRef.current === currentRef) {
            ratioOscsRef.current = null;
          }
        } catch (e) {}
      }, 110);
    }
  };

  const handleToggleRatio = (id: string, cents: number) => {
    // Resume/create audio context inside a direct click callback context to unlock audio context in all browsers
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (activeRatioId === id) {
      stopRatio();
      setActiveRatioId(null);
    } else {
      setActiveFreq(null);
      setActiveVowel(null);
      stopFrequency();
      stopVowel();
      playRatio(cents);
      setActiveRatioId(id);
    }
  };

  const handleStopAll = () => {
    stopFrequency();
    stopVowel();
    stopRatio();
    setActiveFreq(null);
    setActiveVowel(null);
    setActiveRatioId(null);
  };

  return {
    activeFreq,
    activeRatioId,
    activeVowel,
    audioCtxRef,
    gainRef,
    handleStopAll,
    handleToggleFreq,
    handleToggleRatio,
    handleToggleVowel,
    oscRef,
    playFrequency,
    playRatio,
    playVowel,
    ratioOscsRef,
    setActiveFreq,
    setActiveRatioId,
    setActiveVowel,
    stopFrequency,
    stopRatio,
    stopVowel,
    vowelOscsRef,
  };
}
