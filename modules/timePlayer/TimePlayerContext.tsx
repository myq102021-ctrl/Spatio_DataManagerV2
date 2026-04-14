
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type TimeStep = 'day' | 'month' | 'year';

interface TimePlayerState {
  isPlaying: boolean;
  currentTime: Date;
  startTime: Date;
  endTime: Date;
  step: TimeStep;
  speed: number; // multiplier
  boundLayerIds: string[];
}

interface TimePlayerContextType extends TimePlayerState {
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: Date) => void;
  setRange: (start: Date, end: Date) => void;
  setStep: (step: TimeStep) => void;
  setSpeed: (speed: number) => void;
  toggleLayerBinding: (layerId: string) => void;
}

const TimePlayerContext = createContext<TimePlayerContextType | undefined>(undefined);

export const TimePlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date(2026, 1, 8)); // Default FEB 08 2026
  const [startTime, setStartTime] = useState(new Date(2025, 11, 1)); // DEC 2025
  const [endTime, setEndTime] = useState(new Date(2026, 1, 28)); // FEB 2026
  const [step, setStep] = useState<TimeStep>('day');
  const [speed, setSpeed] = useState(1);
  const [boundLayerIds, setBoundLayerIds] = useState<string[]>([]);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          const next = new Date(prev);
          if (step === 'day') next.setDate(next.getDate() + 1);
          if (step === 'month') next.setMonth(next.getMonth() + 1);
          if (step === 'year') next.setFullYear(next.getFullYear() + 1);
          
          if (next > endTime) {
            return startTime;
          }
          return next;
        });
      }, 1000 / speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, step, speed, startTime, endTime]);

  const toggleLayerBinding = (id: string) => {
    setBoundLayerIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const setRange = React.useCallback((s: Date, e: Date) => { setStartTime(s); setEndTime(e); }, []);

  const value = {
    isPlaying,
    currentTime,
    startTime,
    endTime,
    step,
    speed,
    boundLayerIds,
    setIsPlaying,
    setCurrentTime,
    setRange,
    setStep,
    setSpeed,
    toggleLayerBinding
  };

  return <TimePlayerContext.Provider value={value}>{children}</TimePlayerContext.Provider>;
};

export const useTimePlayer = () => {
  const context = useContext(TimePlayerContext);
  if (!context) throw new Error('useTimePlayer must be used within a TimePlayerProvider');
  return context;
};
