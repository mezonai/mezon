import { TouchableOpacity, TouchableWithoutFeedback } from '@gorhom/bottom-sheet';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useChatSending, useGifsStickersEmoji } from '@mezon/core';
import { Icons, debounce } from '@mezon/mobile-components';
import { Colors, Fonts, size, useTheme } from '@mezon/mobile-ui';
import {
	getStoreAsync,
	gifsActions,
	selectCurrentChannel,
	selectCurrentClanId,
	selectDmGroupCurrent,
	settingClanStickerActions
} from '@mezon/store-mobile';
import { IMessageSendPayload, checkIsThread } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { MutableRefObject, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Platform, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import { EMessageActionType } from '../../enums';
import { IMessageActionNeedToResolve } from '../../types';
import EmojiSelector from './EmojiSelector';
import GifSelector from './GifSelector';
import StickerSelector from './StickerSelector';
import { style } from './styles';

export type IProps = {
	onDone: () => void;
	bottomSheetRef: MutableRefObject<BottomSheetMethods>;
	directMessageId?: string;
	messageActionNeedToResolve?: IMessageActionNeedToResolve | null;
};

interface TextTabProps {
	selected?: boolean;
	title: string;
	onPress: () => void;
}
function TextTab({ selected, title, onPress }: TextTabProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return (
		<View style={{ flex: 1 }}>
			<TouchableOpacity onPress={onPress} style={{ backgroundColor: selected ? Colors.bgViolet : 'transparent', ...styles.selected }}>
				<Text style={{ color: selected ? Colors.white : Colors.gray72, fontSize: Fonts.size.small, textAlign: 'center' }}>{title}</Text>
			</TouchableOpacity>
		</View>
	);
}

type ExpressionType = 'emoji' | 'gif' | 'sticker';

function EmojiPicker({ onDone, bottomSheetRef, directMessageId = '', messageActionNeedToResolve }: IProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useSelector(selectCurrentChannel);
	const clanId = useSelector(selectCurrentClanId);
	const currentDirectMessage = useSelector(selectDmGroupCurrent(directMessageId)); //Note: prioritize DM first
	const { valueInputToCheckHandleSearch, setValueInputSearch } = useGifsStickersEmoji();
	const [mode, setMode] = useState<ExpressionType>('emoji');
	const [searchText, setSearchText] = useState<string>('');
	const { t } = useTranslation('message');

	const dmMode = currentDirectMessage
		? Number(currentDirectMessage?.user_id?.length === 1 ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP)
		: '';

	useEffect(() => {
		initLoader();
	}, []);

	const initLoader = async () => {
		const promises = [];
		const store = await getStoreAsync();
		promises.push(store.dispatch(gifsActions.fetchGifCategories()));
		promises.push(store.dispatch(gifsActions.fetchGifCategoryFeatured()));
		await Promise.all(promises);
	};

	const stickerLoader = useCallback(async () => {
		const promises = [];
		const store = await getStoreAsync();
		promises.push(store.dispatch(settingClanStickerActions.fetchStickerByUserId({})));
		await Promise.all(promises);
	}, []);

	useEffect(() => {
		stickerLoader();
	}, [clanId, currentDirectMessage?.channel_id, stickerLoader]);

	const { sendMessage } = useChatSending({
		mode: dmMode ? dmMode : checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL,
		channelOrDirect: currentDirectMessage || currentChannel
	});

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			sendMessage(content, mentions, attachments, references, false, false, true);
		},
		[sendMessage]
	);

	function handleSelected(type: ExpressionType, data: any) {
		let messageRef;
		if (messageActionNeedToResolve?.type === EMessageActionType.Reply) {
			const targetMessage = messageActionNeedToResolve?.targetMessage;
			messageRef = {
				message_id: '',
				message_ref_id: targetMessage?.id,
				ref_type: 0,
				message_sender_id: targetMessage?.sender_id,
				message_sender_username: targetMessage?.username,
				mesages_sender_avatar: targetMessage?.clan_avatar ? targetMessage?.clan_avatar : targetMessage?.avatar,
				message_sender_clan_nick: targetMessage?.clan_nick,
				message_sender_display_name: targetMessage?.display_name,
				content: JSON.stringify(targetMessage?.content),
				has_attachment: Boolean(targetMessage?.attachments?.length),
				channel_id: targetMessage?.channel_id ?? '',
				mode: targetMessage?.mode ?? 0,
				channel_label: targetMessage?.channel_label
			};
		} else {
			messageRef = {};
		}

		if (type === 'gif') {
			handleSend({ t: '' }, [], [{ url: data }], [messageRef]);
		} else if (type === 'sticker') {
			handleSend({ t: '' }, [], [{ url: data, height: 40, width: 40, filetype: 'image/gif' }], [messageRef]);
		} else {
			/* empty */
		}

		onDone && type !== 'emoji' && onDone();
	}

	function handleInputSearchFocus() {
		bottomSheetRef && bottomSheetRef.current && bottomSheetRef.current.expand();
	}

	function handleInputSearchBlur() {
		Keyboard.dismiss();
	}

	const debouncedSetSearchText = useCallback(
		debounce((text) => setSearchText(text), 300),
		[]
	);

	const handleBottomSheetExpand = () => {
		bottomSheetRef && bottomSheetRef?.current && bottomSheetRef.current.expand();
	};

	const handleBottomSheetCollapse = () => {
		bottomSheetRef && bottomSheetRef?.current && bottomSheetRef.current.collapse();
	};

	const onScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
		if (e.nativeEvent.contentOffset.y < -100 || (e.nativeEvent.contentOffset.y <= -5 && Platform.OS === 'android')) {
			handleBottomSheetCollapse();
		}

		if (e.nativeEvent.contentOffset.y > 200) {
			handleBottomSheetExpand();
		}
	};

	return (
		<TouchableWithoutFeedback onPressIn={handleInputSearchBlur}>
			<View style={styles.container}>
				<View style={styles.tabContainer}>
					<TextTab title="Emoji" selected={mode === 'emoji'} onPress={() => setMode('emoji')} />
					<TextTab title="GIFs" selected={mode === 'gif'} onPress={() => setMode('gif')} />
					<TextTab title="Stickers" selected={mode === 'sticker'} onPress={() => setMode('sticker')} />
				</View>

				{mode !== 'emoji' && (
					<View style={{ flexDirection: 'row', gap: size.s_10, width: '100%', alignItems: 'center' }}>
						{mode === 'gif' && !!valueInputToCheckHandleSearch && (
							<TouchableOpacity
								style={{ paddingVertical: size.s_10 }}
								onPress={() => {
									setSearchText('');
									setValueInputSearch('');
								}}
							>
								<Icons.ArrowLargeLeftIcon height={20} width={20} color={themeValue.text} />
							</TouchableOpacity>
						)}

						<View style={styles.textInputWrapper}>
							<Icons.MagnifyingIcon height={18} width={18} color={themeValue.text} />
							<TextInput
								placeholder={mode === 'sticker' ? t('findThePerfectSticker') : 'search'}
								placeholderTextColor={themeValue.text}
								style={styles.textInput}
								onFocus={handleInputSearchFocus}
								onChangeText={debouncedSetSearchText}
							/>
						</View>
					</View>
				)}

				{mode === 'emoji' ? (
					<EmojiSelector
						onScroll={onScroll}
						handleBottomSheetExpand={handleBottomSheetExpand}
						handleBottomSheetCollapse={handleBottomSheetCollapse}
						onSelected={(url) => handleSelected('emoji', url)}
						searchText={searchText}
					/>
				) : mode === 'gif' ? (
					<GifSelector onScroll={onScroll} onSelected={(url) => handleSelected('gif', url)} searchText={searchText} />
				) : (
					<StickerSelector onScroll={onScroll} onSelected={(url) => handleSelected('sticker', url)} />
				)}
			</View>
		</TouchableWithoutFeedback>
	);
}

export default EmojiPicker;
