import { toChannelPage, useAppNavigation, useClans } from '@mezon/core';
import {
	channelsActions,
	checkDuplicateNameClan,
	selectAllClans,
	selectCurrentChannelId,
	selectCurrentClanId,
	triggerClanLimitModal,
	useAppDispatch
} from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Button, ButtonLoading, Icons, InputField } from '@mezon/ui';
import { DEBOUNCE_TYPING_TIME, LIMIT_SIZE_UPLOAD_IMG, ValidateSpecialCharacters, checkClanLimit, fileTypeImage, generateE2eId } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import { ModalLayout } from '../../components';

import ModalValidateFile, { ELimitSize } from '../ModalValidateFile';

export type ModalCreateClansProps = {
	open: boolean;
	onClose: () => void;
};

type openModalErrorProps = {
	errorType: boolean;
	errorSize: boolean;
};
enum EValidateListMessage {
	INVALID_NAME = 'Please enter a valid clan name (max 64 characters, only words, numbers, _ or -)',
	DUPLICATE_NAME = 'The clan name already exists. Please enter another name.',
	VALIDATED = 'VALIDATED'
}

const ModalCreateClans = (props: ModalCreateClansProps) => {
	const { onClose } = props;
	const [urlImage, setUrlImage] = useState('');
	const [nameClan, setNameClan] = useState('');
	const [checkvalidate, setCheckValidate] = useState<EValidateListMessage | null>(EValidateListMessage.INVALID_NAME);
	const { sessionRef, clientRef } = useMezon();
	const { navigate, toClanPage } = useAppNavigation();
	const { createClans } = useClans();
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const currentChannelId = useSelector(selectCurrentChannelId) || '';
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
		handleUploadFile(client, session, currentClanId || '0', currentChannelId || '0', file?.name, file).then((attachment: any) => {
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
			<div className="bg-theme-setting-primary rounded-xl flex flex-col" data-e2e={generateE2eId('clan_page.modal.create_clan')}>
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
						<span className=" text-[24px] pb-4 font-[700] leading-8">Customize Your Clan</span>
						<p className="  text-center text-[20px] leading-6 font-[400]">
							Give your new clan a personality with a name and an icon. You can always change it later.
						</p>
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
									<span className="text-[14px]">Upload</span>
								</div>
							)}
							<input id="preview_img" type="file" onChange={(e) => handleFile(e)} className="w-full text-sm hidden" />
						</label>
						<div className="w-full">
							<span className="font-[700] text-[16px] leading-6">CLAN NAME</span>
							<InputField
								onChange={handleInputChange}
								type="text"
								className="mb-2 mt-4 py-2"
								placeholder={`Enter the clan name`}
								maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED)}
								data-e2e={generateE2eId('clan_page.modal.create_clan.input.clan_name')}
							/>
							{checkvalidate !== EValidateListMessage.VALIDATED && (
								<p className="text-[#e44141] text-xs italic font-thin">{checkvalidate}</p>
							)}
							<span className="text-[14px] ">
								By creating a clan, you agree to Mezon's <span className="text-contentBrandLight">Community Guidelines</span>.
							</span>
						</div>
					</div>
					<ModalValidateFile
						open={openModalError.errorType}
						onClose={() => seOpenModalError((prev) => ({ ...prev, errorType: false }))}
						title={'Only image files are allowed'}
						content={`Just upload type file images, please!`}
					/>

					<ModalValidateFile
						open={openModalError.errorSize}
						onClose={() => seOpenModalError((prev) => ({ ...prev, errorSize: false }))}
						title={'Your files are too powerful'}
						content={`Max file size is ${ELimitSize.MB}, please!`}
					/>
					<div className="flex items-center border-t border-solid dark:border-borderDefault rounded-b justify-between pt-4">
						<Button
							className="text-contentBrandLight px-4 py-2 background-transparent font-semibold text-sm outline-none focus:outline-none rounded-lg"
							onClick={onClose}
						>
							Back
						</Button>
						<ButtonLoading
							className={`font-semibold btn-primary btn-primary-hover text-sm px-4 py-2 shadow hover:shadow-lg rounded-lg ${checkvalidate !== EValidateListMessage.VALIDATED ? 'opacity-50 cursor-not-allowed' : ''}`}
							onClick={handleCreateClan}
							label="Create"
							disabled={checkvalidate !== EValidateListMessage.VALIDATED}
						/>
					</div>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ModalCreateClans;
