import React from 'react';
import type { BackgroundEffectId } from '../types/portal';

interface BackgroundEffectsProps {
  effect: BackgroundEffectId;
  primaryColor: string;
  secondaryColor: string;
}

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: ((i * 19 + 7) % 94) + 3,
  top: ((i * 23 + 11) % 86) + 5,
  delay: (i * 0.7) % 7,
  duration: 9 + (i % 6) * 2.2,
  size: 10 + (i % 4) * 5,
}));

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({
  effect,
  primaryColor,
  secondaryColor,
}) => {
  if (effect === 'none') return null;

  if (effect === 'polka') {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-45"
        style={{
          backgroundImage: `radial-gradient(${secondaryColor} 2px, transparent 2px)`,
          backgroundSize: '28px 28px',
        }}
      />
    );
  }

  if (effect === 'grid-glow') {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(to right, ${secondaryColor}55 1px, transparent 1px), linear-gradient(to bottom, ${secondaryColor}55 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }}
      />
    );
  }

  if (effect === 'clouds') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {PARTICLES.slice(0, 6).map((p) => (
          <svg
            key={p.id}
            viewBox="0 0 120 50"
            className="animate-kawaii-drift absolute"
            style={{
              top: `${10 + p.id * 14}%`,
              width: `${110 + (p.id % 3) * 45}px`,
              animationDuration: `${26 + p.id * 5}s`,
              animationDelay: `-${p.id * 4}s`,
              color: secondaryColor,
            }}
          >
            <path
              fill="currentColor"
              fillOpacity="0.35"
              d="M25 45h68a17 17 0 0 0 3-33.7A22 22 0 0 0 54 8a18 18 0 0 0-30 12A13 13 0 0 0 25 45z"
            />
          </svg>
        ))}
      </div>
    );
  }

  if (effect === 'stars' || effect === 'sparkles') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {PARTICLES.map((p) => (
          <svg
            key={p.id}
            viewBox="0 0 24 24"
            className="animate-kawaii-twinkle absolute"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${3 + (p.id % 4)}s`,
              animationDelay: `${p.delay * 0.4}s`,
              color: p.id % 2 === 0 ? primaryColor : secondaryColor,
            }}
          >
            {effect === 'stars' ? (
              <path
                fill="currentColor"
                fillOpacity="0.45"
                d="M12 2l2.6 6.2L21 9l-4.8 4.2 1.4 6.5L12 16.4 6.4 19.7l1.4-6.5L3 9l6.4-.8L12 2z"
              />
            ) : (
              <path
                fill="currentColor"
                fillOpacity="0.5"
                d="M12 1c1 6 5 10 11 11-6 1-10 5-11 11-1-6-5-10-11-11 6-1 10-5 11-11z"
              />
            )}
          </svg>
        ))}
      </div>
    );
  }

  const isRising = effect === 'hearts' || effect === 'bubbles';
  const animClass = isRising ? 'animate-kawaii-rise' : 'animate-kawaii-fall';

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {PARTICLES.map((p) => {
        const fill = p.id % 2 === 0 ? primaryColor : secondaryColor;
        return (
          <div
            key={p.id}
            className={`${animClass} absolute`}
            style={{
              left: `${p.left}%`,
              top: isRising ? 0 : '-5%',
              width: `${p.size + 4}px`,
              height: `${p.size + 4}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `-${p.delay * 1.4}s`,
              color: fill,
            }}
          >
            {effect === 'sakura' && (
              <svg viewBox="0 0 24 24" className="h-full w-full">
                <path
                  fill="currentColor"
                  fillOpacity="0.42"
                  d="M12 2C8 6 5 11 8 17c1.6 3.1 4 4.5 4 4.5s2.4-1.4 4-4.5c3-6 0-11-4-15z"
                />
              </svg>
            )}
            {effect === 'hearts' && (
              <svg viewBox="0 0 24 24" className="h-full w-full">
                <path
                  fill="currentColor"
                  fillOpacity="0.38"
                  d="M12 21s-7-4.5-9.3-8.6C.8 9 2.5 5 6.3 5c2.2 0 3.7 1.2 4.7 2.6C12 6.2 13.5 5 15.7 5 19.5 5 21.2 9 19.3 12.4 17 16.5 12 21 12 21z"
                />
              </svg>
            )}
            {effect === 'bubbles' && (
              <div
                className="h-full w-full rounded-full border-2"
                style={{
                  borderColor: `${fill}66`,
                  backgroundColor: `${fill}1A`,
                }}
              />
            )}
            {effect === 'confetti' && (
              <div
                className="h-2.5 w-4 rounded-sm"
                style={{ backgroundColor: `${fill}66` }}
              />
            )}
            {effect === 'snow' && (
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: `${fill}4A` }}
              />
            )}
            {effect === 'butterflies' && (
              <svg viewBox="0 0 24 24" className="h-full w-full">
                <path
                  fill="currentColor"
                  fillOpacity="0.42"
                  d="M12 12C9 6 3 5 3 10c0 3 4 4 6 4-2 1-4 4-1 6 3 1 4-3 4-5 0 2 1 6 4 5 3-2 1-5-1-6 2 0 6-1 6-4 0-5-6-4-9 2z"
                />
              </svg>
            )}
            {effect === 'ribbons' && (
              <svg viewBox="0 0 24 24" className="h-full w-full">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.45"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  d="M4 6c5 0 5 12 10 12s5-12 6-12"
                />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};
