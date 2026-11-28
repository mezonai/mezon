import { avatarFrameUrl, defaultAvatarFrameForUser } from '@mezon/utils';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { memo, useMemo } from 'react';

export type ProAvatarFrameProps = {
	isPro: boolean;
	userId: string;
	animated?: boolean;
	className?: string;
	children: ReactNode;
};

const FRAME_OVERLAY_STYLE: CSSProperties = {
	width: '125%',
	height: '125%',
	left: '-12.5%',
	top: '-12.5%'
};

const ProAvatarFrameBase = ({ isPro, userId, animated = false, className, children }: ProAvatarFrameProps) => {
	const shouldAnimate = useMemo(
		() => Boolean(animated && !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)),
		[animated]
	);

	const frameSrc = useMemo(
		() => (!isPro || !userId ? '' : avatarFrameUrl(defaultAvatarFrameForUser(userId), shouldAnimate)),
		[isPro, userId, shouldAnimate]
	);

	if (!isPro || !userId) {
		return children as ReactElement;
	}

	return (
		<div className={className ? `relative shrink-0 w-fit ${className}` : 'relative shrink-0 w-fit'}>
			{children}
			<img
				src={frameSrc}
				alt=""
				aria-hidden
				draggable={false}
				loading="lazy"
				decoding="async"
				className="absolute pointer-events-none select-none max-w-none"
				style={FRAME_OVERLAY_STYLE}
			/>
		</div>
	);
};

export const ProAvatarFrame = memo(ProAvatarFrameBase);
