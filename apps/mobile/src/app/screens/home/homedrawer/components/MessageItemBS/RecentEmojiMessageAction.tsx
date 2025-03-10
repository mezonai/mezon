/* eslint-disable no-console */
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { getSrcEmoji } from '@mezon/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { EMessageBSToShow } from '../../enums';
import { emojiFakeData } from '../fakeData';
import { style } from './styles';

interface IRecentEmojiMessageAction {
	messageId: string;
	handleReact?: any;
	mode?: ChannelStreamMode;
	userId?: string;
	type?: string;
	setIsShowEmojiPicker?: any;
}

export const RecentEmojiMessageAction = React.memo((props: IRecentEmojiMessageAction) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { messageId, mode, handleReact, userId, type, setIsShowEmojiPicker } = props;

	const [recentEmoji, setRecentEmoji] = useState([]);

	useEffect(() => {
		if (type === EMessageBSToShow?.MessageAction) {
			AsyncStorage.getItem('recentEmojis')
				.then((emojis) => safeJSONParse(emojis || '[]'))
				.then((parsedEmojis) => {
					const recentEmojis = parsedEmojis
						?.reverse()
						?.slice(0, 5)
						?.map((item: { emoji: any; emojiId: any }) => ({
							shortname: item.emoji,
							id: item.emojiId
						}));

					const uniqueEmojis = [...recentEmojis, ...emojiFakeData]?.filter(
						(emoji, index, self) => index === self?.findIndex((e) => e?.id === emoji?.id)
					);
					setRecentEmoji(uniqueEmojis?.slice(0, 5));
				});
		}
	}, [type]);
	return (
		<View style={styles.reactWrapper}>
			{recentEmoji?.map((item, index) => {
				return (
					<Pressable
						key={index}
						style={styles.favouriteIconItem}
						onPress={() => handleReact(mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL, messageId, item.id, item.shortname, userId)}
					>
						<FastImage
							source={{
								uri: getSrcEmoji(item.id)
							}}
							resizeMode={'contain'}
							style={{
								width: size.s_28,
								height: size.s_28
							}}
						/>
					</Pressable>
				);
			})}
			<Pressable onPress={() => setIsShowEmojiPicker(true)} style={{ height: size.s_28, width: size.s_28 }}>
				<Icons.ReactionIcon color={themeValue.text} height={size.s_30} width={size.s_30} />
			</Pressable>
		</View>
	);
});
