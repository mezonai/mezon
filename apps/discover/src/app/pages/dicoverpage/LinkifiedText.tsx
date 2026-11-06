import { getPublicAboutImageSrc } from './aboutImage';
import { splitLinkifiedText, type TextSegment } from './communityUtils';

interface LinkifiedTextProps {
	text: string;
	linkClassName?: string;
}

type ImageSegment = {
	type: 'image';
	src: string;
	alt: string;
};

const IMAGE_TAGS = /(<img\b(?:[^>"']|"[^"]*"|'[^']*')*>)/gi;

function getImageSegment(text: string): ImageSegment | null {
	if (!/^<img\b/i.test(text)) return null;
	// Template content stays inert until the image source has been validated.
	const template = document.createElement('template');
	template.innerHTML = text;
	const image = template.content.querySelector('img');
	const src = getPublicAboutImageSrc(image?.getAttribute('src') || '');
	if (!image || !src) return null;
	return {
		type: 'image',
		src,
		alt: image.getAttribute('alt') || ''
	};
}

export default function LinkifiedText({ text, linkClassName }: LinkifiedTextProps) {
	const segments = text.split(IMAGE_TAGS).flatMap<TextSegment | ImageSegment>((part) => {
		const image = getImageSegment(part);
		return image ? [image] : splitLinkifiedText(part);
	});
	const linkClass =
		linkClassName ||
		'text-[#5865f2] underline underline-offset-4 decoration-[#5865f2]/40 break-all hover:text-[#404eed] hover:decoration-[#404eed]';

	return (
		<>
			{segments.map((segment, index) => {
				if (segment.type === 'image') {
					return (
						<img
							key={`image-${index}`}
							src={segment.src}
							alt={segment.alt}
							loading="lazy"
							decoding="async"
							className="my-6 block h-auto max-h-[320px] w-auto max-w-full rounded-2xl object-contain"
						/>
					);
				}
				return segment.type === 'link' ? (
					<a
						key={`${segment.href}-${index}`}
						href={segment.href}
						target="_blank"
						rel="noopener noreferrer"
						className={linkClass}
						onClick={(event) => event.stopPropagation()}
					>
						{segment.value}
					</a>
				) : (
					<span key={`text-${index}`}>{segment.value}</span>
				);
			})}
		</>
	);
}
