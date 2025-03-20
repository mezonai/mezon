import { authActions, selectAllAccount, useAppDispatch } from '@mezon/store';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

export function LogOutButton() {
	const [openModal, setOpenModal] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);
	const handleOpenModal = () => {
		setOpenModal(true);
	};
	const handleLogOut = () => {
		dispatch(authActions.logOut({ device_id: userProfile?.user?.username || '', platform: 'desktop' }));
	};
	const handleCloseModal = () => {
		setOpenModal(false);
	};

	return (
		<>
			{openModal && <LogoutModal handleLogOut={handleLogOut} onClose={handleCloseModal} />}
			<button
				onClick={handleOpenModal}
				className="inline-flex m-4 h-10 items-center justify-center gap-2
      whitespace-nowrap rounded-full
      bg-blue-700 px-5 text-sm font-medium tracking-wide text-white transition duration-300
      hover:bg-blue-500 focus:bg-blue-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:border-emerald-300 disabled:bg-emerald-300 disabled:shadow-none"
			>
				<span>Log Out</span>
				<span className="relative only:-mx-5">
					<svg
						className="h-4 w-4 text-white"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<title id="title-38">Icon title</title>
						<desc id="desc-38">A more detailed description of the icon</desc>
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /> <polyline points="16 17 21 12 16 7" />{' '}
						<line x1="21" y1="12" x2="9" y2="12" />
					</svg>
				</span>
			</button>
		</>
	);
}

interface ModalProps {
	onClose: () => void;
	handleLogOut: () => void;
}

export const LogoutModal: React.FC<ModalProps> = ({ handleLogOut, onClose }) => {
	return (
		<div className="fixed  inset-0 flex items-center justify-center z-50">
			<div className="fixed inset-0 bg-black opacity-80"></div>
			<div className="relative z-10 dark:bg-bgPrimary bg-bgLightModeSecond p-6 rounded-[5px] text-center">
				<h2 className="text-[30px] font-semibold mb-4 dark:text-white text-black">Log Out</h2>
				<p className="dark:text-white-600 dark:text-textDarkTheme text-textLightTheme mb-6 text-[16px]">Are you sure you want to log out?</p>
				<div className="flex justify-center mt-10 text-[14px]">
					<button
						color="gray"
						onClick={onClose}
						className="px-4 py-2 mr-5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring focus:border-blue-300"
					>
						Cancel
					</button>
					<button
						color="blue"
						onClick={handleLogOut}
						className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-500 focus:outline-none focus:ring focus:border-blue-300"
					>
						Log Out
					</button>
				</div>
			</div>
		</div>
	);
};
