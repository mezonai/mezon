import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { memo, useMemo } from 'react';
import type { ProPalette } from './proPalette';
import { hexToRgba } from './proPalette';

export type ProAvatarFrameProps = {
	isPro: boolean;
	palette: ProPalette;
	glow?: boolean;
	ringWidth?: number;
	className?: string;
	children: ReactNode;
};

const ProAvatarFrameBase = ({ isPro, palette, glow = true, ringWidth = 3, className, children }: ProAvatarFrameProps) => {
	const frameStyle = useMemo<CSSProperties | undefined>(() => {
		if (!isPro) return undefined;
		return {
			padding: `${ringWidth}px`,
			background: `linear-gradient(135deg, ${palette.start}, ${palette.end})`,
			...(glow ? { boxShadow: `0 0 18px ${hexToRgba(palette.accent, 0.55)}` } : {})
		};
	}, [isPro, ringWidth, palette.start, palette.end, palette.accent, glow]);

	if (!isPro) {
		return children as ReactElement;
	}

	return (
		<div className={`inline-flex items-center justify-center rounded-full shrink-0 ${className ?? ''}`} style={frameStyle}>
			{children}
		</div>
	);
};

export const ProAvatarFrame = memo(ProAvatarFrameBase);
