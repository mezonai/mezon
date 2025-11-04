import { ModalSaveChanges } from '@mezon/components';
import { editApplication, fetchApplications, selectAppDetail, useAppDispatch } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import type { ApiApp, ApiMessageAttachment, MezonUpdateAppBody } from 'mezon-js/api.gen';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import ToggleItem from '../../components/ToggleItem';
import { APP_TYPES } from '../../constants/constants';
import DeleteAppPopup from '../applications/DeleteAppPopup';

const GeneralInformation = () => {
	const { t } = useTranslation('adminApplication');
	const { sessionRef, clientRef } = useMezon();
	const appId = useParams().applicationId as string;
	const appDetail = useSelector(selectAppDetail);
	const dispatch = useAppDispatch();

	const [appLogoUrl, setAppLogoUrl] = useState(appDetail.applogo);
	const appLogoRef = useRef<HTMLInputElement>(null);
	const [hasChanges, setHasChanges] = useState(false);

	useEffect(() => {
		setAppLogoUrl(appDetail.applogo);
		setHasChanges(false);
	}, [appId, appDetail.applogo]);

	useEffect(() => {
		setHasChanges(appLogoUrl !== appDetail.applogo);
	}, [appLogoUrl, appDetail.applogo]);

	const handleResetChange = () => {
		setAppLogoUrl(appDetail.applogo);
		setHasChanges(false);
	};

	const handleChooseFile = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const client = clientRef.current;
			const session = sessionRef.current;
			if (!client || !session) {
				throw new Error(t('generalInformation.errors.clientNotInitialized'));
			}
			handleUploadFile(client, session, '', '', e.target.files[0].name, e.target.files[0]).then((attachment: ApiMessageAttachment) => {
				setAppLogoUrl(attachment.url);
			});
		}
	};

	const handleClearLogo = () => {
		setAppLogoUrl('');
	};

	const handleEditApp = async () => {
		const updateRequest: MezonUpdateAppBody = {};

		if (appLogoUrl !== appDetail.applogo) {
			updateRequest.applogo = appLogoUrl;
		}

		if (Object.keys(updateRequest).length === 0) return;

		await dispatch(editApplication({ request: updateRequest, appId }));
		await dispatch(fetchApplications({ noCache: true }));
		setHasChanges(false);
	};

	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-col gap-4">
				<div className="text-[24px] font-semibold">{t('generalInformation.title')}</div>
				<div className="text-[20px]">{t('generalInformation.subtitle')}</div>
				<div>
					{t('generalInformation.agreement.text')}{' '}
					<span className="cursor-pointer text-blue-700 hover:text-blue-400 hover:underline">
						{t('generalInformation.agreement.adminTerms')}
					</span>{' '}
					{t('generalInformation.agreement.and')}{' '}
					<span className="cursor-pointer text-blue-700 hover:text-blue-400 hover:underline">
						{t('generalInformation.agreement.adminPolicy')}
					</span>
					.
				</div>
			</div>
			<div className="flex gap-5 max-md:flex-col">
				<div className="flex flex-col gap-2 w-fit">
					<div className="text-[12px] uppercase font-semibold">{t('generalInformation.appIcon.label')}</div>
					<div className="w-fit flex flex-col items-center p-5 gap-4 bg-[#f2f3f5] dark:bg-[#2b2d31] border dark:border-[#4d4f52] rounded-md">
						<input type="file" hidden ref={appLogoRef} onChange={handleChooseFile} />
						<div className="relative w-[144px] cursor-pointer" onClick={() => appLogoRef.current?.click()}>
							{appLogoUrl ? (
								<img
									className="aspect-square w-full hover:grayscale-[50%]"
									style={{ borderRadius: '25px' }}
									src={appLogoUrl}
									alt={appDetail.appname}
								/>
							) : (
								<div
									className="select-none aspect-square w-full flex justify-center items-center bg-bgLightModeThird dark:bg-[#141416] hover:bg-[#c6ccd2]"
									style={{ borderRadius: '25px' }}
								>
									{appDetail.appname && appDetail.appname.charAt(0).toUpperCase()}
								</div>
							)}
							<div className="absolute right-[-5px] top-[-5px] p-[8px] bg-[#e3e5e8] rounded-full z-10 shadow-xl border">
								<Icons.SelectFileIcon className="w-6 h-6" />
							</div>
						</div>
						{appLogoUrl ? (
							<div className="text-blue-600 cursor-pointer" onClick={handleClearLogo}>
								{t('generalInformation.appIcon.remove')}
							</div>
						) : (
							<div className="text-[10px]">{t('generalInformation.appIcon.size', { size: '1024x1024' })}</div>
						)}
					</div>
				</div>
				<AppDetailRight appDetail={appDetail} appId={appId as string} />
				{hasChanges && <ModalSaveChanges onReset={handleResetChange} onSave={handleEditApp} />}
			</div>
		</div>
	);
};

interface IAppDetailRightProps {
	appDetail: ApiApp;
	appId: string;
}

const AppDetailRight = ({ appDetail, appId }: IAppDetailRightProps) => {
	const { t } = useTranslation('adminApplication');
	const [changeName, setChangeName] = useState(appDetail.appname);
	const [changeUrl, setChangeUrl] = useState(appDetail.app_url);
	const [changeAboutApp, setChangeAboutApp] = useState(appDetail.about);
	const [changeBotShadow, setChangeBotShadow] = useState<boolean>(false);
	const [isShowDeletePopup, setIsShowDeletePopup] = useState(false);
	const [openSaveChange, setOpenSaveChange] = useState(false);
	const [isUrlValid, setIsUrlValid] = useState(true);
	const [visibleToken, setVisibleToken] = useState<string | null>(null);
	const [tokenCopied, setTokenCopied] = useState(false);
	const [idCopied, setIdCopied] = useState(false);
	const dispatch = useAppDispatch();

	const [nameChanged, setNameChanged] = useState(false);
	const [urlChanged, setUrlChanged] = useState(false);
	const [aboutChanged, setAboutChanged] = useState(false);

	const [shadowModified, setShadowModified] = useState(false);

	const updateSaveChangeState = useCallback(() => {
		if (nameChanged || urlChanged || aboutChanged) {
			setOpenSaveChange(true);
		} else {
			setOpenSaveChange(false);
		}
	}, [nameChanged, urlChanged, aboutChanged]);

	useEffect(() => {
		updateSaveChangeState();
	}, [nameChanged, urlChanged, aboutChanged, updateSaveChangeState]);

	useEffect(() => {
		const savedToken = localStorage.getItem(`app_token_${appId}`);
		if (savedToken) {
			setVisibleToken(savedToken);
			localStorage.removeItem(`app_token_${appId}`);
		}
	}, [appId]);

	useEffect(() => {
		setChangeName(appDetail.appname);
		setChangeUrl(appDetail.app_url);
		setChangeAboutApp(appDetail.about);

		if (!shadowModified) {
			let isShadow = false;
			if (appDetail.is_shadow === true) {
				isShadow = true;
			}
			setChangeBotShadow(isShadow);
		}

		setNameChanged(false);
		setUrlChanged(false);
		setAboutChanged(false);
	}, [appDetail, shadowModified]);

	const toggleDeletePopup = () => {
		setIsShowDeletePopup(!isShowDeletePopup);
	};

	const handleOpenSaveChangeForName = (e: ChangeEvent<HTMLInputElement>) => {
		setChangeName(e.target.value);
		const isChanged = e.target.value !== appDetail.appname;
		setNameChanged(isChanged);
	};

	const handleOpenSaveChangeForBotShadow = (value: string) => {
		const checked = value === 'true';
		setChangeBotShadow(checked);
		setShadowModified(true);
		setOpenSaveChange(true);
	};

	const handleOpenSaveChangeForUrl = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setChangeUrl(value);

		try {
			new URL(value);
			setIsUrlValid(true);
		} catch {
			setIsUrlValid(false);
		}

		const isChanged = value !== appDetail.app_url;
		setUrlChanged(isChanged);
	};

	const handleOpenSaveChangeAboutApp = (e: ChangeEvent<HTMLTextAreaElement>) => {
		const newAbout = e.target.value;
		setChangeAboutApp(newAbout);

		const isChanged = newAbout !== appDetail.about;
		setAboutChanged(isChanged);
	};

	const handleResetChange = () => {
		setChangeName(appDetail.appname);
		setChangeUrl(appDetail.app_url);
		setChangeAboutApp(appDetail.about);

		let isShadow = false;
		if (appDetail.is_shadow === true) {
			isShadow = true;
		}
		setChangeBotShadow(isShadow);

		setShadowModified(false);

		setNameChanged(false);
		setUrlChanged(false);
		setAboutChanged(false);

		setOpenSaveChange(false);
	};

	const handleEditAppOrBot = async () => {
		const updateRequest: MezonUpdateAppBody = {};

		if (changeName !== appDetail.appname) {
			updateRequest.appname = changeName;
		}

		if (changeUrl !== appDetail.app_url) {
			updateRequest.app_url = changeUrl;
		}

		if (changeAboutApp !== appDetail.about) {
			updateRequest.about = changeAboutApp;
		}

		(updateRequest as MezonUpdateAppBody & { is_shadow: string }).is_shadow = changeBotShadow ? 'true' : 'false';

		if (Object.keys(updateRequest).length === 0) return;

		const response = await dispatch(editApplication({ request: updateRequest, appId })).unwrap();

		if (response?.token) {
			setVisibleToken(response.token);
		}

		await dispatch(fetchApplications({ noCache: true }));

		setNameChanged(false);
		setUrlChanged(false);
		setAboutChanged(false);
		setOpenSaveChange(false);
	};

	const handleCopyUrl = (url: string) => {
		navigator.clipboard.writeText(url);
		if (url === visibleToken) {
			setTokenCopied(true);
			setTimeout(() => setTokenCopied(false), 1000);
		}
	};

	const handleCopyID = (id: string) => {
		navigator.clipboard.writeText(id);
		setIdCopied(true);
		setTimeout(() => setIdCopied(false), 1000);
	};

	const handleResetToken = async () => {
		try {
			const updateRequest: MezonUpdateAppBody = { token: 'reset' };
			const response = await dispatch(editApplication({ request: updateRequest, appId })).unwrap();

			if (response?.token) {
				setVisibleToken(response.token);
			}
		} catch (error) {
			console.error(t('generalInformation.errors.resetTokenFailed'), error);
		}
	};

	const setAppOrBot = appDetail.app_url ? APP_TYPES.APPLICATION : APP_TYPES.BOT;

	return (
		<div className="flex-1 flex flex-col gap-7">
			<div className="w-full flex flex-col gap-2">
				<div className="text-[12px] uppercase font-semibold">{t('generalInformation.form.name')}</div>
				<input
					value={changeName}
					className="w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] p-[10px] outline-primary dark:bg-[#1e1f22]"
					type="text"
					onChange={handleOpenSaveChangeForName}
				/>
			</div>

			{appDetail.app_url ? (
				<div className="w-full flex flex-col gap-2">
					<div className="text-[12px] uppercase font-semibold">{t('generalInformation.form.url')}</div>
					<input
						value={changeUrl}
						className="w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] p-[10px] outline-primary dark:bg-[#1e1f22]"
						type="text"
						onChange={handleOpenSaveChangeForUrl}
					/>
					{!isUrlValid && <div className="text-red-500 text-sm">{t('generalInformation.errors.invalidUrl')}</div>}
				</div>
			) : (
				<ToggleItem
					label={t('generalInformation.form.botShadow')}
					value={changeBotShadow ? 'true' : 'false'}
					handleToggle={handleOpenSaveChangeForBotShadow}
				/>
			)}

			{openSaveChange && isUrlValid && <ModalSaveChanges onReset={handleResetChange} onSave={handleEditAppOrBot} />}

			<div className="flex flex-col gap-2">
				<div className="text-[12px] uppercase font-semibold">{t('generalInformation.form.description.label')}</div>
				<div className="text-[14px]">{t('generalInformation.form.description.subtitle', { type: setAppOrBot })}</div>
				<textarea
					className="w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] min-h-[120px] max-h-[120px] p-[10px] outline-primary dark:bg-[#1e1f22]"
					placeholder={t('generalInformation.form.description.placeholder', { type: setAppOrBot })}
					onChange={handleOpenSaveChangeAboutApp}
					value={changeAboutApp}
				></textarea>
			</div>

			<div className="text-[12px] font-semibold flex flex-col gap-2">
				<div className="uppercase">{t('generalInformation.form.appId', { type: setAppOrBot })}</div>
				<div>{appId}</div>
				<div
					onClick={() => handleCopyID(appId)}
					className={`py-[7px] px-[16px] rounded-xl ${
						idCopied ? 'bg-gray-500' : 'bg-indigo-600  hover:bg-indigo-700'
					} cursor-pointer w-fit text-[15px] text-white rounded-xl flex items-center justify-center`}
				>
					{idCopied ? t('generalInformation.buttons.copied') : t('generalInformation.buttons.copy')}
				</div>
			</div>

			<div className="text-[12px] font-semibold flex flex-col gap-2">
				<div className="uppercase">{t('generalInformation.form.appToken', { type: setAppOrBot })}</div>
				{visibleToken ? (
					<div className="text-gray-500  rounded-sm mt-1">
						<span className="text-sm text-red-500">{t('generalInformation.token.newTokenWarning')}</span>
						<div className="mt-2 font-mono break-all">{visibleToken}</div>
					</div>
				) : (
					<div className=" mt-1">
						<span className="text-sm text-gray-500">{t('generalInformation.token.securityInfo')}</span>
					</div>
				)}{' '}
				{visibleToken && (
					<div
						onClick={() => handleCopyUrl(visibleToken)}
						className={`mt-2 py-[7px] px-[16px] ${
							tokenCopied ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-800'
						} flex items-center justify-center cursor-pointer w-fit text-[15px] text-white rounded-xl ${
							openSaveChange ? 'pointer-events-none opacity-50' : ''
						}`}
					>
						{tokenCopied ? t('generalInformation.buttons.copied') : t('generalInformation.buttons.copyToken')}
					</div>
				)}
				<div
					onClick={handleResetToken}
					className={`py-[7px] px-[16px]  flex items-center justify-center bg-indigo-600 hover:bg-indigo-700  cursor-pointer w-[130px] text-[15px] text-white rounded-xl ${
						openSaveChange ? 'pointer-events-none opacity-50' : ''
					}`}
				>
					{t('generalInformation.buttons.resetToken')}
				</div>
			</div>

			<div className="flex justify-end">
				<div
					onClick={toggleDeletePopup}
					className={`text-[15px] px-4 py-[10px] text-white bg-red-600 hover:bg-red-800 cursor-pointer rounded-xl w-fit ${
						openSaveChange ? 'pointer-events-none opacity-50' : ''
					}`}
				>
					{t('generalInformation.buttons.delete')} {setAppOrBot}
				</div>
			</div>
			{isShowDeletePopup && <DeleteAppPopup appId={appId} appName={appDetail.appname as string} togglePopup={toggleDeletePopup} />}
		</div>
	);
};
export default GeneralInformation;
