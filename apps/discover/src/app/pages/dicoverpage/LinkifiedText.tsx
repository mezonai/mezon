import AboutQrCard from './AboutQrCard';
import { splitLinkifiedText, type TextSegment } from './communityUtils';

interface LinkifiedTextProps {
	text: string;
	linkClassName?: string;
}

function getQrUrl(text: string): string | null {
	const value = text.match(/^<qr>([\s\S]*?)<\/qr>$/i)?.[1].trim();
	if (!value || !/^https?:\/\/\S+$/i.test(value)) return null;
	try {
		new URL(value);
		return value;
	} catch {
		return null;
	}
}

export default function LinkifiedText({ text, linkClassName }: LinkifiedTextProps) {
	const segments = text.split(/(<qr>[\s\S]*?<\/qr>)/gi).flatMap<TextSegment | { type: 'qr'; value: string }>((part) => {
		const qrUrl = getQrUrl(part);
		return qrUrl ? [{ type: 'qr', value: qrUrl }] : splitLinkifiedText(part);
	});
	const linkClass =
		linkClassName ||
		'text-[#5865f2] underline underline-offset-4 decoration-[#5865f2]/40 break-all hover:text-[#404eed] hover:decoration-[#404eed]';

	return (
		<>
			{segments.map((segment, index) => {
				if (segment.type === 'qr') {
					return <AboutQrCard key={`qr-${index}`} value={segment.value} />;
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
