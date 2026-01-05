import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { appActions, selectChannelsEntitiesByClanId, selectClanById, selectDirectMessageEntities, selectHistory, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const SideBarHistory = () => {
	const history = useSelector(selectHistory);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [left, setLeft] = useState(false);
	const handleHistoryNavigate = useCallback(
		(move: boolean) => {
			if (history?.current === null) return;
			if ((history?.current === 0 || !history?.url?.length) && move) {
				return;
			}
			if (history?.current === null || history?.current === undefined || (history?.current === history?.url?.length - 1 && !move)) {
				return;
			}
			dispatch(appActions.setBackHistory(move));
			navigate(history?.url[history?.current + (move ? -1 : 1)]);
		},
		[history]
	);
	const handleCloseHistory = () => {
		closeHistoryList();
	};
	const onOpenHistoryList = (left: boolean) => {
		if (history?.url?.length < 2) {
			return;
		}
		onpenHistoryList();
		setLeft(left);
	};
	const [onpenHistoryList, closeHistoryList] = useModal(() => {
		return <ListHistory onClose={closeHistoryList} allHistory={history} left={left} />;
	}, [handleCloseHistory, left]);

	const checkHold = useRef<boolean>(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button === 2) return;
		timerRef.current = setTimeout(() => {
			checkHold.current = true; // gọi action giống onContextMenu
		}, 500);
	};

	const handleMouseUp = (e: React.MouseEvent, left: boolean) => {
		if (e.button === 2) return;
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			if (checkHold.current) {
				onOpenHistoryList(left);
			} else {
				handleHistoryNavigate(left);
			}
			checkHold.current = false;
		}
	};

	if (!isElectron()) return null;
	return (
		<div className="flex pb-1 text-theme-primary-active">
			<div
				className={`rotate-180 rounded-full aspect-square p-1 bg-item-theme-hover cursor-pointer  ${history?.current === 0 || !history?.url?.length ? 'opacity-40' : ''}`}
				onContextMenu={(e) => {
					e.preventDefault();
					onOpenHistoryList(true);
				}}
				onMouseDown={handleMouseDown}
				onMouseUp={(e) => handleMouseUp(e, true)}
			>
				<Icons.LongArrowRight className="w-5" />
			</div>
			<div
				onContextMenu={(e) => {
					e.preventDefault();
					onOpenHistoryList(false);
				}}
				onMouseDown={handleMouseDown}
				onMouseUp={(e) => handleMouseUp(e, false)}
				className={`rounded-full aspect-square bg-item-theme-hover p-1 cursor-pointer ${history?.current !== null && history?.current < history?.url?.length - 1 ? '' : 'opacity-40 pointer-events-none'}`}
			>
				<Icons.LongArrowRight className="w-5" />
			</div>
		</div>
	);
};

const ListHistory = ({
	onClose,
	allHistory,
	left
}: {
	onClose: () => void;
	allHistory: {
		url: string[];
		current: number | null;
	};
	left: boolean;
}) => {
	const expandRef = useRef<HTMLDivElement | null>(null);

	useOnClickOutside(expandRef, onClose);
	useEscapeKeyClose(expandRef, onClose);

	if (!allHistory) {
		return;
	}

	const history = left
		? allHistory?.url.slice(0, (allHistory.current || 0) + 1)
		: allHistory?.url.slice(allHistory.current || 0, allHistory?.url.length);
	return (
		<div
			ref={expandRef}
			className="fixed font-semibold top-10 gap-1 left-16 w-72 h-fit flex flex-col rounded-md shadow-sm shadow-black bg-theme-setting-nav p-2"
		>
			{history.map((url, index) => {
				const parts = url.split('/');
				const isDM = !url.includes('clans');
				const clanId = parts[3];
				const channelId = isDM ? parts[4] : parts[5];
				return (
					<ItemHistory
						key={index}
						url={url}
						clanId={clanId}
						channelId={channelId}
						active={left ? allHistory.current === index : index === 0}
						index={index}
						onClose={onClose}
					/>
				);
			})}
		</div>
	);
};

const ItemHistory = ({
	active,
	clanId,
	channelId,
	index,
	url,
	onClose
}: {
	url: string;
	clanId: string;
	channelId: string;
	active: boolean;
	index: number;
	onClose: () => void;
}) => {
	const channelDM = useAppSelector(selectDirectMessageEntities)?.[channelId];
	const channelClan = useAppSelector((state) => selectChannelsEntitiesByClanId(state, clanId))[channelId];
	const clan = useSelector(selectClanById(clanId));
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const logo = useMemo(() => {
		if (!clan) {
			const avatar = channelDM.type === ChannelType.CHANNEL_TYPE_GROUP ? channelDM?.channelAvatar : channelDM?.avatars?.[0];
			return (
				<img
					className="w-6 aspect-square rounded-md"
					src={avatar ? createImgproxyUrl(avatar, { width: 24, height: 24, resizeType: 'fit' }) : 'assets/images/mezon-logo-black.svg'}
				/>
			);
		}

		if (clan.logo) {
			return <img className="w-6 aspect-square rounded-md" src={createImgproxyUrl(clan.logo, { width: 24, height: 24, resizeType: 'fit' })} />;
		}

		return <div className="h-6 aspect-square flex items-center justify-center bg-theme-primary uppercase rounded-md">{clan.clan_name?.[0]}</div>;
	}, [clan]);

	const handleClickHistory = () => {
		dispatch(appActions.setCurrentHistory(index));
		navigate(url);
		onClose();
	};
	return (
		<div
			className={`w-full h-8 cursor-pointer bg-item-hover leading-8 rounded-md items-center px-2 flex gap-2 ${active ? 'text-theme-primary-active' : 'text-theme-primary'}`}
			onClick={handleClickHistory}
		>
			{logo}
			<div className="flex-1 truncate">{channelDM?.channelLabel || channelClan?.channelLabel}</div>
			<div className="w-4 h-4">{active && <Icons.Star defaultSize="w-4 h-4" />}</div>
		</div>
	);
};

export default memo(SideBarHistory);
