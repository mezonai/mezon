import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useChatSending, useGifsStickersEmoji } from '@mezon/core';
import { debounce, isEmpty } from '@mezon/mobile-components';
import { Fonts, baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	MediaType,
	selectAnonymousMode,
	selectCurrentChannel,
	selectCurrentTopicId,
	selectDmGroupCurrent,
	selectIsShowCreateTopic
} from '@mezon/store-mobile';
import { IMessageSendPayload, checkIsThread } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { MutableRefObject, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, TextInput, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
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
		<View style={{ flex: 1, height: size.s_30 }}>
			<Pressable
				onPress={onPress}
				style={{
					backgroundColor: selected ? themeValue.bgViolet : 'transparent',
					...styles.selected,
					alignItems: 'center',
					justifyContent: 'center',
					height: '100%'
				}}
			>
				<Text style={{ color: selected ? 'white' : '#727272', fontSize: Fonts.size.small, textAlign: 'center' }}>{title}</Text>
			</Pressable>
		</View>
	);
}

type ExpressionType = 'emoji' | 'gif' | 'sticker';

function EmojiPicker({ onDone, bottomSheetRef, directMessageId = '', messageActionNeedToResolve }: IProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDirectMessage = useSelector(selectDmGroupCurrent(directMessageId)); //Note: prioritize DM first
	const anonymousMode = useSelector(selectAnonymousMode);
	const { valueInputToCheckHandleSearch, setValueInputSearch } = useGifsStickersEmoji();
	const [mode, setMode] = useState<ExpressionType>('emoji');
	const [searchText, setSearchText] = useState<string>('');
	const { t } = useTranslation('message');
	const [stickerMode, setStickerMode] = useState<MediaType>(MediaType.STICKER);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const isCreateTopic = useSelector(selectIsShowCreateTopic);

	const dmMode = currentDirectMessage
		? Number(currentDirectMessage?.user_id?.length === 1 ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP)
		: '';

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
			sendMessage(content, mentions, attachments, references, dmMode ? false : anonymousMode, false, true);
		},
		[anonymousMode, dmMode, sendMessage]
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
			handleSend({ t: '' }, [], [{ url: data }], isEmpty(messageRef) ? [] : [messageRef]);
		} else if (type === 'sticker') {
			const imageUrl = data?.source ? data?.source : `${process.env.NX_BASE_IMG_URL}/stickers/${data?.id}.webp`;
			const attachments = [{ url: imageUrl, filetype: stickerMode === MediaType.STICKER ? 'image/gif' : 'audio/mpeg', filename: data?.id }];

			handleSend({ t: '' }, [], attachments, isEmpty(messageRef) ? [] : [messageRef]);
		} else {
			/* empty */
		}

		onDone && type !== 'emoji' && onDone();
	}

	function handleInputSearchFocus() {
		bottomSheetRef && bottomSheetRef.current && bottomSheetRef.current.expand();
	}

	const debouncedSetSearchText = useCallback(
		debounce((text) => setSearchText(text), 300),
		[]
	);

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
				<View style={styles.tabContainer}>
					<TextTab title={t('tab.emoji')} selected={mode === 'emoji'} onPress={() => setMode('emoji')} />
					<TextTab title={t('tab.gif')} selected={mode === 'gif'} onPress={() => setMode('gif')} />
					<TextTab title={t('tab.sticker')} selected={mode === 'sticker'} onPress={() => setMode('sticker')} />
				</View>

				{mode !== 'emoji' && (
					<View style={{ flexDirection: 'row', gap: size.s_10, width: '100%', alignItems: 'center' }}>
						{mode === 'gif' && !!valueInputToCheckHandleSearch && (
							<Pressable
								style={{ paddingVertical: size.s_10 }}
								onPress={() => {
									setSearchText('');
									setValueInputSearch('');
								}}
							>
								<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={20} width={20} color={themeValue.text} />
							</Pressable>
						)}

						<View style={styles.textInputWrapper}>
							<MezonIconCDN icon={IconCDN.magnifyingIcon} height={18} width={18} color={themeValue.text} />
							<TextInput
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
									{ paddingVertical: size.s_10, backgroundColor: baseColor.blurple, padding: size.s_10, borderRadius: size.s_4 },
									stickerMode === MediaType.STICKER && { backgroundColor: themeValue.secondaryLight }
								]}
								onPress={() => {
									setSearchText('');
									setValueInputSearch('');
									changeStickerMode();
								}}
							>
								<MezonIconCDN icon={IconCDN.channelVoice} height={20} width={20} color={themeValue.text} />
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
					searchText={searchText}
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
