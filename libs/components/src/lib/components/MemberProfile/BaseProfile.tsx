import { createImgproxyUrl, EUserStatus } from '@mezon/utils';
import { ReactNode } from 'react';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { UserStatusIconClan } from './IconStatus';

const BaseProfile = ({
	avatar,
	name,
	status,
	hideIcon = false,
	userMeta,
	displayName,
	dataE2E
}: {
	avatar: string;
	name?: string;
	displayName?: ReactNode;
	status?: string;
	hideIcon?: boolean;
	userMeta?: { status: string; user_status: EUserStatus };
	dataE2E?: string;
}) => {
	return (
		<div className={`relative h-10 flex gap-3 items-center text-theme-primary`}>
			<AvatarImage
				alt={name || ''}
				username={name}
				className="min-w-8 min-h-8 max-w-8 max-h-8"
				classNameText="font-semibold"
				srcImgProxy={createImgproxyUrl(avatar ?? '')}
				src={avatar}
			/>
			{!hideIcon && (
				<div className="rounded-full left-7 absolute bottom-1 inline-flex items-center justify-center gap-1 p-[3px] text-sm text-theme-primary">
					<UserStatusIconClan status={userMeta?.user_status} online={userMeta?.user_status !== EUserStatus.INVISIBLE} />
				</div>
			)}

			<div className="flex flex-col justify-center ">
				{(displayName || name) && (
					<span className="one-line text-start" data-e2e={dataE2E}>
						{displayName || name}
					</span>
				)}
				{status && <span className="text-[11px] text-left text-theme-primary opacity-60 line-clamp-1 ">{status}</span>}
			</div>
		</div>
	);
};

export default BaseProfile;
