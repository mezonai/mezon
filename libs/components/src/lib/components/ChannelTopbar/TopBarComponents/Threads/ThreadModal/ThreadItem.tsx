import { useAppNavigation } from '@mezon/core';
import {
	ChannelsEntity,
	ThreadsEntity,
	appActions,
	channelsActions,
	selectAllChannelMembers,
	selectChannelById,
	selectLastMessageIdByChannelId,
	selectMemberClanByUserId2,
	selectMessageEntityById,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ChannelMembersEntity, IChannel, IChannelMember, convertTimeMessage } from '@mezon/utils';
import { Avatar } from 'flowbite-react';
import { ChannelType } from 'mezon-js';
import { MutableRefObject, useCallback, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Coords } from '../../../../ChannelLink';
import SettingChannel from '../../../../ChannelSetting';
import { useMessageSender } from '../../../../MessageWithUser/useMessageSender';
import ModalConfirm from '../../../../ModalConfirm';
import PanelChannel from '../../../../PanelChannel';
import ThreadModalContent from './ThreadModalContent';

type ThreadItemProps = {
	thread: ThreadsEntity;
	setIsShowThread: () => void;
	isPublicThread?: boolean;
	isHasContext?: boolean;
	preventClosePannel: MutableRefObject<boolean>;
};

const ThreadItem = ({ thread, setIsShowThread, isPublicThread = false, isHasContext = true, preventClosePannel }: ThreadItemProps) => {
	const navigate = useNavigate();
	const { toChannelPage } = useAppNavigation();
	const dispatch = useAppDispatch();
	const threadMembers = useSelector((state) => selectAllChannelMembers(state, thread.channel_id));
	const channelThread = useAppSelector((state) => selectChannelById(state, thread.id ?? '')) || {};

	const messageId = useAppSelector((state) => selectLastMessageIdByChannelId(state, thread.channel_id as string));
	const message = useAppSelector((state) =>
		selectMessageEntityById(state, thread.channel_id as string, messageId || thread?.last_sent_message?.id)
	);
	const user = useAppSelector((state) =>
		selectMemberClanByUserId2(state, (message?.user?.id || thread?.last_sent_message?.sender_id) as string)
	) as IChannelMember;
	const { avatarImg, username } = useMessageSender(user);
	const [openThreadSetting, closeThreadSetting] = useModal(() => {
		return <SettingChannel onClose={closeThreadSetting} channel={{ ...channelThread, type: ChannelType.CHANNEL_TYPE_THREAD }} />;
	}, [channelThread?.id]);

	const getRandomElements = (array: ChannelMembersEntity[], count: number) => {
		const result = [];
		const usedIndices = new Set();

		while (result.length < count && usedIndices.size < array.length) {
			const randomIndex = Math.floor(Math.random() * array.length);
			if (!usedIndices.has(randomIndex)) {
				usedIndices.add(randomIndex);
				result.push(array[randomIndex]);
			}
		}

		return result;
	};

	const previewAvatarList = useMemo(() => {
		if (threadMembers && threadMembers.length > 0) {
			return getRandomElements(threadMembers, 5);
		}
		return [];
	}, [threadMembers]);

	const timeMessage = useMemo(() => {
		if (message && message.create_time_seconds) {
			const lastTime = convertTimeMessage(message.create_time_seconds);
			return lastTime;
		} else {
			if (thread && thread.last_sent_message && thread.last_sent_message.timestamp_seconds) {
				const lastTime = convertTimeMessage(thread.last_sent_message.timestamp_seconds);
				return lastTime;
			}
		}
	}, [message, thread]);

	const handleLinkThread = (channelId: string, clanId: string) => {
		preventClosePannel.current = false;
		dispatch(channelsActions.upsertOne({ clanId, channel: thread as ChannelsEntity }));
		dispatch(appActions.setIsShowCanvas(false));
		navigate(toChannelPage(channelId, clanId));
		setIsShowThread();
	};

	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const panelRef = useRef<HTMLDivElement | null>(null);
	const [isShowPanelChannel, setIsShowPanelChannel] = useState<boolean>(false);

	const handlePannelThread = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		if (!isHasContext) {
			return;
		}
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;
		const distanceToBottom = windowHeight - event.clientY;
		setCoords({ mouseX, mouseY, distanceToBottom });
		setIsShowPanelChannel((s) => !s);
	};

	const handleDeleteThread = async () => {
		await dispatch(channelsActions.deleteChannel({ channelId: channelThread?.channel_id as string, clanId: channelThread?.clan_id as string }));
		await dispatch(threadsActions.remove(channelThread.id));
		closeConfirmDelete();
		dispatch(threadsActions.toggleThreadModal());
		preventClosePannel.current = false;
	};

	const [openConfirmDelete, closeConfirmDelete] = useModal(() => {
		return (
			<ModalConfirm
				handleCancel={() => {
					closeConfirmDelete();
					preventClosePannel.current = false;
				}}
				handleConfirm={handleDeleteThread}
				title="delete"
				modalName={`${channelThread?.channel_label}`}
			/>
		);
	}, [channelThread?.id]);

	const handleOpenConfirmDelete = useCallback(() => {
		setIsShowPanelChannel(false);
		dispatch(threadsActions.toggleThreadModal());
		preventClosePannel.current = true;
		openConfirmDelete();
	}, []);

	return (
		<div
			onClick={() => handleLinkThread(thread.channel_id as string, thread.clan_id || '')}
			className="relative overflow-y-hidden p-4 mb-2 cursor-pointer rounded-lg h-[72px] dark:bg-bgPrimary bg-bgLightPrimary border border-transparent dark:hover:border-bgModifierHover hover:border-bgModifierHover hover:bg-bgLightModeButton"
			role="button"
			ref={panelRef}
			onContextMenu={handlePannelThread}
		>
			<div className="flex flex-row justify-between items-center">
				<div className="flex flex-col gap-1">
					<p className="text-base font-semibold leading-5 dark:text-white text-black one-line">{thread?.channel_label}</p>
					<div className="flex flex-row items-center h-6">
						<Avatar
							img={user?.clan_avatar ?? avatarImg}
							rounded
							size={'xs'}
							theme={{ root: { size: { xs: 'w-4 h-4' } } }}
							className="mr-2"
						/>
						<span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-[#17AC86] text-sm font-semibold leading-4">
							{user?.clan_nick ?? user?.user?.display_name ?? username}:&nbsp;
						</span>
						<div className="overflow-hidden max-w-[140px]">
							<ThreadModalContent message={message} thread={thread as ChannelsEntity} />
						</div>
						<div className="overflow-x-hidden">
							<p className="text-xs font-medium leading-4 ml-2">
								<span className="truncate dark:text-white text-colorTextLightMode">•&nbsp;{timeMessage}</span>
							</p>
						</div>
					</div>
				</div>
				<div className="w-[120px]">
					{threadMembers && (
						<Avatar.Group className="flex gap-3 justify-end items-center">
							{previewAvatarList?.map((avatar, index) => (
								<img
									key={avatar.clan_avatar || avatar.user?.avatar_url}
									src={avatar.clan_avatar || avatar.user?.avatar_url}
									className="object-cover h-6 aspect-square rounded-full"
								/>
							))}
							{threadMembers && threadMembers.length > 5 && (
								<Avatar.Counter
									total={threadMembers?.length - 5 > 50 ? 50 : threadMembers?.length - 5}
									className="h-4 w-6 dark:text-bgLightPrimary text-bgPrimary ring-transparent dark:bg-bgTertiary bg-bgLightTertiary dark:hover:bg-bgTertiary hover:bg-bgLightTertiary"
								/>
							)}
						</Avatar.Group>
					)}
				</div>
			</div>
			{isShowPanelChannel && (
				<PannelThreadItem
					channelThread={{ ...channelThread, type: ChannelType.CHANNEL_TYPE_THREAD }}
					coords={coords}
					panelRef={panelRef}
					setIsShowPanelChannel={setIsShowPanelChannel}
					openThreadSetting={openThreadSetting}
					handleOpenConfirmDelete={handleOpenConfirmDelete}
				/>
			)}
		</div>
	);
};

const PannelThreadItem = ({
	channelThread,
	coords,
	setIsShowPanelChannel,
	panelRef,
	openThreadSetting,
	handleOpenConfirmDelete
}: {
	panelRef: React.MutableRefObject<HTMLDivElement | null>;
	channelThread: IChannel;
	coords: Coords;
	setIsShowPanelChannel: React.Dispatch<React.SetStateAction<boolean>>;
	openThreadSetting: () => void;
	handleOpenConfirmDelete: () => void;
}) => {
	return (
		<div onClick={(e) => e.stopPropagation()}>
			<PanelChannel
				selectedChannel={channelThread?.id}
				onDeleteChannel={handleOpenConfirmDelete}
				channel={channelThread as IChannel}
				coords={coords}
				openSetting={openThreadSetting}
				setIsShowPanelChannel={setIsShowPanelChannel}
				rootRef={panelRef}
			/>
		</div>
	);
};
export default ThreadItem;
