import { useAuth } from '@mezon/core';
import { selectCurrentClanId, selectIsShowSettingFooter } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import SettingRightClan from '../SettingRightClanProfile';
import SettingRightUser from '../SettingRightUserProfile';

type SettingRightProfileProps = {
	menuIsOpen: boolean;
	isDM: boolean;
};

export enum EActiveType {
	USER_SETTING = 'USER_SETTING',
	CLAN_SETTING = 'CLAN_SETTING'
}

const SettingRightProfile = ({ menuIsOpen, isDM }: SettingRightProfileProps) => {
	const { userProfile } = useAuth();
	const { t } = useTranslation('profileSetting');
	const [activeType, setActiveType] = useState<string>(EActiveType.USER_SETTING);
	const isShowSettingFooter = useSelector(selectIsShowSettingFooter);
	const currentClanId = useSelector(selectCurrentClanId);
	const [clanId, setClanId] = useState<string | undefined>(currentClanId as string);
	const handleClanProfileClick = () => {
		setActiveType(EActiveType.CLAN_SETTING);
	};

	const handleUserSettingsClick = () => {
		setActiveType(EActiveType.USER_SETTING);
	};

	useEffect(() => {
		setActiveType(EActiveType.USER_SETTING);
		setClanId(isShowSettingFooter.clanId ? isShowSettingFooter.clanId || '' : currentClanId || '');
	}, [isShowSettingFooter?.profileInitTab, isShowSettingFooter.clanId, currentClanId]);

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-full sbm:w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen === true ? 'sbm:min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar z-20`}
		>
			<div className="">
				<h1 className="text-xl font-semibold tracking-wider text-theme-primary-active">{t('profiles')}</h1>
				<div className="flex flex-row gap-4 mt-6 mb-4">
					<button
						onClick={handleUserSettingsClick}
						className={`pt-1 font-medium text-base tracking-wider border-b-2 ${activeType === EActiveType.USER_SETTING ? 'border-[#155EEF] text-theme-primary-active' : 'border-transparent text-theme-primary'}`}
						data-e2e={generateE2eId(`user_setting.profile.user_profile.button`)}
					>
						{t('userProfile')}
					</button>

					{!isDM || !isShowSettingFooter.isUserProfile ? (
						<button
							onClick={handleClanProfileClick}
							className={`pt-1 font-medium text-base tracking-wider border-b-2 ${activeType === EActiveType.CLAN_SETTING ? 'border-[#155EEF] text-theme-primary-active' : 'border-transparent text-theme-primary'}`}
							data-e2e={generateE2eId(`user_setting.profile.clan_profile.button`)}
						>
							{t('clanProfiles')}
						</button>
					) : null}
				</div>
			</div>

			<div className="flex-1 flex z-0 gap-x-8 sbm:flex-row flex-col">
				{activeType === EActiveType.USER_SETTING ? (
					<SettingRightUser
						onClanProfileClick={handleClanProfileClick}
						name={userProfile?.user?.username || ''}
						avatar={userProfile?.user?.avatarUrl || ''}
						currentDisplayName={userProfile?.user?.displayName || ''}
						aboutMe={userProfile?.user?.aboutMe || ''}
						isDM={isDM}
						dob={userProfile?.user?.dob || ''}
						logo={userProfile?.logo || ''}
					/>
				) : (
					<SettingRightClan clanId={clanId || ''} />
				)}
			</div>
		</div>
	);
};

export default SettingRightProfile;
