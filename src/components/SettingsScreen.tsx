import React from 'react';
import { ShieldCheck, Heart, Moon, Volume2, Globe, Sparkles, Smartphone, Code2 } from 'lucide-react';

interface SettingsScreenProps {
  onOpenCodeViewer: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenCodeViewer }) => {
  return (
    <div className="py-3 px-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
          Settings & Preferences
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Customise audio streaming, themes, and developer options
        </p>
      </div>

      {/* 100% Free Pure Dedication Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0E1726] to-[#0A0E17] border border-emerald-500/30 mb-4 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">100% Free & Open For All</h4>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">
              Sadaqah Jariyah • No Ads • No Subscriptions
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-300/90 leading-relaxed">
          This application provides unhindered, high-fidelity Quran recitations for listeners globally, streaming freely from verified public Quranic CDNs with seamless one-tap offline downloads.
        </p>
      </div>

      {/* Preferences List */}
      <div className="space-y-2 mb-5">
        <div className="p-3.5 rounded-2xl bg-[#101726]/80 border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-white">Audio Streaming Bitrate</p>
              <p className="text-[11px] text-slate-400">High Definition 128 kbps (Mp3Quran CDN)</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            HD 128K
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#101726]/80 border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-xs font-bold text-white">App Color Theme</p>
              <p className="text-[11px] text-slate-400">Deep AMOLED Midnight Black & Emerald Glow</p>
            </div>
          </div>
          <span className="text-xs text-slate-300 font-medium bg-white/[0.05] px-2 py-0.5 rounded-md">
            AMOLED Dark
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#101726]/80 border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-xs font-bold text-white">Arabic Calligraphy Script</p>
              <p className="text-[11px] text-slate-400">Amiri Naskh Typography</p>
            </div>
          </div>
          <span className="text-xs font-['Amiri'] text-emerald-300 px-2 py-0.5 rounded-md bg-white/[0.05]">
            النسخ العثماني
          </span>
        </div>
      </div>

      {/* Flutter Architecture Export Card */}
      <div className="p-4 rounded-3xl bg-[#0F172A] border border-sky-500/30 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Flutter Mobile Codebase</h4>
            <p className="text-[11px] text-slate-400">
              Clean modular Dart code with just_audio & audio_service
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCodeViewer}
          className="w-full mt-3 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Code2 className="w-4 h-4" />
          <span>Open Full Flutter Code Viewer</span>
        </button>
      </div>
    </div>
  );
};
