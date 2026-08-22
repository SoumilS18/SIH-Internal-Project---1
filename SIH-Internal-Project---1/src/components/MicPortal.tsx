import { Mic } from 'lucide-react';

interface MicPortalProps {
  size?: 'hero' | 'main';
  active?: boolean;
  phase?: 'idle' | 'listening' | 'processing';
  onClick?: () => void;
  disabled?: boolean;
}

export function MicPortal({
  size = 'hero',
  active = false,
  phase = 'idle',
  onClick,
  disabled = false,
}: MicPortalProps) {
  const dim = size === 'hero' ? 'h-64 w-64 sm:h-72 sm:w-72' : 'h-40 w-40 sm:h-48 sm:w-48';
  const iconSize = size === 'hero' ? 88 : 56;
  const ringScale = size === 'hero' ? 'scale-100' : 'scale-75';

  return (
    <div
      className={`relative ${dim} flex items-center justify-center select-none`}
      aria-hidden="true"
    >
      {/* Outer orbital ring */}
      <div
        className={`absolute inset-0 rounded-full border border-gold-300/20 ${ringScale} animate-spin-slow`}
        style={{ borderStyle: 'dashed' }}
      />
      {/* Inner orbital ring (reverse) */}
      <div
        className={`absolute inset-6 rounded-full border border-pink-500/15 ${ringScale} animate-spin-reverse`}
        style={{ borderStyle: 'dotted' }}
      />

      {/* Pulse rings when listening */}
      {active && phase === 'listening' && (
        <>
          <span className="absolute inset-0 rounded-full border border-gold-300/40 animate-pulse-ring" />
          <span
            className="absolute inset-0 rounded-full border border-gold-300/30 animate-pulse-ring"
            style={{ animationDelay: '0.8s' }}
          />
        </>
      )}

      {/* Soft glow */}
      <div
        className="absolute inset-8 rounded-full blur-2xl animate-breathe"
        style={{
          background:
            'radial-gradient(circle, rgba(255,210,26,0.35) 0%, rgba(255,210,26,0.08) 50%, transparent 70%)',
        }}
      />

      {/* Dotted texture disc */}
      <div className="absolute inset-10 rounded-full dot-texture radial-fade opacity-40" />

      {/* Microphone button */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={active ? 'Listening, tap to stop' : 'Tap to speak'}
        className="group relative z-10 flex h-32 w-32 items-center justify-center rounded-full border border-gold-300/40 bg-forest-900/80 backdrop-blur-sm transition-all duration-300 hover:border-gold-300/70 hover:shadow-[0_0_40px_rgba(255,210,26,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-forest-950 disabled:cursor-not-allowed disabled:opacity-60 sm:h-36 sm:w-36"
      >
        <span
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-gold-300/15 to-transparent transition-opacity duration-300 ${
            active ? 'opacity-100' : 'opacity-50 group-hover:opacity-80'
          }`}
        />
        <Mic
          size={iconSize}
          className={`relative transition-colors duration-300 ${
            active ? 'text-pink-400' : 'text-gold-200 group-hover:text-gold-100'
          }`}
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
}
