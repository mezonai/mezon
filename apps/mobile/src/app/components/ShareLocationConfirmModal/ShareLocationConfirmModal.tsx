import { useChatSending } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectCurrentTopicId, selectDmGroupCurrent, selectIsShowCreateTopic, useAppSelector } from '@mezon/store-mobile';
import { EBacktickType, IMessageSendPayload, filterEmptyArrays, processText } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { EMessageActionType } from '../../screens/home/homedrawer/enums';
import { style } from './styles';

type IGeoLocation = {
	latitude: number;
	longitude: number;
};

const ShareLocationConfirmModal = ({
	mode,
	channelId,
	geoLocation,
	messageAction
}: {
	mode: ChannelStreamMode;
	channelId: string;
	geoLocation: IGeoLocation;
	messageAction?: EMessageActionType;
}) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId));
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId));
	const currentTopicId = useSelector(selectCurrentTopicId);
	const isCreateTopic = useSelector(selectIsShowCreateTopic);

	const [links, setLinks] = useState([]);
	const { t } = useTranslation('message');

	const [googleMapsLink, setGoogleMapsLink] = useState<string>('');
	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect:
			mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup,
		fromTopic: isCreateTopic || !!currentTopicId
	});
	useEffect(() => {
		if (geoLocation) {
			const { latitude, longitude } = geoLocation;
			const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}&z=14&t=m&mapclient=embed`;
			setGoogleMapsLink(googleMapsLink);
			const { links } = processText(googleMapsLink);
			setLinks(links);
		}
	}, [geoLocation]);

	const handleSendMessage = async () => {
		const payloadSendMessage: IMessageSendPayload = {
			t: googleMapsLink,
			hg: [],
			ej: [],
			lk: links || [],
			mk: [
				{
					s: 0,
					e: googleMapsLink.length,
					type: EBacktickType.LINK
				}
			],
			vk: []
		};
		if (messageAction === EMessageActionType.CreateThread) {
			DeviceEventEmitter.emit(ActionEmitEvent.SEND_MESSAGE, { content: filterEmptyArrays(payloadSendMessage) });
		} else {
			await sendMessage(filterEmptyArrays(payloadSendMessage), [], [], [], false, false, true);
		}
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	const handelCancelModal = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	return (
		<View style={styles.main}>
			<View style={styles.container}>
				<View style={styles.modalHeader}>
					<Text style={styles.headerText}>
						{t('shareLocationModal.sendThisLocation')}{' '}
						{mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
							? currentChannel?.channelLabel
							: currentDmGroup?.channelLabel}
					</Text>
				</View>
				<View style={styles.modalContent}>
					<View style={styles.circleIcon}>
						<MezonIconCDN icon={IconCDN.locationIcon} height={16} width={16} color={themeValue.textStrong} />
					</View>
					<Text
						style={styles.textContent}
					>{`${t('shareLocationModal.coordinate')} (${geoLocation?.latitude}, ${geoLocation?.longitude})`}</Text>
				</View>
				<View style={styles.modalFooter}>
					<TouchableOpacity style={styles.button} onPress={handelCancelModal}>
						<Text style={[styles.textButton, { color: themeValue.text }]}>{t('shareLocationModal.cancel')}</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.button} onPress={handleSendMessage}>
						<Text style={styles.textButton}>{t('shareLocationModal.send')}</Text>
					</TouchableOpacity>
				</View>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={handelCancelModal} />
		</View>
	);
};

export default React.memo(ShareLocationConfirmModal);
