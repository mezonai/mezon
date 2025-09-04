import { PinMessageEntity, selectMemberClanByUserId } from '@mezon/store';
import { generateE2eId, IMessageWithUser, TOPBARS_MAX_WIDTH } from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useSelector } from 'react-redux';
import BaseProfile from '../../../MemberProfile/BaseProfile';
import MessageAttachment from '../../../MessageWithUser/MessageAttachment';
import { MessageLine } from '../../../MessageWithUser/MessageLine';

type ModalDeletePinMessProps = {
	pinMessage: PinMessageEntity;
	contentString: string | undefined;
	closeModal: () => void;
	handlePinMessage: () => void;
	attachments: ApiMessageAttachment[];
	modalref?: React.MutableRefObject<HTMLDivElement | null>;
};
export const ModalDeletePinMess = (props: ModalDeletePinMessProps) => {
	const { pinMessage, contentString, closeModal, handlePinMessage, attachments, modalref } = props;
	const userSender = useSelector(selectMemberClanByUserId(pinMessage.sender_id as string));
	return (
		<div
			ref={modalref}
			className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
		>
			<div className="w-fit h-fit bg-theme-setting-primary text-theme-primary rounded-lg flex-col justify-start  items-start gap-3 inline-flex overflow-hidden max-w-[440px]">
				<div className="px-4 py-4">
					<h3 className="font-semibold pb-1 text-xl">Unpin Message</h3>
					<p>You sure you want to remove this pinned message?</p>
				</div>
				<div className="px-4 pb-2 max-h-[60vh] overflow-y-auto hide-scrollbar w-full">
					<div className="flex items-start gap-2 p-2 shadow-md rounded bg-theme-setting-secondary">
						<div className="flex-shrink-0">
							<BaseProfile
								avatar={pinMessage.avatar || ''}
								hideIcon={true}
								dataE2E={generateE2eId(`common.delete_pin_message.username`)}
							/>
						</div>
						<div className="flex text-sm flex-col gap-1 text-left flex-1 min-w-0 pointer-events-none [&_.attachment-actions]:!hidden [&_button]:!hidden">
							<div className="font-medium">
								{userSender?.clan_nick || userSender?.user?.display_name || userSender?.user?.username || pinMessage.username}
							</div>
							{contentString && (
								<MessageLine
									isEditted={false}
									isJumMessageEnabled={false}
									isTokenClickAble={false}
									content={safeJSONParse(pinMessage.content || '{}')}
									isInPinMsg={true}
									messageId={pinMessage.message_id}
									isSearchMessage={true}
								/>
							)}

							{attachments && (
								<MessageAttachment
									mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
									message={{ ...pinMessage, attachments: attachments } as IMessageWithUser}
									defaultMaxWidth={TOPBARS_MAX_WIDTH}
								/>
							)}
						</div>
					</div>
				</div>
				<div className="w-full bg-theme-setting-primary p-4 flex justify-end gap-x-4">
					<button onClick={closeModal} className="px-4 py-2 hover:underline rounded">
						Cancel
					</button>
					<button
						onClick={() => {
							handlePinMessage();
							closeModal();
						}}
						className="px-4 py-2 hover:bg-opacity-85 rounded bg-[#DA363C] text-white font-medium"
					>
						Unpin it
					</button>
				</div>
			</div>
		</div>
	);
};
