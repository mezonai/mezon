import {
	selectAllChannelMembers2,
	selectClanMemberMetaUserId,
	selectClanMemberWithStatusIds,
	selectCurrentChannelId,
	selectCurrentClan,
	selectMemberClanByUserId2,
	selectMemberCustomStatusById2,
	selectTheme,
	useAppSelector
} from '@mezon/store';
import { createImgproxyUrl, isLinuxDesktop, isWindowsDesktop, useSyncEffect, useWindowSize } from '@mezon/utils';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage, useVirtualizer } from '../../components';
import { ClanUserName, UserStatusIcon } from '../MemberProfile';
import { BaseMemberProfile } from '../MemberProfile/MemberProfile2';

const heightTopBar = 50;
const titleBarHeight = isWindowsDesktop || isLinuxDesktop ? 21 : 0;

type TempMemberItemProps = {
	id: string;
};

const TempMemberItem = memo(({ id }: TempMemberItemProps) => {
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, id));
	const userMeta = useAppSelector((state) => selectClanMemberMetaUserId(state, id));
	const userCustomStatus = useAppSelector((state) => selectMemberCustomStatusById2(state, user.user?.id || ''));
	const avatar = user.clan_avatar ? user.clan_avatar : (user?.user?.avatar_url ?? '');
	const username = user?.clan_nick || user?.user?.display_name || user?.user?.username || '';

	return (
		<div className="cursor-pointer flex items-center gap-[9px] relative ">
			<div className="relative">
				<AvatarImage
					alt={username}
					username={user?.user?.username ?? username}
					className="min-w-8 min-h-8 max-w-8 max-h-8"
					classNameText="font-semibold"
					srcImgProxy={createImgproxyUrl(avatar ?? '')}
					src={avatar}
				/>
				<div className="rounded-full right-[-4px] absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm text-white dark:bg-bgSecondary bg-bgLightMode">
					<UserStatusIcon status={userMeta?.status} />
				</div>
			</div>

			<div className="flex flex-col font-medium">
				<ClanUserName userId={user.user?.id} name={username} />
				<p className="dark:text-channelTextLabel text-black w-full text-[12px] line-clamp-1 break-all max-w-[176px] ">{userCustomStatus}</p>
			</div>
		</div>
	);
});

type MemberItemProps = {
	id: string;
	temp: boolean;
};

const MemoizedMemberItem = memo((props: MemberItemProps) => {
	const { id, temp } = props;

	return temp ? <TempMemberItem id={id} /> : <BaseMemberProfile id={id} />;
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
	const userChannels = useAppSelector((state) => selectAllChannelMembers2(state, currentChannelId as string));
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
			className={`custom-member-list ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'}`}
			style={{
				height: height,
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
						>
							<div className="flex items-center px-4 h-full">
								{typeof user === 'object' && 'onlineSeparate' in user ? (
									<p className="dark:text-[#AEAEAE] text-black text-[14px] font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase">
										Member - {lisMembers.onlineCount}
									</p>
								) : typeof user === 'object' && 'offlineSeparate' in user ? (
									<p className="dark:text-[#AEAEAE] text-black text-[14px] font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase">
										Offline - {lisMembers.offlineCount}
									</p>
								) : (
									<MemoizedMemberItem id={user} temp={!showFullList} />
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
