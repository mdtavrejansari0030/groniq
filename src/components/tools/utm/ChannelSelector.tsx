"use client";

import { UTM_PRESETS } from '@/lib/utm/presets';
import { Search, Video, Mail, Link2, Share2, QrCode, MonitorPlay, MessageSquare } from 'lucide-react';

const iconMap: Record<string, any> = {
  search: Search,
  instagram: MonitorPlay,
  linkedin: MessageSquare,
  video: Video,
  mail: Mail,
  'link-2': Link2,
  'share-2': Share2,
  'qr-code': QrCode,
};

type Props = {
  selectedChannel: string;
  onChange: (channelId: string, sourceValue: string, mediumValue: string) => void;
};

export default function ChannelSelector({ selectedChannel, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2" id="platform-presets">
      {UTM_PRESETS.map((p) => {
        const Icon = iconMap[p.icon] || Search;
        const isSelected = selectedChannel === p.id;
        return (
          <button
            key={p.id}
            onClick={() => {
              // For presets without placements, set the source directly
              const defaultSource = p.requiresPlacement && p.placements ? p.placements[0].source : p.source;
              onChange(p.id, defaultSource, p.medium);
            }}
            aria-pressed={isSelected}
            className={`px-4 py-2.5 rounded-lg border transition-all flex items-center justify-start gap-2 ${
              isSelected
                ? 'border-[#39FF14] bg-[#39FF14]/5 text-[#39FF14]'
                : 'border-[#333] bg-[#0A0A0A] hover:border-[#39FF14]/50 hover:bg-[#141414] text-white'
            }`}
          >
            <Icon
              className={`w-4 h-4 ${
                isSelected ? 'text-[#39FF14]' : 'text-[#9E9E9E]'
              }`}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
