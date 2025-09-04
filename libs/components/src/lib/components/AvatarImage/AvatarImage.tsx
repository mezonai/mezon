import { generateE2eId } from '@mezon/utils';
import { DetailedHTMLProps, ImgHTMLAttributes, useState } from 'react';

export type AvatarImageProp = {
	username?: string;
	alt: string;
	isAnonymous?: boolean;
	classNameText?: string;
	srcImgProxy?: string;
	dataE2E?: string;
} & DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;

export const AvatarImage = ({ username, src, srcImgProxy, alt, className = '', isAnonymous, classNameText, dataE2E, ...rest }: AvatarImageProp) => {
	const [isError, setIsError] = useState(false);

	const computedClassName = 'size-10 rounded-full object-cover min-w-5 min-h-5 cursor-pointer ' + className;
	const handleError = () => {
		setIsError(true);
	};

	if ((!src && !username) || isAnonymous)
		return (
			<div
				className={`flex items-center justify-center size-10 rounded-full bg-white ${computedClassName}`}
				data-e2e={generateE2eId('user_setting.profile.avatar_image', dataE2E)}
			>
				<svg xmlns="http://www.w3.org/2000/svg" className="w-[80%] h-[80%]" viewBox="0 0 87.52 112.55000000000001" x="0px" y="0px">
					<path
						d="M48.87,39.09c21.15,0,38.3-2.86,38.3-6.39,0-2.36-7.7-4.42-19.11-5.52C67,22.27,65,12.64,63.71,8.28,62,2.61,55.84,5.52,51.15,8S43.91,7,39,6.27c-3.66-.51-5.11,3.38-5.11,3.38L31.33,27C19,28.09,10.57,30.23,10.57,32.7,10.57,36.23,27.72,39.09,48.87,39.09Z"
						transform="translate(-5.79 -1.01)"
					/>
					<path
						d="M72.61,73.16S79.1,65.3,80.18,61.8c1.24-4-15.43-6.42-15.43-6.42s-1.11,8.32-12.39,13a8,8,0,0,1-5.63,0C35.46,63.71,34.12,55.42,34.12,55.42S17.68,57.78,18.92,61.8C20,65.3,26.49,73.16,26.49,73.16c-11.44,0-20.71,8.41-20.71,18.79v3.11H93.31V91.95C93.31,81.57,84,73.16,72.61,73.16Z"
						transform="translate(-5.79 -1.01)"
					/>
					<path
						d="M52.44,42.84a32,32,0,0,1-7.32-.08C40.49,41.13,31.17,41.28,31.17,44c0,3.62,3.69,7.49,8.24,7.49,4.19,0,7.61-2.49,8.14-5.71,0,0,.07,0,.09,0a2.06,2.06,0,0,1,2.55,0c.53,3.21,4,5.7,8.13,5.7,4.55,0,8.24-3.87,8.24-7.49C66.57,41.24,57,41.13,52.44,42.84Z"
						transform="translate(-5.79 -1.01)"
					/>
				</svg>
			</div>
		);

	if (srcImgProxy && src && isError) {
		return (
			<img
				loading="lazy"
				className={computedClassName}
				src={src}
				alt={alt}
				{...rest}
				data-e2e={generateE2eId('user_setting.profile.avatar_image', dataE2E)}
			/>
		);
	}

	if (!src || isError) {
		const avatarChar = username?.charAt(0)?.toUpperCase() || '';

		return (
			<div
				className={`size-10 bg-bgAvatarDark  rounded-full flex justify-center items-center text-bgAvatarLight text-[16px] ${className} ${classNameText}`}
				data-e2e={generateE2eId('user_setting.profile.avatar_image', dataE2E)}
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
			data-e2e={generateE2eId('user_setting.profile.avatar_image', dataE2E)}
		/>
	);
};
