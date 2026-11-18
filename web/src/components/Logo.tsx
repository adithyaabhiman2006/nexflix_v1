import { BRAND } from '@/config/brand';

/** Placeholder mark and wordmark from the UI canvas. Swap this one component when the brand is decided. */
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span className={`logo logo-${size}`}>
      <span className="logo-mark" aria-hidden="true" />
      <span className="logo-word">{BRAND.wordmark}</span>
    </span>
  );
}
