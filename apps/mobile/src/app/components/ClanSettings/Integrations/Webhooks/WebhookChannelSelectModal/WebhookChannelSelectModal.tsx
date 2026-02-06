import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllChannels } from '@mezon/store-mobile';
import { ChannelIsNotThread } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonOption from '../../../../../componentUI/MezonOption';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { style } from './styles';

interface IWebhookChannelSelectModalProps {
	onConfirm: (channelId: string) => void;
	onCancel: () => void;
	initialChannelId?: string;
}

export function WebhookChannelSelectModal({ onConfirm, onCancel, initialChannelId }: IWebhookChannelSelectModalProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['clanIntegrationsSetting']);
	const allChannel = useSelector(selectAllChannels);
	const [selectedChannelId, setSelectedChannelId] = useState<string>(initialChannelId || '');

	const parentChannelsInClan = useMemo(() => allChannel?.filter((channel) => channel?.parent_id === ChannelIsNotThread.TRUE), [allChannel]);

	const channelOptions = useMemo(() => {
		return parentChannelsInClan?.map((channel) => ({
			title: channel?.channel_label,
			value: channel?.channel_id,
			icon: <MezonIconCDN icon={channel?.channel_private ? IconCDN.channelTextLock : IconCDN.channelText} color={themeValue.text} />
		}));
	}, [parentChannelsInClan, themeValue.text]);

	useEffect(() => {
		if (initialChannelId && initialChannelId !== selectedChannelId) {
			setSelectedChannelId(initialChannelId);
		}
	}, [initialChannelId, selectedChannelId]);

	const handleChannelChange = useCallback(
		(value: string) => {
			setSelectedChannelId(value);
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, {
				isDismiss: false,
				data: { children: <WebhookChannelSelectModal onConfirm={onConfirm} onCancel={onCancel} initialChannelId={value} /> }
			});
		},
		[onConfirm, onCancel]
	);

	const handleConfirm = useCallback(() => {
		if (selectedChannelId) {
			onConfirm(selectedChannelId);
		}
	}, [selectedChannelId, onConfirm]);

	const handleCancel = useCallback(() => {
		onCancel();
	}, [onCancel]);

	return (
		<MezonConfirm
			title={t('webhookChannelSelect.title', { ns: 'clanIntegrationsSetting' })}
			confirmText={t('webhookChannelSelect.create', { ns: 'clanIntegrationsSetting' })}
			onConfirm={handleConfirm}
			onCancel={handleCancel}
		>
			<View style={styles.container}>
				<Text style={styles.description}>{t('webhookChannelSelect.description', { ns: 'clanIntegrationsSetting' })}</Text>

				<View style={styles.dropdownContainer}>
					<Text style={styles.label}>{t('webhookChannelSelect.selectChannel', { ns: 'clanIntegrationsSetting' })}</Text>
					<TouchableOpacity
						style={styles.dropdownButton}
						onPress={() => {
							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });

							const data = {
								snapPoints: ['50%'],
								children: <MezonOption data={channelOptions} value={selectedChannelId} onChange={handleChannelChange} />
							};

							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
						}}
					>
						<Text style={styles.dropdownText}>
							{selectedChannelId
								? channelOptions?.find((ch) => ch.value === selectedChannelId)?.title
								: t('webhookChannelSelect.placeholder', { ns: 'clanIntegrationsSetting' })}
						</Text>
						<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
					</TouchableOpacity>
				</View>
			</View>
		</MezonConfirm>
	);
}
