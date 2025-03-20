/* eslint-disable no-console */
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllEmojiRecent } from '@mezon/store-mobile';
import { getSrcEmoji } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
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
		setIsShowEmojiPicker(true);
	};

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
							style={styles.reactionImage}
						/>
					</Pressable>
				);
			})}
			<Pressable onPress={handleShowPicker} style={styles.emojiButton}>
				<Icons.ReactionIcon color={themeValue.text} height={size.s_30} width={size.s_30} />
			</Pressable>
		</View>
	);
});
