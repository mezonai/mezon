import { selectCurrentClan } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

interface DeleteClanModalProps {
	onClose: () => void;
	title: string;
	buttonLabel: string;
	onClick?: () => void;
}

const DeleteClanModal: React.FC<DeleteClanModalProps> = ({ onClose, title, buttonLabel, onClick }) => {
	const currentClan = useSelector(selectCurrentClan);
	const [inputValue, setInputValue] = useState('');
	const [inputValueIsMatchClanName, setInputValueIsMatchClanName] = useState(false);

	const handleOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		if (e.target.value === currentClan?.clan_name) {
			setInputValueIsMatchClanName(true);
		} else if ((currentClan?.clan_name || '').length < e.target.value.length && e.target.value !== currentClan?.clan_name) {
			setInputValueIsMatchClanName(false);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (inputValueIsMatchClanName && onClick) {
			onClick();
			onClose();
			return;
		}
	};
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 ">
			<div className="fixed inset-0 bg-black opacity-80"></div>
			<form className="relative z-10 bg-theme-setting-primary rounded-[5px]" onSubmit={handleSubmit}>
				<div className="top-block p-[16px]  flex flex-col gap-[15px]">
					<div className="text-xl font-semibold text-theme-primary-active">{title}</div>
					<div className="bg-[#f0b132] text-theme-message rounded-sm p-[10px]">
						Are you sure you want to delete this clan? This action cannot be undone.
					</div>
					<div className="mb-[15px]">
						<div className=" text-base">Enter clan name</div>
						<input
							type="text"
							className="w-full bg-input-secondary border-theme-primary text-theme-message rounded-lg outline-none p-[10px] my-[7px]"
							value={inputValue}
							onChange={handleOnchange}
							data-e2e={generateE2eId('clan_page.settings.modal.delete_clan.input')}
						/>
						{!inputValueIsMatchClanName ? (
							<div className="text-[#fa777c] text-xs font-semibold">You didn't enter the clan name correctly</div>
						) : (
							''
						)}
					</div>
				</div>
				<div className="bottom-block flex justify-end p-[16px]  items-center gap-[20px] font-semibold rounded-[5px]">
					<div
						onClick={onClose}
						className="cursor-pointer hover:underline"
						data-e2e={generateE2eId('clan_page.settings.modal.delete_clan.cancel')}
					>
						Cancel
					</div>
					<div
						onClick={handleSubmit}
						className={`bg-[#da373c] text-white  rounded-md px-4 py-2 cursor-pointer ${!inputValueIsMatchClanName ? '!cursor-default opacity-70 ' : 'hover:bg-[#a12828]'}`}
						data-e2e={generateE2eId('clan_page.settings.modal.delete_clan.confirm')}
					>
						{buttonLabel}
					</div>
				</div>
			</form>
		</div>
	);
};

export default DeleteClanModal;
