import { IMessageWithUser, TypeMessage } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import MessageWithSystem from '../../MessageWithSystem';
import MessageWithUser from '../../MessageWithUser';

type ChannelMessageThreadProps = {
	message: IMessageWithUser;
};

const ChannelMessageThread = (props: ChannelMessageThreadProps) => {
	const { message } = props;

	const isMessageSystem =
		message?.code === TypeMessage.Welcome ||
		message?.code === TypeMessage.CreateThread ||
		message?.code === TypeMessage.CreatePin ||
		message?.code === TypeMessage.AuditLog;
	return (
		<div className="mb-3">
			{isMessageSystem ? (
				<MessageWithSystem message={message} mode={ChannelStreamMode.STREAM_MODE_THREAD} />
			) : (
				<MessageWithUser
					allowDisplayShortProfile={true}
					message={message}
					mode={ChannelStreamMode.STREAM_MODE_THREAD}
					isMention={true}
					isShowFull={true}
				/>
			)}
		</div>
	);
};

export default ChannelMessageThread;
