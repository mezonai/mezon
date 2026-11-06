import { getIconMotion, setIconMotion } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const IconMotionSwitch = () => {
	const { t } = useTranslation('common');
	const [motion, setMotion] = useState(() => getIconMotion());

	const handleToggle = (checked: boolean) => {
		setMotion(checked);
		setIconMotion(checked);
	};

	return (
		<div className="rounded-lg bg-theme-setting-nav p-4 mt-6">
			<div className="flex items-center justify-between">
				<div className="flex flex-col">
					<h2 className="text-base font-medium text-theme-primary-active mb-1">{t('iconAnimations')}</h2>
					<p className="text-sm text-theme-primary">{t('iconAnimationsDesc')}</p>
				</div>
				<div className="ml-4 flex-shrink-0">
					<label
						className="relative inline-flex items-center cursor-pointer"
						data-e2e={generateE2eId('user_setting.appearance.icon_motion.switch')}
					>
						<input type="checkbox" checked={motion} onChange={(e) => handleToggle(e.target.checked)} className="sr-only peer" />
						<div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
					</label>
				</div>
			</div>
		</div>
	);
};

export default IconMotionSwitch;
