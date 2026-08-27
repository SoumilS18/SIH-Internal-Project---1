import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Reduced motion                                                      */
/* ------------------------------------------------------------------ */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/* Coarse pointer (touch) detection — used to gate cursor effects      */
/* ------------------------------------------------------------------ */
export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const update = () => setTouch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return touch;
}

/* ------------------------------------------------------------------ */
/* requestAnimationFrame loop with delta time                          */
/* ------------------------------------------------------------------ */
export function useRafLoop(callback: (dt: number, t: number) => void, active = true) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      cbRef.current(dt, now / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/* ------------------------------------------------------------------ */
/* IntersectionObserver — element in view                              */
/* ------------------------------------------------------------------ */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit & { once?: boolean }
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const once = options?.once ?? true;
  const threshold = options?.threshold ?? 0.02;
  const rootMargin = options?.rootMargin ?? '0px 0px 80px 0px';

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) obs.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { threshold, rootMargin }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [once, threshold, rootMargin]);

  return [ref, inView];
}

/* ------------------------------------------------------------------ */
/* Count-up — animates a number toward target with easeOutExpo         */
/* ------------------------------------------------------------------ */
export function useCountUp(
  target: number,
  opts?: { durationMs?: number; play?: boolean; decimals?: number; from?: number }
): number {
  const { durationMs = 1400, play = true, decimals = 0, from = 0 } = opts || {};
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState<number>(play ? from : target);
  const rafRef = useRef<number>(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!play) return;
    if (reduced) {
      setValue(target);
      return;
    }
    startedRef.current = true;
    const start = performance.now();
    const startVal = from;
    const delta = target - startVal;
    const round = (v: number) => {
      const p = Math.pow(10, decimals);
      return Math.round(v * p) / p;
    };
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(2, -10 * p);
      setValue(round(startVal + delta * (p >= 1 ? 1 : eased)));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // re-run when target/play changes
  }, [target, play, durationMs, decimals, from, reduced]);

  return value;
}

/* ------------------------------------------------------------------ */
/* Mouse parallax — subtle tilt/translate of an element on desktop     */
/* Returns a ref to attach and a live transform string via callback.   */
/* ------------------------------------------------------------------ */
export function useMouseParallax<T extends HTMLElement = HTMLDivElement>(
  strength = 12,
  rotate = 6
) {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();
  const touch = useIsTouch();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced || touch) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: MouseEvent) => {
      const r = node.getBoundingClientRect();
      const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      tx = Math.max(-1, Math.min(1, px));
      ty = Math.max(-1, Math.min(1, py));
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    const render = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      node.style.transform =
        `perspective(1000px) rotateX(${(-cy * rotate).toFixed(2)}deg) ` +
        `rotateY(${(cx * rotate).toFixed(2)}deg) ` +
        `translate3d(${(cx * strength).toFixed(2)}px, ${(cy * strength).toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(render);
    };
    const parent = node.parentElement || node;
    parent.addEventListener('mousemove', onMove);
    parent.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(render);
    return () => {
      parent.removeEventListener('mousemove', onMove);
      parent.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
      node.style.transform = '';
    };
  }, [strength, rotate, reduced, touch]);

  return ref;
}

/* ------------------------------------------------------------------ */
/* Pointer position (normalized -1..1) within a container — for scenes */
/* ------------------------------------------------------------------ */
export function usePointerField<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const value = useRef({ x: 0, y: 0 });
  const reduced = usePrefersReducedMotion();
  const touch = useIsTouch();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced || touch) return;
    const onMove = (e: MouseEvent) => {
      const r = node.getBoundingClientRect();
      value.current = {
        x: Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))),
        y: Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2))),
      };
    };
    const onLeave = () => {
      value.current = { x: 0, y: 0 };
    };
    node.addEventListener('mousemove', onMove);
    node.addEventListener('mouseleave', onLeave);
    return () => {
      node.removeEventListener('mousemove', onMove);
      node.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced, touch]);

  return { ref, value };
}

/* ------------------------------------------------------------------ */
/* Magnetic element — springs toward the cursor when hovered           */
/* ------------------------------------------------------------------ */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(strength = 0.32) {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();
  const touch = useIsTouch();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced || touch) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let hovering = false;

    const onMove = (e: MouseEvent) => {
      const r = node.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * strength;
      ty = (e.clientY - (r.top + r.height / 2)) * strength;
    };
    const onEnter = () => {
      hovering = true;
    };
    const onLeave = () => {
      hovering = false;
      tx = 0;
      ty = 0;
    };
    const render = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      node.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(render);
    };
    node.addEventListener('mousemove', onMove);
    node.addEventListener('mouseenter', onEnter);
    node.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(render);
    return () => {
      node.removeEventListener('mousemove', onMove);
      node.removeEventListener('mouseenter', onEnter);
      node.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
      node.style.transform = '';
      void hovering;
    };
  }, [strength, reduced, touch]);

  return ref;
}

/* ------------------------------------------------------------------ */
/* Scroll progress of an element through the viewport (0..1)           */
/* ------------------------------------------------------------------ */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(): [
  React.RefObject<T>,
  number
] {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = node.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // 0 when element top hits bottom of viewport, 1 when its bottom passes top
        const p = 1 - (r.top + r.height) / (vh + r.height);
        setProgress(Math.max(0, Math.min(1, p)));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return [ref, progress];
}

/* ------------------------------------------------------------------ */
/* Window scrollY (throttled via rAF)                                  */
/* ------------------------------------------------------------------ */
export function useScrollY(): number {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return y;
}

/* ------------------------------------------------------------------ */
/* Staggered mount flag — flips true shortly after mount for entrances */
/* ------------------------------------------------------------------ */
export function useMounted(delayMs = 40): boolean {
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => {
    const id = window.setTimeout(() => setMounted(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);
  return mounted;
}

/* ------------------------------------------------------------------ */
/* Interval that respects unmount + latest callback                    */
/* ------------------------------------------------------------------ */
export function useInterval(callback: () => void, delayMs: number | null) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  useEffect(() => {
    if (delayMs === null) return;
    const id = window.setInterval(() => cbRef.current(), delayMs);
    return () => window.clearInterval(id);
  }, [delayMs]);
}

/* Convenience: a callback ref that measures element size on resize */
export function useElementSize<T extends HTMLElement = HTMLDivElement>(): [
  React.RefObject<T>,
  { width: number; height: number }
] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setSize({ width: e.contentRect.width, height: e.contentRect.height });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

/* Small helper hook to run a one-shot callback (kept for future use) */
export function useOnce(fn: () => void) {
  const done = useRef(false);
  const stable = useCallback(fn, [fn]);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    stable();
  }, [stable]);
}
