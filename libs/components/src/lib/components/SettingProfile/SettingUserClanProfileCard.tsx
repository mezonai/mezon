import { useAuth, useMemberStatus } from '@mezon/core';
import { selectAccountCustomStatus } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import AvatarProfile from '../ModalUserProfile/AvatarProfile';
import { getColorAverageFromURL } from './AverageColor';
export type Profilesform = {
	displayName: string;
	urlImage: string;
};
export type propProfilesform = {
	profiles: Profilesform;
	currentDisplayName?: string;
	isLoading?: boolean;
};
const SettingUserClanProfileCard = (props: propProfilesform) => {
	const { userProfile } = useAuth();
	const { profiles, currentDisplayName } = props;
	const checkUrl = profiles.urlImage === undefined || profiles.urlImage === '';
	const userStatusProfile = useSelector(selectAccountCustomStatus);
	const [color, setColor] = useState<string>('#323232');
	const userStatus = useMemberStatus(userProfile?.user?.id || '');

	useEffect(() => {
		const getColor = async () => {
			if (!checkUrl) {
				const colorImg = await getColorAverageFromURL(profiles.urlImage);
				if (colorImg) setColor(colorImg);
			}
		};

		getColor();
	}, [checkUrl, profiles.urlImage]);

	return (
		<div className="bg-theme-setting-nav border-theme-primary rounded-lg flex flex-col relative">
			{props.isLoading && (
				<div className="absolute w-[78px] h-[78px] top-[61px] left-[22px] z-20 flex items-center justify-center">
					<div className="absolute w-full h-full bg-white rounded-full opacity-30"></div>
					<Icons.LoadingSpinner />
				</div>
			)}

			<div style={{ backgroundColor: color }} className="h-[105px] rounded-tr-[10px] rounded-tl-[10px] "></div>
			<AvatarProfile
				avatar={profiles.urlImage || userProfile?.user?.avatar_url || ''}
				username={userProfile?.user?.username}
				userToDisplay={true}
				customStatus={userStatusProfile}
				userID={userProfile?.user?.id}
				statusOnline={userStatus.status}
				identifierE2E="avatar_clan_profile"
			/>

			<div className="p-4 flex flex-col gap-4">
				<div className="bg-theme-setting-primary text-theme-primary border-theme-primary shadow w-full p-4 rounded-[10px] flex flex-col gap-y-6 xl:gap-y-7">
					<div className="w-[300px]">
						<p
							className="font-bold tracking-wider text-xl one-line"
							data-e2e={generateE2eId('user_setting.profile.user_profile.preview.display_name')}
						>
							{profiles.displayName || currentDisplayName || userProfile?.user?.username}
						</p>
						<p className="font-medium tracking-wide text-sm">{userProfile?.user?.username}</p>
					</div>
				</div>
			</div>
		</div>
	);
};
export default SettingUserClanProfileCard;
