import { useEscapeKey } from '@mezon/core';
import { useEffect } from 'react';

interface ModalConfirmProps {
	handleCancel: () => void;
	handleConfirm: () => void;
	/**  Recommend lowercase */
	title?: string;
	modalName?: string;
	buttonName?: string;
	buttonColor?: string;
	message?: string;
	customModalName?: string;
}

const ModalConfirm = ({
	handleCancel,
	title = 'Title Modal',
	buttonName = 'OK',
	modalName,
	handleConfirm,
	buttonColor,
	message = `You won’t be able to re-join this
            server unless you are re-invited.`,
	customModalName
}: ModalConfirmProps) => {
	useEffect(() => {
		const handleEnterKey = (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				handleConfirm();
			}
		};

		document.addEventListener('keydown', handleEnterKey);
		return () => {
			document.removeEventListener('keydown', handleEnterKey);
		};
	}, [handleConfirm]);

	useEscapeKey(handleCancel);

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
			<div className="fixed inset-0 bg-black opacity-80" />
			<div className="relative z-10 w-[440px]">
				<div className="dark:bg-[#313338] bg-white pt-[16px] px-[16px] rounded-t-md">
					<div className="dark:text-textDarkTheme text-textLightTheme text-[20px] font-semibold pb-[16px]">
						<span className="capitalize mr-1">{title}</span>
						{customModalName ? customModalName : modalName}
					</div>
					<div className="dark:text-[#dbdee1] text-textLightTheme pb-[20px]">
						Are you sure you want to {title} <b className="font-semibold">{modalName}</b>? {message}
					</div>
				</div>
				<div className="dark:bg-[#2b2d31] bg-[#f2f3f5] dark:text-textDarkTheme text-textLightTheme flex justify-end items-center gap-4 p-[16px] text-[14px] font-medium rounded-b-md">
					<div onClick={handleCancel} className="hover:underline cursor-pointer">
						Cancel
					</div>
					<div
						className={`bg-red-600 hover:bg-red-700 text-white rounded-sm px-[25px] py-[8px] cursor-pointer ${buttonColor}`}
						onClick={handleConfirm}
					>
						{buttonName}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ModalConfirm;
