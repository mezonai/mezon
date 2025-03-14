import { useChatSending } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectDmGroupCurrent, useAppSelector } from '@mezon/store-mobile';
import { IMessageSendPayload, filterEmptyArrays, processText } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from '../styles';

const ShareLocation = ({
	mode,
	channelId,
	geoLocation,
	oncancel
}: {
	mode: ChannelStreamMode;
	channelId: string;
	geoLocation: { latitude: number; longitude: number };
	oncancel: () => void;
}) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId));
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId));

	const [links, setLinks] = useState([]);
	const { t } = useTranslation('message');

	const [googleMapsLink, setGoogleMapsLink] = useState<string>('');
	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect:
			mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup
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
			mk: [],
			vk: []
		};
		await sendMessage(filterEmptyArrays(payloadSendMessage), [], [], [], false, false, true);
		oncancel();
	};

	const handelCancelModal = () => {
		oncancel();
	};

	return (
		<View style={styles.modalContainer}>
			<View style={styles.modalHeader}>
				<Text style={styles.headerText}>
					{t('shareLocationModal.sendThisLocation')}{' '}
					{mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
						? currentChannel?.channel_label
						: currentDmGroup?.channel_label}
				</Text>
			</View>
			<View style={styles.modalContent}>
				<View style={styles.circleIcon}>
					<MezonIconCDN icon={IconCDN.locationIcon} />
				</View>
				<Text
					style={styles.textContent}
				>{`${t('shareLocationModal.coordinate')} (${geoLocation?.latitude}, ${geoLocation?.longitude})`}</Text>
			</View>
			<View style={styles.modalFooter}>
				<TouchableOpacity style={styles.button} onPress={handelCancelModal}>
					<Text style={styles.textButton}>{t('shareLocationModal.cancel')}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.button} onPress={handleSendMessage}>
					<Text style={styles.textButton}>{t('shareLocationModal.send')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default React.memo(ShareLocation);
