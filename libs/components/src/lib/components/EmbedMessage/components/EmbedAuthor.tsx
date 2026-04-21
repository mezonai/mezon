import { sanitizeHref } from '@mezon/utils';

interface EmbedAuthorProps {
	name: string;
	icon_url?: string;
	url?: string;
}

export function EmbedAuthor({ name, icon_url, url }: EmbedAuthorProps) {
	const safeHref = sanitizeHref(url);
	return (
		<div className="flex items-center gap-2 mt-2 ">
			{icon_url && <img src={icon_url} alt={name} className="w-6 h-6 rounded-full object-cover" />}
			{safeHref ? (
				<a
					href={safeHref}
					className="text-sm font-medium no-underline hover:underline text-theme-message"
					target="_blank"
					rel="noopener noreferrer"
				>
					{name}
				</a>
			) : (
				<span className="text-sm font-medium">{name}</span>
			)}
		</div>
	);
}
