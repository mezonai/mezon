import type { HTMLAttributes } from 'react';

type ProfileCoverProps = HTMLAttributes<HTMLDivElement> & {
	banner?: string;
	color?: string;
};

export default function ProfileCover({ banner, color, style, ...props }: ProfileCoverProps) {
	return (
		<div
			{...props}
			style={{
				backgroundColor: color,
				backgroundImage: banner ? `url(${JSON.stringify(banner)})` : undefined,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				...style
			}}
		/>
	);
}
