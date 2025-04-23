import { ModalSaveChanges } from '@mezon/components';
import { editApplication, fetchApplications, selectAppDetail, useAppDispatch } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { ApiApp, ApiMessageAttachment, MezonUpdateAppBody } from 'mezon-js/api.gen';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
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
		const computeHasChanges = appLogoUrl !== appDetail.applogo;
		if (computeHasChanges) {
			setHasChanges(true);
		}
	}, [appDetail.applogo, appLogoUrl]);

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
		const updateRequest: MezonUpdateAppBody = {
			applogo: appLogoUrl
		};
		await dispatch(editApplication({ request: updateRequest, appId: appId }));
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
	const handleCopyUrl = (url: string) => {
		navigator.clipboard.writeText(url);
	};
	const [changeName, setChangeName] = useState(appDetail.appname);
	const [changeUrl, setChangeUrl] = useState(appDetail.app_url);
	const [isShowDeletePopup, setIsShowDeletePopup] = useState(false);
	const [openSaveChange, setOpenSaveChange] = useState(false);
	const [isUrlValid, setIsUrlValid] = useState(true);
	const dispatch = useAppDispatch();
	const toggleDeletePopup = () => {
		setIsShowDeletePopup(!isShowDeletePopup);
	};
	const handleOpenSaveChangeForName = (e: ChangeEvent<HTMLInputElement>) => {
		setChangeName(e.target.value);
		if (e.target.value !== appDetail.appname) {
			setChangeName(e.target.value);
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

	const handleResetChange = () => {
		setChangeName(appDetail.appname);
		setOpenSaveChange(false);
	};
	const handleEditAppOrBot = async () => {
		const updateRequest: MezonUpdateAppBody = {
			appname: changeName,
			app_url: changeUrl,
			token: 'reset'
		};
		const response = await dispatch(editApplication({ request: updateRequest, appId: appId }));
		await dispatch(fetchApplications({ noCache: true }));
		setOpenSaveChange(false);
	};
	return (
		<div className="flex-1 flex flex-col gap-7">
			<div className="w-full flex flex-col gap-2">
				<div className="text-[12px] uppercase font-semibold">Name</div>
				<input
					value={changeName}
					className=" w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] p-[10px] outline-primary dark:bg-[#1e1f22]"
					type="text"
					onChange={handleOpenSaveChangeForName}
				/>
			</div>
			{appDetail.app_url && (
				<div className="w-full flex flex-col gap-2">
					<div className="text-[12px] uppercase font-semibold">URL</div>
					<input
						value={changeUrl}
						className=" w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] p-[10px] outline-primary dark:bg-[#1e1f22]"
						type="text"
						onChange={handleOpenSaveChangeForUrl}
					/>
					{!isUrlValid && <div className="text-red-500 text-sm">Please enter a valid URL (e.g., https://example.com).</div>}
				</div>
			)}
			{openSaveChange && isUrlValid && <ModalSaveChanges onReset={handleResetChange} onSave={handleEditAppOrBot} />}

			<div className="flex flex-col gap-2">
				<div className="text-[12px] uppercase font-semibold">Description (maximum 400 characters)</div>
				<div className="text-[14px]">Your description will appear in the About Me section of your bot's profile.</div>
				<textarea
					className="w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] min-h-[120px] max-h-[120px] p-[10px] outline-primary dark:bg-[#1e1f22]"
					name=""
					id=""
				></textarea>
			</div>
			<div className="flex flex-col gap-2">
				<div className="text-[12px] uppercase font-semibold">Tags (maximum 5)</div>
				<div className="text-[14px]">Add up to 5 tags to describe the content and functionality of your application.</div>
				<input
					className="w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] p-[10px] outline-primary dark:bg-[#1e1f22]"
					type="text"
				/>
			</div>
			<div className="text-[12px] font-semibold flex flex-col gap-2">
				<div className="uppercase">Application ID</div>
				<div>{appId}</div>
				<div
					onClick={() => handleCopyUrl(appId)}
					className="py-[7px] px-[16px] bg-blue-600 hover:bg-blue-800 cursor-pointer w-fit text-[15px] text-white rounded-sm"
				>
					Copy
				</div>
			</div>
			<div className="text-[12px] font-semibold flex flex-col gap-2">
				<div className="uppercase">Application Token</div>
				<div>{appDetail.token}</div>
				<div
					onClick={() => handleCopyUrl(appDetail.token as string)}
					className="py-[7px] px-[16px] bg-blue-600 hover:bg-blue-800 cursor-pointer w-fit text-[15px] text-white rounded-sm"
				>
					Copy
				</div>
			</div>
			<div className="flex justify-end">
				<div
					onClick={toggleDeletePopup}
					className="text-[15px] px-4 py-[10px] text-white bg-red-600 hover:bg-red-800 cursor-pointer rounded-sm w-fit"
				>
					Delete App
				</div>
			</div>
			{isShowDeletePopup && <DeleteAppPopup appId={appId} appName={appDetail.appname as string} togglePopup={toggleDeletePopup} />}
		</div>
	);
};

export default GeneralInformation;
