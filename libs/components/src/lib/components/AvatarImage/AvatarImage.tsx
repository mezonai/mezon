import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import type { DetailedHTMLProps, ImgHTMLAttributes, MouseEventHandler } from 'react';
import { memo, useState } from 'react';

export type AvatarImageProp = {
	username?: string;
	alt: string;
	isAnonymous?: boolean;
	classNameText?: string;
	srcImgProxy?: string;
} & DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;

export const avatarColors = ['bg-[#ade603]', 'bg-[#00b2cc]', 'bg-[#fda63c]', 'bg-[#e16dcc]', 'bg-[#e8467b]', 'bg-[#9c7cfd]', 'bg-[#22e2b3]'];

export const getAvatarColor = (name?: string) => {
	const avatarChar = name?.trim()?.charAt(0)?.toUpperCase() || '';
	const color = avatarChar ? avatarChar.charCodeAt(0) % avatarColors.length : 0;
	return avatarColors[color];
};

export const AvatarImage = ({ username, src, srcImgProxy, alt, className = '', isAnonymous, classNameText, ...rest }: AvatarImageProp) => {
	const [isError, setIsError] = useState(false);

	const computedClassName = `size-10 rounded-full object-cover min-w-5 min-h-5 cursor-pointer ${className}`;
	const handleError = () => {
		setIsError(true);
	};

	if (isAnonymous && !src)
		return (
			<div
				className={`flex items-center justify-center size-10 rounded-full ${computedClassName}`}
				data-e2e={generateE2eId('base_profile.anonymous.avatar')}
			></div>
		);

	if (!src && !username) {
		return <Icons.AvatarUser className={`w-5 h-5 ${className}`} />;
	}

	if (srcImgProxy && src && isError) {
		return <img loading="lazy" className={computedClassName} src={src} alt={alt} {...rest} data-e2e={generateE2eId('avatar.image')} />;
	}

	if (!src || isError) {
		const avatarChar = username?.trim()?.charAt(0)?.toUpperCase() || '';
		const colorClass = getAvatarColor(username);
		return (
			<div
				className={`size-10 ${colorClass}  rounded-full flex justify-center items-center text-white text-[16px] ${rest.onClick ? 'cursor-pointer' : ''} ${className} ${classNameText}`}
				onClick={rest.onClick as MouseEventHandler<HTMLElement>}
				data-e2e={generateE2eId('avatar.image')}
			>
				{avatarChar}
			</div>
		);
	}

	return (
		<img
			loading="lazy"
			onError={handleError}
			className={computedClassName}
			src={srcImgProxy}
			alt={alt}
			{...rest}
			data-e2e={generateE2eId('avatar.image')}
		/>
	);
};

export const AvatarColor = memo(({ username, className }: { username: string; className?: string }) => {
	const avatarChar = username?.trim()?.charAt(0)?.toUpperCase() || '';
	const colorClass = getAvatarColor(username);
	return (
		<div
			className={`${colorClass} uppercase rounded-full flex justify-center items-center text-white font-semibold ${className}`}
			data-e2e={generateE2eId('avatar.image')}
		>
			{avatarChar}
		</div>
	);
});
