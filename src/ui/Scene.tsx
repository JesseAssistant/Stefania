import type { CSSProperties, ReactNode } from 'react';

/** Небо + земля: универсальная «сцена» для персонажей. */
export function Stage({ sky1 = '#BFE9FF', sky2 = '#FFF3C4', ground = '#8ED081', children, height = 240, className = '', style }: { sky1?: string; sky2?: string; ground?: string; children?: ReactNode; height?: number | string; className?: string; style?: CSSProperties }) {
  return (
    <div className={`stage ${className}`} style={{ ['--sky1' as string]: sky1, ['--sky2' as string]: sky2, ['--ground' as string]: ground, height, ...style } as CSSProperties}>
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, top: 18, width: '100%', height: 70, opacity: .9 }} aria-hidden="true">
        <g fill="#fff" opacity=".85"><ellipse cx="70" cy="40" rx="42" ry="14" /><ellipse cx="100" cy="30" rx="30" ry="14" /><ellipse cx="300" cy="62" rx="48" ry="15" /><ellipse cx="330" cy="50" rx="30" ry="13" /></g>
      </svg>
      <div className="ground" />
      {children}
    </div>
  );
}

/** Фоны для фотографий и сцен. */
export const PHOTO_BGS: Record<string, { name: string; sky1: string; sky2: string; ground: string }> = {
  sunny: { name: 'Солнечный день', sky1: '#8FD3FF', sky2: '#FFF3C4', ground: '#8ED081' },
  night: { name: 'Звёздная ночь', sky1: '#2B2D6E', sky2: '#6B5BD6', ground: '#3C4A8A' },
  beach: { name: 'Пляж', sky1: '#7FE3F0', sky2: '#FFF1B8', ground: '#F2D388' },
  party: { name: 'Вечеринка', sky1: '#FF9EC4', sky2: '#FFE066', ground: '#C9A8FF' },
  lab: { name: 'Лаборатория', sky1: '#BFD9FF', sky2: '#E8F4FF', ground: '#9AA5B1' },
};
