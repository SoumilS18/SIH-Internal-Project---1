/**
 * READING ROW — eyebrow, hairline, value.
 *
 * The one way this product states a fact about the farm. It is used on the
 * location page, in the planning flow's summary and (in stacked form) by the
 * analysis cinematic, so a farmer sees the same row shape every time the app
 * reads something back to them.
 */
export function ReadingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="t-eyebrow shrink-0 text-[var(--ink-ghost)]">{label}</span>
      <span
        className="h-px min-w-3 flex-1 -translate-y-1"
        style={{ background: 'var(--line)' }}
        aria-hidden
      />
      <span className="shrink-0 text-[13px] font-medium text-[var(--ink)]">{value}</span>
    </div>
  );
}
