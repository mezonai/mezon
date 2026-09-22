import { splitLinkifiedText } from './communityUtils';

interface LinkifiedTextProps {
	text: string;
	linkClassName?: string;
}

export default function LinkifiedText({ text, linkClassName }: LinkifiedTextProps) {
	const segments = splitLinkifiedText(text);
	const linkClass =
		linkClassName ||
		'text-[#5865f2] underline underline-offset-4 decoration-[#5865f2]/40 break-all hover:text-[#404eed] hover:decoration-[#404eed]';

	return (
		<>
			{segments.map((segment, index) =>
				segment.type === 'link' ? (
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
				)
			)}
		</>
	);
}
