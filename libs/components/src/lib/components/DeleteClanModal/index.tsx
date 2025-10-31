import { selectCurrentClanName } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface DeleteClanModalProps {
	onClose: () => void;
	title: string;
	buttonLabel: string;
	onClick?: () => void;
}

const DeleteClanModal: React.FC<DeleteClanModalProps> = ({ onClose, title, buttonLabel, onClick }) => {
	const { t } = useTranslation('deleteClan');
	const currentClanName = useSelector(selectCurrentClanName);
	const [inputValue, setInputValue] = useState('');
	const [inputValueIsMatchClanName, setInputValueIsMatchClanName] = useState(false);

	const handleOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		if (e.target.value === currentClanName) {
			setInputValueIsMatchClanName(true);
		} else if ((currentClanName || '').length < e.target.value.length && e.target.value !== currentClanName) {
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
					<div className="text-xl font-semibold text-theme-primary-active" data-e2e="permission-denied">
						{title}
					</div>
					<div className="bg-[#f0b132] text-theme-message rounded-sm p-[10px]">{t('confirmMessage')}</div>
					<div className="mb-[15px]">
						<div className=" text-base">{t('enterClanName')}</div>
						<input
							type="text"
							className="w-full bg-input-secondary border-theme-primary text-theme-message rounded-lg outline-none p-[10px] my-[7px]"
							value={inputValue}
							onChange={handleOnchange}
							data-e2e={generateE2eId('clan_page.settings.modal.delete_clan.input')}
						/>
						{!inputValueIsMatchClanName ? <div className="text-[#fa777c] text-xs font-semibold">{t('incorrectName')}</div> : ''}
					</div>
				</div>
				<div className="bottom-block flex justify-end p-[16px]  items-center gap-[20px] font-semibold rounded-[5px]">
					<div
						onClick={onClose}
						className="cursor-pointer hover:underline"
						data-e2e={generateE2eId('clan_page.settings.modal.delete_clan.cancel')}
					>
						{t('cancel')}
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
