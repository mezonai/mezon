import { useAppNavigation, useAppParams } from '@mezon/core';
import {
	SetMuteNotificationPayload,
	SetNotificationPayload,
	deleteChannel,
	directMetaActions,
	fetchDirectMessage,
	notificationSettingActions,
	removeMemberChannel,
	selectCurrentUserId,
	selectDirectById,
	selectSelectedChannelNotificationSetting,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { FOR_15_MINUTES, FOR_1_HOUR, FOR_24_HOURS, FOR_3_HOURS, FOR_8_HOURS } from '@mezon/utils';
import { format } from 'date-fns';
import { Dropdown } from 'flowbite-react';
import { ChannelType } from 'mezon-js';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ModalConfirm from '../ModalConfirm';
import ItemPanel from '../PanelChannel/ItemPanel';
import ItemPanelMember from './ItemPanelMember';
interface PanelGroupDMPProps {
	isDmGroupOwner: boolean;
	dmGroupId?: string;
	lastOne: boolean;
}

const PanelGroupDM = ({ isDmGroupOwner, dmGroupId, lastOne }: PanelGroupDMPProps) => {
	const dispatch = useAppDispatch();
	const { directId } = useAppParams();
	const currentUserId = useAppSelector(selectCurrentUserId);
	const channel = useAppSelector((state) => selectDirectById(state, dmGroupId || ''));
	const { navigate } = useAppNavigation();
	const [popupLeave, setPopupLeave] = useState<boolean>(false);
	const getNotificationChannelSelected = useSelector(selectSelectedChannelNotificationSetting);
	const [nameChildren, setNameChildren] = useState('');
	const [mutedUntil, setmutedUntil] = useState('');
	const handleLeaveDmGroup = async () => {
		const isLeaveOrDeleteGroup = lastOne
			? await dispatch(deleteChannel({ clanId: '', channelId: dmGroupId ?? '', isDmGroup: true }))
			: await dispatch(removeMemberChannel({ channelId: dmGroupId || '', userIds: [currentUserId], kickMember: false }));
		if (!isLeaveOrDeleteGroup) {
			return;
		}
		if (directId === dmGroupId) {
			navigate('/chat/direct/friends');
		}
		await dispatch(fetchDirectMessage({ noCache: true }));
	};

	const handleConfirmLeave = (e: Event) => {
		if (lastOne) {
			e.stopPropagation();
			setPopupLeave(true);
			return;
		}
		handleLeaveDmGroup();
	};

	const handleCancelLeave = () => {
		setPopupLeave(false);
	};
	const handleMarkAsRead = useCallback(
		(directId: string) => {
			const timestamp = Date.now() / 1000;
			dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: directId, timestamp: timestamp }));
		},
		[dispatch]
	);

	useEffect(() => {
		if (getNotificationChannelSelected?.active === 1 || getNotificationChannelSelected?.id === '0') {
			setNameChildren(`Mute Conversation`);
			setmutedUntil('');
		} else {
			setNameChildren(`UnMute Conversation`);

			if (getNotificationChannelSelected?.time_mute) {
				const timeMute = new Date(getNotificationChannelSelected.time_mute);
				const currentTime = new Date();
				if (timeMute > currentTime) {
					const timeDifference = timeMute.getTime() - currentTime.getTime();
					const formattedDate = format(timeMute, 'dd/MM, HH:mm');
					setmutedUntil(`Muted until ${formattedDate}`);

					setTimeout(() => {
						const body = {
							channel_id: dmGroupId || '',
							notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
							clan_id: '',
							active: 1,
							is_current_channel: dmGroupId === directId
						};
						dispatch(notificationSettingActions.setMuteNotificationSetting(body));
					}, timeDifference);
				}
			}
		}
	}, [getNotificationChannelSelected]);

	const muteOrUnMuteChannel = (active: number) => {
		const body = {
			channel_id: dmGroupId || '',
			notification_type: 0,
			clan_id: '',
			active: active,
			is_current_channel: dmGroupId === directId
		};
		dispatch(notificationSettingActions.setMuteNotificationSetting(body));
	};

	const handleScheduleMute = (duration: number) => {
		if (duration !== Infinity) {
			const now = new Date();
			const unmuteTime = new Date(now.getTime() + duration);
			const unmuteTimeISO = unmuteTime.toISOString();

			const body: SetNotificationPayload = {
				channel_id: dmGroupId || '',
				notification_type: 0,
				clan_id: '',
				time_mute: unmuteTimeISO,
				is_current_channel: dmGroupId === directId,
				is_direct: channel?.type === ChannelType.CHANNEL_TYPE_DM || channel?.type === ChannelType.CHANNEL_TYPE_GROUP
			};
			dispatch(notificationSettingActions.setNotificationSetting(body));
		} else {
			const body: SetMuteNotificationPayload = {
				channel_id: dmGroupId || '',
				notification_type: 0,
				clan_id: '',
				active: 0,
				is_current_channel: dmGroupId === directId
			};
			dispatch(notificationSettingActions.setMuteNotificationSetting(body));
		}
	};

	return (
		<>
			<div className="border-b dark:border-[#2e2f34]">
				<ItemPanelMember onClick={() => handleMarkAsRead(dmGroupId ?? '')} children="Mark as read" />
			</div>
			<div className="border-b dark:border-[#2e2f34]">
				{isDmGroupOwner && <ItemPanelMember children="Invites" />}
				<ItemPanelMember children="Change icon" />
			</div>
			<div className="border-b dark:border-[#2e2f34]">
				{getNotificationChannelSelected?.active === 1 || getNotificationChannelSelected?.id === '0' ? (
					<Dropdown
						trigger="hover"
						dismissOnClick={false}
						renderTrigger={() => (
							<div>
								<ItemPanel children={nameChildren} dropdown="change here" onClick={() => muteOrUnMuteChannel(0)} />
							</div>
						)}
						label=""
						placement="right-start"
						className="dark:!bg-bgProfileBody bg-gray-100 border-none ml-[3px] py-[6px] px-[8px] w-[200px]"
					>
						<ItemPanel children="For 15 Minutes" onClick={() => handleScheduleMute(FOR_15_MINUTES)} />
						<ItemPanel children="For 1 Hour" onClick={() => handleScheduleMute(FOR_1_HOUR)} />
						<ItemPanel children="For 3 Hour" onClick={() => handleScheduleMute(FOR_3_HOURS)} />
						<ItemPanel children="For 8 Hour" onClick={() => handleScheduleMute(FOR_8_HOURS)} />
						<ItemPanel children="For 24 Hour" onClick={() => handleScheduleMute(FOR_24_HOURS)} />
						<ItemPanel children="Until I turn it back on" onClick={() => handleScheduleMute(Infinity)} />
					</Dropdown>
				) : (
					<ItemPanel children={nameChildren} onClick={() => muteOrUnMuteChannel(1)} subText={mutedUntil} />
				)}
			</div>
			<ItemPanelMember children={lastOne ? 'Delete Group' : 'Leave Group'} danger onClick={handleConfirmLeave} />
			{popupLeave && lastOne && (
				<ModalConfirm
					handleCancel={handleCancelLeave}
					handleConfirm={handleLeaveDmGroup}
					title="delete"
					modalName="this group"
					buttonName="Delete Group"
				/>
			)}
		</>
	);
};

export default PanelGroupDM;
