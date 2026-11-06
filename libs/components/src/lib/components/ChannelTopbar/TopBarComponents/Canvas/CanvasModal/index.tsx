import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import {
	appActions,
	canvasAPIActions,
	selectCanvasIdsByChannelId,
	selectCurrentChannelChannelId,
	selectCurrentChannelCreatorId,
	selectCurrentChannelParentId,
	selectCurrentClanId,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import type { RefObject } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ModalConfirm from '../../../../ModalConfirm';
import EmptyCanvas from './EmptyCanvas';
import GroupCanvas from './GroupCanvas';
import SearchCanvas from './SearchCanvas';

type CanvasProps = {
	onClose: () => void;
	rootRef?: RefObject<HTMLElement>;
};

const CanvasModal = ({ onClose, rootRef }: CanvasProps) => {
	const { t } = useTranslation('channelTopbar');
	const { t: tCommon } = useTranslation('common');
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { canvasId: currentCanvasId } = useParams<{ canvasId: string }>();
	const channelId = useAppSelector(selectCurrentChannelChannelId);
	const parentId = useAppSelector(selectCurrentChannelParentId);
	const creatorChannelId = useAppSelector(selectCurrentChannelCreatorId);
	const currentClanId = useSelector(selectCurrentClanId);
	const appearanceTheme = useSelector(selectTheme);
	const [keywordSearch, setKeywordSearch] = useState('');
	const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(currentCanvasId || null);
	const [confirmModalProps, setConfirmModalProps] = useState<{
		canvasId: string;
		canvasTitle: string;
		channelId: string;
		clanId: string;
	} | null>(null);
	const canvases = useAppSelector((state) => selectCanvasIdsByChannelId(state, channelId || ''));
	const filteredCanvases = useMemo(() => {
		if (!keywordSearch) return canvases;
		const lowerCaseQuery = keywordSearch.toLowerCase().trim();
		return canvases.filter((entity) => entity.title.toLowerCase().includes(lowerCaseQuery));
	}, [canvases, keywordSearch]);

	const handleCreateCanvas = async () => {
		const isThread = Boolean(parentId && parentId !== '0');
		const id = channelId;

		if (!id || !currentClanId) {
			console.error('Error: ID is undefined. Check channel data');
			return;
		}

		dispatch(appActions.setIsShowCanvas(true));
		const newCanvasPath = isThread
			? `/chat/clans/${currentClanId}/channels/${id}/canvas/new`
			: `/chat/clans/${currentClanId}/channels/${id}/canvas/new`;
		navigate(newCanvasPath);
		onClose();
	};

	const handleSelectCanvas = (canvasId: string) => {
		setSelectedCanvasId(canvasId);
	};

	const handleDeleteCanvas = async () => {
		if (confirmModalProps && confirmModalProps.channelId && confirmModalProps.clanId) {
			const body = {
				id: confirmModalProps.canvasId,
				channel_id: confirmModalProps.channelId,
				clan_id: confirmModalProps.clanId
			};
			await dispatch(canvasAPIActions.deleteCanvas(body));
			dispatch(canvasAPIActions.removeOneCanvas({ channelId: confirmModalProps.channelId, canvasId: confirmModalProps.canvasId }));
			if (currentCanvasId === confirmModalProps.canvasId) {
				dispatch(appActions.setIsShowCanvas(false));
				const redirectPath = `/chat/clans/${confirmModalProps.clanId}/channels/${confirmModalProps.channelId}`;
				navigate(redirectPath);
			}
		}
		setConfirmModalProps(null);
		closeModalConfirm();
	};

	const handleOpenConfirmDelete = (canvasId: string, canvasTitle: string) => {
		if (channelId && currentClanId) {
			setConfirmModalProps({ canvasId, canvasTitle, channelId, clanId: currentClanId });
			openModalConfirm();
		}
	};

	const modalRef = useRef<HTMLDivElement>(null);

	const [openModalConfirm, closeModalConfirm] = useModal(() => {
		return (
			<ModalConfirm
				handleCancel={() => {
					setConfirmModalProps(null);
					closeModalConfirm();
					modalRef.current?.focus();
				}}
				handleConfirm={handleDeleteCanvas}
				modalName={confirmModalProps?.canvasTitle}
				title="Delete"
				buttonName="Delete"
				message={tCommon('canvas.deleteMessage')}
			/>
		);
	}, [confirmModalProps]);

	useEscapeKeyClose(modalRef, onClose);
	useOnClickOutside(
		modalRef,
		() => {
			if (!confirmModalProps) onClose();
		},
		rootRef
	);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="absolute top-8 right-0 rounded-md dark:shadow-shadowBorder shadow-shadowInbox z-[99999999] origin-top-right"
		>
			<div className="flex flex-col bg-theme-setting-primary rounded-md h-[400px] md:w-[480px] max-h-[80vh] lg:w-[540px] justify-between shadow-sm overflow-hidden">
				<div className="flex flex-row items-center bg-theme-setting-nav border-b-theme-primary justify-between p-[16px] h-12 ">
					<div className="flex flex-row items-center border-r-[1px] border-color-theme pr-[16px] gap-4">
						<MezonIcon icon={MzIcons20.mzCanvas} className="shrink-0 text-[var(--mz-icon)]" />
						<span className="text-base font-semibold cursor-default ">{t('modals.canvas.title')}</span>
					</div>
					<SearchCanvas setKeywordSearch={setKeywordSearch} />
					<div className="flex flex-row items-center gap-4">
						<button
							onClick={handleCreateCanvas}
							className="px-3 h-6 rounded-lg btn-primary btn-primary-hover text-sm"
							data-e2e={generateE2eId('chat.channel_message.header.button.canvas.modal.canvas_management.button.create_canvas')}
						>
							{t('modals.canvas.create')}
						</button>
						<button onClick={onClose} className="text-theme-primary text-theme-primary-hover group/mzi">
							<MezonIcon icon={MzIcons16.mzClose} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
						</button>
					</div>
				</div>
				<div
					className={`flex flex-col gap-2 py-2 px-[16px] flex-1 overflow-y-auto ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'}`}
				>
					{filteredCanvases?.map((canvas) => {
						return (
							<GroupCanvas
								onClose={onClose}
								key={canvas.id}
								canvas={canvas}
								channelId={channelId}
								clanId={currentClanId || ''}
								creatorIdChannel={creatorChannelId}
								selectedCanvasId={selectedCanvasId}
								onSelectCanvas={handleSelectCanvas}
								onDeleteCanvas={handleOpenConfirmDelete}
							/>
						);
					})}

					{!canvases?.length && <EmptyCanvas onClick={handleCreateCanvas} />}
				</div>
			</div>
		</div>
	);
};

export default CanvasModal;
