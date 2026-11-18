import Image from 'next/image';
import Link from 'next/link';

export type CardArt = { src: string; shape: 'tall' | 'wide'; position?: string } | null;

type Props = {
  href: string;
  title: string;
  art: CardArt;
  /** Small label in the top-left corner, such as "New" or a release date. */
  tag?: string;
  tagStyle?: 'soon';
  /** Watched share (0 to 1) and the line under it, such as "S1:E3 · 14 min left". */
  progress?: { share: number; label: string };
  priority?: boolean;
};

/**
 * The demo's title card. Posters already carry the name, so artwork gets no text overlay;
 * a title without artwork shows its name on the brand gradient instead.
 */
export function Card({ href, title, art, tag, tagStyle, progress, priority = false }: Props) {
  const tagText = tag ?? (art ? progress?.label : undefined);
  return (
    <Link className={`card ${progress ? 'has-progress' : ''}`} href={href} aria-label={title}>
      {art ? (
        <Image
          className={`art art-${art.shape}`}
          src={art.src}
          alt=""
          fill
          sizes={art.shape === 'tall' ? '(max-width: 760px) 40vw, 240px' : '(max-width: 760px) 58vw, 340px'}
          style={art.position ? { objectPosition: art.position } : undefined}
          priority={priority}
        />
      ) : (
        <div className="art art-blank" aria-hidden="true" />
      )}
      {!art && <span className="card-shade" />}
      {tagText && <span className={`card-tag ${tagStyle ?? ''}`}>{tagText}</span>}
      {!art && (
        <span className="card-text">
          <span className="art-title font-display" style={{ display: 'block' }}>{title}</span>
          {progress && <span className="card-sub">{progress.label}</span>}
        </span>
      )}
      {progress && (
        <span className="progress"><i style={{ width: `${Math.min(100, progress.share * 100)}%` }} /></span>
      )}
    </Link>
  );
}
