import { authActions, selectAllAccount, useAppDispatch } from '@mezon/store';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '../Button';
import ButtonLoading from '../Button/ButtonLoading';

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
			<Button
				onClick={handleOpenModal}
				className="inline-flex m-4  h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-medium tracking-wide text-white  duration-300"
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
			</Button>
		</>
	);
}

interface ModalProps {
	onClose: () => void;
	handleLogOut: () => void;
	isDeleting?: boolean;
}

export const LogoutModal: React.FC<ModalProps> = ({ handleLogOut, onClose }) => {
	return (
		<div className="fixed  inset-0 flex items-center justify-center z-50">
			<div className="fixed inset-0 bg-black opacity-80"></div>
			<div className="relative z-10 bg-theme-setting-primary p-6 rounded-[5px] text-center">
				<h2 className="text-[30px] font-semibold mb-4  text-theme-primary">Log Out</h2>
				<p
					className="text-theme-primary 
				 mb-6 text-[16px]"
				>
					Are you sure you want to log out?
				</p>
				<div className="flex justify-center mt-10 text-[14px]">
					<Button
						onClick={onClose}
						className="px-4 py-2 mr-5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:ring focus:border-blue-300"
					>
						Cancel
					</Button>
					<ButtonLoading
						onClick={handleLogOut}
						className="px-4 py-2 rounded focus:ring bg-[#da373c] text-white hover:opacity-80"
						label="Log Out"
					/>
				</div>
			</div>
		</div>
	);
};

export const DeleteAccountModal: React.FC<ModalProps> = ({ handleLogOut, onClose, isDeleting }) => {
	return (
		<div className="fixed  inset-0 flex items-center justify-center z-50">
			<div className="fixed inset-0 bg-black opacity-80"></div>
			<div className="relative z-10 bg-theme-setting-primary p-6 rounded-lg text-center">
				<h2 className="text-[30px] font-semibold mb-4 text-theme-primary ">Delete Account</h2>
				<p
					className="text-theme-primary
				 mb-6 text-[16px]"
				>
					Are you sure that you want to delete your account? This will immediately log you out of your account and you will not be able to
					log in again.
				</p>
				<div className="flex justify-center mt-10 text-[14px]">
					<Button
						onClick={onClose}
						className="px-4 py-2 mr-5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:ring focus:border-blue-300"
					>
						Cancel
					</Button>
					<ButtonLoading onClick={handleLogOut} disabled={isDeleting} className={`px-4 py-2 rounded text-white bg-red-500 hover:opacity-80 `} label="Delete" />
				</div>
			</div>
		</div>
	);
};
