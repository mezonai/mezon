import { useEscapeKeyClose } from '@mezon/core';
import { deleteClanWebhookById, hasGrandchildModal, selectCurrentClanId, settingClanStickerActions, useAppDispatch } from '@mezon/store';
import type { ApiClanWebhook, ApiWebhook } from 'mezon-js/api.gen';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface IDeleteClanWebhookPopupProps {
	closeShowPopup: () => void;
	webhookItem: ApiWebhook;
}

const DeleteClanWebhookPopup = ({ webhookItem, closeShowPopup }: IDeleteClanWebhookPopupProps) => {
	const { t } = useTranslation('clanIntegrationsSetting');
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const handleDeleteClanWebhook = (webhook: ApiClanWebhook) => {
		dispatch(
			deleteClanWebhookById({
				webhook,
				clanId: currentClanId as string
			})
		);
		closeShowPopup();
	};

	const isChildModal = useSelector(hasGrandchildModal);

	const handleUseEscapeKey = useCallback(() => {
		if (isChildModal) {
			closeShowPopup();
			setTimeout(() => {
				dispatch(settingClanStickerActions.closeModalInChild());
			}, 0);
		}
	}, []);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, handleUseEscapeKey);

	return (
		<div ref={modalRef} tabIndex={-1} className="fixed inset-0 flex items-center justify-center z-50">
			<div className="fixed inset-0 bg-black opacity-80" />
			<div className="relative z-10 w-[440px]">
				<div className="bg-theme-setting-primary pt-[16px] px-[16px]">
					<div className=" text-[20px] font-semibold pb-[16px]">{t('webhooksEdit.deleteCaptionHook')}</div>
					<div className=" pb-[20px]">{t('webhooksEdit.deleteWebhookConfirmation', { webhookName: webhookItem.webhook_name })}</div>
				</div>
				<div className="bg-theme-setting-nav  flex justify-end items-center gap-4 p-[16px] text-[14px] font-medium">
					<div onClick={closeShowPopup} className="hover:underline cursor-pointer">
						{t('webhooksEdit.cancel')}
					</div>
					<div
						onClick={() => handleDeleteClanWebhook(webhookItem)}
						className="bg-red-600 hover:bg-red-700 text-white rounded-sm px-[25px] py-[8px] cursor-pointer"
					>
						{t('webhooksEdit.delete')}
					</div>
				</div>
			</div>
		</div>
	);
};

export default DeleteClanWebhookPopup;
