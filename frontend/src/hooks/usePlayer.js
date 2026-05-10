import { useState, useRef, useCallback, useEffect } from 'react';

export function usePlayer() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // 0–1
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
    });

    audioRef.current = audio;

    return () => {
      cancelAnimationFrame(rafRef.current);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    if (!audio.paused) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const play = useCallback((track) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!track.previewUrl) {
      console.warn('No preview URL for track:', track.title);
      return;
    }

    if (currentTrack?.spotifyId === track.spotifyId) {
      // Toggle play/pause on same track
      if (audio.paused) {
        audio.play();
        setIsPlaying(true);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        audio.pause();
        setIsPlaying(false);
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    // New track
    cancelAnimationFrame(rafRef.current);
    audio.pause();
    audio.src = track.previewUrl;
    audio.currentTime = 0;
    setCurrentTrack(track);
    setProgress(0);
    audio.play().then(() => {
      setIsPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    }).catch(console.error);
  }, [currentTrack, tick]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const seek = useCallback((ratio) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }, []);

  return { currentTrack, isPlaying, progress, duration, play, pause, seek };
}
