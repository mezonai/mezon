import { channelMembersActions, selectCurrentClanId, useAppDispatch, userClanProfileActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ActivitiesType, ChannelMembersEntity, EUserStatus, IUserAccount, MemberProfileType, createImgproxyUrl } from '@mezon/utils';
import { ApiUserActivity } from 'mezon-js/api.gen';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import StatusUser from '../StatusUser';

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
	userStatus?: { status?: boolean; isMobile?: boolean };
	statusOnline?: EUserStatus;
};

const AvatarProfile = ({
	customStatus,
	avatar,
	username,
	isAnonymous,
	styleAvatar,
	userID,
	positionType,
	isFooterProfile,
	activityByUserId,
	userStatus,
	statusOnline
}: AvatarProfileProps) => {
	const isMemberDMGroup = useMemo(() => positionType === MemberProfileType.DM_MEMBER_GROUP, [positionType]);

	const isMemberChannel = useMemo(() => positionType === MemberProfileType.MEMBER_LIST, [positionType]);

	const currentClanId = useSelector(selectCurrentClanId);

	const isListDm = useMemo(() => positionType === MemberProfileType.DM_LIST, [positionType]);
	const dispatch = useAppDispatch();
	const handleCustomStatus = () => {
		dispatch(userClanProfileActions.setShowModalCustomStatus(true));
	};

	const handleClearCustomStatus = () => {
		dispatch(channelMembersActions.updateCustomStatus({ clanId: currentClanId ?? '', customStatus: '' }));
	};

	const activityNames: { [key: number]: string } = {
		[ActivitiesType.VISUAL_STUDIO_CODE]: 'Coding',
		[ActivitiesType.SPOTIFY]: 'Music',
		[ActivitiesType.LOL]: 'Gaming'
	};

	const activityStatus = customStatus || activityNames[activityByUserId?.activity_type as number];

	return (
		<div className=" text-black flex flex-1 flex-row gap-[6px] mt-[-50px] px-[16px]">
			<div className="relative h-fit">
				<AvatarImage
					alt={username || ''}
					userName={username}
					className={`w-[90px] h-[90px] min-w-[90px] min-h-[90px] xl:w-[90px] xl:h-[90px] rounded-[50px] border-[6px] border-solid dark:border-bgSecondary600 border-white object-cover my-0 ${styleAvatar}`}
					srcImgProxy={createImgproxyUrl(avatar ?? '', { width: 300, height: 300, resizeType: 'fit' })}
					src={avatar}
					isAnonymous={isAnonymous}
					classNameText="!text-5xl"
				/>
				<div className="absolute bottom-[0.4rem] right-[0.5rem]">
					<StatusUser
						isListDm={isListDm}
						isMemberChannel={isMemberChannel}
						isMemberDMGroup={isMemberDMGroup}
						status={userStatus}
						userId={userID}
						isTyping={false}
						sizeStatusIcon={'w-4 h-4'}
						customStatus={statusOnline}
					/>
				</div>
			</div>

			{(customStatus || (userStatus?.status && activityByUserId)) && (
				<div className="flex flex-col gap-[12px] mt-[30px] relative w-full h-[85px]">
					<div className="dark:bg-bgPrimary bg-white w-[12px] h-[12px] rounded-full shadow-md"></div>
					<div className="relative flex-1">
						<div className="dark:bg-bgPrimary bg-white w-[20px] h-[20px] rounded-full absolute top-[-11px] left-[16px] shadow-md"></div>
						<div className="absolute w-fit max-w-full shadow-lg rounded-[12px] group">
							<div className="relative dark:bg-bgPrimary bg-white px-[16px] py-[12px] w-fit max-w-full rounded-[12px] flex items-center justify-center">
								<span className="text-left font-medium text-[14px] dark:text-white text-black w-full break-words overflow-hidden transition-all duration-300 hover:line-clamp-none line-clamp-2">
									{activityStatus}
								</span>
								{isFooterProfile && (
									<div className="absolute -top-4 right-1 hidden group-hover:flex gap-[1px] dark:text-[#d1d4d6] text-[#303236] rounded-full bg-white dark:bg-bgPrimary border dark:border-[#1e1e1e] p-[2px] shadow-md">
										<div
											onClick={handleCustomStatus}
											className="pl-2 pr-1 py-1 w-fit hover:bg-bgLightModeButton dark:hover:bg-[#25272a] rounded-l-full cursor-pointer"
										>
											<Icons.EditMessageRightClick defaultSize="w-4 h-4" />
										</div>
										<div
											onClick={handleClearCustomStatus}
											className="pl-1 pr-2 py-1 w-fit hover:bg-bgLightModeButton dark:hover:bg-[#25272a] rounded-r-full text-red-600 cursor-pointer"
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
