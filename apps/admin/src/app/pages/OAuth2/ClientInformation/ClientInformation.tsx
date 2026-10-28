import type { IApplicationEntity } from '@mezon/store';
import { editMezonOauthClient, fetchMezonOauthClient, useAppDispatch } from '@mezon/store';
import type { ApiMezonOauthClient } from 'mezon-js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

interface IClientInformationProps {
	currentApp: IApplicationEntity;
}

const ClientInformation = ({ currentApp }: IClientInformationProps) => {
	const { t } = useTranslation('adminApplication');
	const [isShowResetSecretPO, setIsShowSecretPO] = useState(false);
	const dispatch = useAppDispatch();
	const [idCopied, setIdCopied] = useState(false);
	useEffect(() => {
		if (currentApp?.id) {
			dispatch(fetchMezonOauthClient({ appId: currentApp.id, appName: currentApp.appname }));
		}
	}, [currentApp?.id, currentApp?.appname, dispatch]);

	const toggleResetSecretePopup = () => {
		const redirectUris = currentApp?.oAuthClient?.redirect_uris;
		if (!redirectUris || redirectUris.length === 0 || redirectUris.every((uri) => !uri || uri.trim() === '')) {
			toast.warning(t('clientInformation.toasts.addRedirectUri'));
			return;
		}
		setIsShowSecretPO(!isShowResetSecretPO);
	};

	const handleCopyUrl = (url: string) => {
		navigator.clipboard.writeText(url);
		setIdCopied(true);
		setTimeout(() => {
			setIdCopied(false);
		}, 2000);
	};

	return (
		<div className="rounded-md dark:bg-bgSecondary bg-bgLightSecondary p-5 dark:text-textPrimary text-colorTextLightMode flex flex-col gap-2">
			{isShowResetSecretPO && (
				<ResetSecretPopup handleClosePopup={toggleResetSecretePopup} currentApp={currentApp} handleCopyKey={handleCopyUrl} />
			)}
			<div className="text-black dark:text-white font-medium text-xl">{t('clientInformation.title')}</div>
			<div className="flex flex-col gap-5">
				<div className="flex gap-5 max-md:flex-col">
					<div className="flex flex-col gap-2 xl:w-1/3 max-xl:w-1/2">
						<div className="uppercase text-black dark:text-white font-bold text-xs">{t('clientInformation.clientId')}</div>
						<div className="text-black dark:text-white font-bold text-xs">{currentApp?.oAuthClient?.client_id}</div>
						<button
							onClick={() => handleCopyUrl(currentApp?.oAuthClient?.client_id as string)}
							className={`py-[7px] px-4 cursor-pointer ${
								idCopied ? 'bg-gray-500' : 'bg-indigo-600  hover:bg-indigo-700'
							} transition-colors rounded-lg w-fit select-none font-medium text-white`}
						>
							{idCopied ? t('clientInformation.buttons.copied') : t('clientInformation.buttons.copy')}
						</button>
					</div>
					<div className="flex flex-col gap-2 xl:w-1/3 max-xl:w-1/2">
						<div className="uppercase text-black dark:text-white font-bold text-xs">{t('clientInformation.clientSecret')}</div>
						<div className="text-xs">{t('clientInformation.hiddenForSecurity')}</div>
						<div
							onClick={toggleResetSecretePopup}
							className="py-[7px] px-4 cursor-pointer transition-colors rounded-lg w-fit select-none font-medium dark:text-white text-black dark:hover:bg-[#35373c] dark:bg-[#3b3d44] hover:bg-[#dfe1e5] bg-[#d7d9dc]"
						>
							{t('clientInformation.resetSecret')}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

enum PASSWORD_LENGTH {
	SIXTEEN_CHARS = 16,
	THIRTY_TWO_CHARS = 32
}

const generateRandomPassword = () => {
	const symbols = '!@#$%&*_+=[]{}|;:,.<>';
	const numbers = '0123456789';
	const lowercase = 'abcdefghijklmnopqrstuvwxyz';
	const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

	const allChars = symbols + numbers + lowercase + uppercase;
	let password = '';

	for (let i = 0; i < PASSWORD_LENGTH.THIRTY_TWO_CHARS; i++) {
		const randomIndex = Math.floor(Math.random() * allChars.length);
		password += allChars[randomIndex];
	}

	return password;
};

interface IResetSecretPopupProps {
	handleClosePopup: () => void;
	currentApp: IApplicationEntity;
	handleCopyKey: (url: string) => void;
}

const ResetSecretPopup = ({ handleClosePopup, currentApp, handleCopyKey: _handleCopyKey }: IResetSecretPopupProps) => {
	const { t } = useTranslation('adminApplication');
	const dispatch = useAppDispatch();
	const [newSecretKey] = useState(() => generateRandomPassword());
	const [tokenCopied, setTokenCopied] = useState(false);
	const handleSaveSecretKey = async () => {
		const request: ApiMezonOauthClient = {
			...currentApp?.oAuthClient,
			client_secret: newSecretKey
		};
		await dispatch(editMezonOauthClient({ body: request }));
		handleClosePopup();
	};
	const handleCoppyKey = (url: string) => {
		navigator.clipboard.writeText(url);
		setTokenCopied(true);
		setTimeout(() => setTokenCopied(false), 1000);
	};
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
			<div onClick={handleClosePopup} className="fixed inset-0 bg-black opacity-80" />
			<div className="relative z-10 w-[440px]">
				<div className="dark:bg-[#313338] bg-white pt-[16px] px-[16px] rounded-t-md">
					<div className="dark:text-textDarkTheme text-textLightTheme text-[20px] font-semibold pb-[16px]">
						{t('clientInformation.resetSecretPopup.title')}
					</div>
					<div className="flex flex-col gap-4">
						<div className="dark:text-[#dbdee1] text-textLightTheme pb-[20px]">{t('clientInformation.resetSecretPopup.warning')}</div>
						<div className="relative">
							<div className="bg-bgLightModeThird dark:bg-[#1e1f22] border border-bgSelectItemHover p-[10px] mb-2 rounded-lg">
								{newSecretKey}
							</div>
							<button
								onClick={() => handleCoppyKey(newSecretKey)}
								className={`absolute right-2 top-2 text-sm py-[5px] px-[6px] cursor-pointer ${tokenCopied ? 'bg-gray-600 hover:bg-gray-700' : 'bg-indigo-600  hover:bg-indigo-700 '}  transition-colors rounded-lg w-fit select-none font-medium text-white`}
							>
								{tokenCopied ? t('clientInformation.buttons.copied') : t('clientInformation.buttons.copy')}
							</button>
						</div>
					</div>
				</div>
				<div className="dark:bg-slate-800 bg-slate-400  rounded-b-md dark:text-textDarkTheme text-textLightTheme flex justify-end items-center gap-4 p-[16px] text-[14px] font-medium">
					<div onClick={handleClosePopup} className="hover:underline cursor-pointer">
						{t('clientInformation.resetSecretPopup.nevermind')}
					</div>
					<div
						className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-[25px] py-[8px] cursor-pointer"
						onClick={handleSaveSecretKey}
					>
						{t('clientInformation.resetSecretPopup.confirm')}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ClientInformation;
