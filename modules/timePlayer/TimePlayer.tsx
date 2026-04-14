
import React, { useMemo, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Settings } from 'lucide-react';
import { useTimePlayer } from './TimePlayerContext';
import { TimePlayerConfig } from '../../components/DataSmartMapPanel';

export const TimePlayer: React.FC<{ config?: TimePlayerConfig, onTimeChange?: (time: Date) => void }> = ({ config, onTimeChange }) => {
  const { isPlaying, currentTime, startTime, endTime, setIsPlaying, setCurrentTime, setRange } = useTimePlayer();

  useEffect(() => {
    if (onTimeChange) {
        onTimeChange(currentTime);
    }
  }, [currentTime, onTimeChange]);

  const sortedPoints = useMemo(() => {
    if (!config || !config.timePoints) return [];
    return [...config.timePoints]
      .filter(tp => tp.time)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [config]);

  useEffect(() => {
    if (sortedPoints.length > 0) {
      const start = new Date(sortedPoints[0].time);
      const end = new Date(sortedPoints[sortedPoints.length - 1].time);
      setRange(start, end);
      
      // If current time is outside the range, reset it
      if (currentTime < start || currentTime > end) {
          setCurrentTime(start);
      }
    }
  }, [sortedPoints, setRange]);

  const formattedDate = useMemo(() => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      year: currentTime.getFullYear(),
      month: months[currentTime.getMonth()],
      day: String(currentTime.getDate()).padStart(2, '0')
    };
  }, [currentTime]);

  const progress = useMemo(() => {
    const total = endTime.getTime() - startTime.getTime();
    if (total === 0) return 0;
    const current = currentTime.getTime() - startTime.getTime();
    return Math.min(100, Math.max(0, (current / total) * 100));
  }, [currentTime, startTime, endTime]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const total = endTime.getTime() - startTime.getTime();
    const newTime = new Date(startTime.getTime() + (total * val) / 100);
    setCurrentTime(newTime);
  };

  const handleSkipBack = () => {
      if (sortedPoints.length === 0) return;
      
      // Find the previous time point
      for (let i = sortedPoints.length - 1; i >= 0; i--) {
          const tpTime = new Date(sortedPoints[i].time).getTime();
          if (tpTime < currentTime.getTime()) {
              setCurrentTime(new Date(tpTime));
              return;
          }
      }
      // If none found, go to the last one
      if (sortedPoints.length > 0) {
          setCurrentTime(new Date(sortedPoints[sortedPoints.length - 1].time));
      }
  };

  const handleSkipForward = () => {
      if (sortedPoints.length === 0) return;
      
      // Find the next time point
      for (let i = 0; i < sortedPoints.length; i++) {
          const tpTime = new Date(sortedPoints[i].time).getTime();
          if (tpTime > currentTime.getTime()) {
              setCurrentTime(new Date(tpTime));
              return;
          }
      }
      // If none found, go to the first one
      if (sortedPoints.length > 0) {
          setCurrentTime(new Date(sortedPoints[0].time));
      }
  };

  return (
    <div 
      className="v2-time-series-player-container w-[840px] animate-slideUp"
    >
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-[28px] shadow-[0_15px_40px_rgba(0,0,0,0.12)] p-2.5 px-6 flex items-center gap-6 lg:gap-8">
        
        {/* Left: Date Display - More Compact */}
        <div className="flex items-center gap-5 flex-shrink-0">
          <DateUnit label="YEAR" value={formattedDate.year} />
          <DateUnit label="MONTH" value={formattedDate.month} variant="blue" />
          <DateUnit label="DAY" value={formattedDate.day} />
          <div className="w-px h-8 bg-slate-100 mx-1"></div>
        </div>

        {/* Middle: Controls - Smaller buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <ControlButton icon={<SkipBack size={16} fill="currentColor" />} onClick={handleSkipBack} />
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>
          <ControlButton icon={<SkipForward size={16} fill="currentColor" />} onClick={handleSkipForward} />
          <div className="w-px h-8 bg-slate-100 mx-1"></div>
        </div>

        {/* Right: Timeline - Adaptive width */}
        <div className="flex-1 relative pb-4">
          <div className="relative h-10 flex flex-col justify-center">
            {/* Ticks - Subtle background ticks */}
            <div className="absolute inset-x-2 inset-y-0 flex items-end justify-between pointer-events-none opacity-20 pb-2">
               {Array.from({length: 31}).map((_, i) => (
                 <div key={i} className={`w-0.5 bg-slate-800 ${i % 5 === 0 ? 'h-3' : 'h-1.5'}`}></div>
               ))}
            </div>

            {/* Range Track Background */}
            <div className="absolute left-0 right-0 h-8 bg-slate-50/50 border border-slate-100/80 rounded-xl -z-10"></div>

            {/* Slider Input */}
            <input 
              type="range"
              min="0"
              max="100"
              step="0.01"
              value={progress}
              onChange={handleSliderChange}
              onMouseDown={e => e.stopPropagation()}
              className="w-full h-1 bg-transparent appearance-none cursor-pointer relative z-20 slider-thumb-custom"
            />
            
            {/* Visual Indicator Line */}
            <div 
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)] transition-all pointer-events-none"
                style={{ left: `calc(${progress}% )` }}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>
            </div>

            {/* Timeline Labels - Adjusted font size */}
            <div className="absolute -bottom-1 left-0 right-0 flex justify-between px-1 text-[8px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">
               <span>{sortedPoints.length > 0 ? new Date(sortedPoints[0].time).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'DEC 2025'}</span>
               <span className="opacity-60">{sortedPoints.length > 1 ? new Date(sortedPoints[Math.floor(sortedPoints.length / 2)].time).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'JAN 2026'}</span>
               <span className="text-blue-600/80">{sortedPoints.length > 0 ? new Date(sortedPoints[sortedPoints.length - 1].time).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'FEB 2026'}</span>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .v2-time-series-player-container .slider-thumb-custom::-webkit-slider-thumb {
          appearance: none;
          width: 0;
          height: 0;
        }
        .v2-time-series-player-container .slider-thumb-custom::-moz-range-thumb {
          width: 0;
          height: 0;
          border: 0;
        }
      `}</style>
    </div>
  );
};

const DateUnit: React.FC<{ label: string; value: string | number; variant?: 'blue' }> = ({ label, value, variant }) => (
  <div className="flex flex-col items-center min-w-[36px]">
    <span className="text-[9px] font-black text-slate-400 mb-0.5 uppercase tracking-tighter opacity-60">{label}</span>
    <span className={`text-[15px] font-black tracking-tight ${variant === 'blue' ? 'text-blue-600' : 'text-slate-800'}`}>{value}</span>
  </div>
);

const ControlButton: React.FC<{ icon: React.ReactNode; onClick: () => void }> = ({ icon, onClick }) => (
  <button 
    onClick={onClick}
    className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-100 rounded-xl transition-all hover:shadow-sm"
  >
    {icon}
  </button>
);
