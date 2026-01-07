import { useUserById } from '@mezon/core';
import { selectAllAccount } from '@mezon/store';
import { formatDateI18n } from '@mezon/utils';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

type AboutMeProps = {
	createTime?: string | number;
	userId?: string;
};

const AboutMe = ({ createTime, userId }: AboutMeProps) => {
	const { t } = useTranslation('common');
	const userProfile = useSelector(selectAllAccount);
	const userById = useUserById(userId);
	const checkUser = useMemo(() => userProfile?.user?.id === userId, [userId, userProfile?.user?.id]);

	const formatCreateTime = () => {
		if (!createTime) return '';
		const timestamp = typeof createTime === 'number' ? (createTime.toString().length <= 10 ? createTime * 1000 : createTime) : createTime;
		return formatDateI18n(new Date(timestamp), 'en', 'MMMM d, yyyy');
	};

	return (
		<div className="flex flex-col gap-[20px]">
			<div className="flex flex-col gap-2">
				<p className="max-w-[400px] text-sm font-normal text-theme-primary break-words">
					{checkUser ? userProfile?.user?.aboutMe : userById?.user?.aboutMe}
				</p>
				<p className="text-xs font-semibold text-theme-primary">{t('userProfile.memberSince')}</p>
				<span className="text-sm font-normal text-theme-primary">{formatCreateTime()}</span>
			</div>
		</div>
	);
};

export default AboutMe;
