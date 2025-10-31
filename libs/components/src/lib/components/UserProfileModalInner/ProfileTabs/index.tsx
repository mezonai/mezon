import { useTranslation } from 'react-i18next';

type ProfileTabsProps = {
	activeTab: string;
	onActiveTabChange: (tabId: string) => void;
};

export const typeTab = {
	ABOUT_ME: 'aboutMe',
	ACTIVITY: 'activity',
	MUTUAL_FRIENDS: 'mutualFriends',
	MUTUAL_SERVERS: 'mutualServers'
};

const ProfileTabs = ({ activeTab, onActiveTabChange }: ProfileTabsProps) => {
	const { t } = useTranslation('common');

	const profileTabs = [{ id: typeTab.ABOUT_ME, name: t('userProfile.aboutMe') }];

	const handleClickTab = (tabId: string) => {
		onActiveTabChange(tabId);
	};

	return (
		<div className="mt-4 mx-4">
			<ul className="flex gap-8 h-[25px] text-theme-primary border-b-[1px] border-[var(--text-theme-primary)]">
				{profileTabs.map((tab) => (
					<li
						key={tab.id}
						onClick={() => handleClickTab(tab.id)}
						className={`text-sm font-normal hover:border-white border-b-[1px] cursor-pointer ${activeTab === tab.id ? 'dark:border-white border-black' : 'border-transparent'}`}
					>
						{tab.name}
					</li>
				))}
			</ul>
		</div>
	);
};

export default ProfileTabs;
