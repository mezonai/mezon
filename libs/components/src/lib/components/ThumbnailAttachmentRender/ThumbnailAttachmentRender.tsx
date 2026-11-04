import type { IconData } from '@mezon/ui';
import { MezonIcon, MzIcons16, MzIcons20, MzIcons32, MzIcons40, MzIcons48 } from '@mezon/ui';
import { EMimeTypes, SHOW_POSITION, createImgproxyUrl, fileTypeImage, fileTypeVideo } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useMessageContextMenu } from '../ContextMenu';
import { MessageAudioControl } from '../MessageWithUser/MessageAudio/MessageAudioControl';
import type { FileIconName } from './TypeFormats';
import { typeFormats } from './TypeFormats';

const FILE_ICONS: Record<FileIconName, [IconData, IconData, IconData]> = {
	mzFile: [MzIcons32.mzFile, MzIcons40.mzFile, MzIcons48.mzFile],
	mzFileArchive: [MzIcons32.mzFileArchive, MzIcons40.mzFileArchive, MzIcons48.mzFileArchive],
	mzFileAudio: [MzIcons32.mzFileAudio, MzIcons40.mzFileAudio, MzIcons48.mzFileAudio],
	mzFileCode: [MzIcons32.mzFileCode, MzIcons40.mzFileCode, MzIcons48.mzFileCode],
	mzFilePdf: [MzIcons32.mzFilePdf, MzIcons40.mzFilePdf, MzIcons48.mzFilePdf],
	mzFileSheet: [MzIcons32.mzFileSheet, MzIcons40.mzFileSheet, MzIcons48.mzFileSheet],
	mzFileText: [MzIcons32.mzFileText, MzIcons40.mzFileText, MzIcons48.mzFileText]
};

const LEGACY_FILE_ICONS: Record<FileIconName, JSX.Element> = {
	mzFile: <MezonIcon icon={MzIcons48.mzFile} className="w-[72px] h-[96px] text-[var(--mz-icon)]" />,
	mzFileArchive: <MezonIcon icon={MzIcons48.mzFileArchive} className="w-[72px] h-[96px] text-[var(--mz-icon)]" />,
	mzFileAudio: <MezonIcon icon={MzIcons48.mzFileAudio} className="w-[72px] h-[96px] text-[var(--mz-icon)]" />,
	mzFileCode: <MezonIcon icon={MzIcons48.mzFileCode} className="w-[72px] h-[96px] text-[var(--mz-icon)]" />,
	mzFilePdf: <MezonIcon icon={MzIcons48.mzFilePdf} className="w-[72px] h-[96px] text-[var(--mz-icon)]" />,
	mzFileSheet: <MezonIcon icon={MzIcons48.mzFileSheet} className="w-[72px] h-[96px] text-[var(--mz-icon)]" />,
	mzFileText: <MezonIcon icon={MzIcons48.mzFileText} className="w-[72px] h-[96px] text-[var(--mz-icon)]" />
};

const SIZE_INDEX: Record<string, number> = { 'w-8 h-8': 0, 'w-8 h-10': 1, 'w-10 h-10': 1 };

const fileIcon = (name: FileIconName, size?: string) => FILE_ICONS[name][SIZE_INDEX[size ?? ''] ?? 2];

const renderFileIcon = (name: FileIconName, size?: string) =>
	size === undefined ? LEGACY_FILE_ICONS[name] : <MezonIcon icon={fileIcon(name, size)} className="text-[var(--mz-icon)]" />;

export interface IRenderAttachmentThumbnailParam {
	attachment: ApiMessageAttachment;
	size?: string;
	pos?: string;
	isFileList?: boolean;
	/** The upload has not been confirmed yet, so its CDN object may not exist. */
	isPresignPending?: boolean;
}

export const RenderAttachmentThumbnail = ({ attachment, size, pos, isFileList, isPresignPending }: IRenderAttachmentThumbnailParam) => {
	const fileType = attachment.filetype;

	const renderIcon = typeFormats.find((typeFormat: any) => typeFormat.type === fileType);

	const hasFileImage = fileType && fileTypeImage.includes(fileType);

	const hasFileVideo = fileType && fileTypeVideo.includes(fileType);

	const isAudioFile = fileType && fileType.startsWith('audio');

	const { setPositionShow } = useMessageContextMenu();

	const handleContextMenu = useCallback(() => {
		if (attachment.filetype === EMimeTypes.sticker) {
			setPositionShow(SHOW_POSITION.IN_STICKER);
		}
	}, [attachment.filetype]);
	return (
		<div onContextMenu={handleContextMenu}>
			{isAudioFile && <AudioAttachment attachment={attachment} size={size} isFileList={isFileList} />}

			{hasFileImage && isPresignPending && (
				<div key="image-thumbnail-pending" className="w-[174px] aspect-square bg-bgLightSecondary dark:bg-bgSecondary" />
			)}

			{hasFileImage && !isPresignPending && (
				<img
					key="image-thumbnail"
					src={createImgproxyUrl(attachment.url ?? '', { width: 174, height: 174, resizeType: 'fill' })}
					role="presentation"
					className="w-[174px] aspect-square object-cover"
					alt={attachment.url}
				/>
			)}

			{hasFileVideo && (
				<div className="relative w-[174px] aspect-square overflow-hidden rounded-md bg-bgLightSecondary dark:bg-bgSecondary">
					{attachment.thumbnail && !isPresignPending && (
						<img
							src={
								attachment.thumbnail.startsWith('blob:')
									? attachment.thumbnail
									: createImgproxyUrl(attachment.thumbnail, { width: 174, height: 174, resizeType: 'fill' })
							}
							role="presentation"
							className="w-full h-full object-cover"
							alt=""
						/>
					)}
					<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
						<div className="flex items-center justify-center w-10 h-10 rounded-full bg-black bg-opacity-50">
							<MezonIcon icon={MzIcons20.mzPlay} className="text-white" />
						</div>
					</div>
				</div>
			)}

			{!isAudioFile && renderIcon && renderFileIcon(renderIcon.icon, size)}

			{!hasFileImage && !hasFileVideo && !renderIcon && !isAudioFile && renderFileIcon('mzFile', size)}
		</div>
	);
};

interface IAudioAttachmentProps {
	attachment: ApiMessageAttachment;
	size?: string;
	isFileList?: boolean;
}

export const AudioAttachment = ({ attachment, size, isFileList }: IAudioAttachmentProps) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState<number>(0);
	const audioControlRef = useRef<{ togglePlay: () => void }>(null);

	const handleTogglePlay = (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		if (audioControlRef.current) {
			audioControlRef.current.togglePlay();
		}
	};

	const overlayStyle = useMemo(() => {
		if (isFileList) {
			return { container: 'w-5 h-5', play: MzIcons16.mzPlay, pause: MzIcons16.mzPause };
		}
		return { container: 'w-12 h-12', play: MzIcons20.mzPlay, pause: MzIcons20.mzPause };
	}, [isFileList]);

	return (
		<div className="relative inline-flex items-center justify-center group">
			{renderFileIcon('mzFile', size)}
			<div
				onClick={(e) => handleTogglePlay(e)}
				className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 group-hover:bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer transition-all ${overlayStyle.container}`}
			>
				{isPlaying ? <MezonIcon icon={overlayStyle.pause} /> : <MezonIcon icon={overlayStyle.play} className="ml-0.5" />}
			</div>
			<MessageAudioControl
				ref={audioControlRef}
				audioUrl={attachment.url || ''}
				setDuration={setDuration}
				setCurrentTime={setCurrentTime}
				setIsPlaying={setIsPlaying}
				isPlaying={isPlaying}
			/>
		</div>
	);
};
