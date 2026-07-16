import { acitvitiesActions, selectIsActivityTrackingEnabled, useAppDispatch, useAppSelector } from '@mezon/store';
import { useTranslation } from 'react-i18next';

type SettingActivityProps = {
	menuIsOpen: boolean;
};

const SettingActivity = ({ menuIsOpen }: SettingActivityProps) => {
	const { t } = useTranslation(['setting', 'common']);
	const dispatch = useAppDispatch();

	const isActivity = useAppSelector(selectIsActivityTrackingEnabled);

	const handleToggleActivity = (checked: boolean) => {
		dispatch(acitvitiesActions.setActivityTrackingEnabled(checked));
		if (!checked) {
			dispatch(
				acitvitiesActions.createActivity({
					activity_name: '',
					activity_type: 0,
					status: 0
				})
			);
		}
	};

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-theme-primary text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-8 text-theme-primary-active">{t('setting:appSettings.activity')}</h1>

			<div className="rounded-lg bg-theme-setting-nav p-4">
				<div className="flex items-center justify-between mb-2">
					<div className="flex flex-col">
						<h2 className="text-base font-medium text-theme-primary-active mb-1">{t('setting:activity.title')}</h2>
						<p className="text-sm text-theme-primary">{t('setting:activity.description')}</p>
					</div>
					<div className="ml-4 flex-shrink-0">
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={isActivity}
								onChange={(e) => handleToggleActivity(e.target.checked)}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
						</label>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingActivity;
