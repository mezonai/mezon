import { useWindowSize } from '@mezon/core';
import {
	selectAllChannelMembers,
	selectClanMemberMetaUserId,
	selectClanMemberWithStatusIds,
	selectCurrentChannelId,
	selectMemberClanByUserId2,
	selectTheme,
	useAppSelector
} from '@mezon/store';
import { MemberProfileType, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import MemberItem from './MemberItem';

const heightTopBar = 60;
const titleBarHeight = isWindowsDesktop || isLinuxDesktop ? 21 : 0;

type MemberItemProps = {
	id: string;
};
const MemoizedMemberItem = memo((props: MemberItemProps) => {
	const { id } = props;
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, id));
	const userMeta = useAppSelector((state) => selectClanMemberMetaUserId(state, id));

	return (
		<MemberItem
			user={user}
			name={user?.clan_nick || user?.user?.display_name || user?.user?.username}
			positionType={MemberProfileType.MEMBER_LIST}
			isDM={false}
			listProfile={true}
			isOffline={!userMeta?.online}
			isMobile={userMeta?.isMobile}
			statusOnline={userMeta.status}
		/>
	);
});

const ListMember = () => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const userChannels = useAppSelector((state) => selectAllChannelMembers(state, currentChannelId));
	const members = useSelector(selectClanMemberWithStatusIds);
	const lisMembers = useMemo(() => {
		if (!userChannels || !members) {
			return {
				users: [
					{ onlineSeparate: true },
					{
						offlineSeparate: true
					}
				],
				onlineCount: 0,
				offlineCount: 0
			};
		}

		const users = new Map(userChannels.map((item) => [item.id, true]));
		const onlines = members.online.filter((m) => users.has(m));
		const offlines = members.offline.filter((m) => users.has(m));
		return {
			users: [
				{ onlineSeparate: true },
				...onlines,
				{
					offlineSeparate: true
				},
				...offlines
			],
			onlineCount: onlines.length,
			offlineCount: offlines.length
		};
	}, [members, userChannels]);

	const [height, setHeight] = useState(window.innerHeight - heightTopBar - titleBarHeight);

	const appearanceTheme = useSelector(selectTheme);

	useWindowSize(() => {
		setHeight(window.innerHeight - heightTopBar - titleBarHeight);
	});

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
									<MemoizedMemberItem id={user} />
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
