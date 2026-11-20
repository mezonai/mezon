import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import { memo, useEffect, useMemo, useState } from 'react';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import type { LiveCommentItem } from './liveCommentSender';

export interface LiveCommentStackLabels {
	hide: string;
}

export interface LiveCommentStackProps {
	comments: LiveCommentItem[];
	onHide: () => void;
	labels: LiveCommentStackLabels;
	className?: string;
}

const LiveCommentBubble = memo(({ comment }: { comment: LiveCommentItem }) => {
	const [entered, setEntered] = useState(false);

	useEffect(() => {
		const frame = requestAnimationFrame(() => setEntered(true));
		return () => cancelAnimationFrame(frame);
	}, []);

	const avatarSrcImgProxy = useMemo(
		() => (comment.avatar ? createImgproxyUrl(comment.avatar, { width: 100, height: 100, resizeType: 'fill-down' }) : undefined),
		[comment.avatar]
	);

	const motionClassName = entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0';

	return (
		<div
			className={`pointer-events-none relative isolate flex max-w-full items-start gap-2 rounded-2xl border-theme-primary px-3 py-2 shadow-lg backdrop-blur-sm transition-all duration-200 ease-out ${motionClassName}`}
		>
			<span aria-hidden="true" className="absolute inset-0 -z-10 rounded-2xl bg-theme-setting-primary opacity-85" />
			<AvatarImage
				alt={comment.name}
				username={comment.name}
				src={comment.avatar}
				srcImgProxy={avatarSrcImgProxy}
				className="!h-[26px] !w-[26px] !min-h-[26px] !min-w-[26px] shrink-0 !cursor-default"
			/>
			<div className="min-w-0 flex-1">
				<div className="truncate text-xs font-semibold leading-tight text-theme-primary">{comment.name}</div>
				<p className="line-clamp-3 break-words text-sm leading-snug text-theme-message">{comment.content}</p>
			</div>
		</div>
	);
});

LiveCommentBubble.displayName = 'LiveCommentBubble';

export const LiveCommentStack = memo(({ comments, onHide, labels, className = 'absolute bottom-4 right-4' }: LiveCommentStackProps) => {
	if (comments.length === 0) return null;

	return (
		<div className={`pointer-events-none z-30 flex w-[320px] max-w-[calc(100%-2rem)] flex-col items-end gap-2 ${className}`}>
			<button
				type="button"
				onClick={onHide}
				title={labels.hide}
				aria-label={labels.hide}
				className="pointer-events-auto flex size-7 items-center justify-center rounded-full border-theme-primary bg-theme-setting-primary text-theme-primary shadow-md transition-colors hover:text-theme-message"
			>
				<MezonIcon icon={MzIcons16.mzEyeOff} />
			</button>
			<div className="flex w-full flex-col items-end gap-2">
				{comments.map((comment) => (
					<LiveCommentBubble key={comment.id} comment={comment} />
				))}
			</div>
		</div>
	);
});

LiveCommentStack.displayName = 'LiveCommentStack';
