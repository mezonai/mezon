interface EmbedTitleProps {
	title: string;
	url?: string;
	onClick?: () => void;
}

export function EmbedTitle({ title, url, onClick }: EmbedTitleProps) {
	return (
		<div className="mt-2 h-fit ">
			{url ? (
				<a
					href={url}
					className="font-semibold no-underline hover:underline cursor-pointer text-theme-message"
					target={'_blank'}
					rel="noreferrer"
					onClick={(e) => {
						if (url?.startsWith('mezon.ai')) {
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
