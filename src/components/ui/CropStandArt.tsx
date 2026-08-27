import React from 'react';
import { cropStand, cropVisual } from '@/lib/crops';

interface CropStandArtProps {
  /** Raw backend crop name — matching is handled by the shared crop tables. */
  name: string;
  /** Entrance stagger, so a row of crops rises one after another. */
  delayMs?: number;
  /** 1 = the planning flow's size; use ~0.6 for a legend row. */
  scale?: number;
}

/**
 * A CROP, STANDING.
 *
 * Drawn from the same morphology the 3D twin uses (`cropStand`) and coloured
 * from the same table (`cropVisual`), so a crop looks like itself everywhere in
 * the product: the season strip on the planning page, the legend on the plan
 * sheet, and the field in the twin all agree.
 *
 * Deliberately not an emoji. Emoji is the single strongest "farming game" tell,
 * and it also can't take the palette. This is plant morphology — a visual fact
 * about a known crop — never an agronomic claim.
 *
 * Composed of absolutely-positioned spans rather than SVG so each part can
 * inherit palette tokens directly. The wrapper owns the `.twin-stand` rise
 * animation, so nothing inside it may use the wrapper's transform slot.
 *
 * The root is a `<span class="block">`, not a div, so a crop can stand inside
 * phrasing content — the plan sheet's key rows are `<button>`s.
 */
export function CropStandArt({ name, delayMs = 0, scale = 1 }: CropStandArtProps) {
  const stand = cropStand(name);
  const vis = cropVisual(name);
  const h = (26 + Math.round(stand.height * 46)) * scale;
  const leaf = vis.topLight;
  /** scale a fixed drawing dimension */
  const s = (n: number) => n * scale;

  const blade = (key: string, rot: number, len: number, w = 3) => (
    <span
      key={key}
      className="absolute bottom-0 left-1/2 block origin-bottom"
      style={{
        width: s(w),
        height: len,
        marginLeft: s(-w / 2),
        borderRadius: s(w),
        background: `linear-gradient(180deg, ${leaf}, var(--field-deep))`,
        transform: `rotate(${rot}deg)`,
      }}
    />
  );

  const stem = (len: number, w = 2.4) => (
    <span
      key="stem"
      className="absolute bottom-0 left-1/2 block"
      style={{
        width: s(w),
        height: len,
        marginLeft: s(-w / 2),
        borderRadius: s(w),
        background: 'linear-gradient(180deg, var(--field-bright), var(--field-deep))',
      }}
    />
  );

  const parts: React.ReactNode[] = [];
  switch (stand.form) {
    case 'cereal':
      parts.push(blade('l1', -26, h * 0.5), blade('l2', 24, h * 0.46), stem(h * 0.92));
      parts.push(
        <span
          key="ear"
          className="absolute left-1/2 block"
          style={{
            bottom: h * 0.86,
            width: s(7),
            height: s(15),
            marginLeft: s(-3.5),
            borderRadius: '50% 50% 45% 45%',
            background: stand.head,
          }}
        />
      );
      break;
    case 'cane':
      parts.push(stem(h * 0.9, 3.4));
      parts.push(blade('p1', -34, h * 0.42), blade('p2', 0, h * 0.34), blade('p3', 32, h * 0.4));
      parts.push(
        <span
          key="node"
          className="absolute left-1/2 block"
          style={{
            bottom: h * 0.4,
            width: s(3.4),
            height: h * 0.34,
            marginLeft: s(-1.7),
            background:
              'repeating-linear-gradient(180deg, transparent 0 5px, rgb(var(--sh-color) / 0.22) 5px 6px)',
          }}
        />
      );
      break;
    case 'fibre':
      parts.push(stem(h * 0.86), blade('l1', -38, h * 0.4), blade('l2', 36, h * 0.4));
      [0.5, 0.72, 0.9].forEach((t, i) => {
        parts.push(
          <span
            key={`boll${i}`}
            className="absolute left-1/2 block rounded-full"
            style={{
              bottom: h * t,
              width: s(6),
              height: s(6),
              marginLeft: i % 2 ? 0 : s(-6),
              background: stand.head,
              boxShadow: '0 1px 2px rgb(var(--sh-color) / 0.2)',
            }}
          />
        );
      });
      break;
    case 'tree':
      parts.push(stem(h * 0.55, 3.6));
      parts.push(
        <span
          key="canopy"
          className="absolute left-1/2 block"
          style={{
            bottom: h * 0.44,
            width: s(26),
            height: h * 0.56,
            marginLeft: s(-13),
            borderRadius: '52% 48% 46% 54% / 60% 58% 42% 40%',
            background: `linear-gradient(160deg, ${leaf}, var(--field))`,
          }}
        />,
        <span
          key="fruit"
          className="absolute left-1/2 block rounded-full"
          style={{ bottom: h * 0.5, width: s(5), height: s(5), marginLeft: s(1), background: stand.head }}
        />
      );
      break;
    case 'tuber':
      parts.push(
        blade('l1', -40, h * 0.72),
        blade('l2', -14, h * 0.82),
        blade('l3', 16, h * 0.78),
        blade('l4', 42, h * 0.66)
      );
      parts.push(
        <span
          key="mound"
          className="absolute bottom-0 left-1/2 block"
          style={{
            width: s(24),
            height: s(7),
            marginLeft: s(-12),
            borderRadius: '50% 50% 3px 3px',
            background: 'linear-gradient(180deg, var(--soil-tint), var(--soil))',
            opacity: 0.85,
          }}
        />
      );
      break;
    default: /* bush */
      parts.push(
        blade('l1', -36, h * 0.66),
        blade('l2', -12, h * 0.86),
        blade('l3', 14, h * 0.82),
        blade('l4', 38, h * 0.6)
      );
      parts.push(
        <span
          key="fruit"
          className="absolute left-1/2 block rounded-full"
          style={{
            bottom: h * 0.52,
            width: s(6),
            height: s(6),
            marginLeft: s(-1),
            background: stand.head,
            boxShadow: '0 1px 2px rgb(var(--sh-color) / 0.18)',
          }}
        />
      );
      break;
  }

  return (
    <span
      className="twin-stand relative block"
      style={{ width: s(34), height: h, animationDelay: `${delayMs}ms` }}
      aria-hidden
    >
      {parts}
    </span>
  );
}
