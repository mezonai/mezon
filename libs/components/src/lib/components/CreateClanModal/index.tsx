import { toChannelPage, useAppNavigation, useClans } from '@mezon/core';
import { channelsActions, checkDuplicateNameClan, selectAllClans, triggerClanLimitModal, useAppDispatch } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Button, ButtonLoading, Icons, InputField } from '@mezon/ui';
import { DEBOUNCE_TYPING_TIME, LIMIT_SIZE_UPLOAD_IMG, ValidateSpecialCharacters, checkClanLimit, fileTypeImage, generateE2eId } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import { ModalErrorTypeUpload, ModalLayout, ModalOverData } from '../../components';

export type ModalCreateClansProps = {
	open: boolean;
	onClose: () => void;
};

type openModalErrorProps = {
	errorType: boolean;
	errorSize: boolean;
};
enum EValidateListMessage {
	INVALID_NAME = 'INVALID_NAME',
	DUPLICATE_NAME = 'DUPLICATE_NAME',
	VALIDATED = 'VALIDATED'
}

const ModalCreateClans = (props: ModalCreateClansProps) => {
	const { t } = useTranslation('clan');
	const { onClose } = props;
	const [urlImage, setUrlImage] = useState('');
	const [nameClan, setNameClan] = useState('');
	const [checkvalidate, setCheckValidate] = useState<EValidateListMessage | null>(EValidateListMessage.INVALID_NAME);
	const { sessionRef, clientRef } = useMezon();
	const { navigate, toClanPage } = useAppNavigation();
	const { createClans } = useClans();
	const dispatch = useAppDispatch();
	const allClans = useSelector(selectAllClans);
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setNameClan(value);
		setCheckValidate(null);
		if (value) {
			debouncedSetClanName(value);
		} else {
			debouncedSetClanName.cancel();
			setCheckValidate(EValidateListMessage.INVALID_NAME);
		}
	};
	const debouncedSetClanName = useDebouncedCallback(async (value: string) => {
		const regex = ValidateSpecialCharacters();
		if (regex.test(value)) {
			await dispatch(checkDuplicateNameClan(value.trim()))
				.then(unwrapResult)
				.then((result) => {
					if (result) {
						setCheckValidate(EValidateListMessage.DUPLICATE_NAME);
						return;
					}
					setCheckValidate(EValidateListMessage.VALIDATED);
				});
			return;
		}
		setCheckValidate(EValidateListMessage.INVALID_NAME);
	}, DEBOUNCE_TYPING_TIME);

	const [openModalError, seOpenModalError] = useState<openModalErrorProps>({
		errorType: false,
		errorSize: false
	});
	const handleFile = (e: any) => {
		const file = e?.target?.files[0];
		const session = sessionRef.current;
		const client = clientRef.current;
		const sizeImage = file?.size;
		if (!file) return;
		if (!client || !session) {
			throw new Error('Client or file is not initialized');
		}
		const allowedTypes = fileTypeImage;
		if (!allowedTypes.includes(file.type)) {
			seOpenModalError((prev) => ({ ...prev, errorType: true }));
			e.target.value = null;
			return;
		}
		if (sizeImage > LIMIT_SIZE_UPLOAD_IMG) {
			seOpenModalError((prev) => ({ ...prev, errorSize: true }));
			e.target.value = null;
			return;
		}
		handleUploadFile(client, session, file?.name, file).then((attachment: any) => {
			setUrlImage(attachment.url ?? '');
		});
	};

	const handleCreateClan = async () => {
		const clanLimitCheck = checkClanLimit(allClans.length, 'create');

		if (!clanLimitCheck.canProceed) {
			handleClose();
			dispatch(triggerClanLimitModal({ type: 'create', clanCount: allClans.length }));
			return;
		}

		const res = await createClans(nameClan.trim(), urlImage);

		if (res && res.clan_id) {
			const result = await dispatch(channelsActions.fetchChannels({ clanId: res.clan_id, noCache: true }));
			const channels = (result?.payload as any)?.channels || [];
			if (channels.length > 0) {
				const firstChannel = channels[0];
				dispatch(
					channelsActions.setCurrentChannelId({
						clanId: res.clan_id,
						channelId: firstChannel.channel_id
					})
				);
				navigate(toChannelPage(firstChannel.channel_id, res.clan_id));
			} else {
				navigate(toClanPage(res.clan_id));
			}
		}
		handleClose();
	};

	const handleClose = useCallback(() => {
		onClose();
		setUrlImage('');
		setNameClan('');
	}, [onClose]);

	return (
		<ModalLayout onClose={handleClose}>
			<div className="bg-theme-setting-primary rounded-xl flex flex-col mx-4 md:mx-0" data-e2e={generateE2eId('clan_page.modal.create_clan')}>
				<div className="flex-1 flex items-center justify-end border-b-theme-primary rounded-t p-4">
					<Button
						className="rounded-full aspect-square w-6 h-6 text-5xl leading-3 !p-0 opacity-50 text-theme-primary-hover"
						onClick={handleClose}
					>
						×
					</Button>
				</div>
				<div className="flex flex-col px-5 py-4 max-w-[684px]">
					<div className="flex items-center flex-col justify-center ">
						<span className=" text-[24px] pb-4 font-[700] leading-8">{t('createClanModal.title')}</span>
						<p className="text-center text-[20px] leading-6 font-[400]">{t('createClanModal.description')}</p>
						<label className="block mt-8 mb-4">
							{urlImage ? (
								<img id="preview_img" className="h-[81px] w-[81px] object-cover rounded-full" src={urlImage} alt="Current profile" />
							) : (
								<div
									id="preview_img"
									className="h-[81px] w-[81px] flex justify-center bg-item-theme items-center flex-col  border-white relative border-[1px] border-dashed rounded-full cursor-pointer transform hover:scale-105 transition duration-300 ease-in-out"
								>
									<div className="absolute right-0 top-[-3px] left-[54px]">
										<Icons.AddIcon />
									</div>
									<Icons.UploadImage className="" />
									<span className="text-[14px]">{t('createClanModal.upload')}</span>
								</div>
							)}
							<input
								id="preview_img"
								type="file"
								onChange={(e) => handleFile(e)}
								className="w-full text-sm hidden"
								data-e2e={generateE2eId('clan_page.modal.create_clan.input.upload_avatar_clan')}
							/>
						</label>
						<div className="w-full">
							<span className="font-[700] text-[16px] leading-6">{t('createClanModal.clanName')}</span>
							<InputField
								onChange={handleInputChange}
								type="text"
								className="mb-2 mt-4 py-2"
								placeholder={t('createClanModal.placeholder')}
								maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED)}
								data-e2e={generateE2eId('clan_page.modal.create_clan.input.clan_name')}
							/>
							{checkvalidate !== EValidateListMessage.VALIDATED && (
								<p className="text-[#e44141] text-xs italic font-thin">
									{checkvalidate === EValidateListMessage.INVALID_NAME && t('createClanModal.invalidName')}
									{checkvalidate === EValidateListMessage.DUPLICATE_NAME && t('createClanModal.duplicateName')}
								</p>
							)}
							<span className="text-[14px]">
								{t('createClanModal.agreement')}{' '}
								<span className="text-contentBrandLight">{t('createClanModal.communityGuidelines')}</span>
								{'.'}
							</span>
						</div>
					</div>
					<ModalErrorTypeUpload
						open={openModalError.errorType}
						onClose={() => seOpenModalError((prev) => ({ ...prev, errorType: false }))}
					/>

					<ModalOverData open={openModalError.errorSize} onClose={() => seOpenModalError((prev) => ({ ...prev, errorSize: false }))} />
					<div className="flex items-center border-t border-solid dark:border-borderDefault rounded-b justify-between pt-4">
						<Button
							className="text-contentBrandLight px-4 py-2 background-transparent font-semibold text-sm outline-none focus:outline-none rounded-lg"
							onClick={onClose}
						>
							{t('createClanModal.back')}
						</Button>
						<ButtonLoading
							className={`font-semibold btn-primary btn-primary-hover text-sm px-4 py-2 shadow hover:shadow-lg rounded-lg ${checkvalidate !== EValidateListMessage.VALIDATED ? 'opacity-50 cursor-not-allowed' : ''}`}
							onClick={handleCreateClan}
							label={t('createClanModal.create')}
							disabled={checkvalidate !== EValidateListMessage.VALIDATED}
						/>
					</div>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ModalCreateClans;
