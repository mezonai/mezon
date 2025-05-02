import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

type SettingNotificationsProps = {
	menuIsOpen: boolean;
};

const SettingNotifications = ({ menuIsOpen }: SettingNotificationsProps) => {
	const [hideNotifications, setHideNotifications] = useState(false);

	useEffect(() => {
		const saved = localStorage.getItem('hideNotificationContent');
		if (saved === 'true') {
			setHideNotifications(true);
		}
	}, []);

	const handleSave = () => {
		localStorage.setItem('hideNotificationContent', hideNotifications.toString());
		toast.success('Settings saved!');
	};

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink dark:bg-bgPrimary bg-white w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar dark:text-white text-colorTextLightMode text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-8">Notifications</h1>
			<div className="rounded-md dark:bg-bgSecondary bg-bgLightModeSecond m-4 p-4">
				<div className="flex items-center mb-4">
					<input
						type="checkbox"
						id="hideNotifications"
						checked={hideNotifications}
						onChange={(e) => setHideNotifications(e.target.checked)}
						className="mr-2"
					/>
					<label htmlFor="hideNotifications" className="text-sm font-medium">
						Hide Notifications Content
					</label>
				</div>

				{hideNotifications ? (
					<p className="mb-4">When you clear this checkbox, a message will appear with its contents.</p>
				) : (
					<p className="mb-4">When the checkbox is clicked, any notification will be displayed without any content.</p>
				)}

				<button onClick={handleSave} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
					Save
				</button>
			</div>
		</div>
	);
};

export default SettingNotifications;
