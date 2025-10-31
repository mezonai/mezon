import { useAppNavigation } from '@mezon/core';
import { useTranslation } from 'react-i18next';

function EmbedsPage() {
	const { navigate } = useAppNavigation();
	const { t } = useTranslation('adminApplication');

	return (
		<div className="flex flex-1 flex-col items-center">
			<div className="flex flex-row justify-between w-full">
				<span className="text-2xl font-medium">{t('embed.title')}</span>
			</div>
		</div>
	);
}

export default EmbedsPage;
