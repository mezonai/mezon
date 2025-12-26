import { channelMembersActions, selectCurrentClanId, useAppDispatch, userClanProfileActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ChannelMembersEntity, EUserStatus, IUserAccount } from '@mezon/utils';
import { ActivitiesType, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import type { ApiUserActivity } from 'mezon-js/api.gen';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { UserStatusIcon } from '../MemberProfile/IconStatus';
type AvatarProfileProps = {
	avatar?: string;
	username?: string;
	userToDisplay: IUserAccount | ChannelMembersEntity | null | boolean | undefined;
	customStatus?: string;
	isAnonymous?: boolean;
	styleAvatar?: string;
	positionType?: string;
	userID?: string;
	isFooterProfile?: boolean;
	activityByUserId?: ApiUserActivity;
	statusOnline?: EUserStatus;
	identifierE2E?: string;
	isMobile?: boolean;
};

const AvatarProfile = ({
	customStatus,
	avatar,
	username,
	isAnonymous,
	styleAvatar,
	userID,
	isFooterProfile,
	activityByUserId,
	statusOnline,
	isMobile
}: AvatarProfileProps) => {
	const currentClanId = useSelector(selectCurrentClanId);

	const dispatch = useAppDispatch();
	const handleCustomStatus = () => {
		dispatch(userClanProfileActions.setShowModalCustomStatus(true));
	};

	const handleClearCustomStatus = () => {
		dispatch(channelMembersActions.updateCustomStatus({ clanId: currentClanId ?? '', customStatus: '', minutes: 0, noClear: true }));
	};

	const activityNames: { [key: number]: string } = {
		[ActivitiesType.VISUAL_STUDIO_CODE]: 'Coding',
		[ActivitiesType.SPOTIFY]: 'Music',
		[ActivitiesType.LOL]: 'Gaming'
	};

	const isUserLeft = !avatar && !username;
	const avatarChar = username?.charAt(0)?.toUpperCase() || '';
	const displayAvatar = isUserLeft ? avatarChar : avatar || '';
	const activityStatus = useMemo(() => {
		return typeof customStatus === 'string'
			? customStatus
			: JSON.stringify(customStatus) || activityNames[activityByUserId?.activity_type as number];
	}, [activityByUserId, customStatus, activityNames]);

	return (
		<div
			className=" text-theme-primary flex flex-1 flex-row gap-[6px] mt-[-50px] px-[16px]"
			data-e2e={generateE2eId('user_setting.profile.user_profile.preview.avatar')}
		>
			<div className="relative h-fit">
				<AvatarImage
					alt={username || ''}
					username={username || ''}
					className={`w-[90px] h-[90px] min-w-[90px] min-h-[90px] xl:w-[90px] xl:h-[90px] rounded-[50px] border-[6px] border-color-avatar object-cover my-0 ${styleAvatar} ${isUserLeft ? 'opacity-60' : ''}`}
					srcImgProxy={displayAvatar ? createImgproxyUrl(displayAvatar, { width: 300, height: 300, resizeType: 'fit' }) : undefined}
					src={displayAvatar || ''}
					isAnonymous={isUserLeft || isAnonymous}
					classNameText="!text-5xl"
				/>

				{userID !== '0' && !isUserLeft && (
					<div className="absolute bottom-1 right-2">
						<UserStatusIcon status={statusOnline} />
					</div>
				)}

				{isUserLeft && (
					<div className="absolute bottom-1 right-2">
						<div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
					</div>
				)}
			</div>

			{(customStatus || (statusOnline && activityByUserId)) && !isUserLeft && (
				<div className="flex flex-col gap-[12px] mt-[30px] relative w-full h-[85px]">
					<div className="bg-theme-surface w-[12px] h-[12px] rounded-full shadow-md"></div>
					<div className="relative flex-1">
						<div className=" w-[20px] h-[20px] rounded-full absolute top-[-11px] left-[16px] shadow-md"></div>
						<div className="absolute w-fit max-w-full shadow-lg rounded-[12px] group">
							<div className="relative bg-theme-surface px-[16px] py-[12px] w-fit max-w-full rounded-[12px] flex items-center justify-center">
								<span
									className="text-left font-medium text-[14px] text-theme-primary w-full break-words overflow-hidden transition-all duration-300 hover:line-clamp-none line-clamp-2"
									data-e2e={generateE2eId('short_profile.activity_status')}
								>
									{activityStatus}
								</span>
								{isFooterProfile && (
									<div className="absolute -top-4 right-1 hidden group-hover:flex gap-[1px] text-theme-primary rounded-full bg-theme-surface border-theme-primary p-[2px] shadow-md">
										<div
											onClick={handleCustomStatus}
											className="pl-2 pr-1 py-1 w-fit bg-item-hover rounded-l-full cursor-pointer"
											data-e2e={generateE2eId('short_profile.activity_status.button.custom')}
										>
											<Icons.EditMessageRightClick defaultSize="w-4 h-4" />
										</div>
										<div
											onClick={handleClearCustomStatus}
											className="pl-1 pr-2 py-1 w-fit bg-item-hover rounded-r-full text-red-600 cursor-pointer"
											data-e2e={generateE2eId('short_profile.activity_status.button.clear')}
										>
											<Icons.DeleteMessageRightClick defaultSize="w-4 h-4" />
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default React.memo(AvatarProfile);
