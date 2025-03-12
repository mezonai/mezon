import { appActions, authActions, selectAllAccount, useAppDispatch } from '@mezon/store';
import { LogoutModal } from '@mezon/ui';
import isElectron from 'is-electron';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
const SettingItem = ({ onItemClick, initSetting }: { onItemClick?: (settingName: string) => void; initSetting: string }) => {
	const [selectedButton, setSelectedButton] = useState<string | null>(initSetting);
	const userProfile = useSelector(selectAllAccount);
	const handleButtonClick = (buttonName: string) => {
		setSelectedButton(buttonName);
	};
	const [openModal, setOpenModal] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const handleOpenModal = () => {
		setOpenModal(true);
	};
	const handleLogOut = async () => {
		await dispatch(authActions.logOut({ device_id: userProfile?.user?.username || '', platform: 'desktop' }));
		await dispatch(appActions.setIsShowSettingFooterStatus(false));
		if (!isElectron()) {
			window.location.href = `${process.env.NX_CHAT_APP_OAUTH2_LOG_OUT}`;
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
		<div className=" overflow-y-auto w-1/6 xl:w-1/4 min-w-56 dark:bg-bgSecondary bg-[#F0F0F0] flex justify-end pt-96 pr-2 scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 2xl:flex-grow hide-scrollbar flex-grow">
			<div className="w-170px ">
				<p className="dark:text-[#84ADFF] text-black font-bold text-sm tracking-wider">USER SETTINGS</p>
				<button
					className={`dark:text-[#AEAEAE] text-black w-[170px] text-[16px] font-medium rounded-[5px] text-left ml-[-8px] p-2 mt-4  ${selectedButton === 'Account' ? 'dark:bg-[#232E3B] bg-gray-300 dark:text-white text-black' : ''}`}
					onClick={() => {
						handleButtonClick('Account');
						onItemClick && onItemClick('Account');
					}}
				>
					My Account
				</button>
				<br />
				<button
					className={`p-2 dark:text-[#AEAEAE] text-black  pl-2 ml-[-8px] font-medium ${selectedButton === 'Profiles' ? 'dark:bg-[#232E3B] bg-gray-300 dark:text-white text-black' : ''} mt-1 w-[170px] text-left rounded-[5px]`}
					onClick={() => {
						handleButtonClick('Profiles');
						onItemClick && onItemClick('Profiles');
					}}
				>
					Profiles
				</button>
				<div className="hidden">
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Privacy & Safety
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Authorized Apps
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Devices
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Connections
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium mb-[10px] w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Friend Requests
					</button>
				</div>
				<hr className="border-t border-solid border-borderDefault mt-4" />
				<button className="pt-2 dark:text-[#84ADFF] text-black mt-4 font-bold text-sm tracking-wider">APP SETTINGS</button>
				<br />
				<button
					className={`p-2 dark:text-[#AEAEAE] text-black  pl-2 ml-[-8px] font-medium ${selectedButton === 'Appearance' ? 'dark:bg-[#232E3B] bg-gray-300 dark:text-white text-black' : ''} mt-1 w-[170px] text-left rounded-[5px]`}
					onClick={() => {
						handleButtonClick('Appearance');
						onItemClick && onItemClick('Appearance');
					}}
				>
					Appearance
				</button>
				<div className="hidden">
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Accessibility
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Voice & Video
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Text & Image
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Notifications
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Keybinds
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Language
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Streamer Mode
					</button>
					<br />
					<button className="p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium w-[170px] rounded-[5px] text-left mt-1 ml-[-8px] ">
						Advanced
					</button>
				</div>
				<hr className="border-t border-solid border-borderDefault mt-4" />
				<br />
				<button
					className={`p-2 dark:text-[#AEAEAE] text-black text-[16px] font-medium ${selectedButton === 'Log Out' ? 'bg-[#232E3B]' : ''} mt-1 w-[170px] text-left rounded-[5px] ml-[-8px] `}
					onClick={() => {
						handleButtonClick('Log Out');
						handleOpenModal();
					}}
				>
					Log Out
				</button>
				{openModal && <LogoutModal handleLogOut={handleLogOut} onClose={handleCloseModal} />}
				<div className="h-9"></div>
			</div>
		</div>
	);
};

export default SettingItem;
