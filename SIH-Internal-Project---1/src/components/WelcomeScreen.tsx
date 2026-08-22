import { useMemo, useState } from 'react';
import { IndiaMap } from '@/components/IndiaMap';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { type LanguageCode } from '@/lib/languages';

const GOA_IMAGE = 'https://images.pexels.com/photos/10185531/pexels-photo-10185531.jpeg?auto=compress&cs=tinysrgb&w=1920';
interface WelcomeScreenProps { onEnter: (lang: LanguageCode) => void; }
const STARS = Array.from({ length: 18 }, (_, id) => ({ id, top: 6 + Math.random() * 45, left: Math.random() * 100, size: 1 + Math.random() * 2, delay: Math.random() * 5, duration: 3 + Math.random() * 5 }));
const PARTICLES = Array.from({ length: 12 }, (_, id) => ({ id, top: 20 + Math.random() * 70, left: Math.random() * 100, size: 1.5 + Math.random() * 2, delay: Math.random() * 8, duration: 6 + Math.random() * 8 }));
const LEAF_PATHS = ['M0 0 C 30 -40 70 -50 110 -30 C 80 -20 50 -10 0 0 Z', 'M0 0 C 40 -55 90 -60 130 -35 C 95 -28 55 -15 0 0 Z', 'M0 0 C 25 -35 60 -45 95 -28 C 70 -18 40 -8 0 0 Z', 'M0 0 C 35 -50 85 -55 120 -32 C 88 -24 48 -12 0 0 Z'];

export function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const reduced = usePrefersReducedMotion();
  const stars = useMemo(() => STARS, []);
  const particles = useMemo(() => PARTICLES, []);
  const [hovered, setHovered] = useState<LanguageCode | null>(null);
  const [selected, setSelected] = useState<LanguageCode | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleSelect = (code: LanguageCode) => {
    if (transitioning) return;
    setSelected(code);
    setTransitioning(true);
    window.setTimeout(() => onEnter(code), reduced ? 60 : 820);
  };

  return (
    <section
      className={`absolute inset-0 h-full w-full overflow-hidden transition-[filter,opacity] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${transitioning ? 'brightness-[0.65] opacity-0' : ''}`}
      role="region"
      aria-label="Choose a language for Voice RAG"
    >
      {/* Atmospheric background layers */}
      <div className="absolute inset-0" aria-hidden="true">
        <img src={GOA_IMAGE} alt="Goa nightscape" className="absolute inset-0 h-full w-full object-cover" style={{ transform: 'scale(1.12)' }} loading="eager" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,21,16,0.5)_0%,rgba(4,43,29,0.35)_50%,rgba(2,21,16,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,21,16,0.85)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,21,16,0.35),transparent_45%,rgba(2,21,16,0.4))]" />
        {/* Palm silhouettes */}
        <div className="absolute bottom-0 left-0" style={{ transformOrigin: 'bottom left', animation: reduced ? undefined : 'sway1 8s ease-in-out infinite' }}><PalmLeaf variant={0} /></div>
        <div className="absolute bottom-0 left-[12%]" style={{ transformOrigin: 'bottom left', animation: reduced ? undefined : 'sway2 11s ease-in-out 1.5s infinite' }}><PalmLeaf variant={1} /></div>
        <div className="absolute bottom-0 right-0" style={{ transformOrigin: 'bottom right', animation: reduced ? undefined : 'sway3 14s ease-in-out 0.8s infinite' }}><PalmLeaf variant={2} flip /></div>
      </div>

      {/* Stars and particles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-texture radial-fade opacity-15" />
        {stars.map((star) => <span key={star.id} className="absolute rounded-full bg-cream-100" style={{ top: `${star.top}%`, left: `${star.left}%`, width: star.size, height: star.size, animation: reduced ? undefined : `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`, boxShadow: '0 0 4px rgba(255,249,232,0.6)' }} />)}
        {particles.map((particle) => <span key={particle.id} className="absolute rounded-full bg-gold-200/40" style={{ top: `${particle.top}%`, left: `${particle.left}%`, width: particle.size, height: particle.size, animation: reduced ? undefined : `drift ${particle.duration}s ease-in-out ${particle.delay}s infinite` }} />)}
      </div>

      {/* Main content — map is the hero, occupying ~70% of viewport */}
      <div className="relative z-10 flex h-full flex-col">
        <header className="flex shrink-0 items-start justify-between px-5 pt-4 sm:px-10 sm:pt-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cream-100/90">Voice RAG</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-cream-200/70 sm:inline-block">Hacker House Goa · 2026</span>
        </header>

        <div className="flex shrink-0 flex-col items-center pt-1 text-center">
          <h1 className="font-serif text-base font-medium text-cream-100 sm:text-lg md:text-xl">Choose your language.</h1>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-cream-300/60 sm:text-[10px]">Start where your voice speaks.</p>
        </div>

        {/* Map — the dominant element, flex-1 to fill remaining space (~70% viewport height) */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-1 py-1 sm:px-4 sm:py-1">
          <div className="relative h-full w-full max-w-5xl">
            <IndiaMap hovered={hovered} selected={selected} onHover={setHovered} onSelect={handleSelect} transitioning={transitioning} />
          </div>
        </div>

        <div className="pointer-events-none flex shrink-0 items-center justify-between px-5 pb-3 sm:px-10 sm:pb-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold-300/55">#RAGingoa</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-cream-300/45">Select a region to enter</span>
        </div>
      </div>
    </section>
  );
}

function PalmLeaf({ variant, flip }: { variant: number; flip?: boolean }) {
  const path = LEAF_PATHS[variant % LEAF_PATHS.length];
  const width = 200 + variant * 30;
  const height = 120 + variant * 20;
  return <svg width={width} height={height} viewBox={`0 ${-height} ${width} ${height}`} fill="none" style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true"><path d={path} fill="rgba(2,21,16,0.92)" /></svg>;
}
