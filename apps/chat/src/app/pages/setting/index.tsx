import { ExitSetting, SettingAccount, SettingAppearance, SettingItem, SettingRightProfile } from '@mezon/components';
import { useEscapeKeyClose, useSettingFooter } from '@mezon/core';
import { selectIsShowSettingFooter, showSettingFooterProps } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EUserSettings } from '@mezon/utils';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
// ... existing code ...

interface settingProps {
	isDM: boolean;
}

const SettingContent = ({ isDM, isShowSettingFooter }: { isDM: boolean; isShowSettingFooter: showSettingFooterProps }) => {
	const [currentSetting, setCurrentSetting] = useState<string>(isShowSettingFooter?.initTab || EUserSettings.ACCOUNT);
	const handleSettingItemClick = (settingName: string) => {
		setCurrentSetting(settingName);
	};
	const [menuIsOpen, setMenuIsOpen] = useState<boolean>(true);
	const handleMenuBtn = () => {
		setMenuIsOpen(!menuIsOpen);
	};
	const { setIsShowSettingFooterStatus, setIsShowSettingFooterInitTab, setIsUserProfile } = useSettingFooter();
	const closeSetting = useCallback(() => {
		setIsShowSettingFooterStatus(false);
		setIsShowSettingFooterInitTab('Account');
		setIsUserProfile(true);
	}, [isShowSettingFooter?.status]);

	useEffect(() => {
		setCurrentSetting(isShowSettingFooter?.initTab || 'Account');
	}, [isShowSettingFooter?.initTab]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, closeSetting);

	return (
		<div ref={modalRef} tabIndex={-1} className="z-20 flex fixed inset-0 w-screen">
			<div className="flex text-gray- w-screen relative">
				<div className={`${!menuIsOpen ? 'hidden' : 'flex'} text-gray- w-1/6 xl:w-1/4 min-w-56 relative`}>
					<SettingItem onItemClick={handleSettingItemClick} initSetting={currentSetting} />
				</div>
				{currentSetting === EUserSettings.ACCOUNT && <SettingAccount menuIsOpen={menuIsOpen} onSettingProfile={handleSettingItemClick} />}
				{currentSetting === EUserSettings.PROFILES && <SettingRightProfile menuIsOpen={menuIsOpen} isDM={isDM} />}
				{currentSetting === EUserSettings.APPEARANCE && <SettingAppearance menuIsOpen={menuIsOpen} />}
				<ExitSetting onClose={closeSetting} />

				{menuIsOpen ? (
					<Icons.ArrowLeftCircleActive
						className="flex sbm:hidden absolute left-4 top-4 dark:text-[#AEAEAE] text-gray-500 w-[30px] h-[30px] hover:text-slate-400 z-50"
						onClick={handleMenuBtn}
					/>
				) : (
					<Icons.ArrowLeftCircle
						className="flex sbm:hidden absolute left-4 top-4 dark:text-[#AEAEAE] text-gray-500 w-[30px] h-[30px] hover:text-slate-400 z-50"
						onClick={handleMenuBtn}
					/>
				)}

				<div className="flex sbm:hidden absolute right-4 top-4" onClick={closeSetting}>
					<Icons.CloseIcon className="dark:text-[#AEAEAE] text-gray-500 w-[30px] h-[30px] hover:text-slate-400 z-50" />
				</div>
			</div>
		</div>
	);
};

const Setting = ({ isDM }: settingProps) => {
	const isShowSettingFooter = useSelector(selectIsShowSettingFooter);

	if (!isShowSettingFooter?.status) {
		return null;
	}

	return <SettingContent isDM={isDM} isShowSettingFooter={isShowSettingFooter} />;
};

export default memo(Setting);
