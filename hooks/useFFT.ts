import { useEffect, useState, RefObject } from "react";

/**
 * useFFT
 * Analyzes the audio from the given audioRef using FFT and returns a scale value (1.0-1.2) based on audio energy.
 * @param audioRef - React ref to an <audio> element with a MediaStream srcObject
 * @param options - Optional min/max for mapping energy to scale
 */
export function useFFT(
  audioRef: RefObject<HTMLAudioElement | null>,
  options?: { min?: number; max?: number; minScale?: number; maxScale?: number }
): number {
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationId: number;
    let lastStream: MediaStream | null = null;
    let pollInterval: NodeJS.Timeout;

    const cleanup = () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (audioCtx) audioCtx.close();
      analyser = null;
      source = null;
      audioCtx = null;
      setScale(1.0);
    };

    const update = () => {
      if (!analyser) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      // Calculate average volume (energy)
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
      // Map average to scale
      const min = options?.min ?? 20;
      const max = options?.max ?? 160;
      const minScale = options?.minScale ?? 1.0;
      const maxScale = options?.maxScale ?? 1.3;
      let mapped = minScale + (maxScale - minScale) * Math.max(0, Math.min(1, (avg - min) / (max - min)));
      setScale(mapped);
      animationId = requestAnimationFrame(update);
    };

    const setup = (stream: MediaStream) => {
      cleanup();
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      update();
    };

    pollInterval = setInterval(() => {
      const stream = audioRef.current?.srcObject as MediaStream | null;
      if (stream !== lastStream) {
        lastStream = stream;
        if (stream) {
          setup(stream);
        } else {
          cleanup();
        }
      }
    }, 200);

    return () => {
      clearInterval(pollInterval);
      cleanup();
    };
  }, [audioRef, options?.min, options?.max, options?.minScale, options?.maxScale]);

  return scale;
}
