import { FriendsEntity, selectAllActivities, selectTheme } from '@mezon/store';
import { isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ActivityListItem from './ActivityListItem';

const heightTopBar = 60;
const titleBarHeight = isWindowsDesktop || isLinuxDesktop ? 21 : 0;

type ListActivityProps = {
	listFriend: FriendsEntity[];
};

type ActivityUserItemProps = {
	user: any;
};

const MemoizedMemberItem = memo((props: ActivityUserItemProps) => {
	const { user } = props;
	const appearanceTheme = useSelector(selectTheme);

	return (
		<div className={`flex h-full flex-col overflow-y-auto w-full ${appearanceTheme === 'light' && `customScrollLightMode`}`}>
			<ActivityListItem friend={user?.user} />
		</div>
	);
});

const ActivityList = ({ listFriend }: ListActivityProps) => {
	const friendIds = listFriend?.filter((user) => user?.user?.online).map((item) => item?.id);

	const activities = useSelector(selectAllActivities);

	const activitiesByFriendId = activities?.filter((item) => friendIds?.includes(item?.id));
	const listActivities = useMemo(() => {
		if (activitiesByFriendId?.length === 0) {
			return {
				users: [{ visualCodeSeparate: true }, { spotifySeparate: true }, { lOLSeparate: true }],
				codeCount: 0,
				spotifyCount: 0,
				lolCount: 0
			};
		}

		const userMap = new Map(listFriend.map((user) => [user.id, user]));

		const visualCodes = activitiesByFriendId
			.filter((activity) => activity?.activity_type === 1 && activity?.user_id && userMap.has(activity?.user_id))
			.map((activity) => ({ ...activity, user: userMap.get(activity?.user_id as string) }));

		const spotifys = activitiesByFriendId
			.filter((activity) => activity?.activity_type === 2 && activity?.user_id && userMap.has(activity?.user_id))
			.map((activity) => ({ ...activity, user: userMap.get(activity?.user_id as string) }));

		const lol = activitiesByFriendId
			.filter((activity) => activity?.activity_type === 3 && activity?.user_id && userMap.has(activity?.user_id))
			.map((activity) => ({ ...activity, user: userMap.get(activity?.user_id as string) }));

		return {
			users: [{ visualCodeSeparate: true }, ...visualCodes, { spotifySeparate: true }, ...spotifys, { lOLSeparate: true }, ...lol],
			codeCount: visualCodes.length,
			spotifyCount: spotifys.length,
			lolCount: lol.length
		};
	}, [activitiesByFriendId, listFriend]);

	const [height, setHeight] = useState(window.innerHeight - heightTopBar - titleBarHeight);

	const appearanceTheme = useSelector(selectTheme);

	useEffect(() => {
		const handleResize = () => setHeight(window.innerHeight - heightTopBar - titleBarHeight);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const parentRef = useRef(null);
	const rowVirtualizer = useVirtualizer({
		count: listActivities.users.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 48,
		overscan: 5
	});
	return (
		<div
			ref={parentRef}
			className={`flex h-full flex-col overflow-y-auto w-full custom-member-list ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'}`}
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
					const user = listActivities.users[virtualRow.index];
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
								{typeof user === 'object' && 'visualCodeSeparate' in user ? (
									<p className="dark:text-[#AEAEAE] text-black text-[14px] font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase">
										Activity - Visual Studio Code - {listActivities.codeCount}
									</p>
								) : typeof user === 'object' && 'spotifySeparate' in user ? (
									<p className="dark:text-[#AEAEAE] text-black text-[14px] font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase">
										Activity - Spotify - {listActivities.spotifyCount}
									</p>
								) : typeof user === 'object' && 'lOLSeparate' in user ? (
									<p className="dark:text-[#AEAEAE] text-black text-[14px] font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase">
										Activity - League of Legends - {listActivities.lolCount}
									</p>
								) : (
									<MemoizedMemberItem user={user} />
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default ActivityList;
