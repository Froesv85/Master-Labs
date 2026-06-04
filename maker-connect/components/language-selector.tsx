'use client';

import React, { useState } from 'react';
import { useLanguage } from './language-provider';

type Language = {
  code: string;
  name: string;
  flag: string;
};

const languages: Language[] = [
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export function LanguageSelector({ onSelect }: { onSelect?: (code: string) => void }) {
  const { language: currentLang, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const selected = languages.find(l => l.code === currentLang) || languages[0];

  const handleSelect = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
    if (onSelect) onSelect(code);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95"
      >
        <span>{selected.flag}</span>
        <span className="hidden sm:inline">{selected.name}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#1e293b]/90 p-1 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors hover:bg-emerald-500/20 ${
                currentLang === lang.code ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-300'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLang === lang.code && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
