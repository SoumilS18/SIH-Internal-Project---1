import { useMemo } from 'react';

interface AtmosphereProps {
  intensity?: 'full' | 'dim';
}

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  top: Math.random() * 100,
  left: Math.random() * 100,
  size: 1 + Math.random() * 2.5,
  delay: Math.random() * 6,
  duration: 4 + Math.random() * 6,
}));

export function Atmosphere({ intensity = 'full' }: AtmosphereProps) {
  const particles = useMemo(() => PARTICLES, []);
  const opacity = intensity === 'full' ? 'opacity-100' : 'opacity-50';

  return (
    <div className={`pointer-events-none fixed inset-0 overflow-hidden ${opacity}`} aria-hidden="true">
      {/* Deep forest base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-950 via-forest-900 to-forest-950" />

      {/* Warm gold radial glow, upper area */}
      <div
        className="absolute left-1/2 top-[18%] h-[55vh] w-[80vw] -translate-x-1/2 rounded-full blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(255,210,26,0.18) 0%, rgba(255,210,26,0.05) 45%, transparent 70%)',
        }}
      />

      {/* Forest green side glow */}
      <div
        className="absolute left-[8%] top-[40%] h-[40vh] w-[40vw] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(10,138,79,0.22) 0%, transparent 70%)' }}
      />
      <div
        className="absolute right-[6%] top-[30%] h-[36vh] w-[36vw] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(5,107,58,0.2) 0%, transparent 70%)' }}
      />

      {/* Hot pink accent, very subtle, lower right */}
      <div
        className="absolute bottom-[10%] right-[14%] h-[24vh] w-[24vw] rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgba(245,0,122,0.12) 0%, transparent 70%)' }}
      />

      {/* Grid texture overlay */}
      <div className="absolute inset-0 grid-texture radial-fade opacity-60" />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-gold-200 animate-twinkle"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              boxShadow: '0 0 6px rgba(255,210,26,0.6)',
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(2,21,16,0.7) 100%)',
        }}
      />
    </div>
  );
}
