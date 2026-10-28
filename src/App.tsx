import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  RotateCw,
  Info,
  Layers,
  Sparkles,
  BookOpen,
  FileCheck2,
  Library,
  HelpCircle,
  BarChart2,
  CheckCircle2,
  FileCode,
  Upload
} from 'lucide-react';

export default function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Reload the iframe dashboard
  const handleReload = () => {
    setKey((prev) => prev + 1);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Export / Download HTML file
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = './dashboard.html';
    link.download = 'Math_Teacher_Dashboard.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Navigate to specific tabs inside the dashboard if possible
  const sendTabMessage = (tabName: string) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        // Look for buttons inside iframe document
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc) {
          const buttons = iframeDoc.querySelectorAll('.tb-menu .tb, .nav button, .tabs button');
          buttons.forEach((btn) => {
            if (btn.textContent?.toLowerCase().includes(tabName.toLowerCase())) {
              (btn as HTMLElement).click();
            }
          });
        }
      }
    } catch {
      // Cross-origin fallback (same-origin works fine here)
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none ${
      isFullscreen ? 'fixed inset-0 z-50 p-0 m-0 overflow-hidden' : ''
    }`}>
      {/* Top Application Header */}
      {!isFullscreen && (
        <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 sm:px-6 h-15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">Math Teacher Dashboard</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Live System
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">
                Question Bank • Test Paper Generator • DPP Library • KaTeX Math Engine
              </p>
            </div>
          </div>

          {/* Quick Tab Jumpers */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => sendTabMessage('question')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 font-medium transition cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              <span>Question Bank</span>
            </button>
            <button
              onClick={() => sendTabMessage('make')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 font-medium transition cursor-pointer"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Make Test</span>
            </button>
            <button
              onClick={() => sendTabMessage('dpp')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 font-medium transition cursor-pointer"
            >
              <Library className="h-3.5 w-3.5 text-amber-400" />
              <span>DPP Library</span>
            </button>
            <button
              onClick={() => sendTabMessage('must')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 font-medium transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>Must Solve</span>
            </button>
            <button
              onClick={() => sendTabMessage('results')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 font-medium transition cursor-pointer"
            >
              <BarChart2 className="h-3.5 w-3.5 text-rose-400" />
              <span>Results</span>
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-lg border transition cursor-pointer ${
                showInfo
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Dashboard System Info"
            >
              <Info className="h-4 w-4" />
            </button>

            <button
              onClick={handleReload}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Reload Dashboard"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            <button
              onClick={handleDownload}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Download Standalone HTML"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export HTML</span>
            </button>

            <a
              href="./dashboard.html"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Open in Full Window"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>New Window</span>
            </a>

            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Focus Mode</span>
            </button>
          </div>
        </header>
      )}

      {/* Info Banner Dropdown */}
      {showInfo && !isFullscreen && (
        <div className="bg-slate-900 border-b border-indigo-500/30 px-6 py-4 transition-all">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-400" />
                Math Teacher Dashboard • Architecture &amp; Capabilities
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                This all-in-one education platform features an embedded virtual file system (VFS) with thousands of curated mathematics questions (JEE, CBSE &amp; Olympiad grade), KaTeX formula rendering, printable A4 sheets, DPP handouts, and client-side test grading stored in browser storage.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                Size: 2.2 MB Standalone
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30 font-medium">
                KaTeX Math Enabled
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Exit Button in Fullscreen Mode */}
      {isFullscreen && (
        <div className="absolute top-3 right-4 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-2xl">
          <span className="text-xs font-semibold text-slate-200">Math Teacher Dashboard</span>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
          >
            <Minimize2 className="h-3 w-3" />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      )}

      {/* Embedded Live Dashboard */}
      <main className="flex-1 w-full h-full relative bg-slate-950 flex flex-col">
        {!hasLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10 gap-3">
            <div className="w-10 h-10 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading Math Teacher Dashboard &amp; Question Bank…</p>
          </div>
        )}

        <iframe
          key={key}
          ref={iframeRef}
          src="./dashboard.html"
          title="Math Teacher Dashboard"
          onLoad={() => setHasLoaded(true)}
          className="w-full flex-1 border-0 min-h-[calc(100vh-60px)]"
          style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 60px)' }}
          allow="clipboard-write; clipboard-read"
        />
      </main>
    </div>
  );
}
