import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const DirectMessageIndexComponent = () => {
	const { t } = useTranslation('directMessage');
	return (
		<div className="flex items-center justify-center h-full w-full">
			<div className="text-center">
				<h2 className="text-2xl font-medium mb-2 text-theme-primary">{t('yourMessages')}</h2>
				<p className="text-gray-500">{t('selectConversation')}</p>
			</div>
		</div>
	);
};

export default memo(DirectMessageIndexComponent);
