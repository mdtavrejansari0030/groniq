"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Info, X, ChevronRight } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  example: string;
  learnHref: string;
};

export default function InfoPopover({ title, description, example, learnHref }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        aria-label={`Learn about ${title}`}
        onClick={() => setIsOpen(!isOpen)}
        className="text-[#9E9E9E] hover:text-white transition-colors p-1"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 top-6 w-64 bg-[#111] border border-[#333] shadow-2xl rounded-xl p-4 text-left">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
            <button
              type="button"
              className="text-[#9E9E9E] hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-[#A3A3A3] mb-3 leading-relaxed">{description}</p>
          <div className="bg-[#0A0A0A] border border-[#222] rounded-md p-2 mb-3">
            <span className="text-[10px] font-mono text-[#39FF14]">{example}</span>
          </div>
          <Link
            href={learnHref}
            target="_blank"
            className="text-[10px] font-bold text-white hover:text-[#39FF14] uppercase tracking-widest inline-flex items-center gap-1 transition-colors"
          >
            Learn more <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
