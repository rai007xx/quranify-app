/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AudioProvider, useAudio } from './context/AudioContext';
import { TopBar } from './components/TopBar';
import { FeaturedCard } from './components/FeaturedCard';
import { FavouritesCarousel } from './components/FavouritesCarousel';
import { PlaylistsPreviewSection } from './components/PlaylistsPreviewSection';
import { SurahList } from './components/SurahList';
import { MiniPlayer } from './components/MiniPlayer';
import { FullPlayerModal } from './components/FullPlayerModal';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { RecitersScreen } from './components/RecitersScreen';
import { PlaylistsScreen } from './components/PlaylistsScreen';
import { SearchScreen } from './components/SearchScreen';
import { InsightsScreen } from './components/InsightsScreen';
import { ReciterProfileModal } from './components/ReciterProfileModal';
import { SurahQueueSheet } from './components/SurahQueueSheet';
import { OnboardingRecitersModal } from './components/OnboardingRecitersModal';
import { RECITERS } from './data/quranData';
import { Smartphone, Monitor, ShieldCheck, CheckCircle2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { toastMessage } = useAudio();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [deviceFrameMode, setDeviceFrameMode] = useState<'mobile' | 'wide'>('mobile');

  // Featured reciter is Yasser Al-Dosari
  const featuredReciter = RECITERS.find((r) => r.id === 'yasser') || RECITERS[0];

  return (
    <div className="h-[100dvh] w-full bg-[#000000] text-slate-100 flex flex-col items-center justify-center antialiased overflow-hidden selection:bg-[#00E676] selection:text-black relative">
      
      {/* Top Desktop Helper Header (Visible on Desktop only) */}
      <div className="w-full bg-[#05090F] border-b border-[#182230] px-4 py-1.5 hidden lg:flex items-center justify-between z-30 text-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#00E676] font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Free Quran Audio Streaming</span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            AMOLED Dark Glassmorphism • Real Reciter Photos • Pinned Sticky Player
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.08]">
            <button
              onClick={() => setDeviceFrameMode('mobile')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                deviceFrameMode === 'mobile'
                  ? 'bg-[#00E676] text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Phone</span>
            </button>
            <button
              onClick={() => setDeviceFrameMode('wide')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                deviceFrameMode === 'wide'
                  ? 'bg-[#00E676] text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Expanded</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main App Container: Pinned/Fixed Top and Bottom Architecture */}
      <main
        className={`w-full flex flex-col overflow-hidden bg-[#05090F] shadow-2xl transition-all duration-300 ${
          deviceFrameMode === 'mobile'
            ? 'h-full lg:h-[92vh] lg:max-h-[860px] max-w-[430px] rounded-none lg:rounded-[42px] border-0 lg:border lg:border-[#182230]'
            : 'h-full lg:h-[92vh] max-w-4xl rounded-none lg:rounded-[32px] border-0 lg:border lg:border-[#182230]'
        }`}
      >
        {/* 1. Permanent Fixed Top Bar */}
        <TopBar />

        {/* 2. Scrollable Middle Body (Content scrolls behind the fixed bottom player with 90Hz/120Hz native inertia) */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-6 scrollbar-thin scrollbar-thumb-white/10 smooth-scroll gpu-accelerated">
          {activeTab === 'home' && (
            <>
              {/* Featured Reciter Hero Card (Yasser Al-Dosari with real photo) */}
              <FeaturedCard reciter={featuredReciter} />

              {/* Your favourites Horizontal Carousel (Real photos, local persistence) */}
              <FavouritesCarousel
                onExploreMore={() => setActiveTab('reciters')}
              />

              {/* Playlists Preview Section */}
              <PlaylistsPreviewSection onViewAllPlaylists={() => setActiveTab('playlists')} />

              {/* Full 114 Surahs Library List */}
              <SurahList />
            </>
          )}

          {activeTab === 'reciters' && <RecitersScreen />}

          {activeTab === 'playlists' && <PlaylistsScreen />}

          {activeTab === 'insights' && <InsightsScreen />}

          {activeTab === 'search' && <SearchScreen />}
        </div>

        {/* 3. PERMANENT FIXED BOTTOM REGION: High-Performance GPU Mini Player + 4-Tab Bottom Bar */}
        <div className="shrink-0 z-40 bg-[#070B14] pb-safe gpu-accelerated">
          <MiniPlayer />
          <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>
      </main>

      {/* Full-Screen Audio Player Modal */}
      <FullPlayerModal />

      {/* Continue Playing / Surah Queue Sheet */}
      <SurahQueueSheet />

      {/* Reciter Profile & 114 Surahs Modal */}
      <ReciterProfileModal />

      {/* First-Launch Reciter Onboarding Modal */}
      <OnboardingRecitersModal />

      {/* Floating Offline Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] px-4 py-2.5 rounded-2xl bg-[#0F1728] border border-emerald-500/40 shadow-2xl shadow-emerald-500/20 text-xs font-semibold text-white flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 gpu-accelerated">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AudioProvider>
      <MainAppContent />
    </AudioProvider>
  );
}
