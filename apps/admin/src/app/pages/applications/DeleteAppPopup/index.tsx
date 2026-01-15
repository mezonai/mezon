import { deleteApplication, fetchApplications, useAppDispatch } from '@mezon/store';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface IDeleteAppPopup {
	appId: string;
	appName: string;
	togglePopup: () => void;
}

const DeleteAppPopup = ({ togglePopup, appName, appId }: IDeleteAppPopup) => {
	const [inputValue, setInputValue] = useState('');
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const handleInputOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleDeleteApp = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		await dispatch(deleteApplication({ appId }));
		await dispatch(fetchApplications({ noCache: true }));
		togglePopup();
		navigate('/');
	};

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 bg-[#000000c9]">
			<form className="relative z-10 w-[450px]" onSubmit={handleDeleteApp}>
				<div className="dark:bg-[#313338] bg-white pt-[16px] px-[16px] flex flex-col gap-5 pb-5 rounded-t-md">
					<div className="dark:text-textDarkTheme text-textLightTheme text-[20px] font-semibold uppercase">
						Danger: Deleting Your Application!
					</div>
					<div>
						To delete this application, please confirm the name (<span className="underline">{appName}</span>) below.
					</div>
					<div className="bg-[#ccd0fb] dark:bg-[#3c4270] border border-[#5d69f2] p-[10px] rounded-lg">
						Deleting this application will also delete your bot and remove it from every clan it is in!
					</div>
					<div className="flex flex-col gap-2">
						<div className="text-[12px] font-semibold">
							APPLICATION NAME <span className="text-red-600">*</span>
						</div>
						<input
							onChange={handleInputOnchange}
							value={inputValue}
							type="text"
							placeholder={appName}
							className="bg-bgLightModeThird dark:bg-[#1e1f22] outline-primary p-[10px] rounded-sm"
						/>
					</div>
				</div>
				<div className="dark:bg-[#2b2d31] bg-[#f2f3f5] dark:text-textDarkTheme text-textLightTheme flex justify-end items-center gap-4 p-[16px] text-[14px] font-medium border-t dark:border-[#1e1f22] rounded-b-md">
					<div className="hover:underline cursor-pointer" onClick={togglePopup}>
						Cancel
					</div>
					<button
						disabled={!(inputValue === appName)}
						type="submit"
						className={`${inputValue === appName ? 'bg-red-600 hover:bg-blue-800' : 'bg-red-300 dark:bg-[#8e3639] cursor-not-allowed'} text-white rounded-sm px-[20px] py-[9px] duration-300`}
					>
						Delete App
					</button>
				</div>
			</form>
		</div>
	);
};

export default DeleteAppPopup;
