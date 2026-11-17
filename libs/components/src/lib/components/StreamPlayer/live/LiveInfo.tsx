import { useAppNavigation, useMenu } from '@mezon/core';
import { categoriesActions, liveStreamActions, selectCloseMenu, selectLiveInfo, selectLivePhase, useAppDispatch } from '@mezon/store';
import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

export function LiveInfo() {
	const { t } = useTranslation('channelStream');
	const dispatch = useAppDispatch();
	const { toChannelPage, navigate } = useAppNavigation();
	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const phase = useSelector(selectLivePhase);
	const liveInfo = useSelector(selectLiveInfo);

	const statusLabel = useMemo(() => {
		if (phase === 'starting') return t('liveConnecting');
		if (phase === 'reconnecting') return t('liveReconnecting');
		return t('youAreLive');
	}, [phase, t]);

	const displayAddress = useMemo(() => {
		const raw = `${liveInfo.channelLabel} / ${liveInfo.clanName}`;
		return raw.length > 30 ? `${raw.substring(0, 30)}...` : raw;
	}, [liveInfo.channelLabel, liveInfo.clanName]);

	const endLabel = useMemo(() => t('endLive'), [t]);

	const handleNavigate = useCallback(() => {
		if (!liveInfo.channelId || !liveInfo.clanId) return;
		if (closeMenu) setStatusMenu(false);
		const channelUrl = toChannelPage(liveInfo.channelId, liveInfo.clanId);
		dispatch(
			categoriesActions.setCtrlKFocusChannel({
				id: liveInfo.channelId,
				parentId: liveInfo.parentId
			})
		);
		navigate(channelUrl);
	}, [closeMenu, dispatch, liveInfo.channelId, liveInfo.clanId, liveInfo.parentId, navigate, setStatusMenu, toChannelPage]);

	const handleEndLive = useCallback(() => {
		dispatch(liveStreamActions.requestStop('user'));
	}, [dispatch]);

	return (
		<div className="border-b dark:border-borderDefault border-gray-300 px-4 py-2 hover:bg-gray-550/[0.16] shadow-sm transition bg-item-theme w-full group">
			<div className="flex items-center justify-between">
				<div className="flex max-w-[200px] flex-col">
					<div className="flex items-center gap-1.5">
						<MezonIcon icon={MzIcons16.mzLive} className="shrink-0 text-[green]" />
						<span className="truncate text-base font-bold text-green-700">{statusLabel}</span>
					</div>
					<button type="button" className="w-fit" onClick={handleNavigate}>
						<div className="text-xs font-medium text-theme-primary hover:underline">{displayAddress}</div>
					</button>
				</div>
				<button
					type="button"
					title={endLabel}
					aria-label={endLabel}
					onClick={handleEndLive}
					className="rounded-md p-1 text-black opacity-80 hover:bg-bgLightModeButton dark:text-[#AEAEAE] dark:hover:bg-[#5e5e5e]"
				>
					<MezonIcon icon={MzIcons20.mzCallEnd} />
				</button>
			</div>
		</div>
	);
}
