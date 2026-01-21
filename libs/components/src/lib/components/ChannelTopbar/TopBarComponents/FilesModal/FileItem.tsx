import type { AttachmentEntity } from '@mezon/store';
import { selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { DOWNLOAD_FILE, EFailAttachment, convertTimeString, electronBridge } from '@mezon/utils';
import isElectron from 'is-electron';
import type { ChannelStreamMode } from 'mezon-js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RenderAttachmentThumbnail } from '../../../ThumbnailAttachmentRender';

type FileItemProps = {
	readonly attachmentData: AttachmentEntity;
	readonly mode?: ChannelStreamMode;
};

const FileItem = ({ attachmentData, mode }: FileItemProps) => {
	const { t } = useTranslation('channelTopbar');
	const userSendAttachment = useAppSelector((state) => selectMemberClanByUserId(state, attachmentData?.uploader ?? ''));
	const username = userSendAttachment?.user?.username;
	const attachmentSendTime = attachmentData?.create_time_seconds ? convertTimeString(attachmentData?.create_time_seconds) : '';
	const fileType = getFileExtension(attachmentData?.filetype ?? '');

	function getFileExtension(filetype: string) {
		if (filetype === 'application/vnd.android.package-archive') {
			return 'FILE';
		}

		return filetype ?? 'FILE';
	}

	const handleDownload = async (event: React.MouseEvent) => {
		event.stopPropagation();
		const response = await fetch(attachmentData?.url as string);
		if (!response.ok) {
			return;
		}
		if (isElectron()) {
			const fileName = !attachmentData.filename?.includes('.')
				? `${attachmentData.filename}.${attachmentData.filetype}`
				: attachmentData.filename;
			try {
				await electronBridge.invoke(DOWNLOAD_FILE, {
					url: attachmentData.url as string,
					defaultFileName: fileName
				});
			} catch (error) {
				console.error('Error during download:', error);
			}
		} else {
			try {
				const blob = await response.blob();
				const dataUrl = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = dataUrl;
				a.download = attachmentData.filename as string;
				a.click();
			} catch (error) {
				console.error('Error during download:', error);
			}
		}
	};
	const thumbnailAttachment = RenderAttachmentThumbnail({ attachment: attachmentData, size: 'w-8 h-10', isFileList: true });

	const hideTheInformationFile =
		attachmentData.filetype !== 'image/gif' &&
		attachmentData.filetype !== 'image/png' &&
		attachmentData.filetype !== 'image/jpeg' &&
		attachmentData.filetype !== 'video/mp4';

	const [hoverShowOptButtonStatus, setHoverShowOptButtonStatus] = useState(false);
	const hoverOptButton = () => {
		setHoverShowOptButtonStatus(true);
	};

	return (
		<div
			onMouseEnter={hoverOptButton}
			onMouseLeave={() => setHoverShowOptButtonStatus(false)}
			onClick={(event) => {
				event.stopPropagation();
				handleDownload(event);
			}}
			className={`cursor-pointer break-all w-full gap-3 flex py-3 pl-3 pr-3 rounded-lg max-w-full ${hideTheInformationFile ? 'bg-theme-setting-nav border-theme-primary' : ''}  relative`}
			role="button"
		>
			<div className="flex items-center">{thumbnailAttachment}</div>
			{attachmentData.filename === EFailAttachment.FAIL_ATTACHMENT ? (
				<div className="text-red-500">{t('fileItem.attachmentFailed')}</div>
			) : (
				hideTheInformationFile && (
					<>
						<div className="cursor-pointer">
							<p className="text-blue-500 hover:underline w-fit one-line">{attachmentData?.filename ?? 'File'}</p>
							{hoverShowOptButtonStatus ? (
								<span>
									{t('fileItem.download')} <span className="font-medium uppercase">{fileType}</span>
								</span>
							) : (
								<p className=" w-fit one-line">{t('fileItem.sharedBy', { username, time: attachmentSendTime })}</p>
							)}
						</div>
						{hoverShowOptButtonStatus && (
							<div className="h-8 absolute right-4 top-1/2 transform -translate-y-1/2 rounded-md  border flex flex-row justify-center items-center">
								<div
									onClick={(event) => {
										event.stopPropagation();
										handleDownload(event);
									}}
									role="button"
									className="rounded-md w-8 h-8 flex flex-row justify-center items-center cursor-pointer bg-theme-input bg-secondary-button-hover text-theme-primary-hover "
								>
									<Icons.Download defaultSize="w-4 h-4" />
								</div>
							</div>
						)}
					</>
				)
			)}
		</div>
	);
};

export default FileItem;
