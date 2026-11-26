import type { AvatarFrameId } from '@mezon/utils';
import { avatarFrameUrl, defaultAvatarFrameForUser } from '@mezon/utils';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { memo, useMemo } from 'react';

export type ProAvatarFrameProps = {
	isPro: boolean;
	userId: string;
	frameId?: AvatarFrameId;
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

const ProAvatarFrameBase = ({ isPro, userId, frameId, animated = false, className, children }: ProAvatarFrameProps) => {
	const shouldAnimate = useMemo(
		() => Boolean(animated && !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)),
		[animated]
	);

	const resolvedFrameId = frameId ?? (userId ? defaultAvatarFrameForUser(userId) : undefined);

	const frameSrc = useMemo(
		() => (!isPro || !resolvedFrameId ? '' : avatarFrameUrl(resolvedFrameId, shouldAnimate)),
		[isPro, resolvedFrameId, shouldAnimate]
	);

	if (!isPro || !resolvedFrameId) {
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
