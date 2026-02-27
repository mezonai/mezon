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
import { Icons } from '../../../componentUI/MobileIcons';
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
						<Icons.ClansOpenIcon color={themeValue.channelNormal} width={size.s_14} height={size.s_14} />
					)}
					{isChannelPrivate && isChannelText && !isThread && (
						<Icons.ClansLockIcon color={themeValue.channelNormal} width={size.s_14} height={size.s_14} />
					)}
					{!isChannelPrivate && isThread && <Icons.ThreadIcon color={themeValue.channelNormal} width={size.s_14} height={size.s_14} />}
					{isChannelPrivate && isThread && <Icons.ThreadIcon color={themeValue.channelNormal} width={size.s_14} height={size.s_14} />}
					{!isChannelPrivate && isChannelVoice && <Icons.VoiceIcon color={themeValue.channelNormal} width={size.s_14} height={size.s_14} />}
					{isChannelPrivate && isChannelVoice && <Icons.VoiceIcon color={themeValue.channelNormal} width={size.s_14} height={size.s_14} />}
					{!isChannelPrivate && isChannelStream && (
						<Icons.StreamIcon color={themeValue.channelNormal} width={size.s_14} height={size.s_14} />
					)}
					{!isChannelPrivate && isChannelApp && (
						<Icons.ChannelappIcon color={themeValue.channelNormal} width={size.s_14} height={size.s_14} />
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
