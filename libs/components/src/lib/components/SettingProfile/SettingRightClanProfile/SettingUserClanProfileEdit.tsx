import { useAuth, useClanProfileSetting } from '@mezon/core';
import { checkDuplicateClanNickName, selectUserClanProfileByClanID, toastActions, useAppDispatch } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { InputField } from '@mezon/ui';
import type { ImageSourceObject } from '@mezon/utils';
import { MAX_FILE_SIZE_10MB, fileTypeImage, generateE2eId } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import type { ModalSettingSave } from '../../ClanSettings/SettingRoleManagement';
import { ELimitSize } from '../../ModalValidateFile';
import { ModalErrorTypeUpload, ModalOverData } from '../../ModalValidateFile/ModalOverData';
import ImageEditor from '../ImageEditor/ImageEditor';
import PreviewSetting from '../SettingUserClanProfileCard';
import { processImage } from '../helper';
import { SettingUserClanProfileSave } from './SettingUserClanProfileSave';

interface SettingUserClanProfileEditProps {
	flagOption: boolean;
	setFlagOption: (flagOption: boolean) => void;
	clanId: string;
}

const SettingUserClanProfileEdit: React.FC<SettingUserClanProfileEditProps> = ({ flagOption, clanId, setFlagOption }) => {
	const { userProfile } = useAuth();
	const { sessionRef, clientRef } = useMezon();
	const { t } = useTranslation('profileSetting');
	const userClansProfile = useSelector(selectUserClanProfileByClanID(clanId ?? '', userProfile?.user?.id ?? ''));
	const [draftProfile, setDraftProfile] = useState(userClansProfile);
	const [openModal, setOpenModal] = useState(false);
	const [openModalType, setOpenModalType] = useState(false);
	const [checkValidate, setCheckValidate] = useState(false);

	const { updateUserClanProfile } = useClanProfileSetting({ clanId });
	const dispatch = useAppDispatch();

	useEffect(() => {
		setDraftProfile(userClansProfile);
	}, [userClansProfile]);

	const setUrlImage = useCallback(
		(url_image: string) => {
			setDraftProfile((prevState) => (prevState ? { ...prevState, avatar: url_image } : prevState));
		},
		[setDraftProfile]
	);
	const setDisplayName = (nick_name: string) => {
		setDraftProfile((prevState) => (prevState ? { ...prevState, nick_name } : prevState));
	};

	const editProfile = useMemo(() => {
		const profileVaile = {
			displayName: '',
			urlImage: ''
		};
		if (draftProfile?.nick_name) {
			profileVaile.displayName = draftProfile?.nick_name;
		}
		if (draftProfile?.avatar) {
			profileVaile.urlImage = draftProfile.avatar;
		}
		return profileVaile;
	}, [draftProfile, userProfile]);
	const { displayName, urlImage } = editProfile;

	// Editor Avatar //
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
			clanId,
			userProfile,
			setUrlImage as any,
			setImageObject as any,
			setImageCropped as any,
			setIsLoading,
			setOpenModal,
			setFlagOption as any
		);
	}, [imageCropped]);

	const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!fileTypeImage.includes(file.type)) {
			setOpenModalType(true);
			return;
		}
		if (file.size > MAX_FILE_SIZE_10MB) {
			setOpenModal(true);
			return;
		}
		if (file.type === fileTypeImage[2]) {
			if (!clientRef.current || !sessionRef.current) {
				dispatch(toastActions.addToastError({ message: 'Client or session is not initialized' }));
				return;
			}
			setIsLoading(true);

			const attachment = await handleUploadFile(
				clientRef.current,
				sessionRef.current,
				clanId || '0',
				userProfile?.user?.id || '0',
				file.name,
				file
			);
			setUrlImage(attachment.url || '');
			setFlagOption(attachment.url !== userProfile?.user?.avatar_url);
			setIsLoading(false);
		} else {
			const newImageObject: ImageSourceObject = {
				filename: file.name,
				filetype: file.type,
				size: file.size,
				url: URL.createObjectURL(file)
			};

			setImageObject(newImageObject);
			openModalEditor();
		}
		e.target.value = '';
	};

	const debouncedSetCategoryName = useDebouncedCallback(async (value: string) => {
		if (value === userClansProfile?.nick_name) {
			setCheckValidate(false);
			setFlagOption(false);
			return;
		}

		if (value === '') {
			setCheckValidate(false);
			setFlagOption(true);
			return;
		}

		const result = unwrapResult(
			await dispatch(
				checkDuplicateClanNickName({
					clanNickName: value,
					clanId: clanId ?? ''
				})
			)
		);

		if (result) {
			setCheckValidate(true);
			setFlagOption(false);
		} else {
			setCheckValidate(false);
			setFlagOption(true);
		}
	}, 300);

	const handleDisplayName = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setDisplayName(value);
		debouncedSetCategoryName(value);
	};

	const handleRemoveButtonClick = () => {
		setFlagOption(true);
		setUrlImage(userProfile?.user?.avatar_url || '');
	};

	const handleClose = () => {
		if (userClansProfile?.nick_name || userClansProfile?.avatar) {
			setDisplayName(userClansProfile.nick_name || '');
			setUrlImage(userClansProfile.avatar || '');
		} else {
			setDisplayName(userProfile?.user?.username || '');
			setUrlImage(userProfile?.user?.avatar_url || '');
		}
		setFlagOption(false);
	};
	const handleUpdateUser = async () => {
		if (!checkValidate) {
			await updateUserClanProfile(userClansProfile?.clan_id ?? '', displayName.trim() || userProfile?.user?.display_name || '', urlImage || '');
		}
		setFlagOption(false);
	};
	const saveProfile: ModalSettingSave = {
		flagOption,
		handleClose,
		handleUpdateUser
	};

	return (
		<>
			<div className="flex-1 flex mt-[10px] gap-x-8 sbm:flex-row flex-col">
				<div className="flex-1 ">
					<div className="mt-[20px]">
						<label htmlFor="inputField" className=" font-bold tracking-wide text-sm">
							{t('clanNickname')}
						</label>
						<br />
						<InputField
							data-e2e={generateE2eId(`user_setting.profile.clan_profile.input_nickname`)}
							id="inputField"
							onChange={handleDisplayName}
							type="text"
							className="rounded-lg w-full border-theme-primary px-4 py-2 mt-2 outline-none font-normal text-sm tracking-wide"
							placeholder={userProfile?.user?.display_name || userProfile?.user?.username}
							value={displayName}
							maxLength={32}
						/>
						{checkValidate && <p className="text-[#e44141] text-xs italic font-thin">{t('nickNameExistsError')}</p>}
					</div>
					<div className="mt-[20px]">
						<p className="font-bold tracking-wide text-sm">{t('avatar')}</p>
						<div className="flex mt-[10px] gap-x-5">
							<label data-e2e={generateE2eId(`user_setting.profile.clan_profile.button_change_avatar`)}>
								<div className="text-[14px] font-medium btn-primary btn-primary-hover rounded-lg p-[8px] pr-[10px] pl-[10px] cursor-pointer ">
									{t('changeAvatar')}
								</div>
								<input type="file" onChange={handleFile} className="hidden" />
							</label>
							<button
								className="border-theme-primary rounded-lg p-[8px] pr-[10px] pl-[10px] text-nowrap text-[14px] font-medium "
								onClick={handleRemoveButtonClick}
								data-e2e={generateE2eId(`user_setting.profile.clan_profile.button_remove_avatar`)}
							>
								{t('removeAvatar')}
							</button>
						</div>
					</div>
				</div>
				<div className="flex-1">
					<p className="mt-[20px] font-bold tracking-wide text-sm">{t('preview')}</p>
					<PreviewSetting
						profiles={editProfile}
						currentDisplayName={!displayName ? userProfile?.user?.display_name : ''}
						isLoading={isLoading}
					/>
				</div>
			</div>

			<SettingUserClanProfileSave PropsSave={saveProfile} />
			<ModalOverData size={ELimitSize.MB_10} open={openModal} onClose={() => setOpenModal(false)} />
			<ModalErrorTypeUpload open={openModalType} onClose={() => setOpenModalType(false)} />
		</>
	);
};
export default SettingUserClanProfileEdit;
