"use client";

import { useState } from 'react';
import { buildUtmUrl } from '@/lib/utm/build-url';
import ChannelSelector from './ChannelSelector';
import SourceSelector from './SourceSelector';
import InfoPopover from './InfoPopover';

export default function GuidedBuilder() {
  const [destination, setDestination] = useState('');
  const [channel, setChannel] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [showOptional, setShowOptional] = useState(false);

  const url = buildUtmUrl({
    destination,
    source,
    medium,
    campaign,
    content,
    term,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
          1. Destination URL
        </h2>
        <input
          type="url"
          className="w-full bg-[#141414] border border-[#2A2A2A] focus:border-[#39FF14] rounded-xl px-4 py-3 text-white placeholder-[#9E9E9E] outline-none text-sm transition-colors"
          placeholder="https://example.com/product"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
          2. Traffic Source
        </h2>
        <ChannelSelector
          selectedChannel={channel}
          onChange={(channelId, sourceValue, mediumValue) => {
            setChannel(channelId);
            setSource(sourceValue);
            setMedium(mediumValue);
          }}
        />
        
        {channel === 'meta_ads' && (
          <div className="mt-6 pt-6 border-t border-[#1C1C1C]">
            <SourceSelector
              channel={channel}
              selectedSource={source}
              onChange={(src) => setSource(src)}
            />
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            3. Campaign Name
          </h2>
          <InfoPopover
            title="Campaign Name"
            description="The specific initiative or promotion. Keep this consistent across channels."
            example="utm_campaign=winter_sale_2026"
            learnHref="/learn/utm-tracking/#campaign"
          />
        </div>
        <input
          type="text"
          className="w-full bg-[#141414] border border-[#2A2A2A] focus:border-[#39FF14] rounded-xl px-4 py-3 text-white placeholder-[#9E9E9E] outline-none text-sm transition-colors"
          placeholder="e.g. Winter Sale 2026"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
        />

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 text-[#9E9E9E] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
          >
            {showOptional ? '- Hide Optional Details' : '+ Add Optional Details'}
          </button>
          
          {showOptional && (
            <div className="mt-6 grid grid-cols-1 gap-6 border-t border-[#1C1C1C] pt-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white">
                    Creative / Ad name
                  </label>
                  <InfoPopover
                    title="Campaign Content"
                    description="Used to differentiate creatives or link placements within the same ad."
                    example="utm_content=video_01"
                    learnHref="/learn/utm-tracking/#content"
                  />
                </div>
                <input
                  type="text"
                  className="w-full bg-[#141414] border border-[#2A2A2A] focus:border-[#39FF14] rounded-xl px-4 py-3 text-white placeholder-[#9E9E9E] outline-none text-sm transition-colors"
                  placeholder="e.g. video_01"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white">
                    Keyword / Term
                  </label>
                  <InfoPopover
                    title="Campaign Term"
                    description="Useful when you need to identify a keyword or targeting term."
                    example="utm_term=retargeting_30d"
                    learnHref="/learn/utm-tracking/#term"
                  />
                </div>
                <input
                  type="text"
                  className="w-full bg-[#141414] border border-[#2A2A2A] focus:border-[#39FF14] rounded-xl px-4 py-3 text-white placeholder-[#9E9E9E] outline-none text-sm transition-colors"
                  placeholder="e.g. retargeting_30d"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#9E9E9E] mb-4">
          Your Tracking URL
        </h2>
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4">
          {url ? (
            <div className="space-y-4">
              <p className="font-mono text-xs text-white break-all leading-relaxed">
                {url}
              </p>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(url)}
                className="px-4 py-2 bg-[#39FF14] text-black font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-[#32e012] transition-colors"
              >
                Copy URL
              </button>
            </div>
          ) : (
            <p className="font-mono text-xs text-[#9E9E9E] break-all leading-relaxed min-h-[60px]">
              Enter a destination URL to begin...
            </p>
          )}
        </div>

        {url && (
          <div className="mt-8 pt-8 border-t border-[#1C1C1C]">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] mb-6">
              What this link tracks
            </h3>
            <div className="space-y-4">
              {source && (
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-white block">Source</span>
                    <span className="text-[10px] text-[#9E9E9E] font-mono block">utm_source</span>
                  </div>
                  <span className="text-lg text-[#39FF14] font-bold">{source}</span>
                </div>
              )}
              {medium && (
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-white block">Medium</span>
                    <span className="text-[10px] text-[#9E9E9E] font-mono block">utm_medium</span>
                  </div>
                  <span className="text-lg text-[#39FF14] font-bold">{medium}</span>
                </div>
              )}
              {campaign && (
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-white block">Campaign</span>
                    <span className="text-[10px] text-[#9E9E9E] font-mono block">utm_campaign</span>
                  </div>
                  <span className="text-lg text-[#39FF14] font-bold">{campaign}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
