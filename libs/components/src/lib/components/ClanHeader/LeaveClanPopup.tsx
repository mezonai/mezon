import { useTranslation } from 'react-i18next';

interface ILeaveClanPopupProps {
	handleCancel: () => void;
	handleLeave: () => void;
	leaveName?: string;
	leaveTitle: string;
}

const LeaveClanPopup = ({ handleCancel, handleLeave, leaveTitle, leaveName }: ILeaveClanPopupProps) => {
	const { t } = useTranslation('clan');
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
			<div className="fixed inset-0 bg-black opacity-80" />
			<div className="relative z-10 w-[440px]">
				<div className="bg-theme-setting-primary pt-[16px] px-[16px]">
					<div className=" text-[20px] font-semibold pb-[16px]">{t('leaveClanModal.title', { clanName: leaveName })}</div>
					<div className="pb-[20px]">{t('leaveClanModal.description', { clanName: leaveName })}</div>
				</div>
				<div className="bg-theme-setting-nav  flex justify-end items-center gap-4 p-[16px] text-[14px] font-medium">
					<div onClick={handleCancel} className="hover:underline cursor-pointer">
						{t('leaveClanModal.cancel')}
					</div>
					<div className="bg-red-600 hover:bg-red-700 text-white rounded-sm px-[25px] py-[8px] cursor-pointer" onClick={handleLeave}>
						{leaveTitle}
					</div>
				</div>
			</div>
		</div>
	);
};

export default LeaveClanPopup;
