import React, { useEffect, useState } from 'react'

const Loading = ({ duration = 3200, onFinish }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // kick the progress bar to 100% on next frame so the CSS transition animates
    const raf = requestAnimationFrame(() => setProgress(100))

    const timer = setTimeout(() => {
      onFinish?.()
    }, duration)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [duration, onFinish])

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-neutral-950 via-zinc-900 to-cyan-950 text-white">
      <style>{`
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes core-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px 10px rgba(49,184,198,0.35); }
          50% { transform: scale(1.08); box-shadow: 0 0 60px 18px rgba(49,184,198,0.55); }
        }
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-46px) translateX(var(--drift, 10px)); opacity: 0; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .loading-orbit { animation: orbit-spin 6s linear infinite; }
        .loading-orbit-reverse { animation: orbit-spin-reverse 9s linear infinite; }
        .loading-core { animation: core-pulse 2.2s ease-in-out infinite; }
        .loading-particle { animation: float-particle 3.2s ease-in-out infinite; }
        .loading-fade-1 { animation: fade-up 0.6s ease-out both; animation-delay: 0.1s; }
        .loading-fade-2 { animation: fade-up 0.6s ease-out both; animation-delay: 0.35s; }
        .loading-fade-3 { animation: fade-up 0.6s ease-out both; animation-delay: 0.6s; }
      `}</style>

      {/* Ambient drifting particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="loading-particle absolute h-1 w-1 rounded-full bg-[#31b8c6]"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              '--drift': `${(i % 5) * 6 - 12}px`,
              animationDelay: `${(i % 6) * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Orbiting core logo */}
      <div className="loading-fade-1 relative flex h-40 w-40 items-center justify-center">
        <div className="loading-orbit absolute h-full w-full rounded-full border border-dashed border-[#31b8c6]/30" />
        <div className="loading-orbit-reverse absolute h-28 w-28 rounded-full border border-dashed border-cyan-400/25" />
        <div className="loading-core relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#31b8c6] via-cyan-500 to-cyan-300">
          <span className="text-2xl font-bold text-zinc-950">P</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="loading-fade-2 mt-8 text-2xl font-bold tracking-tight text-[#31b8c6] sm:text-3xl">
        Project Perplexity
      </h1>
      <p className="loading-fade-2 mt-2 text-sm text-zinc-400">
        Crafted by <span className="font-medium text-zinc-200">Ankan Nandi</span>
      </p>

      {/* Status + progress bar */}
      <div className="loading-fade-3 mt-8 flex flex-col items-center gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Entering the AI world
        </p>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/5 sm:w-64">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#31b8c6] via-cyan-400 to-cyan-200 transition-[width] duration-[3200ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default Loading