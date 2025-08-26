/* eslint-disable @nx/enforce-module-boundaries */
import {
  selectChannelMemberByUserIds,
  selectCurrentChannel,
  selectCurrentChannelId,
  selectDmGroupCurrentId,
  selectMemberByUsername,
  useAppSelector
} from '@mezon/store';
import {
  HEIGHT_PANEL_PROFILE,
  HEIGHT_PANEL_PROFILE_DM,
  TITLE_MENTION_HERE,
  WIDTH_CHANNEL_LIST_BOX,
  WIDTH_CLAN_SIDE_BAR,
  WIDTH_PANEL_PROFILE,
  getNameForPrioritize
} from '@mezon/utils';
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

		if (tagUserName === TITLE_MENTION_HERE) {
			return {
				display: TITLE_MENTION_HERE,
				type: MentionType.HERE
			};
		}

		if (tagUserId && tagUserName !== TITLE_MENTION_HERE) {
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
		(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
			if (checkAnonymous) {
				return;
			}
			const screenX = window.innerWidth;
			const heightPanel =
				mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
					? HEIGHT_PANEL_PROFILE
					: HEIGHT_PANEL_PROFILE_DM;
			if (window.innerHeight - e.clientY > heightPanel) {
				setPositionShortUser({
					top: e.clientY,
					left:
						e.clientX < WIDTH_CLAN_SIDE_BAR + WIDTH_CHANNEL_LIST_BOX + WIDTH_PANEL_PROFILE
							? WIDTH_CLAN_SIDE_BAR + WIDTH_CHANNEL_LIST_BOX + e.currentTarget.offsetWidth + 24
							: screenX < e.clientX + WIDTH_PANEL_PROFILE
								? screenX - WIDTH_PANEL_PROFILE
								: e.clientX
				});
			} else {
				setPositionShortUser({
					top: window.innerHeight - heightPanel,
					left:
						e.clientX < WIDTH_CLAN_SIDE_BAR + WIDTH_CHANNEL_LIST_BOX + WIDTH_PANEL_PROFILE
							? WIDTH_CLAN_SIDE_BAR + WIDTH_CHANNEL_LIST_BOX + e.currentTarget.offsetWidth + 24
							: screenX < e.clientX + WIDTH_PANEL_PROFILE
								? screenX - WIDTH_PANEL_PROFILE
								: e.clientX
				});
			}
			setIsShowPanelChannel(!showProfileUser);
			openProfileItem();
		},
		[checkAnonymous, mode]
	);

	return (
		<>
			{displayToken?.type === MentionType.ROLE_EXIST && (
				<span className="font-medium px-[0.1rem] rounded-sm color-mention-everyone-hover bg-mention-everyone-hover bg-mention-everyone color-mention-everyone   ">{`${displayToken.display}`}</span>
			)}
			{displayToken?.type === MentionType.HERE && (
				<span
					className={`font-medium px-0.1 rounded-sm cursor-text whitespace-nowrap bg-mention color-mention   ${isJumMessageEnabled ? 'hover-mention underline decoration-1' : 'hover:none'}`}
				>
					{displayToken.display}
				</span>
			)}
			{displayToken?.type === MentionType.USER_EXIST && (
				<a

          data-entity-type="MessageEntityMentionName"
          data-user-id={tagUserId}
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					onMouseDown={!isJumMessageEnabled || isTokenClickAble ? (e) => handleOpenShortUser(e) : () => {}}
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					style={{ textDecoration: 'none' }}
					className={`cursor-pointer outline-none font-medium px-0.1 rounded-sm whitespace-nowrap bg-mention color-mention hover-mention   ${isJumMessageEnabled ? '' : 'hover:none'}`}
				>
					{displayToken.display}
				</a>
			)}
		</>
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
	const userId = userGetByNameOrId?.id ?? userID;

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
			className={`fixed z-50 max-[480px]:!left-16 max-[700px]:!left-9 bg-outside-footer w-[300px] max-w-[89vw] rounded-lg flex flex-col duration-300 ease-in-out animate-fly_in`}
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
