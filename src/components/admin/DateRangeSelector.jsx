import React from 'react';
import { Calendar } from 'lucide-react';

// Compact date-range picker used by the dashboard stats + audit log filters.
// Calls onChange({ from, to }) with ISO strings (or null when cleared).
export default function DateRangeSelector({ from, to, onChange }) {
  const setFrom = (v) => onChange({ from: v || null, to });
  const setTo = (v) => onChange({ from, to: v || null });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 glass-card rounded-xl px-3 py-2">
        <Calendar className="w-3.5 h-3.5 text-[#F0E6FF]/40" />
        <input
          type="date"
          value={from ? from.slice(0, 10) : ''}
          onChange={(e) => setFrom(e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="bg-transparent text-[#F0E6FF] text-xs outline-none [color-scheme:dark]"
        />
      </div>
      <span className="text-[#F0E6FF]/30 text-xs">→</span>
      <div className="flex items-center gap-1.5 glass-card rounded-xl px-3 py-2">
        <Calendar className="w-3.5 h-3.5 text-[#F0E6FF]/40" />
        <input
          type="date"
          value={to ? to.slice(0, 10) : ''}
          onChange={(e) => setTo(e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="bg-transparent text-[#F0E6FF] text-xs outline-none [color-scheme:dark]"
        />
      </div>
      {(from || to) && (
        <button
          onClick={() => onChange({ from: null, to: null })}
          className="text-[#F0E6FF]/40 hover:text-[#F5A800] text-xs px-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}