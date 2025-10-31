import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import {
	attachmentActions,
	selectAllListDocumentByChannel,
	selectCurrentChannelChannelId,
	selectCurrentChannelClanId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmptyFile from './EmptyFile';
import FileItem from './FileItem';
import SearchFile from './SearchFile';

type FileModalProps = {
	onClose: () => void;
	rootRef?: RefObject<HTMLElement>;
};

const FileModal = ({ onClose, rootRef }: FileModalProps) => {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const channelId = useAppSelector(selectCurrentChannelChannelId);
	const clanId = useAppSelector(selectCurrentChannelClanId);
	const [keywordSearch, setKeywordSearch] = useState('');

	const allAttachments = useAppSelector((state) => selectAllListDocumentByChannel(state, (channelId ?? '') as string));
	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!channelId || !clanId) return;
		dispatch(attachmentActions.fetchChannelAttachments({ clanId, channelId, limit: 100 }));
	}, [channelId, clanId, dispatch]);

	const filteredAttachments = allAttachments.filter(
		(attachment) => attachment.filename && attachment.filename.toLowerCase().includes(keywordSearch.toLowerCase())
	);

	useEscapeKeyClose(modalRef, onClose);
	useOnClickOutside(modalRef, onClose, rootRef);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="absolute top-8 right-0 rounded-md dark:shadow-shadowBorder shadow-shadowInbox z-[99999999] origin-top-right"
		>
			<div className="flex bg-theme-setting-primary flex-col rounded-md min-h-[400px] md:w-[480px] max-h-[80vh] lg:w-[540px]  shadow-sm overflow-hidden">
				<div className=" bg-theme-setting-nav flex flex-row items-center justify-between p-[16px] h-12">
					<div className="flex flex-row items-center border-r-[1px] border-color-theme pr-[16px] gap-4">
						<Icons.FileIcon />
						<span className="text-base font-semibold cursor-default ">{t('modals.files.title')}</span>
					</div>
					<SearchFile setKeywordSearch={setKeywordSearch} />
					<div className="flex flex-row items-center gap-4 text-theme-primary-hover">
						<button onClick={onClose}>
							<Icons.Close defaultSize="w-4 h-4 " />
						</button>
					</div>
				</div>
				<div className={`flex flex-col gap-2 py-2  px-[16px] min-h-full flex-1 overflow-y-auto thread-scroll`}>
					{filteredAttachments.map((attachment) => (
						<FileItem key={attachment.id} attachmentData={attachment} />
					))}

					{!filteredAttachments.length && <EmptyFile />}
				</div>
			</div>
		</div>
	);
};

export default FileModal;
