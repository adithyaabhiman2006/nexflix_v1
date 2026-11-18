'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

type Props = {
  title: string;
  children: ReactNode;
  labels: { left: string; right: string };
  id?: string;
};

/** A titled, side-scrolling row of cards. Arrows appear on hover and hide at either end. */
export function Row({ title, children, labels, id }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth > el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    sync();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync]);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: el.clientWidth * 0.86 * dir, behavior: 'smooth' });
  };

  return (
    <section className="row" id={id}>
      <h2 className="row-title">{title}</h2>
      <div className="row-wrap">
        <button type="button" className="row-arrow l" onClick={() => scroll(-1)} aria-label={labels.left} hidden={atStart}>
          <Icon name="left" />
        </button>
        <div className="row-track" ref={track} onScroll={sync}>{children}</div>
        <button type="button" className="row-arrow r" onClick={() => scroll(1)} aria-label={labels.right} hidden={atEnd}>
          <Icon name="right" />
        </button>
      </div>
    </section>
  );
}
