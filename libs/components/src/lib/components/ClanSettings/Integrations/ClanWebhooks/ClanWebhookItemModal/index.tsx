import {
	selectCurrentClanId,
	selectMemberClanByUserId,
	settingClanStickerActions,
	updateClanWebhookById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { MAX_FILE_SIZE_8MB, fileTypeImage, generateE2eId, timeFormatI18n } from '@mezon/utils';
import type { ApiClanWebhook, ApiMessageAttachment, MezonUpdateClanWebhookByIdBody } from 'mezon-js/api.gen';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ELimitSize } from '../../../../ModalValidateFile';
import { ModalErrorTypeUpload, ModalOverData } from '../../../../ModalValidateFile/ModalOverData';
import ModalSaveChanges from '../../../ClanSettingOverview/ModalSaveChanges';
import DeleteClanWebhookPopup from './DeleteWebhookPopup';

interface IClanWebhookItemModalProps {
	webhookItem: ApiClanWebhook;
}

const ClanWebhookItemModal = ({ webhookItem }: IClanWebhookItemModalProps) => {
	const { t } = useTranslation('clanIntegrationsSetting');
	const { t: tCommon } = useTranslation('common');
	const [isExpand, setIsExpand] = useState(false);
	const webhookOwner = useAppSelector((state) => selectMemberClanByUserId(state, webhookItem.creator_id as string));
	return (
		<div className="bg-theme-setting-nav border-theme-primary p-[20px] border  rounded-md mb-[20px]">
			<div className="flex gap-[20px] items-center" data-e2e={generateE2eId('clan_page.settings.integrations.webhook_item')}>
				<img src={webhookItem.avatar} alt="Webhook avatar" className="aspect-square w-[50px] rounded-full" />
				<div className="flex w-full justify-between items-center text-theme-primary-active">
					<div className="">
						<div data-e2e={generateE2eId('clan_page.settings.integrations.webhook_item.webhook_title')}>{webhookItem.webhook_name}</div>
						<div className="flex gap-1 items-center"  data-e2e={generateE2eId('clan_page.settings.integrations.webhook_item.webhook_description')}>
							<Icons.ClockIcon className="text-theme-primary" />
							<div className="text-theme-primary text-[13px]">
								{t('webhooksItem.createdBy', {
									webhookCreateTime: timeFormatI18n(webhookItem.create_time || '', tCommon),
									webhookUserOwnerName: webhookOwner?.user?.username
								})}
							</div>
						</div>
					</div>
					<div
						onClick={() => setIsExpand(!isExpand)}
						className={`cursor-pointer transition duration-100 ease-in-out ${isExpand ? '' : '-rotate-90'}`}
						data-e2e={generateE2eId('clan_page.settings.integrations.navigate_webhook_button')}
					>
						<Icons.ArrowDown defaultSize="h-[30px] w-[30px] dark:text-[#b5bac1] text-black" />
					</div>
				</div>
			</div>
			{isExpand && <ExpendedClanWebhookModal webhookItem={webhookItem} />}
		</div>
	);
};

interface IExpendedClanWebhookModal {
	webhookItem: ApiClanWebhook;
}

interface IDataForUpdate {
	webhookNameInput: string | undefined;
	webhookAvatarUrl: string | undefined;
}

const ExpendedClanWebhookModal = ({ webhookItem }: IExpendedClanWebhookModal) => {
	const { t } = useTranslation('clanIntegrationsSetting');
	const dispatch = useAppDispatch();
	const [isShowPopup, setIsShowPopup] = useState(false);
	const openShowPopup = () => {
		dispatch(settingClanStickerActions.openModalInChild());
		setIsShowPopup(true);
	};

	const [openModal, setOpenModal] = useState<boolean>(false);
	const [openTypeModal, setOpenTypeModal] = useState<boolean>(false);

	const handleCloseDeletePopup = useCallback(() => {
		setIsShowPopup(false);
		modalRef?.current?.focus();
		dispatch(settingClanStickerActions.closeModalInChild());
	}, []);

	const handleCopyUrl = (url: string) => {
		navigator.clipboard
			.writeText(url)
			.then(() => {
				toast.success(t('webhooksEdit.copied'));
			})
			.catch((error) => {
				toast.error(t('toast.copyError'));
				console.error('Copy failed:', error);
			});
	};
	const { sessionRef, clientRef } = useMezon();
	const avatarRef = useRef<HTMLInputElement>(null);

	const [dataForUpdate, setDataForUpdate] = useState<IDataForUpdate>({
		webhookAvatarUrl: webhookItem.avatar,
		webhookNameInput: webhookItem.webhook_name
	});

	useEffect(() => {
		setDataForUpdate({
			webhookAvatarUrl: webhookItem.avatar,
			webhookNameInput: webhookItem.webhook_name
		});
	}, []);

	const [hasChange, setHasChange] = useState<boolean>(false);

	useEffect(() => {
		const computeHasChanges =
			dataForUpdate.webhookNameInput !== webhookItem.webhook_name || dataForUpdate.webhookAvatarUrl !== webhookItem.avatar;

		setHasChange(computeHasChanges);
	}, [dataForUpdate.webhookNameInput, dataForUpdate.webhookAvatarUrl, webhookItem.webhook_name, webhookItem.avatar]);

	const handleChooseFile = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const file = e.target.files[0];
			if (!file) return;
			if (file.size > MAX_FILE_SIZE_8MB) {
				setOpenModal(true);
				e.target.value = '';
				return;
			}
			if (!fileTypeImage.includes(file.type)) {
				setOpenTypeModal(true);
				e.target.value = '';
				return;
			}
			const client = clientRef.current;
			const session = sessionRef.current;
			if (!client || !session) {
				throw new Error('Client or file is not initialized');
			}
			handleUploadFile(client, session, e.target.files[0].name, e.target.files[0]).then((attachment: ApiMessageAttachment) => {
				setDataForUpdate({
					...dataForUpdate,
					webhookAvatarUrl: attachment.url
				});
			});
		}
	};
	const clanId = useSelector(selectCurrentClanId) as string;
	const handleEditWebhook = async () => {
		const request: MezonUpdateClanWebhookByIdBody = {
			avatar: dataForUpdate.webhookAvatarUrl,
			webhook_name: dataForUpdate.webhookNameInput,
			clan_id: clanId
		};
		await dispatch(
			updateClanWebhookById({
				request,
				webhookId: webhookItem.id,
				clanId
			})
		);
		setHasChange(false);
	};

	const handleResetToken = async () => {
		const request: MezonUpdateClanWebhookByIdBody = {
			avatar: dataForUpdate.webhookAvatarUrl,
			webhook_name: dataForUpdate.webhookNameInput,
			clan_id: clanId,
			reset_token: true
		};

		try {
			await dispatch(
				updateClanWebhookById({
					request,
					webhookId: webhookItem.id,
					clanId
				})
			);

			toast.success(t('toast.resetTokenSuccess'));
		} catch (error) {
			toast.error(t('toast.resetTokenError'));
		}
	};

	const handleResetChange = () => {
		setDataForUpdate({
			webhookAvatarUrl: webhookItem.avatar,
			webhookNameInput: webhookItem.webhook_name
		});
		setHasChange(false);
	};

	const modalRef = useRef<HTMLDivElement>(null);

	return (
		<>
			<div ref={modalRef} tabIndex={-1} className="pt-[20px] mt-[12px] border-t dark:border-[#3b3d44]">
				<div className="flex gap-2">
					<div className="w-3/12 dark:text-[#b5bac1] text-textLightTheme">
						<input
							onChange={handleChooseFile}
							ref={avatarRef}
							type="file"
							hidden
							data-e2e={generateE2eId('clan_page.settings.upload.clan_webhook_avatar_input')}
						/>
						<div className="relative w-fit">
							<div
								onClick={() => avatarRef.current?.click()}
								className="absolute right-0 top-0 p-[5px] bg-[#ffffff] rounded-full z-10 shadow-xl border cursor-pointer"
							>
								<Icons.SelectFileIcon />
							</div>
							<img
								src={dataForUpdate.webhookAvatarUrl}
								alt="Webhook avatar"
								className="aspect-square w-[100px] rounded-full hover:grayscale-[50%] cursor-pointer"
								onClick={() => avatarRef.current?.click()}
							/>
						</div>
						<div className="text-[10px] mt-[10px] text-center">{t('webhooksEdit.recommendImage')}</div>
					</div>
					<div className="w-9/12">
						<div className="flex gap-6 w-full">
							<div className="w-1/2">
								<div className="dark:text-[#b5bac1] text-textLightTheme text-[12px] mb-[10px]">
									<b>{t('webhooksEdit.name')}</b>
								</div>
								<input
									onChange={(e) =>
										setDataForUpdate({
											...dataForUpdate,
											webhookNameInput: e.target.value
										})
									}
									type="text"
									value={dataForUpdate.webhookNameInput}
									className="w-full bg-theme-setting-primary text-theme-primary rounded-sm outline-none h-[50px] px-[10px]"
								/>
							</div>
							<div className="w-1/2 dark:text-[#b5bac1] text-textLightTheme">
								<div
									onClick={() => handleResetToken()}
									className="mt-7 w-full  btn-primary btn-primary-hover cursor-pointer flex justify-center items-center rounded-lg outline-none h-[50px]"
								>
									{t('webhooksEdit.resetToken')}
								</div>
							</div>
						</div>
						<div className="max-sm:hidden block">
							<div className="border-t dark:border-[#3b3d44] my-[24px]" />
							<div className="flex items-center gap-[20px]">
								<div
									onClick={() => handleCopyUrl(webhookItem.url as string)}
									className="font-medium px-4 py-2 btn-primary btn-primary-hover rounded-lg  cursor-pointer "
								>
									{t('webhooksEdit.copy')} Webhook URL
								</div>
								<div onClick={openShowPopup} className="font-medium text-red-500 hover:underline cursor-pointer">
									{t('webhooksEdit.delete')} Webhook
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="max-sm:block hidden">
					<div className="border-t dark:border-[#3b3d44] my-[24px]" />
					<div className="flex items-center gap-[20px]">
						<div
							onClick={() => handleCopyUrl(webhookItem.url as string)}
							className="font-medium px-4 py-2 btn-primary btn-primary-hover rounded-lg  cursor-pointer"
						>
							{t('webhooksEdit.copy')} Clan Webhook URL
						</div>
						<div onClick={openShowPopup} className="font-medium text-red-500 hover:underline cursor-pointer">
							{t('webhooksEdit.delete')} Clan Webhook
						</div>
					</div>
				</div>
			</div>
			{hasChange && <ModalSaveChanges onSave={handleEditWebhook} onReset={handleResetChange} />}
			{isShowPopup && <DeleteClanWebhookPopup webhookItem={webhookItem} closeShowPopup={handleCloseDeletePopup} />}
			<ModalErrorTypeUpload open={openTypeModal} onClose={() => setOpenTypeModal(false)} />

			<ModalOverData open={openModal} onClose={() => setOpenModal(false)} size={ELimitSize.MB_8} />
		</>
	);
};

export default ClanWebhookItemModal;
