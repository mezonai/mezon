import { FriendsEntity, selectAllActivities, selectAllUserDM, selectTheme } from '@mezon/store';
import { IUserItemActivity, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
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
	user?: IUserItemActivity;
};

const MemoizedMemberItem = memo((props: ActivityUserItemProps) => {
	const { user } = props;
	const appearanceTheme = useSelector(selectTheme);

	return (
		<div className={`flex h-full flex-col overflow-y-auto w-full ${appearanceTheme === 'light' && `customScrollLightMode`}`}>
			<ActivityListItem user={user} />
		</div>
	);
});

const ActivityList = ({ listFriend }: ListActivityProps) => {
	const listUserDM = useSelector(selectAllUserDM);
	const mergeListFriendAndListUserDM = useMemo(() => {
		return [
			...listFriend.map((friend) => ({
				user: {
					avatar_url: friend?.user?.avatar_url,
					display_name: friend?.user?.display_name,
					id: friend?.user?.id,
					username: friend?.user?.username,
					online: friend?.user?.online,
					metadata: friend?.user?.metadata
				},
				id: friend?.id
			})),
			...listUserDM
		];
	}, [listFriend, listUserDM]);

	const listUser = Array.from(new Map(mergeListFriendAndListUserDM.map((item) => [item?.id, item])).values());
	const userIds = listUser?.filter((user) => user?.user?.online).map((item) => item?.id);

	const activities = useSelector(selectAllActivities);

	const activitiesByUserId = activities?.filter((item) => userIds?.includes(item?.id));
	const listActivities = useMemo(() => {
		if (activitiesByUserId?.length === 0) {
			return {
				users: [{ visualCodeSeparate: true }, { spotifySeparate: true }, { lOLSeparate: true }],
				codeCount: 0,
				spotifyCount: 0,
				lolCount: 0
			};
		}

		const userMap = new Map(listUser.map((user) => [user?.id, user]));

		const visualCodes = activitiesByUserId
			.filter((activity) => activity?.activity_type === 1 && activity?.user_id && userMap.has(activity?.user_id))
			.map((activity) => ({ ...activity, user: userMap.get(activity?.user_id as string) }));

		const spotifys = activitiesByUserId
			.filter((activity) => activity?.activity_type === 2 && activity?.user_id && userMap.has(activity?.user_id))
			.map((activity) => ({ ...activity, user: userMap.get(activity?.user_id as string) }));

		const lol = activitiesByUserId
			.filter((activity) => activity?.activity_type === 3 && activity?.user_id && userMap.has(activity?.user_id))
			.map((activity) => ({ ...activity, user: userMap.get(activity?.user_id as string) }));

		return {
			users: [{ visualCodeSeparate: true }, ...visualCodes, { spotifySeparate: true }, ...spotifys, { lOLSeparate: true }, ...lol],
			codeCount: visualCodes.length,
			spotifyCount: spotifys.length,
			lolCount: lol.length
		};
	}, [activitiesByUserId, listUser]);

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
										Activity - Coding - {listActivities.codeCount}
									</p>
								) : typeof user === 'object' && 'spotifySeparate' in user ? (
									<p className="dark:text-[#AEAEAE] text-black text-[14px] font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase">
										Activity - Music - {listActivities.spotifyCount}
									</p>
								) : typeof user === 'object' && 'lOLSeparate' in user ? (
									<p className="dark:text-[#AEAEAE] text-black text-[14px] font-semibold flex items-center gap-[4px] font-title text-xs tracking-wide uppercase">
										Activity - Gaming - {listActivities.lolCount}
									</p>
								) : (
									<MemoizedMemberItem user={user?.user} />
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
