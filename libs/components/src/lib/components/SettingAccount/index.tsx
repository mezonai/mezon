import { useAuth } from '@mezon/core';
import { authActions, selectRegisteringStatus, useAppDispatch } from '@mezon/store';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { getColorAverageFromURL } from '../SettingProfile/AverageColor';
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
			<div className="w-full rounded-lg overflow-hidden bg-theme-setting-nav">
				<div style={{ backgroundColor: color }} className="h-[100px]  "></div>
				<div className="flex justify-between relative -top-5 px-4 flex-col sbm:flex-row sbm:items-center">
					<div className="flex items-center gap-x-4">
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
					<div
						className="mt-8 btn-primary btn-primary-hover  h-fit px-4 py-2 rounded-lg cursor-pointer  w-fit text-center"
						onClick={handleClick}
						data-e2e={generateE2eId(`user_setting.account.edit_profile`)}
					>
						{t('editUserProfile')}
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
