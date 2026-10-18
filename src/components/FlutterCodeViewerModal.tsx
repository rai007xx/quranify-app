import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Terminal, Download, Folder } from 'lucide-react';
import { FLUTTER_CODEBASE, FlutterFile } from '../data/flutterSourceCode';

interface FlutterCodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlutterCodeViewerModal: React.FC<FlutterCodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(FLUTTER_CODEBASE[0]);
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const handleCopyCurrent = () => {
    navigator.clipboard?.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = () => {
    const combined = FLUTTER_CODEBASE.map(
      (f) => `// ==========================================\n// FILE: ${f.path}\n// ${f.description}\n// ==========================================\n\n${f.code}\n`
    ).join('\n\n');
    navigator.clipboard?.writeText(combined);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[90vh] bg-[#0B0F19] border border-white/[0.12] rounded-3xl shadow-2xl flex flex-col overflow-hidden gpu-accelerated">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0E1524]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Flutter Quran Audio Engine Code
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Null-Safe Flutter 3.x
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Production architecture with just_audio, audio_service & Mp3Quran API
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'All Copied!' : 'Copy All Files'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar Files + Code Editor View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#090D16] p-3 overflow-y-auto shrink-0 max-h-48 md:max-h-full">
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-2 mb-2 flex items-center gap-1.5">
              <Folder className="w-3 h-3 text-sky-400" />
              <span>Project Structure</span>
            </div>

            <div className="space-y-1">
              {FLUTTER_CODEBASE.map((file) => {
                const isSelected = file.filename === selectedFile.filename;
                return (
                  <button
                    key={file.filename}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/40'
                        : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{file.filename}</span>
                    <span className="text-[10px] uppercase font-mono text-slate-500 shrink-0 ml-2">
                      {file.language}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Setup CLI block */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] hidden md:block">
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-1 mb-2 flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>Quick Run</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/[0.06] font-mono text-[11px] text-emerald-400/90 space-y-1">
                <p>$ flutter pub get</p>
                <p>$ flutter run</p>
              </div>
            </div>
          </div>

          {/* Main Code Viewer */}
          <div className="flex-1 flex flex-col bg-[#070A12] overflow-hidden">
            {/* Active file toolbar */}
            <div className="px-4 py-2.5 bg-[#0D121F] border-b border-white/[0.08] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-sky-300">
                    {selectedFile.path}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {selectedFile.description}
                </p>
              </div>

              <button
                onClick={handleCopyCurrent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium transition-all shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#070A12] select-text">
              <pre className="whitespace-pre">
                <code>{selectedFile.code}</code>
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
