import { INotification } from '@mezon/utils';
import AllNotificationItem from './AllNotificationItem';

type AllNotificationProps = {
	notification?: INotification;
};

export const AllNotification = ({ notification }: AllNotificationProps) => {
	if (!notification) return null;
	return (
		<div key={notification.id} className="flex flex-col gap-2 py-3 px-3 w-full">
			<AllNotificationItem notify={notification} />
		</div>
	);
};

export default AllNotification;
