import { useAuth } from '@mezon/core';
import { createImgproxyUrl } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { AvatarImage } from '../../AvatarImage/AvatarImage';

const TestThemeBlock = () => {
	const { t } = useTranslation('common');
	const { userProfile } = useAuth();

	const avatarUrl = userProfile?.user?.avatar_url;
	const imgproxyUrl = createImgproxyUrl(userProfile?.user?.avatar_url || '', { width: 300, height: 300, resizeType: 'fit' });

	const date = new Date();
	const realTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
	return (
		<div>
			<div className="font-semibold text-[24px] mb-10 text-theme-primary-active">{t('appearance')}</div>
			<div className={`test-container border-theme-primary bg-theme-primary pb-5 overflow-y-hidden h-[150px] rounded-lg`}>
				<div className="test-item flex px-5 mt-[-15px]">
					<div className="test-left">
						<AvatarImage
							className="aspect-square w-[45px] h-[45px] rounded-full object-cover"
							src={avatarUrl}
							srcImgProxy={imgproxyUrl}
							alt=""
							username={userProfile?.user?.username}
						/>
					</div>
					<div className="test-right ml-3">
						<div className="test-right-top flex gap-3 items-center">
							<div className={`test-right-top-username font-semibold `}>{userProfile?.user?.display_name}</div>
							<div className="test-right-top-time text-[12px]  ">
								{t('todayAt')} {realTime}
							</div>
						</div>
						<div className="test-right-comment ">{t('sampleMessage')}</div>
					</div>
				</div>
				<div className="test-item flex px-5 mt-5">
					<div className="test-left">
						<AvatarImage
							className="aspect-square w-[45px] h-[45px] rounded-full object-cover"
							src={avatarUrl}
							srcImgProxy={imgproxyUrl}
							alt=""
							username={userProfile?.user?.username}
						/>
					</div>
					<div className="test-right ml-3">
						<div className="test-right-top flex gap-3 items-center">
							<div className={`test-right-top-username font-semibold `}>{userProfile?.user?.display_name}</div>
							<div className="test-right-top-time text-[12px]  ">
								{t('todayAt')} {realTime}
							</div>
						</div>
						<div className="test-right-comment ">{t('sampleMessage')}</div>
					</div>
				</div>
				<div className="test-item flex px-5 mt-5">
					<div className="test-left">
						<AvatarImage
							className="aspect-square w-[45px] h-[45px] rounded-full object-cover"
							src={avatarUrl}
							srcImgProxy={imgproxyUrl}
							alt=""
							username={userProfile?.user?.username}
						/>
					</div>
					<div className="test-right ml-3">
						<div className="test-right-top flex gap-3 items-center">
							<div className={`test-right-top-username font-semibold `}>{userProfile?.user?.display_name}</div>
							<div className="test-right-top-time text-[12px]  ">
								{t('todayAt')} {realTime}
							</div>
						</div>
						<div className="test-right-comment ">{t('sampleMessage')}</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TestThemeBlock;
