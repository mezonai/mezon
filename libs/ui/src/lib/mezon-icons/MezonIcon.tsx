import type { SVGProps } from 'react';
import { STROKE, type IconData } from './types';

export interface MezonIconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'height' | 'ref' | 'viewBox' | 'width'> {
  icon: IconData;
  title?: string;
}

export function MezonIcon({ icon, className, title, ...rest }: MezonIconProps) {
  const { size } = icon;
  return (
    <svg
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...rest}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE[size]}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`mz-icon mz-anim-${icon.anim} mz-i-${icon.id}${className ? ` ${className}` : ''}`}
    >
      {title ? <title>{title}</title> : null}
      {icon.parts.map(([kind, d, part], i) => (
        <path
          key={i}
          d={d}
          className={part ? `mz-p-${part}` : undefined}
          fill={kind === 'f' ? 'currentColor' : undefined}
          stroke={kind === 'f' ? 'none' : undefined}
        />
      ))}
    </svg>
  );
}
