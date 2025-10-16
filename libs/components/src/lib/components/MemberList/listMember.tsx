import { useMemberStatus } from '@mezon/core';
import {
	selectAllChannelMembersClan,
	selectClanMemberWithStatusIds,
	selectCurrentChannelId,
	selectCurrentClan,
	selectMemberClanByUserId,
	selectMemberCustomStatusByUserId,
	selectStatusInVoice,
	selectTheme,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl, generateE2eId, isLinuxDesktop, isWindowsDesktop, useSyncEffect, useWindowSize } from '@mezon/utils';
import isElectron from 'is-electron';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage, useVirtualizer } from '../../components';
import { useMemberContextMenu } from '../../contexts';
import { UserStatusIconClan } from '../MemberProfile';
import { BaseMemberProfile, ClanUserName } from '../MemberProfile/MemberProfile';

const heightTopBar = 50;
const titleBarHeight = isWindowsDesktop || isLinuxDesktop ? 21 : 0;

type TempMemberItemProps = {
	id: string;
	isOwner?: boolean;
};

const TempMemberItem = memo(({ id, isOwner }: TempMemberItemProps) => {
	const user = useAppSelector((state) => selectMemberClanByUserId(state, id));
	const userMeta = useMemberStatus(id);
	const currentChannelID = useAppSelector(selectCurrentChannelId);
	const userCustomStatus = useAppSelector((state) => selectMemberCustomStatusByUserId(state, user.user?.id || ''));
	const avatar = user.clan_avatar ? user.clan_avatar : (user?.user?.avatar_url ?? '');
	const username = user?.clan_nick || user?.user?.display_name || user?.user?.username || '';

	return (
		<div className="cursor-pointer flex items-center gap-[9px] relative ">
			<div className="relative">
				<AvatarImage
					alt={''}
					username={user?.user?.username ?? username}
					className="min-w-8 min-h-8 max-w-8 max-h-8"
					classNameText="font-semibold"
					srcImgProxy={createImgproxyUrl(avatar ?? '')}
					src={avatar}
				/>
				<div className="rounded-full right-[-4px] absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm ">
					<UserStatusIconClan channelId={currentChannelID || ''} userId={id || ''} status={userMeta?.status} />
				</div>
			</div>

			<div className="flex flex-col font-medium">
				<ClanUserName userId={user.user?.id as string} name={username} isOwner={!!isOwner} />
				<p className="text-theme-primary w-full text-[12px] line-clamp-1 break-all max-w-[176px] ">{userCustomStatus}</p>
			</div>
		</div>
	);
});
type MemberClanProps = {
	id: string;
	isOwner?: boolean;
	temp: boolean;
};

const MemoizedMemberItem = memo((props: MemberClanProps) => {
	const { id, isOwner, temp } = props;
	const user = useAppSelector((state) => selectMemberClanByUserId(state, id));
	const userMeta = useMemberStatus(id);
	const userCustomStatus = useAppSelector((state) => selectMemberCustomStatusByUserId(state, user?.user?.id || ''));
	const userVoiceStatus = useAppSelector((state) => selectStatusInVoice(state, user.user?.id || ''));
	const avatar = user.clan_avatar ? user.clan_avatar : (user?.user?.avatar_url ?? '');
	const username = user?.clan_nick || user?.user?.display_name || user?.user?.username || '';
	const { showContextMenu, openProfileItem, setCurrentUser } = useMemberContextMenu();
	const handleClick = (event: React.MouseEvent) => {
		setCurrentUser(user);
		openProfileItem(event, user);
	};
	return temp ? (
		<TempMemberItem id={id} isOwner={isOwner} />
	) : (
		<BaseMemberProfile
			userStatus={
				<>
					{userVoiceStatus && userMeta.online ? (
						<span className="flex items-center gap-1" data-e2e={generateE2eId('clan_page.secondary_side_bar.member.in_voice')}>
							<Icons.Speaker className="text-green-500 !w-3 !h-3" />
							In voice
						</span>
					) : (
						userCustomStatus
					)}
				</>
			}
			user={user}
			userMeta={{
				status: userMeta.status,
				online: userMeta.online
			}}
			avatar={avatar}
			username={username}
			id={id}
			isOwner={isOwner}
			onContextMenu={showContextMenu}
			onClick={handleClick}
		/>
	);
});

const ListMember = () => {
	const currentClan = useSelector(selectCurrentClan);

	const [showFullList, setShowFullList] = useState(false);
	useSyncEffect(() => {
		if (showFullList) {
			setShowFullList(false);
		}
	}, [currentClan]);

	const currentChannelId = useSelector(selectCurrentChannelId);
	const userChannels = useAppSelector((state) => selectAllChannelMembersClan(state, currentChannelId as string));
	const members = useSelector(selectClanMemberWithStatusIds);

	const [height, setHeight] = useState(window.innerHeight - heightTopBar - titleBarHeight);

	const lisMembers = useMemo(() => {
		if (!userChannels || !members) {
			return {
				users: [{ onlineSeparate: true }, { offlineSeparate: true }],
				onlineCount: 0,
				offlineCount: 0
			};
		}

		const userIds = new Set(userChannels.map((item) => item.id));

		const onlines: string[] = [];
		const offlines: string[] = [];

		for (const memberId of members.online) {
			if (userIds.has(memberId)) {
				onlines.push(memberId);
			}
		}

		for (const memberId of members.offline) {
			if (userIds.has(memberId)) {
				offlines.push(memberId);
			}
		}

		const onlineCount = onlines.length;
		const offlineCount = offlines.length;

		let userList;
		if (!showFullList) {
			const countItems = Math.round(height / 48);
			const maxItems = countItems > 20 ? countItems : 20;

			const onlinesToShow = Math.min(onlineCount, maxItems);
			const offlinesToShow = onlineCount >= maxItems ? 0 : Math.min(offlineCount, maxItems - onlinesToShow);

			userList = [
				{ onlineSeparate: true },
				...onlines.slice(0, onlinesToShow),
				{ offlineSeparate: true },
				...offlines.slice(0, offlinesToShow)
			];
		} else {
			userList = [{ onlineSeparate: true }, ...onlines, { offlineSeparate: true }, ...offlines];
		}

		return {
			users: userList,
			onlineCount,
			offlineCount,
			fullCount: onlineCount + offlineCount
		};
	}, [members, userChannels, showFullList]);

	const appearanceTheme = useSelector(selectTheme);

	useWindowSize(() => {
		setHeight(window.innerHeight - heightTopBar - titleBarHeight);
	});

	useEffect(() => {
		const idleCallback = window.requestIdleCallback(
			() => {
				setShowFullList(true);
			},
			{ timeout: 3000 }
		);

		return () => {
			window.cancelIdleCallback(idleCallback);
		};
	}, [lisMembers]);

	const parentRef = useRef(null);
	const rowVirtualizer = useVirtualizer({
		count: lisMembers.users.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 48,
		overscan: 5
	});

	return (
		<div
			ref={parentRef}
			className={`custom-member-list ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'} ${isElectron() ? 'scroll-big' : ''} `}
			style={{
				height,
				overflow: 'auto'
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative'
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const user = lisMembers.users[virtualRow.index];
					return (
						<div
							key={virtualRow.index}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`
							}}
							data-e2e={generateE2eId('chat.channel_message.member_list.item')}
						>
							<div className="flex items-center px-4 h-full">
								{typeof user === 'object' && 'onlineSeparate' in user ? (
									<p className="text-theme-primary text-[14px] font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase">
										Online - {lisMembers.onlineCount}
									</p>
								) : typeof user === 'object' && 'offlineSeparate' in user ? (
									<p className="text-theme-primary text-[14px] font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase">
										Offline - {lisMembers.offlineCount}
									</p>
								) : (
									<MemoizedMemberItem id={user} temp={!showFullList} isOwner={currentClan?.creator_id === user} />
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default ListMember;
