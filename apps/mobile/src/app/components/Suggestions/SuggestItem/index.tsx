import { useCheckVoiceStatus } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity } from '@mezon/store-mobile';
import { ChannelStatusEnum, createImgproxyUrl, getSrcEmoji } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './SuggestItem.styles';

type SuggestItemProps = {
	avatarUrl?: string;
	name: string;
	subText?: string;
	isDisplayDefaultAvatar?: boolean;
	isRoleUser?: boolean;
	emojiId?: string;
	emojiSrcUnlock?: string;
	channelId?: string;
	channel?: ChannelsEntity;
	color?: string;
};

const SuggestItem = memo(
	({ channelId, avatarUrl, name, subText, isDisplayDefaultAvatar, isRoleUser, emojiId, emojiSrcUnlock, channel, color }: SuggestItemProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const emojiSrc = emojiSrcUnlock ? emojiSrcUnlock : getSrcEmoji(emojiId) || '';
		const { t } = useTranslation(['clan']);
		const { isChannelPrivate, isChannelText, isThread, isChannelVoice, isChannelStream, isChannelApp } = useMemo(() => {
			const isChannelPrivate = channel?.channel_private === ChannelStatusEnum.isPrivate;
			const isChannelText = channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL;

			const isThread = channel?.type === ChannelType.CHANNEL_TYPE_THREAD;
			const isChannelVoice = channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
			const isChannelStream = channel?.type === ChannelType.CHANNEL_TYPE_STREAMING;
			const isChannelApp = channel?.type === ChannelType.CHANNEL_TYPE_APP;

			return {
				isChannelPrivate,
				isChannelText,
				isThread,
				isChannelVoice,
				isChannelStream,
				isChannelApp
			};
		}, [channel]);

		const isVoiceActive = useCheckVoiceStatus(channelId, channel?.clan_id);

		const renderRoleUser = () => (
			<View>
				{isRoleUser && (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}>
						{avatarUrl ? (
							<FastImage
								style={styles.roleImage}
								source={{
									uri: createImgproxyUrl(avatarUrl || '', { width: 100, height: 100, resizeType: 'fit' })
								}}
							/>
						) : (
							<MezonIconCDN
								icon={IconCDN.shieldUserIcon}
								color={color || themeValue.textRoleLink}
								width={size.s_20}
								height={size.s_20}
							/>
						)}

						<Text style={[styles.roleText, { color: color || themeValue.textRoleLink }]}>{`${name}`}</Text>
					</View>
				)}
				{name?.startsWith('here') && <Text style={[styles.roleText, styles.textHere]}>{`@${name}`}</Text>}
			</View>
		);

		const renderChannelBusy = () => (
			<View style={styles.channelWrapper}>
				<Text style={styles.title}>{name}</Text>
				{isVoiceActive && <Text style={styles.channelBusyText}>({t('busy')})</Text>}
			</View>
		);

		return (
			<View style={styles.wrapperItem}>
				<View style={styles.containerItem}>
					{avatarUrl && !isRoleUser ? (
						<FastImage
							style={styles.image}
							source={{
								uri: createImgproxyUrl(avatarUrl ?? '', { width: 100, height: 100, resizeType: 'fit' })
							}}
						/>
					) : (
						!name.startsWith('here') &&
						!isRoleUser &&
						isDisplayDefaultAvatar && (
							<View style={styles.avatarMessageBoxDefault}>
								<Text style={styles.textAvatarMessageBoxDefault}>{name?.charAt(0)?.toUpperCase()}</Text>
							</View>
						)
					)}
					{!!emojiSrc && !!emojiId && <FastImage style={styles.emojiImage} source={{ uri: emojiSrc }} />}
					{!isChannelPrivate && isChannelText && !isThread && (
						<MezonIconCDN icon={IconCDN.channelText} width={size.s_16} height={size.s_16} color={themeValue.channelNormal} />
					)}
					{isChannelPrivate && isChannelText && !isThread && (
						<MezonIconCDN icon={IconCDN.channelTextLock} width={size.s_16} height={size.s_16} color={themeValue.channelNormal} />
					)}
					{!isChannelPrivate && isThread && (
						<MezonIconCDN icon={IconCDN.threadIcon} width={size.s_16} height={size.s_16} color={themeValue.channelNormal} />
					)}
					{isChannelPrivate && isThread && (
						<MezonIconCDN icon={IconCDN.threadLockIcon} width={size.s_16} height={size.s_16} color={themeValue.channelNormal} />
					)}
					{!isChannelPrivate && isChannelVoice && (
						<MezonIconCDN icon={IconCDN.channelVoice} width={size.s_16} height={size.s_16} color={themeValue.channelNormal} />
					)}
					{isChannelPrivate && isChannelVoice && (
						<MezonIconCDN icon={IconCDN.channelVoiceLock} width={size.s_16} height={size.s_16} color={themeValue.channelNormal} />
					)}
					{!isChannelPrivate && isChannelStream && (
						<MezonIconCDN
							icon={IconCDN.channelStream}
							customStyle={styles.streamIcon}
							height={size.s_16}
							width={size.s_16}
							color={themeValue.channelNormal}
						/>
					)}
					{!isChannelPrivate && isChannelApp && (
						<MezonIconCDN
							icon={IconCDN.channelApp}
							customStyle={styles.streamIcon}
							height={size.s_16}
							width={size.s_16}
							color={themeValue.channelNormal}
						/>
					)}

					{isRoleUser || name?.startsWith('here') ? renderRoleUser() : renderChannelBusy()}
				</View>
				<Text style={styles.subText} numberOfLines={1}>
					{subText}
				</Text>
			</View>
		);
	}
);

export default SuggestItem;
