import { sanitizeHref } from '@mezon/utils';

interface EmbedTitleProps {
	title: string;
	url?: string;
	onClick?: () => void;
}

export function EmbedTitle({ title, url, onClick }: EmbedTitleProps) {
	const safeHref = sanitizeHref(url);
	return (
		<div className="mt-2 h-fit ">
			{safeHref ? (
				<a
					href={safeHref}
					className="font-semibold no-underline hover:underline cursor-pointer text-theme-message"
					target="_blank"
					rel="noopener noreferrer"
					onClick={(e) => {
						if (safeHref.startsWith('mezon.ai') || safeHref.includes('://mezon.ai')) {
							e.preventDefault();
						}
						onClick?.();
					}}
				>
					{title}
				</a>
			) : (
				<span className="font-semibold text-theme-message ">{title}</span>
			)}
		</div>
	);
}
