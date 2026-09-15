import type { ReactNode } from 'react';
import ImageWithSkeleton from '../../components/common/ImageWithSkeleton';

interface ClanStageArtProps {
	src?: string;
	broken: boolean;
	onError: () => void;
	fallback: ReactNode;
}

interface ClanStagePosterProps {
	src: string;
	onError: () => void;
	className?: string;
}

export function ClanStageBackdrop({ src }: { src: string }) {
	return (
		<div className="discover-stage-fill lg:hidden" aria-hidden>
			<img src={src} alt="" className="discover-stage-fill-media" decoding="async" draggable={false} />
		</div>
	);
}

export function ClanStagePoster({ src, onError, className = 'absolute inset-0' }: ClanStagePosterProps) {
	return (
		<div className={className}>
			<div className="discover-stage-bloom lg:hidden" aria-hidden>
				<img src={src} alt="" className="discover-stage-bloom-media" decoding="async" draggable={false} />
			</div>
			<ImageWithSkeleton
				src={src}
				alt=""
				className="discover-art-media w-full h-full object-contain object-center lg:object-cover"
				onError={onError}
				loading="eager"
				fetchPriority="high"
			/>
		</div>
	);
}

export default function ClanStageArt({ src, broken, onError, fallback }: ClanStageArtProps) {
	if (!src || broken) return <>{fallback}</>;

	return (
		<>
			<ClanStageBackdrop src={src} />
			<ClanStagePoster src={src} onError={onError} />
		</>
	);
}
