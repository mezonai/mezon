import { ModalSaveChanges } from '@mezon/components';
import { editApplication, fetchApplications, selectAppDetail, useAppDispatch } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { ApiApp, ApiMessageAttachment, MezonUpdateAppBody } from 'mezon-js/api.gen';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { APP_TYPES } from '../../constants/constants';
import DeleteAppPopup from '../applications/DeleteAppPopup';

const GeneralInformation = () => {
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
				throw new Error('Client or file is not initialized');
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
				<div className="text-[24px] font-semibold">General Information</div>
				<div className="text-[20px]">
					What should we call your creation? What amazing things does it do? What icon should represent it across Mezon? Tell us here!
				</div>
				<div>
					By clicking Create, you agree to the Mezon{' '}
					<span className="cursor-pointer text-blue-700 hover:text-blue-400 hover:underline">Admin Terms of Service</span> and{' '}
					<span className="cursor-pointer text-blue-700 hover:text-blue-400 hover:underline">Admin Policy</span>.
				</div>
			</div>
			<div className="flex gap-5 max-md:flex-col">
				<div className="flex flex-col gap-2 w-fit">
					<div className="text-[12px] uppercase font-semibold">App Icon</div>
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
								Remove
							</div>
						) : (
							<div className="text-[10px]">
								Size: <span className="font-semibold">1024x1024</span>
							</div>
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
	const [changeName, setChangeName] = useState(appDetail.appname);
	const [changeUrl, setChangeUrl] = useState(appDetail.app_url);
	const [changeAboutApp, setChangeAboutApp] = useState(appDetail.about);
	const [isShowDeletePopup, setIsShowDeletePopup] = useState(false);
	const [openSaveChange, setOpenSaveChange] = useState(false);
	const [isUrlValid, setIsUrlValid] = useState(true);
	const [visibleToken, setVisibleToken] = useState<string | null>(null);
	const [tokenCopied, setTokenCopied] = useState(false);
	const [idCopied, setIdCopied] = useState(false);
	const dispatch = useAppDispatch();

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
	}, [appDetail]);

	const toggleDeletePopup = () => {
		setIsShowDeletePopup(!isShowDeletePopup);
	};

	const handleOpenSaveChangeForName = (e: ChangeEvent<HTMLInputElement>) => {
		setChangeName(e.target.value);
		if (e.target.value !== appDetail.appname) {
			setOpenSaveChange(true);
		}
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

		if (value !== appDetail.app_url) {
			setOpenSaveChange(true);
		}
	};

	const handleOpenSaveChangeAboutApp = (e: ChangeEvent<HTMLTextAreaElement>) => {
		const newAbout = e.target.value;
		if (newAbout !== appDetail.about) {
			setChangeAboutApp(newAbout);
			setOpenSaveChange(true);
		}
	};
	const handleResetChange = () => {
		setChangeName(appDetail.appname);
		setChangeUrl(appDetail.app_url);
		setChangeAboutApp(appDetail.about);
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

		if (Object.keys(updateRequest).length === 0) return;

		const response = await dispatch(editApplication({ request: updateRequest, appId })).unwrap();

		if (response?.token) {
			setVisibleToken(response.token);
		}

		await dispatch(fetchApplications({ noCache: true }));
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
			console.error('Failed to reset token:', error);
		}
	};

	const setAppOrBot = appDetail.app_url ? APP_TYPES.APPLICATION : APP_TYPES.BOT;
	return (
		<div className="flex-1 flex flex-col gap-7">
			<div className="w-full flex flex-col gap-2">
				<div className="text-[12px] uppercase font-semibold">Name</div>
				<input
					value={changeName}
					className="w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] p-[10px] outline-primary dark:bg-[#1e1f22]"
					type="text"
					onChange={handleOpenSaveChangeForName}
				/>
			</div>

			{appDetail.app_url && (
				<div className="w-full flex flex-col gap-2">
					<div className="text-[12px] uppercase font-semibold">URL</div>
					<input
						value={changeUrl}
						className="w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] p-[10px] outline-primary dark:bg-[#1e1f22]"
						type="text"
						onChange={handleOpenSaveChangeForUrl}
					/>
					{!isUrlValid && <div className="text-red-500 text-sm">Please enter a valid URL (e.g., https://example.com).</div>}
				</div>
			)}

			{openSaveChange && isUrlValid && <ModalSaveChanges onReset={handleResetChange} onSave={handleEditAppOrBot} />}

			<div className="flex flex-col gap-2">
				<div className="text-[12px] uppercase font-semibold">Description (maximum 400 characters)</div>
				<div className="text-[14px]">Your description will appear in the About Me section of your {setAppOrBot}</div>
				<textarea
					className="w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] min-h-[120px] max-h-[120px] p-[10px] outline-primary dark:bg-[#1e1f22]"
					placeholder={`Write a short description of your ${setAppOrBot} `}
					onChange={handleOpenSaveChangeAboutApp}
					value={changeAboutApp}
				></textarea>
			</div>

			<div className="text-[12px] font-semibold flex flex-col gap-2">
				<div className="uppercase">{setAppOrBot} ID</div>
				<div>{appId}</div>
				<div
					onClick={() => handleCopyID(appId)}
					className={`py-[7px] px-[16px] ${idCopied ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-800'
						} cursor-pointer w-[90px] text-[15px] text-white rounded-sm flex items-center justify-center`}
				>
					{idCopied ? 'Copied!' : 'Copy'}
				</div>
			</div>

			<div className="text-[12px] font-semibold flex flex-col gap-2">
				<div className="uppercase">{setAppOrBot} Token</div>
				{visibleToken ? (
					<div className="text-gray-500  rounded-sm mt-1">
						<span className="text-sm text-red-500">
							This is your new token. Copy and store it safely, you won't be able to see it again.
						</span>
						<div className="mt-2 font-mono break-all">{visibleToken}</div>
					</div>
				) : (
					<div className=" mt-1">
						<span className="text-sm text-gray-500 text-sm">
							For security purposes, tokens can only be viewed once, when created. If you forgot or lost access to your token, please
							regenerate a new one.
						</span>
					</div>
				)}{' '}
				{visibleToken && (
					<div
						onClick={() => handleCopyUrl(visibleToken)}
						className={`mt-2 py-[7px] px-[16px] ${tokenCopied ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-800'
							} flex items-center justify-center cursor-pointer w-[130px] text-[15px] text-white rounded-sm ${openSaveChange ? 'pointer-events-none opacity-50' : ''
							}`}
					>
						{tokenCopied ? 'Copied!' : 'Copy Token'}
					</div>
				)}
				<div
					onClick={handleResetToken}
					className={`py-[7px] px-[16px] bg-blue-600 flex items-center justify-center hover:bg-blue-800 cursor-pointer w-[130px] text-[15px] text-white rounded-sm ${openSaveChange ? 'pointer-events-none opacity-50' : ''
						}`}
				>
					Reset Token
				</div>
			</div>

			<div className="flex justify-end">
				<div
					onClick={toggleDeletePopup}
					className={`text-[15px] px-4 py-[10px] text-white bg-red-600 hover:bg-red-800 cursor-pointer rounded-sm w-fit ${openSaveChange ? 'pointer-events-none opacity-50' : ''
						}`}
				>
					Delete {setAppOrBot}
				</div>
			</div>
			{isShowDeletePopup && <DeleteAppPopup appId={appId} appName={appDetail.appname as string} togglePopup={toggleDeletePopup} />}
		</div>
	);
};
export default GeneralInformation;
