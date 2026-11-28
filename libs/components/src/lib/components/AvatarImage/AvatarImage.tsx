import { MezonIcon, MzIcons20, MzIcons24, MzIcons32 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import type { DetailedHTMLProps, ImgHTMLAttributes, MouseEventHandler } from 'react';
import { useState } from 'react';

export type AvatarImageProp = {
	username?: string;
	alt: string;
	isAnonymous?: boolean;
	useUserPlaceholder?: boolean;
	classNameText?: string;
	srcImgProxy?: string;
	isSending?: boolean;
} & DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;

const AvatarPlaceholder = ({ className = '', onClick }: { className?: string; onClick?: MouseEventHandler<HTMLElement> }) => (
	<div
		className={`flex items-center justify-center rounded-full bg-bgDisable ${onClick ? 'cursor-pointer' : ''} ${className}`}
		onClick={onClick}
		data-e2e={generateE2eId('avatar.image')}
	>
		<MezonIcon icon={MzIcons24.mzUser} className="w-[60%] h-[60%] text-[var(--mz-icon)]" />
	</div>
);

export const AvatarImage = ({
	username,
	src,
	srcImgProxy,
	alt,
	className = '',
	isSending,
	isAnonymous,
	useUserPlaceholder = false,
	classNameText,
	...rest
}: AvatarImageProp) => {
	const [failedProxySrc, setFailedProxySrc] = useState<string>();
	const [failedSrc, setFailedSrc] = useState<string>();
	const isError = !!srcImgProxy && failedProxySrc === srcImgProxy;
	const canRetrySrc = !!src && src !== srcImgProxy && failedSrc !== src;

	const computedClassName = `size-10 rounded-full object-cover min-w-5 min-h-5 cursor-pointer ${className}`;
	const handleError = () => {
		setFailedProxySrc(srcImgProxy);
	};
	const handleSrcError = () => {
		setFailedSrc(src);
	};

	if (isAnonymous && !src)
		return (
			<div
				className={`flex items-center justify-center size-10 ${isSending ? '' : 'bg-white'} rounded-full ${computedClassName}`}
				data-e2e={generateE2eId('base_profile.anonymous.avatar')}
			>
				{isSending ? null : <MezonIcon icon={MzIcons32.mzAnonymous} className="text-black" />}
			</div>
		);

	if (!src && !username && !useUserPlaceholder) {
		return <MezonIcon icon={MzIcons20.mzUserCircle} className={`${className} text-[var(--mz-icon)]`} />;
	}

	if (isError && canRetrySrc) {
		return (
			<img
				loading="lazy"
				onError={handleSrcError}
				className={computedClassName}
				src={src}
				alt={alt}
				{...rest}
				data-e2e={generateE2eId('avatar.image')}
			/>
		);
	}

	if (!src || isError) {
		return (
			<AvatarPlaceholder
				className={`size-10 min-w-5 min-h-5 ${className} ${classNameText ?? ''}`}
				onClick={rest.onClick as MouseEventHandler<HTMLElement> | undefined}
			/>
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
