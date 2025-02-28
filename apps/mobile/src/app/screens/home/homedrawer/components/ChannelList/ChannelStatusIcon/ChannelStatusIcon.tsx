import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { IconCDN } from '../../../../../../constants/icon_cdn';

export const ChannelStatusIcon = ({ channel, isUnRead }: { channel: ChannelsEntity; isUnRead?: boolean }) => {
	const { themeValue } = useTheme();

	const isAgeRestrictedChannel = channel?.age_restricted === 1;
	return (
		<>
			{channel?.channel_private === ChannelStatusEnum.isPrivate &&
				(channel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) &&
				!isAgeRestrictedChannel && (
					<FastImage
						source={{
							uri: IconCDN.channelVoiceLock
						}}
						style={{ height: size.s_18, width: size.s_18 }}
					/>
				)}
			{channel?.channel_private === ChannelStatusEnum.isPrivate &&
				channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
				!isAgeRestrictedChannel && (
					<FastImage
						source={{
							uri: IconCDN.channelTextLock
						}}
						style={{ height: size.s_18, width: size.s_18 }}
					/>
				)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate &&
				(channel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) && (
					<FastImage
						source={{
							uri: IconCDN.channelVoice
						}}
						style={{ height: size.s_18, width: size.s_18 }}
					/>
				)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && (
				<FastImage
					source={{
						uri: IconCDN.channelText
					}}
					style={{ height: size.s_18, width: size.s_18 }}
				/>
			)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_STREAMING && (
				<FastImage
					source={{
						uri: IconCDN.channelStream
					}}
					style={{ height: size.s_18, width: size.s_18 }}
				/>
			)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_APP && (
				<FastImage
					source={{
						uri: IconCDN.channelApp
					}}
					style={{ height: size.s_18, width: size.s_18 }}
				/>
			)}
			{channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel && (
				<FastImage
					source={{
						uri: IconCDN.channelTextWarning
					}}
					style={{ height: size.s_18, width: size.s_18 }}
				/>
			)}
		</>
	);
};
