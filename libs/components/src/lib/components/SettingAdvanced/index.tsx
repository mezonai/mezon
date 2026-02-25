import { appActions, selectAutoHidden, selectAutoStart, selectHardwareAcceleration, useAppDispatch } from '@mezon/store';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

type SettingAdvancedProps = {
	menuIsOpen: boolean;
};

const SettingAdvanced = ({ menuIsOpen }: SettingAdvancedProps) => {
	const { t } = useTranslation(['setting', 'common']);
	const dispatch = useAppDispatch();
	const autoStart = useSelector(selectAutoStart);
	const autoHidden = useSelector(selectAutoHidden);
	const hardwareAcceleration = useSelector(selectHardwareAcceleration);

	const handleConfigStart = () => {
		try {
			dispatch(appActions.toggleAutoStart());
			window.electron.toggleSettingAutoStart({
				autoStart: autoStart === undefined ? false : !autoStart,
				hidden: Boolean(autoHidden)
			});
		} catch (error) {
			toast.error(t('setting:autoStart.error') || 'Failed to toggle auto start');
			console.error('Error toggling auto start:', error);
		}
	};

	const handleHardwareAcceleration = () => {
		try {
			dispatch(appActions.toggleHardwareAcceleration());
			window.electron.toggleHardwareAcceleration(!hardwareAcceleration);
		} catch (error) {
			toast.error(t('setting:hardwareAcceleration.error') || 'Failed to toggle hardware acceleration');
			console.error('Error toggling hardware acceleration:', error);
		}
	};

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-theme-primary text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-8 text-theme-primary-active">{t('setting:appSettings.advanced')}</h1>

			<div className="rounded-lg bg-theme-setting-nav p-4">
				<div className="flex items-center justify-between mb-2">
					<div className="flex flex-col">
						<h2 className="text-base font-medium text-theme-primary-active mb-1">{t('setting:autoStart.title')}</h2>
						<p className="text-sm text-theme-primary">{t('setting:autoStart.description')}</p>
					</div>
					<div className="ml-4 flex-shrink-0">
						<label className="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" checked={autoStart} onChange={handleConfigStart} className="sr-only peer" />
							<div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
						</label>
					</div>
				</div>
			</div>

			<div className="rounded-lg bg-theme-setting-nav p-4 mt-4">
				<div className="flex items-center justify-between mb-2">
					<div className="flex flex-col">
						<h2 className="text-base font-medium text-theme-primary-active mb-1">{t('setting:hardwareAcceleration.title')}</h2>
						<p className="text-sm text-theme-primary">{t('setting:hardwareAcceleration.description')}</p>
					</div>
					<div className="ml-4 flex-shrink-0">
						<label className="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" checked={hardwareAcceleration} onChange={handleHardwareAcceleration} className="sr-only peer" />
							<div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
						</label>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingAdvanced;
