import { createImgproxyUrl } from '@mezon/utils';

interface EmbedFooterProps {
	text?: string;
	icon_url?: string;
	timestamp?: string;
}

export function EmbedFooter({ text, icon_url, timestamp }: EmbedFooterProps) {
	return (
		<div className="mt-2 flex items-center gap-2">
			{icon_url && (
				<img
					src={createImgproxyUrl(icon_url, { width: 100, height: 100, resizeType: 'fill-down' })}
					alt="Footer icon"
					className="w-5 h-5 rounded-full object-cover"
				/>
			)}
			<div className="flex gap-2 items-center text-xs ">
				{text && <span>{text}</span>}
				{timestamp && (
					<>
						{text && <span>•</span>}
						<span>{new Date(timestamp).toLocaleDateString()}</span>
					</>
				)}
			</div>
		</div>
	);
}
