import React from 'react';

type AvatarProps = {
	src?: string;
	alt?: string;
	placeholder?: string;
	isUser?: boolean;
};

const Avatar = ({ src, alt, placeholder, isUser }: AvatarProps) => {
	const imageSrc = src || placeholder || './assets/images/anonymous-avatar.jpg';
	const className =
		'w-[90px] h-[90px] xl:w-[100px] xl:h-[100px] rounded-[50px] dark:bg-bgSecondary bg-white border-[6px] border-solid dark:border-bgSecondary600 border-white object-cover';

	if (!isUser && !src) {
		return (
			<div
				className={`${className} flex justify-center items-center text-theme-primary text-[50px] bg-item-theme hover:[background:var(--bg-item-hover)]`}
			>
				{alt?.charAt(0).toUpperCase()}
			</div>
		);
	}

	return <img src={imageSrc} alt={alt} className={className} crossOrigin="anonymous" />;
};

export default React.memo(Avatar);
