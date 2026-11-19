import { createImgproxyUrl } from '@mezon/utils';
import type { HTMLAttributes } from 'react';

type ProfileCoverProps = HTMLAttributes<HTMLDivElement> & {
	banner?: string;
	color?: string;
	imageWidth?: number;
};

export default function ProfileCover({ banner, color, imageWidth = 400, style, ...props }: ProfileCoverProps) {
	const imageUrl = banner?.startsWith('blob:') ? banner : createImgproxyUrl(banner ?? '', { width: imageWidth, height: 0, resizeType: 'fit' });

	return (
		<div
			{...props}
			style={{
				backgroundColor: color,
				backgroundImage: imageUrl ? `url(${JSON.stringify(imageUrl)})` : undefined,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				...style
			}}
		/>
	);
}
