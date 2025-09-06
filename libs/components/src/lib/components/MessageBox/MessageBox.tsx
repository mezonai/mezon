import { useDragAndDrop, usePermissionChecker, useReference } from '@mezon/core';
import { referencesActions, selectCloseMenu, selectDataReferences, selectStatusMenu, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import {
	EOverriddenPermission,
	ILongPressType,
	IMessageSendPayload,
	MAX_FILE_ATTACHMENTS,
	MentionDataProps,
	ThreadValue,
	UploadLimitReason,
	generateE2eId,
	processFile,
	useLongPress
} from '@mezon/utils';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { Fragment, ReactElement, memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import AttachmentPreviewThumbnail from './AttachmentPreviewThumbnail';
import AudioRecorderControl from './AudioRecorder/AudioRecorderControl';
import FileSelectionButton from './FileSelectionButton';
import { MentionReactInput } from './ReactionMentionInput';

export type MessageBoxProps = {
	readonly onSend: (
		content: IMessageSendPayload,
		mentions?: Array<ApiMessageMention>,
		attachments?: Array<ApiMessageAttachment>,
		references?: Array<ApiMessageRef>,
		value?: ThreadValue,
		anonymous?: boolean,
		mentionEveryone?: boolean
	) => void;
	readonly onTyping?: () => void;
	readonly listMentions?: MentionDataProps[];
	readonly currentChannelId?: string;
	readonly currentClanId?: string;
	readonly mode?: number;
};

const MessageBox = (props: MessageBoxProps): ReactElement => {
	const dispatch = useAppDispatch();
	const { sessionRef, clientRef } = useMezon();
	const { currentChannelId, currentClanId } = props;
	const [canSendMessage] = usePermissionChecker([EOverriddenPermission.sendMessage], currentChannelId ?? '');
	const { removeAttachmentByIndex, checkAttachment, attachmentFilteredByChannelId } = useReference(props.currentChannelId);
	const hasReplyMessage = useSelector((state) => {
		const dataRefs = selectDataReferences(state, currentChannelId ?? '');
		return !!dataRefs?.message_ref_id;
	});

	const { setOverUploadingState } = useDragAndDrop();

	const onConvertToFiles = useCallback(
		async (content: string, anonymousMessage?: boolean) => {
			const fileContent = new Blob([content], { type: 'text/plain' });
			const now = Date.now();
			const filename = now + '.txt';
			const file = new File([fileContent], filename, { type: 'text/plain' });

			if (attachmentFilteredByChannelId?.files?.length + 1 > MAX_FILE_ATTACHMENTS) {
				setOverUploadingState(true, UploadLimitReason.COUNT);
				return;
			}

			dispatch(
				referencesActions.setAtachmentAfterUpload({
					channelId: currentChannelId,
					files: [
						{
							filename: file.name,
							filetype: file.type,
							size: file.size,
							url: URL.createObjectURL(file)
						}
					]
				})
			);
		},
		[attachmentFilteredByChannelId?.files?.length, currentChannelId]
	);

	const onPastedFiles = useCallback(
		async (event: React.ClipboardEvent<HTMLDivElement>, anonymousMessage?: boolean) => {
			const items = (event.clipboardData || (window as any).clipboardData).items;
			const files: File[] = [];
			if (items) {
				for (let i = 0; i < items.length; i++) {
					if (items[i].type.indexOf('image') !== -1) {
						const file = items[i].getAsFile();
						if (file) {
							files.push(file);
						}
					}
				}

				if (files.length > 0) {
					if (files.length + attachmentFilteredByChannelId?.files?.length > MAX_FILE_ATTACHMENTS) {
						setOverUploadingState(true, UploadLimitReason.COUNT);
						return;
					}
					const updatedFiles = await Promise.all(files.map(processFile<ApiMessageAttachment>));
					dispatch(
						referencesActions.setAtachmentAfterUpload({
							channelId: currentChannelId,
							files: updatedFiles
						})
					);
				}
			}
		},
		[clientRef, currentChannelId, currentClanId, sessionRef, props.mode, attachmentFilteredByChannelId?.files?.length]
	);

	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const handleChildContextMenu = (event: React.MouseEvent) => {
		event.stopPropagation();
	};

	const [isRecording, setIsRecording] = useState(false);

	const handleEndRecording = useCallback(() => {
		setIsRecording(false);
	}, []);

	const voiceLongPressHandlers: ILongPressType = useLongPress<HTMLDivElement>({
		onStart: () => setIsRecording(true),
		onFinish: () => setIsRecording(false)
	});

	return (
		<div className="relative max-sm:-pb-2">
			{checkAttachment && (
				<div className={` ${checkAttachment ? 'px-3 pb-1 pt-5  bg-theme-input' : ''} text-theme-primary max-h-full `}>
					<div className={`max-h-full  flex-nowrap flex gap-6 !overflow-y-hidden !overflow-x-auto thread-scroll relative z-0 `}>
						{attachmentFilteredByChannelId?.files?.map((item: ApiMessageAttachment, index: number) => {
							return (
								<Fragment key={index}>
									<AttachmentPreviewThumbnail
										attachment={item}
										channelId={currentChannelId ?? ''}
										onRemove={removeAttachmentByIndex}
										indexOfItem={index}
									/>
								</Fragment>
							);
						})}
					</div>
				</div>
			)}

			<AudioRecorderControl outerRecording={isRecording} onSendRecord={handleEndRecording} />
			<div
				className={`flex flex-inline items-start gap-2 box-content max-sm:mb-0
			bg-theme-surface rounded-lg relative shadow-md border-theme-primary ${checkAttachment || hasReplyMessage ? 'rounded-t-none' : 'rounded-t-lg'}
			${closeMenu && !statusMenu ? 'max-w-wrappBoxChatViewMobile' : 'w-wrappBoxChatView'}`}
			>
				<FileSelectionButton
					currentClanId={currentClanId || ''}
					currentChannelId={currentChannelId || ''}
					hasPermissionEdit={canSendMessage}
				/>

				<div className={`w-[calc(100%_-_50px)] bg-theme-surface gap-3 flex items-center rounded-e-md`}>
					<div className={`w-full rounded-r-lg  gap-3 relative whitespace-pre-wrap`} onContextMenu={handleChildContextMenu}>
						<MentionReactInput
							handlePaste={onPastedFiles}
							listMentions={props.listMentions}
							onSend={props.onSend}
							onTyping={props.onTyping}
							currentChannelId={props.currentChannelId ?? ''}
							handleConvertToFile={onConvertToFiles}
							currentClanId={currentClanId}
							mode={props.mode}
							hasPermissionEdit={canSendMessage}
							voiceLongPress={voiceLongPressHandlers}
							isRecording={isRecording}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

MessageBox.Skeleton = () => {
	return (
		<div className="self-stretch h-fit px-4 mb-[8px] mt-[8px] flex-col justify-end items-start gap-2 flex overflow-visible">
			<form className="self-stretch p-4 bg-theme-surface rounded-lg justify-start gap-2 inline-flex items-center">
				<div className="flex flex-row h-full items-center">
					<div className="flex flex-row  justify-end h-fit">
						<Icons.AddCircle />
					</div>
				</div>

				<div className="grow self-stretch justify-start items-center gap-2 flex">
					<div
						contentEditable
						className="grow text-sm placeholder-[#AEAEAE] h-fit border-none focus:border-none outline-none bg-transparent overflow-y-auto resize-none text-theme-primary"
					/>
				</div>
				<div className="flex flex-row h-full items-center gap-1 mr-2 w-12 rounded-r-lg">
					<Icons.Gif />
					<Icons.Help />
				</div>
			</form>
		</div>
	);
};

const MemoizedMessageBox = memo(MessageBox) as unknown as typeof MessageBox & { Skeleton: typeof MessageBox.Skeleton };

export default MemoizedMessageBox;
