"use client";

import { UTM_PRESETS } from '@/lib/utm/presets';

type Props = {
  channel: string;
  selectedSource: string;
  onChange: (sourceValue: string) => void;
};

export default function SourceSelector({ channel, selectedSource, onChange }: Props) {
  const preset = UTM_PRESETS.find((p) => p.id === channel);
  if (!preset || !preset.placements) return null;

  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] block mb-3">
        Where will the traffic come from?
      </label>
      <div className="flex flex-wrap gap-2">
        {preset.placements.map((pl) => {
          const isSelected = selectedSource === pl.source;
          return (
            <button
              key={pl.id}
              onClick={() => onChange(pl.source)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                isSelected
                  ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/5'
                  : 'border-[#333] text-[#9E9E9E] hover:text-white bg-[#0A0A0A]'
              }`}
            >
              {pl.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
