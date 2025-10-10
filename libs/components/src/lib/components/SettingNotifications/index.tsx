import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

type SettingNotificationsProps = {
	menuIsOpen: boolean;
};

const SettingNotifications = ({ menuIsOpen }: SettingNotificationsProps) => {
	const { t } = useTranslation('common');
	const [hideNotifications, setHideNotifications] = useState(false);

	useEffect(() => {
		const saved = localStorage.getItem('hideNotificationContent');
		if (saved === 'true') {
			setHideNotifications(true);
		}
	}, []);

	const handleSave = () => {
		localStorage.setItem('hideNotificationContent', hideNotifications.toString());
		toast.success(t('settingsSaved'));
	};

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink  w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-theme-primary text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-8 text-theme-primary-active">{t('notifications')}</h1>
			<div className="rounded-lg bg-theme-setting-nav p-4">
				<div className="flex items-center mb-4">
					<input
						type="checkbox"
						id="hideNotifications"
						checked={hideNotifications}
						onChange={(e) => setHideNotifications(e.target.checked)}
						className="mr-2"
					/>
					<label htmlFor="hideNotifications" className="text-sm font-medium">
						{t('hideNotificationsContent')}
					</label>
				</div>

				{hideNotifications ? <p className="mb-4">{t('hideNotificationDesc')}</p> : <p className="mb-4">{t('showNotificationDesc')}</p>}

				<button onClick={handleSave} className="mt-4  px-4 py-2 rounded btn-primary btn-primary-hover ">
					{t('save')}
				</button>
			</div>
		</div>
	);
};

export default SettingNotifications;
