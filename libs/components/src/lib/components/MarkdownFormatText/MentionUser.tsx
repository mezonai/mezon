/* eslint-disable @nx/enforce-module-boundaries */
import {
	selectChannelMemberByUserIds,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectDmGroupCurrentId,
	selectMemberByUsername,
	useAppSelector
} from '@mezon/store';
import { HEIGHT_PANEL_PROFILE, HEIGHT_PANEL_PROFILE_DM, getNameForPrioritize } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { RefObject, memo, useCallback, useMemo, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import ModalUserProfile from '../ModalUserProfile';

type ChannelHashtagProps = {
	tagUserName?: string;
	tagUserId?: string;
	mode?: number;
	isJumMessageEnabled: boolean;
	isTokenClickAble: boolean;
	tagRoleName?: string;
	tagRoleId?: string;
	mention?: string;
};

enum MentionType {
	HERE = 'HERE',
	ROLE_EXIST = 'ROLE_EXIST',
	USER_EXIST = 'USER_EXIST'
}

type UserProfilePopupProps = {
	userID: string;
	channelId?: string;
	mode?: number;
	positionShortUser: { top: number; left: number } | null;
	isDm?: boolean;
	rootRef?: RefObject<HTMLElement>;
	onClose: () => void;
	username?: string;
};

const MentionUser = ({
	mention,
	tagUserName,
	mode,
	isJumMessageEnabled,
	isTokenClickAble,
	tagUserId,
	tagRoleName,
	tagRoleId
}: ChannelHashtagProps) => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const displayToken = useMemo(() => {
		if (tagRoleId) {
			return {
				display: tagRoleName,
				type: MentionType.ROLE_EXIST
			};
		}

		if (tagUserName === '@here') {
			return {
				display: '@here',
				type: MentionType.HERE
			};
		}

		if (tagUserId && tagUserName !== '@here') {
			return {
				display: tagUserName,
				type: MentionType.USER_EXIST
			};
		}
		if (mention) {
			return {
				display: `@${mention}`,
				type: MentionType.USER_EXIST
			};
		}
	}, [tagUserName, tagRoleName, tagUserId, tagRoleId, mention]);

	const checkAnonymous = tagUserId === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID;
	const currentDirectId = useSelector(selectDmGroupCurrentId);
	const isDM = Boolean(mode && [ChannelStreamMode.STREAM_MODE_DM, ChannelStreamMode.STREAM_MODE_GROUP].includes(mode));
	const channelId = isDM ? currentDirectId : currentChannelId;

	const [showProfileUser, setIsShowPanelChannel] = useState(false);

	const [positionShortUser, setPositionShortUser] = useState<{ top: number; left: number } | null>(null);

	const [openProfileItem, closeProfileItem] = useModal(() => {
		return (
			<UserProfilePopup
				userID={tagUserId ?? ''}
				channelId={channelId ?? ''}
				mode={mode}
				isDm={isDM}
				positionShortUser={positionShortUser}
				onClose={closeProfileItem}
				username={mention}
			/>
		);
	}, [positionShortUser]);

	const handleOpenShortUser = useCallback(
		(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			if (checkAnonymous) {
				return;
			}
			const heightPanel =
				mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
					? HEIGHT_PANEL_PROFILE
					: HEIGHT_PANEL_PROFILE_DM;
			if (window.innerHeight - e.clientY > heightPanel) {
				setPositionShortUser({
					top: e.clientY,
					left: 366 + e.currentTarget.offsetWidth
				});
			} else {
				setPositionShortUser({
					top: window.innerHeight - heightPanel,
					left: 366 + e.currentTarget.offsetWidth
				});
			}
			setIsShowPanelChannel(!showProfileUser);
			openProfileItem();
		},
		[checkAnonymous, mode]
	);

	return (
		<span>
			{displayToken?.type === MentionType.ROLE_EXIST && (
				<span className="font-medium px-[0.1rem] rounded-sm bg-[#E3F1E4] hover:bg-[#B1E0C7] text-[#0EB08C] dark:bg-[#3D4C43] dark:hover:bg-[#2D6457]">{`${displayToken.display}`}</span>
			)}
			{displayToken?.type === MentionType.HERE && (
				<span
					className={`font-medium px-0.1 rounded-sm 'cursor-text'
					${isJumMessageEnabled ? 'cursor-pointer hover:!text-white' : 'hover:none'}

					 whitespace-nowrap !text-[#3297ff]  dark:bg-[#3C4270] bg-[#D1E0FF]  ${isJumMessageEnabled ? 'hover:bg-[#5865F2]' : 'hover:none'}`}
				>
					{displayToken.display}
				</span>
			)}
			{displayToken?.type === MentionType.USER_EXIST && (
				<button
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					onMouseDown={!isJumMessageEnabled || isTokenClickAble ? (e) => handleOpenShortUser(e) : () => {}}
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					style={{ textDecoration: 'none' }}
					className={`outline-none font-medium px-0.1 rounded-sm
				${isJumMessageEnabled ? 'cursor-pointer hover:!text-white' : 'hover:none'}
				 whitespace-nowrap !text-[#3297ff]  dark:bg-[#3C4270] bg-[#D1E0FF]  ${isJumMessageEnabled ? 'hover:bg-[#5865F2]' : 'hover:none'}`}
				>
					{displayToken.display}
				</button>
			)}
		</span>
	);
};

export default memo(MentionUser);

const UserProfilePopup = ({ username, userID, channelId, mode, isDm, positionShortUser, onClose, rootRef }: UserProfilePopupProps) => {
	const getUserByUsername = useAppSelector((state) => selectMemberByUsername(state, channelId ?? '', username ?? ''));
	const getUserByUserId = useAppSelector((state) =>
		selectChannelMemberByUserIds(
			state,
			channelId ?? '',
			userID,
			mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? '' : '1'
		)
	)[0];
	const userGetByNameOrId = useMemo(() => {
		return getUserByUserId || getUserByUsername;
	}, [getUserByUserId, getUserByUsername]);
	const userId = userGetByNameOrId?.id;

	const currentChannel = useSelector(selectCurrentChannel);
	const positionStyle = currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ? { right: `120px` } : { left: `${positionShortUser?.left}px` };
	const prioritizeName = getNameForPrioritize(
		userGetByNameOrId?.clan_nick ?? '',
		userGetByNameOrId?.user?.display_name ?? '',
		userGetByNameOrId?.user?.username ?? ''
	);
	const prioritizeAvt = userGetByNameOrId?.clan_avatar ? userGetByNameOrId?.clan_avatar : userGetByNameOrId?.user?.avatar_url;

	const updatedUserByUserId = {
		...userGetByNameOrId,
		prioritizeName,
		prioritizeAvt
	};

	return (
		<div
			className={`fixed z-50 max-[480px]:!left-16 max-[700px]:!left-9 dark:bg-black bg-gray-200 w-[300px] max-w-[89vw] rounded-lg flex flex-col duration-300 ease-in-out animate-fly_in`}
			style={{
				top: `${positionShortUser?.top}px`,
				...positionStyle
			}}
		>
			<ModalUserProfile
				onClose={onClose}
				userID={userId}
				classBanner="rounded-tl-lg rounded-tr-lg h-[105px]"
				mode={mode}
				positionType={''}
				avatar={updatedUserByUserId.prioritizeAvt}
				name={updatedUserByUserId.prioritizeName}
				isDM={isDm}
				isUserRemoved={!userId}
			/>
		</div>
	);
};
