import { selectCurrentChannelId, selectCurrentClanId, selectCurrentClanLogo, selectCurrentClanName } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { MAX_FILE_SIZE_1MB, ValidateSpecialCharacters, fileTypeImage, generateE2eId } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ELimitSize } from '../../../ModalValidateFile';
import { ModalErrorTypeUpload, ModalOverData } from '../../../ModalValidateFile/ModalOverData';

type ClanLogoNameProps = {
	onUpload: (url: string) => void;
	onGetClanName: (clanName: string) => void;
	resetTrigger?: boolean;
	onResetComplete?: () => void;
};

const ClanLogoName = ({ onUpload, onGetClanName, resetTrigger, onResetComplete }: ClanLogoNameProps) => {
	const { t } = useTranslation('clanSettings');
	const { sessionRef, clientRef } = useMezon();
	const currentClanLogo = useSelector(selectCurrentClanLogo);
	const currentClanName = useSelector(selectCurrentClanName);

	const currentClanId = useSelector(selectCurrentClanId) || '';
	const currentChannelId = useSelector(selectCurrentChannelId) || '';

	const [urlLogo, setUrlLogo] = useState<string | undefined>(currentClanLogo ?? '');
	const [clanName, setClanName] = useState<string | undefined>(currentClanName ?? '');
	const [checkValidate, setCheckValidate] = useState(!ValidateSpecialCharacters().test(currentClanName || ''));
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [openSizeModal, setOpenSizeModal] = useState<boolean>(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFile = (e: any) => {
		const file = e?.target?.files[0];
		const session = sessionRef.current;
		const client = clientRef.current;

		if (!file) return;
		if (file.size > MAX_FILE_SIZE_1MB) {
			setOpenSizeModal(true);
			return;
		}
		if (!client || !session) {
			throw new Error('Client or file is not initialized');
		}

		if (!fileTypeImage.includes(file.type)) {
			setOpenModal(true);
			e.target.value = null;
			return;
		}

		handleUploadFile(client, session, currentClanId, currentChannelId, file?.name, file).then((attachment: any) => {
			setUrlLogo(attachment.url ?? '');
			onUpload(attachment.url ?? '');
		});
	};

	const handleChangeClanName = (clanName: string) => {
		setClanName(clanName);
		onGetClanName(clanName);
		const regex = ValidateSpecialCharacters();

		if (clanName.length === 0 || clanName.length === 64 || !regex.test(clanName)) {
			setCheckValidate(true);
		} else {
			setCheckValidate(false);
		}
	};

	const handleOpenFile = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleCloseFile = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		if (urlLogo && fileInputRef.current) {
			setUrlLogo('');
			fileInputRef.current.value = '';
		}

		if (fileInputRef.current && !urlLogo) {
			fileInputRef.current.click();
		}
	};

	useEffect(() => {
		if (clanName === currentClanName) {
			setCheckValidate(false);
		}
	}, [clanName, currentClanName]);

	useEffect(() => {
		if (resetTrigger) {
			setUrlLogo(currentClanLogo ?? '');
			setClanName(currentClanName ?? '');
			onResetComplete?.();
		}
	}, [resetTrigger, currentClanLogo, currentClanName, onResetComplete]);

	return (
		<div className="flex sbm:flex-row flex-col gap-[10px]">
			<div className="flex flex-row flex-1 gap-x-[10px]">
				<div className="flex flex-2 gap-x-[10px]">
					<div className="flex flex-col">
						<div className="relative flex items-center justify-center w-[100px] h-[100px] rounded-full shadow border-theme-primary ">
							<label className="w-full h-full">
								<div
									style={{ backgroundImage: `url(${urlLogo})` }}
									className={`flex items-center justify-center bg-cover bg-no-repeat bg-center w-[100px] h-[100px] bg-transparent rounded-full relative cursor-pointer overflow-hidden`}
								>
									{!urlLogo && (
										<span
											className={
												'max-w-[70px] overflow-hidden text-theme-primary-active whitespace-nowrap text-lg max-h-[100px]'
											}
										>
											{currentClanName}
										</span>
									)}
								</div>
								<input
									ref={fileInputRef}
									id="upload_logo"
									onChange={(e) => handleFile(e)}
									type="file"
									className="hidden"
									data-e2e={generateE2eId('clan_page.settings.upload.clan_logo_input')}
								/>
							</label>
							<div className="absolute right-[-10px] top-0 p-[5px] text-theme-primary rounded-full z-50 shadow-xl border-theme-primary">
								<Icons.SelectFileIcon />
							</div>
						</div>
						<p className="text-[10px] mt-[10px]">{t('clanLogo.minimumSize')}</p>
					</div>
				</div>
				<div className="flex flex-3 flex-col ml-[10px]">
					<p className="text-sm mb-2">{t('clanLogo.recommendedSize')}</p>
					<button
						onClick={handleOpenFile}
						className="h-10 text-theme-primary-active text-sm w-fit flex items-center px-2 justify-center mt-2 rounded-lg btn-primary btn-primary-hover"
					>
						{t('clanLogo.uploadImage')}
					</button>
				</div>
			</div>
			<div className="flex flex-1 flex-col">
				<h3 className="text-xs font-bold uppercase mb-2">{t('clanLogo.clanName')}</h3>
				<div className="w-full">
					<input
						type="text"
						value={clanName}
						onChange={(e) => handleChangeClanName(e.target.value)}
						className=" outline-none w-full h-10 p-[10px] bg-theme-input text-base rounded placeholder:text-sm"
						data-e2e={generateE2eId('clan_page.settings.overview.input.clan_name')}
						placeholder={t('clanLogo.namePlaceholder')}
						maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED)}
					/>
				</div>
				{checkValidate && <p className="text-[#e44141] text-xs italic font-thin">{t('clanLogo.validationError')}</p>}
			</div>
			<ModalErrorTypeUpload open={openModal} onClose={() => setOpenModal(false)} />
			<ModalOverData size={ELimitSize.MB} open={openSizeModal} onClose={() => setOpenSizeModal(false)} />
		</div>
	);
};

export default ClanLogoName;
