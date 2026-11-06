import { useMessageValue } from '@mezon/core';
import { selectComposeInputByChannelId, selectCurrentChannelId, selectIsPrivate, threadsActions, useAppDispatch, useAppSelector } from '@mezon/store';
import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import type { ApiChannelDescription } from 'mezon-js';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

type ThreadHeaderProps = {
	threadCurrentChannel?: ApiChannelDescription | null;
};

const ThreadHeader = ({ threadCurrentChannel }: ThreadHeaderProps) => {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const isPrivate = useSelector(selectIsPrivate);
	const isPrivateThread = threadCurrentChannel ? Boolean(threadCurrentChannel.channel_private) : isPrivate === 1;

	const setNameValueThread = useCallback(
		(nameValue: string) => {
			dispatch(threadsActions.setNameValueThread({ channelId: currentChannelId as string, nameValue }));
		},
		[currentChannelId, dispatch]
	);

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean, channelId?: string) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: channelId ? channelId : (currentChannelId as string), isShowCreateThread }));
		},
		[currentChannelId, dispatch]
	);

	const setTurnOffThreadMessage = useCallback(() => {
		dispatch(threadsActions.setOpenThreadMessageState(false));
		dispatch(threadsActions.setValueThread(null));
	}, [dispatch]);

	const { setRequestInput } = useMessageValue();
	const request = useAppSelector((state) => selectComposeInputByChannelId(state, currentChannelId as string));

	const handleCloseModal = () => {
		setTurnOffThreadMessage();
		setIsShowCreateThread(false);
		setNameValueThread('');
		setRequestInput({ ...request, valueTextInput: '' }, true);
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				handleCloseModal();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleCloseModal]);

	return (
		<div className="flex flex-row items-center justify-between px-4 h-[48px] min-h-[50px] border-b-theme-primary  z-10 bg-theme-chat">
			<div className="flex flex-row items-center gap-2 pointer-events-none">
				{isPrivateThread ? (
					<MezonIcon icon={MzIcons20.mzThreadPrivate} className="text-[var(--mz-icon)]" />
				) : (
					<MezonIcon icon={MzIcons20.mzThread} className="text-[var(--mz-icon)]" />
				)}
				<span className="text-base font-semibold text-theme-primary-active">
					{threadCurrentChannel ? threadCurrentChannel.channel_label : t('createThread.newThread')}
				</span>
			</div>
			<button
				onClick={handleCloseModal}
				className="relative right-0 text-theme-primary-hover group/mzi"
				data-e2e={generateE2eId('discussion.header.button.close')}
			>
				<MezonIcon icon={MzIcons20.mzClose} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			</button>
		</div>
	);
};

export default ThreadHeader;
