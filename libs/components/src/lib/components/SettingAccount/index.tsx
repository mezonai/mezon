import { useAuth } from '@mezon/core';
import { authActions, selectRegisteringStatus, useAppDispatch } from '@mezon/store';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { getColorAverageFromURL } from '../SettingProfile/AverageColor';
import QrProfile from './QrProfile';
import SetPassword from './SettingPassword';
import SettingPhone from './SettingPhone';

type SettingAccountProps = {
	onSettingProfile: (value: string) => void;
	menuIsOpen: boolean;
};

const SettingAccount = ({ onSettingProfile, menuIsOpen }: SettingAccountProps) => {
	const dispatch = useAppDispatch();
	const { userProfile } = useAuth();
	const { t } = useTranslation('accountSetting');
	const urlImg = userProfile?.user?.avatar_url;
	const checkUrl = urlImg === undefined || urlImg === '';
	const isLoadingUpdatePassword = useSelector(selectRegisteringStatus);
	const [color, setColor] = useState<string>('#323232');

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

	const handleClick = () => {
		onSettingProfile('Profiles');
	};

	useEffect(() => {
		const getColor = async () => {
			if (!checkUrl) {
				const colorImg = await getColorAverageFromURL(urlImg);
				if (colorImg) setColor(colorImg);
			}
		};

		getColor();
	}, [checkUrl, urlImg]);

	const email = userProfile?.email;

	const [openSetPassWordModal, closeSetPasswordModal] = useModal(() => {
		return (
			<SetPassword
				onClose={closeSetPasswordModal}
				isLoading={isLoadingUpdatePassword}
				initialEmail={email}
				onSubmit={async (data) => {
					await dispatch(authActions.registrationPassword(data));
				}}
				hasPassword={!!userProfile?.password_setted}
			/>
		);
	}, [isLoadingUpdatePassword, userProfile?.password_setted]);

	const [openQR, closeQR] = useModal(() => {
		return <QrProfile onClose={closeQR} qrData={qrCodeProfile} />;
	}, [qrCodeProfile]);

	const [openSetPhoneModal, closeSetPhoneModal] = useModal(() => {
		return <SettingPhone onClose={closeSetPhoneModal} />;
	}, [isLoadingUpdatePassword]);

	const handleOpenSetPassword = () => {
		openSetPassWordModal();
	};

	useEffect(() => {
		if (isLoadingUpdatePassword !== 'loading') {
			closeSetPasswordModal();
		}
	}, [isLoadingUpdatePassword]);

	return (
		<div
			className={`"overflow-y-auto flex flex-col  flex-1 shrink  pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen === true ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-sm"`}
		>
			<h1 className="text-xl font-semibold tracking-wider text-theme-primary-active  mb-8">{t('myAccount')}</h1>
			<div className="w-full rounded-lg bg-theme-setting-nav">
				<div style={{ backgroundColor: color }} className="h-[100px]  "></div>
				<div className="flex justify-between relative -top-5 px-4 flex-col sbm:flex-row sbm:items-center">
					<div className="flex items-center gap-x-4" data-e2e={generateE2eId(`user_setting.account.info`)}>
						<AvatarImage
							alt={userProfile?.user?.username || ''}
							username={userProfile?.user?.username}
							className="w-[90px] h-[90px] xl:w-[100px] xl:h-[100px] rounded-[50px] border-[6px] border-solid border-user object-cover"
							srcImgProxy={createImgproxyUrl(urlImg ?? '', { width: 300, height: 300, resizeType: 'fit' })}
							src={urlImg}
							classNameText="!text-5xl"
						/>
						<div className="font-semibold text-lg">{userProfile?.user?.display_name}</div>
					</div>
					<div className="flex gap-2">
						<div onClick={openQR} className=" flex items-center justify-center p-2 bg-white mt-8 h-fit rounded-md">
							<svg
								width="24px"
								height="24px"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-labelledby="qrIconTitle"
								stroke="#000000"
								stroke-width="1"
								stroke-linecap="square"
								stroke-linejoin="miter"
								color="#000000"
							>
								<title id="qrIconTitle">QR Code</title> <rect x="10" y="3" width="7" height="7" transform="rotate(90 10 3)" />{' '}
								<rect width="1" height="1" transform="matrix(-1 0 0 1 7 6)" />{' '}
								<rect x="10" y="14" width="7" height="7" transform="rotate(90 10 14)" /> <rect x="6" y="17" width="1" height="1" />{' '}
								<rect x="14" y="20" width="1" height="1" /> <rect x="17" y="17" width="1" height="1" />{' '}
								<rect x="14" y="14" width="1" height="1" /> <rect x="20" y="17" width="1" height="1" />{' '}
								<rect x="20" y="14" width="1" height="1" /> <rect x="20" y="20" width="1" height="1" />{' '}
								<rect x="21" y="3" width="7" height="7" transform="rotate(90 21 3)" /> <rect x="17" y="6" width="1" height="1" />{' '}
							</svg>
						</div>
						<div
							className="mt-8 btn-primary btn-primary-hover  h-fit px-4 py-2 rounded-lg cursor-pointer  w-fit text-center"
							onClick={handleClick}
							data-e2e={generateE2eId(`user_setting.account.edit_profile`)}
						>
							{t('editUserProfile')}
						</div>
					</div>
				</div>
				<div className="rounded-md bg-theme-setting-primary shadow  m-4 p-4">
					<div className="flex justify-between items-center mb-4">
						<div>
							<h4 className="uppercase font-bold text-xs  mb-1">{t('displayName')}</h4>
							<p>{userProfile?.user?.display_name || t('noDisplayName')}</p>
						</div>
						<div
							className=" h-fit rounded-lg px-6 py-1 cursor-pointer border-theme-primary bg-theme-input text-theme-primary-hover bg-secondary-button-hover"
							onClick={handleClick}
							data-e2e={generateE2eId(`user_setting.account.edit_display_name`)}
						>
							{t('edit')}
						</div>
					</div>
					<div className="flex justify-between items-center">
						<div>
							<h4 className="uppercase font-bold text-xs  mb-1">{t('username')}</h4>
							<p>{userProfile?.user?.username}</p>
						</div>
						<div
							className=" h-fit rounded-lg px-6 py-1 cursor-pointer border-theme-primary bg-theme-input text-theme-primary-hover bg-secondary-button-hover	"
							onClick={handleClick}
							data-e2e={generateE2eId(`user_setting.account.edit_username`)}
						>
							{t('edit')}
						</div>
					</div>
				</div>
				<div className="rounded-md bg-theme-setting-primary shadow  m-4 p-4">
					<div className="flex justify-between items-center">
						<div>
							<h4 className="uppercase font-bold text-xs mb-1">{t('password')}</h4>
							<p>{t('password')}</p>
						</div>
						<div
							className=" h-fit rounded-lg px-6 py-1 cursor-pointer border-theme-primary bg-theme-input text-theme-primary-hover bg-secondary-button-hover "
							onClick={handleOpenSetPassword}
							data-e2e={generateE2eId(`user_setting.account.set_password`)}
						>
							{t('setPassword')}
						</div>
					</div>
				</div>

				<div className="rounded-md bg-theme-setting-primary shadow  m-4 p-4">
					<div className="flex justify-between items-center">
						<div>
							<h4 className="uppercase font-bold text-xs mb-1">{t('phoneNumber')}</h4>
							<p>{t('phoneNumber')}</p>
						</div>
						<div
							className=" h-fit rounded-lg px-6 py-1 cursor-pointer border-theme-primary bg-theme-input text-theme-primary-hover bg-secondary-button-hover "
							onClick={openSetPhoneModal}
						>
							{t('setPhoneNumber')}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingAccount;
