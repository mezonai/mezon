import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useChatSending } from '@mezon/core';
import { ActionEmitEvent, debounce, isEmpty } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	MediaType,
	gifsStickerEmojiActions,
	selectAnonymousMode,
	selectCurrentChannel,
	selectCurrentClanPreventAnonymous,
	selectCurrentTopicId,
	selectDmGroupCurrent,
	selectIsShowCreateTopic,
	useAppDispatch
} from '@mezon/store-mobile';
import type { IMessageSendPayload } from '@mezon/utils';
import { checkIsThread } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/types';
import type { MutableRefObject } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Text, TextInput, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { EMessageActionType } from '../../enums';
import type { IMessageActionNeedToResolve } from '../../types';
import EmojiSelector from './EmojiSelector';
import GifSelector from './GifSelector';
import StickerSelector from './StickerSelector';
import { style } from './styles';

export type IProps = {
	onDone: (isFocusKeyboard?: boolean) => void;
	bottomSheetRef: MutableRefObject<BottomSheetMethods>;
	directMessageId?: string;
	messageActionNeedToResolve?: IMessageActionNeedToResolve | null;
	channelId?: string;
	messageAction?: EMessageActionType;
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
		<View style={styles.tabFlexContainer}>
			<Pressable
				onPress={onPress}
				style={[styles.selected, styles.tabPressable, { backgroundColor: selected ? themeValue.bgViolet : 'transparent' }]}
			>
				<Text style={[styles.tabText, { color: selected ? 'white' : '#727272' }]}>{title}</Text>
			</Pressable>
		</View>
	);
}

type ExpressionType = 'emoji' | 'gif' | 'sticker';

function EmojiPicker({ onDone, bottomSheetRef, directMessageId = '', messageActionNeedToResolve, channelId = '', messageAction }: IProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDirectMessage = useSelector(selectDmGroupCurrent(directMessageId)); //Note: prioritize DM first
	const anonymousMode = useSelector((state) => selectAnonymousMode(state, currentChannel?.clanId));
	const currentClanPreventAnonymous = useSelector(selectCurrentClanPreventAnonymous);
	const [mode, setMode] = useState<ExpressionType>('emoji');
	const [searchText, setSearchText] = useState<string>('');
	const { t } = useTranslation('message');
	const [stickerMode, setStickerMode] = useState<MediaType>(MediaType.STICKER);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const isCreateTopic = useSelector(selectIsShowCreateTopic);
	const dispatch = useAppDispatch();

	const isActionCreateThread = useMemo(() => {
		return messageAction === EMessageActionType.CreateThread;
	}, [messageAction]);

	const clearSearchInput = () => {
		setSearchText('');
		dispatch(gifsStickerEmojiActions.setValueInputSearch(''));
	};

	const dmMode = useMemo(() => {
		return currentDirectMessage
			? currentDirectMessage?.type === ChannelType.CHANNEL_TYPE_DM
				? ChannelStreamMode.STREAM_MODE_DM
				: ChannelStreamMode.STREAM_MODE_GROUP
			: '';
	}, [currentDirectMessage]);

	const { sendMessage } = useChatSending({
		mode: dmMode ? dmMode : checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL,
		channelOrDirect: currentDirectMessage || currentChannel,
		fromTopic: isCreateTopic || !!currentTopicId
	});

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			sendMessage(content, mentions, attachments, references, dmMode ? false : anonymousMode && !currentClanPreventAnonymous, false, true);
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, null);
		},
		[anonymousMode, currentClanPreventAnonymous, dmMode, sendMessage]
	);

	function handleSelected(type: ExpressionType, data: any) {
		let messageRef;
		if (messageActionNeedToResolve?.type === EMessageActionType.Reply) {
			const targetMessage = messageActionNeedToResolve?.targetMessage;
			messageRef = {
				message_id: '',
				message_ref_id: targetMessage?.id,
				ref_type: 0,
				message_sender_id: targetMessage?.senderId,
				message_sender_username: targetMessage?.username,
				message_sender_avatar: targetMessage?.clanAvatar ? targetMessage?.clanAvatar : targetMessage?.avatar,
				message_sender_clan_nick: targetMessage?.clanNick,
				message_sender_display_name: targetMessage?.displayName,
				content: JSON.stringify(targetMessage?.content),
				has_attachment: Boolean(targetMessage?.attachments?.length),
				channel_id: targetMessage?.channelId ?? '',
				mode: targetMessage?.mode ?? 0,
				channel_label: targetMessage?.channelLabel
			};
		} else {
			messageRef = {};
		}

		if (type === 'gif') {
			handleSend({ t: '' }, [], [{ url: data, filetype: 'image/gif' }], isEmpty(messageRef) ? [] : [messageRef]);
		} else if (type === 'sticker') {
			const imageUrl = data?.source ? data?.source : `${process.env.NX_BASE_IMG_URL}/stickers/${data?.id}.webp`;
			const attachments = [{ url: imageUrl, filetype: stickerMode === MediaType.STICKER ? 'image/gif' : 'audio/mpeg', filename: data?.id }];

			handleSend({ t: '' }, [], attachments, isEmpty(messageRef) ? [] : [messageRef]);
		} else {
			/* empty */
		}

		onDone && type !== 'emoji' && onDone(false);
	}

	function handleInputSearchFocus() {
		bottomSheetRef && bottomSheetRef.current && bottomSheetRef.current.expand();
	}

	const debouncedSetSearchText = useCallback((text: string) => {
		debounce(() => setSearchText(text), 300)();
	}, []);

	const handleBottomSheetExpand = useCallback(() => {
		bottomSheetRef && bottomSheetRef?.current && bottomSheetRef.current.expand();
	}, [bottomSheetRef]);

	const handleBottomSheetCollapse = useCallback(() => {
		bottomSheetRef && bottomSheetRef?.current && bottomSheetRef.current.collapse();
	}, [bottomSheetRef]);

	const onScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
		if (e.nativeEvent.contentOffset.y < -100 || (e.nativeEvent.contentOffset.y <= -5 && Platform.OS === 'android')) {
			handleBottomSheetCollapse();
		}

		if (e.nativeEvent.contentOffset.y > 200) {
			handleBottomSheetExpand();
		}
	}, []);

	const onSelectEmoji = useCallback((url) => {
		handleSelected('emoji', url);
	}, []);

	const changeStickerMode = useCallback(() => {
		if (stickerMode === MediaType.STICKER) {
			setStickerMode(MediaType.AUDIO);
		} else {
			setStickerMode(MediaType.STICKER);
		}
	}, [stickerMode]);

	return (
		<View style={styles.container}>
			<View>
				{!isActionCreateThread && (
					<View style={styles.tabContainer}>
						<TextTab title={t('tab.emoji')} selected={mode === 'emoji'} onPress={() => setMode('emoji')} />
						<TextTab
							title={t('tab.gif')}
							selected={mode === 'gif'}
							onPress={() => {
								setMode('gif');
								clearSearchInput();
							}}
						/>
						<TextTab
							title={t('tab.sticker')}
							selected={mode === 'sticker'}
							onPress={() => {
								setMode('sticker');
								clearSearchInput();
							}}
						/>
					</View>
				)}
				{mode !== 'emoji' && (
					<View style={styles.searchRow}>
						<View style={styles.textInputWrapper}>
							<MezonIconCDN icon={IconCDN.magnifyingIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
							<TextInput
								key={`mode_${mode}-${stickerMode}`}
								placeholder={mode === 'sticker' ? t('findThePerfectSticker') : t('findThePerfectGif')}
								placeholderTextColor={themeValue.textDisabled}
								style={styles.textInput}
								onFocus={handleInputSearchFocus}
								onChangeText={debouncedSetSearchText}
							/>
						</View>

						{mode === 'sticker' && (
							<Pressable
								style={[
									styles.stickerModeButton,
									stickerMode === MediaType.STICKER && { backgroundColor: themeValue.secondaryLight }
								]}
								onPress={() => {
									clearSearchInput();
									changeStickerMode();
								}}
							>
								<MezonIconCDN
									icon={IconCDN.channelVoice}
									height={size.s_18}
									width={size.s_18}
									color={stickerMode === MediaType.STICKER ? themeValue.text : baseColor.white}
								/>
							</Pressable>
						)}
					</View>
				)}
			</View>
			{mode === 'emoji' ? (
				<EmojiSelector
					handleBottomSheetExpand={handleBottomSheetExpand}
					handleBottomSheetCollapse={handleBottomSheetCollapse}
					onSelected={onSelectEmoji}
					currentChannelId={channelId}
				/>
			) : mode === 'gif' ? (
				<GifSelector onScroll={onScroll} onSelected={(url) => handleSelected('gif', url)} searchText={searchText} />
			) : (
				<StickerSelector
					onScroll={onScroll}
					onSelected={(sticker) => handleSelected('sticker', sticker)}
					mediaType={stickerMode}
					searchText={searchText}
				/>
			)}
		</View>
	);
}

export default EmojiPicker;
