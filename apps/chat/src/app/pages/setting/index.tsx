import {
	ExitSetting,
	SettingAccount,
	SettingActivity,
	SettingAppearance,
	SettingDevices,
	SettingItem,
	SettingLanguage,
	SettingNotifications,
	SettingRightProfile
} from '@mezon/components';
import { useEscapeKeyClose, useSettingFooter } from '@mezon/core';
import type { showSettingFooterProps } from '@mezon/store';
import { selectIsShowSettingFooter } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EUserSettings } from '@mezon/utils';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';

interface settingProps {
	isDM: boolean;
}

const SettingContent = ({ isDM, isShowSettingFooter }: { isDM: boolean; isShowSettingFooter: showSettingFooterProps }) => {
	const [currentSetting, setCurrentSetting] = useState<string>(isShowSettingFooter?.initTab || EUserSettings.ACCOUNT);
	const handleSettingItemClick = (settingName: string) => {
		setCurrentSetting(settingName);
		if (isNarrowLayout) {
			setMenuIsOpen(false);
		}
	};
	const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false);
	const [isNarrowLayout, setIsNarrowLayout] = useState<boolean>(false);
	const handleMenuBtn = () => {
		setMenuIsOpen(!menuIsOpen);
	};
	const { setIsShowSettingFooterStatus, setIsShowSettingFooterInitTab, setIsUserProfile } = useSettingFooter();
	const closeSetting = useCallback(() => {
		setIsShowSettingFooterStatus(false);
		setIsShowSettingFooterInitTab('Account');
		setIsUserProfile(true);
	}, [setIsShowSettingFooterStatus, setIsShowSettingFooterInitTab, setIsUserProfile]);

	useEffect(() => {
		setCurrentSetting(isShowSettingFooter?.initTab || 'Account');
		const handleResize = () => {
			const isNarrow = window.innerWidth <= 768;
			setIsNarrowLayout(isNarrow);
			// On narrow layout (mobile/tablet) hide sidebar by default, on wider screens show it
			setMenuIsOpen(!isNarrow);
		};
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [isShowSettingFooter?.initTab]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, closeSetting);

	return (
		<div ref={modalRef} tabIndex={-1} className="z-50 flex fixed inset-0 w-screen bg-theme-setting-primary text-theme-primary">
			<div className="flex w-screen relative">
				{menuIsOpen && isNarrowLayout && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMenuIsOpen(false)} />}
				<div
					className={`${
						isNarrowLayout
							? !menuIsOpen
								? 'hidden'
								: 'flex fixed left-0 top-0 h-full z-50'
							: 'flex fixed sbm:relative left-0 top-0 h-full z-50 sbm:z-auto'
					} w-1/6 xl:w-1/4 min-w-56 relative bg-theme-setting-nav`}
				>
					<SettingItem onItemClick={handleSettingItemClick} initSetting={currentSetting} />
				</div>
				{currentSetting === EUserSettings.ACCOUNT && <SettingAccount menuIsOpen={menuIsOpen} onSettingProfile={handleSettingItemClick} />}
				{currentSetting === EUserSettings.DEVICES && <SettingDevices menuIsOpen={menuIsOpen} />}
				{currentSetting === EUserSettings.PROFILES && <SettingRightProfile menuIsOpen={menuIsOpen} isDM={isDM} />}
				{currentSetting === EUserSettings.APPEARANCE && <SettingAppearance menuIsOpen={menuIsOpen} />}
				{currentSetting === EUserSettings.LANGUAGE && <SettingLanguage menuIsOpen={menuIsOpen} />}
				{currentSetting === EUserSettings.NOTIFICATIONS && <SettingNotifications menuIsOpen={menuIsOpen} />}
				{currentSetting === EUserSettings.ACTIVITY && <SettingActivity menuIsOpen={menuIsOpen} />}
				<ExitSetting onClose={closeSetting} />

				{isNarrowLayout && (
					<div className="flex fixed top-0 left-0 right-0 justify-between items-center z-[60] bg-theme-setting-primary pb-4 pt-4 px-4">
						<div className="absolute inset-0 bg-gradient-to-b from-theme-setting-primary via-theme-setting-primary/95 to-transparent pointer-events-none" />
						<div className="relative z-10">
							{!menuIsOpen ? (
								<button
									className="text-theme-primary w-[30px] h-[30px] text-theme-primary-hover cursor-pointer"
									onClick={handleMenuBtn}
								>
									<Icons.OpenMenu className="w-full h-full" />
								</button>
							) : (
								<button
									className="text-theme-primary w-[30px] h-[30px] text-theme-primary-hover cursor-pointer"
									onClick={handleMenuBtn}
								>
									<Icons.ArrowLeftCircleActive className="w-full h-full" />
								</button>
							)}
						</div>
						<div onClick={closeSetting} className="relative z-10 cursor-pointer">
							<Icons.CloseIcon className="text-theme-primary w-[30px] h-[30px] text-theme-primary-hover" />
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

const Setting = ({ isDM }: settingProps) => {
	const isShowSettingFooter = useSelector(selectIsShowSettingFooter);
	const [openSettingModal, closeSettingModal] = useModal(() => {
		return <SettingContent isDM={isDM} isShowSettingFooter={isShowSettingFooter} />;
	}, [isDM]);

	useEffect(() => {
		if (isShowSettingFooter?.status) {
			openSettingModal();
		} else {
			closeSettingModal();
		}
	}, [isShowSettingFooter?.status, openSettingModal, closeSettingModal]);
	return null;
};

export default memo(Setting);
