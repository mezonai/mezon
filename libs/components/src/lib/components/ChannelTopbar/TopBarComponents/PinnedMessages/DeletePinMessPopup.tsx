import { PinMessageEntity, selectMemberClanByUserId } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useSelector } from 'react-redux';
import { MemberProfile } from '../../../MemberProfile';
import { MessageLine } from '../../../MessageWithUser/MessageLine';
import { ListPinAttachment } from './ItemPinMessage';

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
			<div className="w-fit h-fit dark:bg-bgPrimary bg-bgLightModeThird rounded-lg flex-col justify-start  items-start gap-3 inline-flex overflow-hidden max-w-[440px]">
				<div className="dark:text-white text-black w-full">
					<div className="p-4 pb-0">
						<h3 className="font-semibold pb-4 text-xl">Unpin Message</h3>
						<p>You sure you want to remove this pinned message?</p>
					</div>
					<div className="p-4 max-h-[60vh] overflow-y-auto hide-scrollbar">
						<div className="flex items-start p-4 pr-6 shadow-md dark:shadow-black rounded">
							<MemberProfile
								isHideUserName={true}
								avatar={pinMessage.avatar || ''}
								name={pinMessage.username ?? ''}
								isHideStatus={true}
								isHideIconStatus={true}
								textColor="#fff"
							/>
							<div className="flex flex-col gap-1 text-left w-[90%]">
								<div>
									<span className="font-medium dark:text-textDarkTheme text-textLightTheme">
										{userSender?.clan_nick ?? userSender?.user?.display_name ?? userSender?.user?.username}
									</span>
								</div>
								<span>
									<MessageLine
										isEditted={false}
										isJumMessageEnabled={false}
										isTokenClickAble={false}
										content={safeJSONParse(pinMessage.content || '{}')}
										isInPinMsg={true}
										messageId={pinMessage.message_id}
									/>
								</span>
								{attachments?.length ? <ListPinAttachment attachments={attachments} /> : <></>}
							</div>
						</div>
					</div>
					<div className="w-full dark:bg-bgSecondary bg-bgLightSecondary p-4 flex justify-end gap-x-4">
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
							Remove it please!
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
