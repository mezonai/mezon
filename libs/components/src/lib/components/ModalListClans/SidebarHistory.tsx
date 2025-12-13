import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import {
	appActions,
	selectChannelsEntitiesByClanId,
	selectClanById,
	selectDirectMessageEntities,
	selectHistory,
	selectLogoCustom,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import isElectron from 'is-electron';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const SideBarHistory = () => {
	const history = useSelector(selectHistory);
	const dispatch = useDispatch();
	const navigate = useNavigate();

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
	const onOpenHistoryList = () => {
		if (history?.url?.length < 2) {
			return;
		}
		onpenHistoryList();
	};
	const [onpenHistoryList, closeHistoryList] = useModal(() => {
		return <ListHistory onClose={closeHistoryList} allHistory={history} />;
	}, [handleCloseHistory]);

	if (!isElectron()) return null;
	return (
		<div className="flex pb-1 text-theme-primary-active" onContextMenu={onOpenHistoryList}>
			<div
				className={`rotate-180 rounded-full aspect-square p-1 bg-item-theme-hover cursor-pointer  ${history?.current === 0 || !history?.url?.length ? 'opacity-40' : ''}`}
				onClick={() => handleHistoryNavigate(true)}
			>
				<Icons.LongArrowRight className="w-5" />
			</div>
			<div
				onClick={() => handleHistoryNavigate(false)}
				className={`rounded-full aspect-square bg-item-theme-hover p-1 cursor-pointer ${history?.current !== null && history?.current < history?.url?.length - 1 ? '' : 'opacity-40'}`}
			>
				<Icons.LongArrowRight className="w-5" />
			</div>
		</div>
	);
};

const ListHistory = ({
	onClose,
	allHistory
}: {
	onClose: () => void;
	allHistory: {
		url: string[];
		current: number | null;
	};
}) => {
	const expandRef = useRef<HTMLDivElement | null>(null);

	useOnClickOutside(expandRef, onClose);
	useEscapeKeyClose(expandRef, onClose);

	if (!allHistory) {
		return;
	}
	return (
		<div
			ref={expandRef}
			className="fixed font-semibold top-10 gap-1 left-16 w-72 h-fit flex flex-col rounded-md shadow-sm shadow-black bg-theme-setting-nav p-2"
		>
			{allHistory?.url.map((url, index) => {
				const parts = url.split('/');
				const isDM = !url.includes('clans');
				const clanId = parts[3];
				const channelId = isDM ? parts[4] : parts[5];
				return <ItemHistory url={url} clanId={clanId} channelId={channelId} active={allHistory.current === index} index={index} />;
			})}
		</div>
	);
};

const ItemHistory = ({
	active,
	clanId,
	channelId,
	index,
	url
}: {
	url: string;
	clanId: string;
	channelId: string;
	active: boolean;
	index: number;
}) => {
	const channelDM = useAppSelector(selectDirectMessageEntities)?.[channelId];
	const channelClan = useAppSelector((state) => selectChannelsEntitiesByClanId(state, clanId))[channelId];
	const clan = useSelector(selectClanById(clanId));
	const logoCustom = useAppSelector(selectLogoCustom);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const logo = useMemo(() => {
		if (clan) {
			return clan?.logo ? (
				<img src={createImgproxyUrl(clan?.logo, { width: 24, height: 24, resizeType: 'fit' })} className="w-6 aspect-square rounded-md" />
			) : (
				<div className="h-6 aspect-square flex bg-theme-primary items-center justify-center uppercase rounded-md">
					{clan?.clan_name?.charAt(0)}
				</div>
			);
		}
		return (
			<img
				className="w-6 aspect-square rounded-md"
				src={logoCustom ? createImgproxyUrl(logoCustom, { width: 24, height: 24, resizeType: 'fit' }) : `assets/images/mezon-logo-black.svg`}
			/>
		);
	}, [clan]);

	const handleClickHistory = () => {
		dispatch(appActions.setCurrentHistory(index));
		navigate(url);
	};
	return (
		<div
			className={`w-full h-8 cursor-pointer bg-item-hover leading-8 rounded-md items-center px-2 flex gap-2 ${active ? 'text-theme-primary-active' : 'text-theme-primary'}`}
			onClick={handleClickHistory}
		>
			{logo}
			<div className="flex-1 truncate">{channelDM?.channel_label || channelClan?.channel_label}</div>
			<div className="w-4 h-4">{active && <Icons.Star defaultSize="w-4 h-4" />}</div>
		</div>
	);
};

export default memo(SideBarHistory);
