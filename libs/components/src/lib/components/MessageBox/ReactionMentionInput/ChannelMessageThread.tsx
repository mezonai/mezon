import { IMessageWithUser, TypeMessage, UsersClanEntity } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import MessageWithSystem from '../../MessageWithSystem';
import MessageWithUser from '../../MessageWithUser';

type ChannelMessageThreadProps = {
	message: IMessageWithUser;
	user: UsersClanEntity;
};

const ChannelMessageThread = (props: ChannelMessageThreadProps) => {
	const { message, user } = props;

	const isMessageSystem =
		message?.code === TypeMessage.Welcome ||
		message?.code === TypeMessage.UpcomingEvent ||
		message?.code === TypeMessage.CreateThread ||
		message?.code === TypeMessage.CreatePin ||
		message?.code === TypeMessage.AuditLog;
	return (
		<div className="mb-3">
			{isMessageSystem ? (
				<MessageWithSystem message={message} isTopic={false} />
			) : (
				<MessageWithUser
					allowDisplayShortProfile={true}
					message={message}
					mode={ChannelStreamMode.STREAM_MODE_THREAD}
					isMention={true}
					isShowFull={true}
					user={user}
				/>
			)}
		</div>
	);
};

export default ChannelMessageThread;
