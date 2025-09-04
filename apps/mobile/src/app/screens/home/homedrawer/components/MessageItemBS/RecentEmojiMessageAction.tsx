/* eslint-disable no-console */
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllEmojiRecent } from '@mezon/store-mobile';
import { getSrcEmoji } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { DeviceEventEmitter, Pressable, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { emojiFakeData } from '../fakeData';
import { ContainerMessageActionModal } from './ContainerMessageActionModal';
import { style } from './styles';

interface IRecentEmojiMessageAction {
	messageId: string;
	handleReact?: any;
	mode?: ChannelStreamMode;
	message?: any;
	senderDisplayName?: string;
}

export const RecentEmojiMessageAction = React.memo((props: IRecentEmojiMessageAction) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { messageId, mode, handleReact, message, senderDisplayName } = props;
	const selectRecentEmoji = useSelector(selectAllEmojiRecent);

	const emojiRecentList = useMemo(() => {
		if (!selectRecentEmoji?.length) return [];
		return selectRecentEmoji?.map((emoji) => ({ id: emoji?.id, shortname: emoji?.shortname }));
	}, [selectRecentEmoji]);

	const recentEmoji = useMemo(() => {
		const uniqueEmojis = [
			...emojiRecentList,
			...(emojiFakeData.filter((emoji) => !emojiRecentList.some((recent) => recent?.id === emoji?.id)) || [])
		]?.slice(0, 5);
		return uniqueEmojis;
	}, [emojiRecentList]);

	const handleShowPicker = () => {
		const data = {
			snapPoints: ['75%'],
			disableScrollView: true,
			children: (
				<ContainerMessageActionModal
					message={message}
					mode={mode}
					senderDisplayName={senderDisplayName}
					isOnlyEmojiPicker={true}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	return (
		<View style={styles.reactWrapper}>
			{recentEmoji?.map((item, index) => {
				return (
					<Pressable
						key={index}
						style={styles.favouriteIconItem}
						onPress={() => handleReact(mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL, messageId, item.id, item.shortname)}
					>
						<FastImage
							source={{
								uri: getSrcEmoji(item.id)
							}}
							resizeMode={'contain'}
							style={styles.reactionImage}
						/>
					</Pressable>
				);
			})}
			<Pressable onPress={handleShowPicker} style={styles.favouriteIconItem}>
				<MezonIconCDN icon={IconCDN.reactionIcon} color={themeValue.text} height={size.s_22} width={size.s_22} />
			</Pressable>
		</View>
	);
});
