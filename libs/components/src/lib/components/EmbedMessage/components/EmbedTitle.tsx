interface EmbedTitleProps {
	title: string;
	url?: string;
	onClick?: () => void;
}

export function EmbedTitle({ title, url, onClick }: EmbedTitleProps) {
	return (
		<div className="mt-2 h-fit">
			{url ? (
				<a
					href={url}
					className="font-semibold no-underline text-contentBrandLight hover:underline cursor-pointer"
					target={'_blank'}
					rel="noreferrer"
					onClick={(e) => {
						if (url?.startsWith('www.mezon.ai')) {
							e.preventDefault();
						}
						onClick?.();
					}}
				>
					{title}
				</a>
			) : (
				<span className="font-semibold">{title}</span>
			)}
		</div>
	);
}
