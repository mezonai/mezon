import type { EUserStatus } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import type { ReactNode } from 'react';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { UserStatusIconClan } from './IconStatus';

const BaseProfile = ({
	avatar,
	name,
	hideIcon = false,
	status,
	displayName,
	userStatus
}: {
	avatar: string;
	name?: string;
	displayName?: ReactNode;
	status?: EUserStatus;
	hideIcon?: boolean;
	userStatus?: string;
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
				<div className="rounded-full left-5 absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm text-theme-primary">
					<UserStatusIconClan status={status} />
				</div>
			)}

			<div className="flex flex-col justify-center min-w-0 flex-1">
				{(displayName || name) && (
					<span className="one-line text-start truncate" data-e2e={generateE2eId('base_profile.display_name')}>
						{displayName || name}
					</span>
				)}
				{userStatus && <span className="text-[11px] text-left text-theme-primary opacity-60 line-clamp-1 truncate">{userStatus}</span>}
			</div>
		</div>
	);
};

export default BaseProfile;
