import { useAccount, useAuth } from '@mezon/core';
import {
	accountActions,
	channelMembersActions,
	clansActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectLogoCustom,
	selectTheme,
	toastActions,
	useAppDispatch,
	usersClanActions
} from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { DeleteAccountModal, Icons, InputField } from '@mezon/ui';
import type { ImageSourceObject } from '@mezon/utils';
import { MAX_FILE_SIZE_10MB, MAX_FILE_SIZE_1MB, createImgproxyUrl, fileTypeImage, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { Coords } from '../../ChannelLink';
import { ELimitSize } from '../../ModalValidateFile';
import { ModalErrorTypeUpload, ModalOverData } from '../../ModalValidateFile/ModalOverData';
import PanelClan from '../../PanelClan';
import ImageEditor from '../ImageEditor/ImageEditor';
import type { Profilesform } from '../SettingUserClanProfileCard';
import PreviewSetting from '../SettingUserClanProfileCard';
import { processImage } from '../helper';

const SettingRightUser = ({
	onClanProfileClick,
	name,
	avatar,
	currentDisplayName,
	aboutMe,
	isDM,
	dob,
	logo
}: {
	onClanProfileClick?: () => void;
	name: string;
	avatar: string;
	currentDisplayName: string;
	aboutMe: string;
	isDM: boolean;
	dob: string;
	logo: string;
}) => {
	const { t } = useTranslation('profileSetting');
	const { t: tAccount } = useTranslation('accountSetting');
	const { t: tInvitation } = useTranslation('invitation');
	const [editAboutUser, setEditAboutUser] = useState(aboutMe);
	const { sessionRef, clientRef } = useMezon();
	const { userProfile } = useAuth();
	const [urlImage, setUrlImage] = useState(avatar);
	const { updateUser } = useAccount();
	const [flags, setFlags] = useState(true);
	const [flagsRemoveAvartar, setFlagsRemoveAvartar] = useState(false);
	const [openModal, setOpenModal] = useState(false);
	const [openModalType, setOpenModalType] = useState(false);
	const logoCustom = useSelector(selectLogoCustom);
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId) || '';
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const sizeWarning = useRef<ELimitSize | null>(null);

	const [valueDisplayName, setValueDisplayName] = useState<string>(currentDisplayName || '');

	const handleUpdateUser = async () => {
		if (name || urlImage || valueDisplayName || editAboutUser || dob) {
			const result = await updateUser(name, urlImage, valueDisplayName.trim(), editAboutUser, dob, userProfile?.logo || '');
			if (result === true) handleSaveClose();
			if (currentClanId && userProfile?.user?.id) {
				await dispatch(
					usersClanActions.updateUserDisplayName({
						clanId: currentClanId,
						userId: userProfile.user.id,
						displayName: valueDisplayName.trim(),
						avatarUrl: urlImage
					})
				);
			}
			if (currentChannelId && currentClanId) {
				await dispatch(
					channelMembersActions.fetchChannelMembers({
						clanId: currentClanId || '',
						channelId: currentChannelId || '',
						channelType: ChannelType.CHANNEL_TYPE_CHANNEL,
						noCache: true,
						repace: true
					})
				);
			}
		}
	};

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [imageObject, setImageObject] = useState<ImageSourceObject | null>(null);
	const [imageCropped, setImageCropped] = useState<File | null>(null);
	const [openModalEditor, closeModalEditor] = useModal(
		() =>
			imageObject ? (
				<ImageEditor setImageCropped={setImageCropped} setImageObject={setImageObject} onClose={closeModalEditor} imageSource={imageObject} />
			) : null,
		[imageObject]
	);

	useEffect(() => {
		if (!imageCropped) return;

		processImage(
			imageCropped,
			dispatch,
			clientRef,
			sessionRef,
			currentClanId || '0',
			userProfile,
			setUrlImage as any,
			setImageObject as any,
			setImageCropped as any,
			setIsLoading,
			setOpenModal
		);
	}, [imageCropped]);

	const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!fileTypeImage.includes(file.type)) {
			setOpenModalType(true);
			e.target.value = '';
			return;
		}
		if (file.size > MAX_FILE_SIZE_10MB) {
			sizeWarning.current = ELimitSize.MB_10;
			e.target.value = '';
			setOpenModal(true);
			return;
		}
		if (file.type === fileTypeImage[2]) {
			if (!clientRef.current || !sessionRef.current) {
				dispatch(toastActions.addToastError({ message: 'Client or session is not initialized' }));
				return;
			}
			setIsLoading(true);

			const attachment = await handleUploadFile(clientRef.current, sessionRef.current, file.name, file, NaN, true);
			setUrlImage(attachment?.url || '');
			setFlags(true);
			setIsLoading(false);
		} else {
			const newImageObject: ImageSourceObject = {
				filename: file.name,
				filetype: file.type,
				size: file.size,
				url: URL.createObjectURL(file)
			};
			setFlags(true);
			setImageObject(newImageObject);
			openModalEditor();
		}

		e.target.value = '';
	};

	const handleClose = () => {
		setValueDisplayName(currentDisplayName);
		setEditAboutUser(aboutMe);
		setUrlImage(avatar);
		setFlags(false);
		setFlagsRemoveAvartar(false);
	};
	const handleSaveClose = () => {
		setFlags(false);
	};
	const editProfile: Profilesform = {
		displayName: valueDisplayName || '',
		urlImage: urlImage || ''
	};
	const handleDisplayName = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.value.startsWith(' ')) {
			setValueDisplayName(e.target.value);
			setFlags(true);
		}
	};

	const handleRemoveButtonClick = () => {
		setFlagsRemoveAvartar(true);
		setFlags(true);
		setUrlImage(process.env.NX_LOGO_MEZON || '');
	};
	const onchangeAboutUser = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setEditAboutUser(e.target.value);
		setFlags(true);
	};
	const appearanceTheme = useSelector(selectTheme);

	const handleChangeLogo = (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) {
			return;
		}
		const allowedTypes = fileTypeImage;
		if (!allowedTypes.includes(e.target.files[0].type)) {
			setOpenModalType(true);
			return;
		}

		if (e.target.files[0].size > MAX_FILE_SIZE_1MB) {
			sizeWarning.current = ELimitSize.MB;
			e.target.value = '';
			setOpenModal(true);
			return;
		}
		const session = sessionRef.current;
		const client = clientRef.current;

		if (!client || !session) {
			throw new Error('Client or file is not initialized');
		}

		handleUploadFile(client, session, e.target.files[0].name || '', e.target.files[0]).then((attachment) => {
			dispatch(
				clansActions.updateUser({
					avatar_url: urlImage,
					display_name: valueDisplayName,
					about_me: editAboutUser,
					dob,
					logo: attachment.url
				})
			);
		});
	};
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const [openRightClickModal, closeRightClickModal] = useModal(() => {
		return <PanelClan coords={coords} setShowClanListMenuContext={closeRightClickModal} userProfile={userProfile || undefined} />;
	}, [coords]);
	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;
		const distanceToBottom = windowHeight - event.clientY;
		setCoords({ mouseX, mouseY, distanceToBottom });
		openRightClickModal();
	};
	const [openModalDeleteAcc, setOpenModalDeleteAcc] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const handleOpenModalDeleteAcc = () => {
		setOpenModalDeleteAcc(true);
	};
	const handleDeleteAccount = async () => {
		setIsDeleting(true);
		await dispatch(accountActions.deleteAccount());
	};
	const handleCloseModal = () => {
		setOpenModalDeleteAcc(false);
	};

	const qrCodeProfile = useMemo(() => {
		const qrData = {
			id: userProfile?.user?.id || '',
			name: userProfile?.user?.display_name || userProfile?.user?.username || '',
			avatar: userProfile?.user?.avatar_url || ''
		};
		const endcodeData = btoa(encodeURIComponent(JSON.stringify(qrData)));
		const qrDataLink = `https://mezon.ai/chat/${userProfile?.user?.username}?data=${endcodeData}`;

		return qrDataLink;
	}, [userProfile]);

	const containerRef = useRef<HTMLDivElement | null>(null);

	const handleCopyQR = async () => {
		if (!containerRef.current) return;
		const svg = containerRef.current.querySelector('svg');
		if (!svg) return;

		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svg);

		const img = new Image();
		const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
		img.src = svgBase64;

		img.onload = async () => {
			const border = 40;
			const canvas = document.createElement('canvas');
			canvas.width = img.width + border * 2;
			canvas.height = img.height + border * 2;

			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.drawImage(img, border, border);

			canvas.toBlob(async (blob) => {
				if (!blob) return;
				try {
					await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
					const successMessage = tInvitation('messages.qrCopiedSuccess');
					toast.success(successMessage);
				} catch (err) {
					console.error(tInvitation('errors.copyFailed'), err);
				}
			});
		};
	};
	return (
		<>
			<div className="flex-1 flex z-0 gap-x-8 sbm:flex-row flex-col">
				<div className="flex-1 ">
					<div data-e2e={generateE2eId(`user_setting.profile.user_profile.input.display_name`)}>
						<label htmlFor="inputField" className="font-semibold tracking-wide text-sm">
							{t('displayName')}
						</label>
						<br />
						<InputField
							id="inputField"
							onChange={handleDisplayName}
							type="text"
							className="rounded-lg color-text-secondary bg-input-theme w-full px-4 py-2 mt-2 focus:outline-none font-normal text-sm tracking-wide border-theme-primary"
							placeholder={valueDisplayName || name}
							value={valueDisplayName}
							maxLength={32}
						/>
					</div>

					<div className="mt-8">
						<p className="font-semibold tracking-wide text-sm">{t('avatar')}</p>
						<div className="flex mt-[10px] gap-x-5">
							<label>
								<div className="font-medium btn-primary btn-primary-hover rounded-lg p-[8px] pr-[10px] pl-[10px] cursor-pointer text-[14px]">
									{t('changeAvatar')}
								</div>
								<input type="file" onChange={(e) => handleFile(e)} className="w-full text-sm  hidden" />
							</label>
							<button
								className="bg-theme-input text-theme-primary-hover bg-secondary-button-hover border-theme-primary  font-medium rounded-lg p-[8px] pr-[10px] pl-[10px] text-nowrap text-[14px]"
								onClick={handleRemoveButtonClick}
							>
								{t('removeAvatar')}
							</button>
						</div>
						<div className="mt-[30px] w-full">
							<textarea
								className={`rounded-lg bg-input-secondary p-[10px] border-theme-primary w-full outline-none min-h-[50px] max-h-[250px] ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}
								onChange={(e) => {
									onchangeAboutUser(e);
								}}
								value={editAboutUser}
								rows={4}
								maxLength={128}
								data-e2e={generateE2eId('user_setting.profile.user_profile.input.about_me')}
							></textarea>
							<div className="w-full flex justify-end">
								<span
									className={`text-${editAboutUser.length > 128 ? '[#EF1515]' : '[#797878]'}`}
									data-e2e={generateE2eId('user_setting.profile.user_profile.text.about_me_length')}
								>
									{editAboutUser.length}/{128}
								</span>
							</div>
						</div>
					</div>

					<div
						className="mt-8 flex items-center  bg-theme-input border-theme-primary p-4 rounded-lg justify-between"
						onContextMenu={handleMouseClick}
					>
						<p className="font-semibold tracking-wide text-sm">{t('directMessageIcon')}</p>
						<div className="flex gap-x-5  text-theme-primary text-theme-primary-hover bg-secondary-button-hover bg-button-secondary rounded-lg border-theme-primary">
							<label
								htmlFor="logo"
								className=" relative  font-medium flex items-center w-11 aspect-square justify-center  rounded-lg cursor-pointer text-[14px]"
							>
								{logoCustom ? (
									<img
										src={createImgproxyUrl(logoCustom, { width: 44, height: 44, resizeType: 'fit' })}
										className="w-11 aspect-square object-cover rounded"
									/>
								) : (
									<Icons.AddIcon />
								)}

								<input
									accept="image/*"
									type="file"
									name="logo"
									id="logo"
									onChange={handleChangeLogo}
									className="w-full absolute top-0 left-0 h-full text-sm hidden"
									data-e2e={generateE2eId('user_setting.profile.user_profile.upload.direct_message_icon_input')}
								/>
							</label>
						</div>
					</div>
					<div className="mt-8">
						<div className="flex mt-[10px] gap-x-5">
							<button
								className="bg-[#ee4545] text-white hover:opacity-85 font-medium rounded-lg p-[8px] pr-[10px] pl-[10px] text-nowrap text-[14px]"
								onClick={handleOpenModalDeleteAcc}
							>
								{tAccount('deleteAccount')}
							</button>
						</div>
					</div>
				</div>
				<div className="flex-1 flex flex-col gap-2 relative">
					<p className="font-semibold tracking-wide text-sm">{t('preview')}</p>
					<PreviewSetting isLoading={isLoading} profiles={editProfile} />
				</div>
			</div>
			{(urlImage !== avatar && flags) ||
			(valueDisplayName !== currentDisplayName && flags) ||
			(flagsRemoveAvartar !== false && flags) ||
			(editAboutUser !== aboutMe && flags) ? (
				<div className="flex flex-col sm:flex-row gap-2 border-theme-primary shadow-sm bg-modal-theme absolute max-w-[815px] w-[calc(100%-1rem)] sm:w-full left-2 sm:left-1/2 sm:translate-x-[-50%] bottom-4 min-w-0 sm:min-w-96 h-fit p-3 rounded-lg transform z-10">
					<div className="flex-1 flex items-center min-w-0">
						<p className="text-theme-message text-sm sm:text-base">{t('unsavedChangesWarning')}</p>
					</div>
					<div className="flex flex-row justify-end gap-3 shrink-0">
						<button
							className="rounded-[4px] px-2 hover:underline text-sm sm:text-base"
							onClick={() => {
								handleClose();
							}}
							data-e2e={generateE2eId(`user_setting.profile.user_profile.button.reset`)}
						>
							{t('reset')}
						</button>

						<button
							className=" btn-primary btn-primary-hover rounded-lg px-2 text-nowrap py-1 text-sm sm:text-base"
							onClick={() => {
								handleUpdateUser();
							}}
							data-e2e={generateE2eId(`user_setting.profile.user_profile.button.save_changes`)}
						>
							{t('saveChanges')}
						</button>
					</div>
				</div>
			) : null}
			{openModalDeleteAcc && <DeleteAccountModal handleLogOut={handleDeleteAccount} onClose={handleCloseModal} isDeleting={isDeleting} />}

			<ModalOverData size={sizeWarning.current || ELimitSize.MB} open={openModal} onClose={() => setOpenModal(false)} />
			<ModalErrorTypeUpload open={openModalType} onClose={() => setOpenModalType(false)} />
		</>
	);
};
export default SettingRightUser;
