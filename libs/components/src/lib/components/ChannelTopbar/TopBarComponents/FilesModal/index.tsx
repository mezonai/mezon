import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import {
	attachmentActions,
	getStore,
	selectAllListDocumentByChannel,
	selectAttachmentPaginationByChannel,
	selectCurrentDM,
	selectCurrentUserId,
	selectCurrentUsername,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { AttachmentTypeUpload } from '@mezon/utils';
import type { RefObject, UIEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGalleryTarget } from '../../GalleryModal';
import EmptyFile from './EmptyFile';
import FileItem from './FileItem';
import SearchFile from './SearchFile';

const FILES_PAGE_LIMIT = 100;
const LOAD_MORE_THRESHOLD = 200;

type FileModalProps = {
	onClose: () => void;
	rootRef?: RefObject<HTMLElement>;
};

const FileModal = ({ onClose, rootRef }: FileModalProps) => {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const { channelId, clanId } = useGalleryTarget();
	const isDirect = clanId === '0';
	const [keywordSearch, setKeywordSearch] = useState('');

	const allAttachments = useAppSelector((state) => selectAllListDocumentByChannel(state, channelId));
	const pagination = useAppSelector((state) => selectAttachmentPaginationByChannel(state, channelId, AttachmentTypeUpload.doc));
	const currentUserId = useAppSelector(selectCurrentUserId);
	const currentUsername = useAppSelector(selectCurrentUsername);
	const currentDm = useAppSelector(selectCurrentDM);
	const modalRef = useRef<HTMLDivElement>(null);

	const dmUserIds = currentDm?.user_ids;
	const dmUsernames = currentDm?.usernames;
	const fallbackUsernames = useMemo(() => {
		const usernames: Record<string, string> = {};
		if (isDirect) {
			dmUserIds?.forEach((userId, index) => {
				if (dmUsernames?.[index]) {
					usernames[userId] = dmUsernames[index];
				}
			});
		}
		if (currentUserId && currentUsername) {
			usernames[currentUserId] = currentUsername;
		}
		return usernames;
	}, [isDirect, dmUserIds, dmUsernames, currentUserId, currentUsername]);

	useEffect(() => {
		if (!channelId || !clanId) return;
		dispatch(attachmentActions.fetchChannelAttachments({ clanId, channelId, limit: FILES_PAGE_LIMIT, fileType: AttachmentTypeUpload.doc }));
	}, [channelId, clanId, dispatch]);

	const loadOlderFiles = () => {
		if (!channelId || !clanId) return;
		const { isLoading, hasMoreBefore } = selectAttachmentPaginationByChannel(getStore().getState(), channelId, AttachmentTypeUpload.doc);
		const oldestCreateTime = Number(allAttachments[allAttachments.length - 1]?.create_time_seconds);
		if (isLoading || !hasMoreBefore || !oldestCreateTime) return;

		dispatch(
			attachmentActions.fetchChannelAttachments({
				clanId,
				channelId,
				fileType: AttachmentTypeUpload.doc,
				limit: FILES_PAGE_LIMIT,
				before: oldestCreateTime + 1,
				direction: 'before',
				noCache: true
			})
		);
	};

	const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
		if (scrollHeight - scrollTop - clientHeight <= LOAD_MORE_THRESHOLD) {
			loadOlderFiles();
		}
	};

	const filteredAttachments = allAttachments.filter(
		(attachment) => attachment.filename && attachment.filename.toLowerCase().includes(keywordSearch.toLowerCase())
	);

	useEscapeKeyClose(modalRef, onClose);
	useOnClickOutside(modalRef, onClose, rootRef);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="absolute top-8 right-0 max-md:fixed max-md:top-14 max-md:left-4 max-md:right-4 rounded-md dark:shadow-shadowBorder shadow-shadowInbox z-[99999999] origin-top-right"
		>
			<div className="flex bg-theme-setting-primary flex-col rounded-md min-h-[400px] w-full md:w-[480px] max-h-[80vh] lg:w-[540px]  shadow-sm overflow-hidden">
				<div className=" bg-theme-setting-nav flex flex-row items-center justify-between p-[16px] h-12">
					<div className="flex flex-row items-center border-r-[1px] border-color-theme pr-[16px] gap-4">
						<Icons.FileIcon />
						<span className="text-base font-semibold cursor-default ">{t('modals.files.title')}</span>
					</div>
					<SearchFile setKeywordSearch={setKeywordSearch} />
					<div className="flex flex-row items-center gap-4 text-theme-primary-hover">
						<button onClick={onClose}>
							<Icons.Close className="w-4 h-4 " />
						</button>
					</div>
				</div>
				<div className={`flex flex-col gap-2 py-2  px-[16px] min-h-full flex-1 overflow-y-auto thread-scroll`} onScroll={handleListScroll}>
					{filteredAttachments.map((attachment) => (
						<FileItem
							key={attachment.id}
							attachmentData={attachment}
							channelId={channelId}
							isDirect={isDirect}
							fallbackUsername={fallbackUsernames[attachment.uploader ?? '']}
						/>
					))}

					{pagination.isLoading && <div className="py-2 text-center text-sm">{t('loading')}</div>}
					{!filteredAttachments.length && !pagination.isLoading && <EmptyFile />}
				</div>
			</div>
		</div>
	);
};

export default FileModal;
