import mezonPackage from '@mezon/package-js';
import { appActions, authActions, selectAllAccount, useAppDispatch } from '@mezon/store';
import { LogoutModal } from '@mezon/ui';
import { EUserSettings, generateE2eId } from '@mezon/utils';
import isElectron from 'is-electron';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
const SettingItem = ({ onItemClick, initSetting }: { onItemClick?: (settingName: string) => void; initSetting: string }) => {
	const [selectedButton, setSelectedButton] = useState<string | null>(initSetting);
	const userProfile = useSelector(selectAllAccount);
	const { t } = useTranslation(['setting']);
	const handleButtonClick = (buttonName: string) => {
		setSelectedButton(buttonName);
	};
	const [openModal, setOpenModal] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const handleOpenModal = () => {
		setOpenModal(true);
	};
	const handleLogOut = async () => {
		if (!isElectron()) {
			window.location.href = `${process.env.NX_CHAT_APP_OAUTH2_LOG_OUT}`;
			return;
		} else {
			await dispatch(authActions.logOut({ device_id: userProfile?.user?.username || '', platform: 'desktop' }));
			dispatch(appActions.setIsShowSettingFooterStatus(false));
			dispatch(appActions.clearHistory());
		}
	};
	const handleCloseModal = () => {
		setOpenModal(false);
		setSelectedButton('');
	};

	useEffect(() => {
		setSelectedButton(initSetting);
	}, [initSetting]);

	return (
		<div className=" overflow-y-auto w-1/6 xl:w-1/4 min-w-56 bg-theme-setting-nav flex justify-center md:justify-end pt-96 pr-2 scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 2xl:flex-grow hide-scrollbar flex-grow">
			<div className="w-170px ">
				<p className="font-bold text-sm tracking-wider text-theme-primary-active">{t('setting:accountSettings.title')}</p>
				<button
					className={` w-[170px] text-[16px] text-theme-primary-hover bg-item-hover font-medium rounded-[5px] text-left ml-[-8px] p-2 mt-4  ${selectedButton === EUserSettings.ACCOUNT ? 'bg-button-secondary text-theme-primary-active bg-item-theme' : 'text-theme-primary'}`}
					onClick={() => {
						handleButtonClick(EUserSettings.ACCOUNT);
						onItemClick && onItemClick(EUserSettings.ACCOUNT);
					}}
					data-e2e={generateE2eId(`user_setting.account.tab_account`)}
				>
					{t('setting:accountSettings.account')}
				</button>

				<br />
				<button
					className={`p-2 pl-2 ml-[-8px] font-medium ${selectedButton === EUserSettings.DEVICES ? 'bg-button-secondary text-theme-primary-active bg-item-theme' : 'text-theme-primary'} mt-1 w-[170px] text-left rounded-[5px]`}
					onClick={() => {
						handleButtonClick(EUserSettings.DEVICES);
						onItemClick && onItemClick(EUserSettings.DEVICES);
					}}
					data-e2e={generateE2eId(`user_setting.devices.tab_devices`)}
				>
					{t('setting:accountSettings.device')}
				</button>
				<br />
				<button
					className={`p-2 pl-2 ml-[-8px] font-medium ${selectedButton === EUserSettings.PROFILES ? 'bg-button-secondary text-theme-primary-active bg-item-theme' : 'text-theme-primary'} mt-1 w-[170px] text-left rounded-[5px]`}
					onClick={() => {
						handleButtonClick(EUserSettings.PROFILES);
						onItemClick && onItemClick(EUserSettings.PROFILES);
					}}
					data-e2e={generateE2eId(`user_setting.profile.tab_profile`)}
				>
					{t('setting:accountSettings.profiles')}
				</button>
				<div className="hidden">
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Privacy & Safety</button>
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Authorized Apps</button>
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Devices</button>
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Connections</button>
					<br />
					<button className="p-2 text-[16px] font-medium mb-[10px] w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Friend Requests
					</button>
				</div>
				<hr className="border-t-theme-primary mt-4" />
				<button className="pt-2  mt-4 font-bold text-sm tracking-wider text-theme-primary-active">{t('setting:appSettings.title')}</button>
				<br />
				<button
					className={`p-2  pl-2 ml-[-8px] font-medium ${selectedButton === EUserSettings.APPEARANCE ? 'bg-button-secondary text-theme-primary-active bg-item-theme' : 'text-theme-primary'} mt-1 w-[170px] text-left rounded-[5px]`}
					onClick={() => {
						handleButtonClick(EUserSettings.APPEARANCE);
						onItemClick && onItemClick(EUserSettings.APPEARANCE);
					}}
				>
					{t('setting:appSettings.appearance')}
				</button>
				<br />
				<button
					className={`p-2 pl-2 ml-[-8px] font-medium ${selectedButton === EUserSettings.ACTIVITY ? 'bg-button-secondary text-theme-primary-active bg-item-theme' : 'text-theme-primary'} mt-1 w-[170px] text-left rounded-[5px]`}
					onClick={() => {
						handleButtonClick(EUserSettings.ACTIVITY);
						onItemClick && onItemClick(EUserSettings.ACTIVITY);
					}}
				>
					{t('setting:appSettings.activity')}
				</button>
				<br />
				<button
					className={`p-2 pl-2 ml-[-8px] font-medium ${selectedButton === EUserSettings.NOTIFICATIONS ? 'bg-button-secondary text-theme-primary-active bg-item-theme' : 'text-theme-primary'} mt-1 w-[170px] text-left rounded-[5px]`}
					onClick={() => {
						handleButtonClick(EUserSettings.NOTIFICATIONS);
						onItemClick && onItemClick(EUserSettings.NOTIFICATIONS);
					}}
				>
					{t('setting:appSettings.notifications')}
				</button>
				<br />
				<button
					className={`p-2 pl-2 ml-[-8px] font-medium ${selectedButton === EUserSettings.LANGUAGE ? 'bg-button-secondary text-theme-primary-active bg-item-theme' : 'text-theme-primary'} mt-1 w-[170px] text-left rounded-[5px]`}
					onClick={() => {
						handleButtonClick(EUserSettings.LANGUAGE);
						onItemClick && onItemClick(EUserSettings.LANGUAGE);
					}}
				>
					{t('setting:language.title')}
				</button>
				<br />
				<button
					className={`p-2 pl-2 ml-[-8px] font-medium ${selectedButton === EUserSettings.VOICE ? 'bg-button-secondary text-theme-primary-active bg-item-theme' : 'text-theme-primary'} mt-1 w-[170px] text-left rounded-[5px]`}
					onClick={() => {
						handleButtonClick(EUserSettings.VOICE);
						onItemClick && onItemClick(EUserSettings.VOICE);
					}}
				>
					{t('setting:appSettings.voice')}
				</button>
				<div className="hidden">
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Accessibility</button>
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Voice & Video</button>
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Text & Image</button>
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Notifications</button>
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Keybinds</button>
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Language</button>
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Streamer Mode</button>
					<br />
					<button className="p-2 text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">Advanced</button>
				</div>
				<hr className="border-t-theme-primary mt-4" />
				<br />
				<button
					className={`p-2 text-[16px] font-medium text-red-500 ${
						selectedButton === EUserSettings.LOG_OUT ? 'bg-button-secondary bg-item-theme' : ''
					} mt-1 w-[170px] text-left rounded-[5px] ml-[-8px] `}
					onClick={() => {
						handleButtonClick(EUserSettings.LOG_OUT);
						handleOpenModal();
					}}
					data-e2e={generateE2eId(`user_setting.logout`)}
				>
					{t('setting:logOut')}
				</button>
				{openModal && <LogoutModal handleLogOut={handleLogOut} onClose={handleCloseModal} />}
				<div className="mt-4 text-xs text-theme-text-secondary opacity-60">v{mezonPackage.version}</div>
			</div>
		</div>
	);
};

export default SettingItem;
