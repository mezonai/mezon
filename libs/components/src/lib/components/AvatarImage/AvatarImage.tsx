import { DetailedHTMLProps, ImgHTMLAttributes, useState } from 'react';
import { twMerge } from 'tailwind-merge';

export type AvatarImageProp = {
	username?: string;
	alt: string;
	isAnonymous?: boolean;
	classNameText?: string;
	srcImgProxy?: string;
} & DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;

export const AvatarImage = ({ username, src, srcImgProxy, alt, className = '', isAnonymous, classNameText, ...rest }: AvatarImageProp) => {
	const [isError, setIsError] = useState(false);

	const computedClassName = twMerge('size-10 rounded-full object-cover min-w-5 min-h-5 cursor-pointer ' + className);
	const handleError = () => {
		setIsError(true);
	};

	if ((!src && !username) || isAnonymous)
		return <img className={computedClassName} src="./assets/images/anonymous-avatar.webp" alt={'anonymous-avatar'} {...rest} />;

	if (srcImgProxy && src && isError) {
		return <img loading="lazy" className={computedClassName} src={src} alt={alt} {...rest} />;
	}

	if (!src || isError) {
		const avatarChar = username?.charAt(0)?.toUpperCase() || '';

		return (
			<div
				className={`size-10 dark:bg-bgAvatarDark bg-bgAvatarLight rounded-full flex justify-center items-center dark:text-bgAvatarLight text-bgAvatarDark text-[16px] ${className} ${classNameText}`}
			>
				{avatarChar}
			</div>
		);
	}

	return <img loading="lazy" onError={handleError} className={computedClassName} src={srcImgProxy} alt={alt} {...rest} />;
};
