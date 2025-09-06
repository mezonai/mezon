import BottomSheet from '@gorhom/bottom-sheet';
import { useThreadMessage, useThreads } from '@mezon/core';
import { ActionEmitEvent, STORAGE_CLAN_ID, STORAGE_DATA_CLAN_CHANNEL_CACHE, getUpdateOrAddClanChannelCache, save } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	RootState,
	appActions,
	channelsActions,
	createNewChannel,
	getStoreAsync,
	messagesActions,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectOpenThreadMessageState,
	selectThreadCurrentChannel,
	useAppDispatch
} from '@mezon/store-mobile';
import { IChannel, IMessageSendPayload, IMessageWithUser, ThreadValue, checkIsThread, isPublicChannel } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiChannelDescription, ApiCreateChannelDescRequest, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, Keyboard, Platform, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import MezonSwitch from '../../../componentUI/MezonSwitch';
import { IconCDN } from '../../../constants/icon_cdn';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN, MenuThreadScreenProps } from '../../../navigation/ScreenTypes';
import { ChatBox } from '../../../screens/home/homedrawer/ChatBox';
import MessageItem from '../../../screens/home/homedrawer/MessageItem';
import PanelKeyboard from '../../../screens/home/homedrawer/PanelKeyboard';
import { EMessageActionType } from '../../../screens/home/homedrawer/enums';
import StatusBarHeight from '../../StatusBarHeight/StatusBarHeight';
import { style } from './CreateThreadForm.style';
import HeaderLeftThreadForm from './HeaderLeftThreadForm';

type CreateThreadFormScreen = typeof APP_SCREEN.MENU_THREAD.CREATE_THREAD_FORM_MODAL;

export default function CreateThreadForm({ navigation, route }: MenuThreadScreenProps<CreateThreadFormScreen>) {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { channelThreads } = route.params || {};
	const { t } = useTranslation(['createThread']);
	const currentClanId = useSelector(selectCurrentClanId);
	const channelCurrent = useSelector(selectCurrentChannel);
	const currentChannelId = useSelector(selectCurrentChannelId);

	const validateThreadName = (name: string) => {
		if (!name || name.trim().length === 0 || name?.length > 64) return t('errorMessage');
		return '';
	};

	const [nameValueThread, setNameValueThread] = useState('');
	const [isPrivate, setIsPrivate] = useState(false);
	const [errorMessage, setErrorMessage] = useState(validateThreadName(''));

	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const { valueThread } = useThreads();
	const { sendMessageThread } = useThreadMessage({
		channelId: '',
		mode: ChannelStreamMode.STREAM_MODE_THREAD
	});
	const bottomPickerRef = useRef<BottomSheet>(null);

	const currentChannel = useMemo(() => {
		return channelThreads || channelCurrent;
	}, [channelThreads, channelCurrent]);

	const sessionUser = useSelector((state: RootState) => state.auth.session);

	const createThread = useCallback(
		async (value: ThreadValue) => {
			const body: ApiCreateChannelDescRequest = {
				clan_id: currentClanId?.toString(),
				channel_label: value.nameValueThread,
				channel_private: value.isPrivate,
				parent_id: (channelThreads ? channelThreads?.id : currentChannelId) || '',
				category_id: currentChannel?.category_id,
				type: ChannelType.CHANNEL_TYPE_THREAD
			};
			try {
				const newThreadResponse = await dispatch(createNewChannel(body));
				if (newThreadResponse.meta.requestStatus === 'rejected') {
					Alert.alert('Created Thread Failed', "Thread not found or you're not allowed to update");
				} else {
					handleRouteData(newThreadResponse.payload as IChannel);
					return newThreadResponse?.payload;
				}
			} catch (error) {
				Alert.alert('Created Thread Failed', "Thread not found or you're not allowed to update");
			}
		},
		[currentChannel, currentChannel?.parent_id, currentClanId, dispatch]
	);

	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

	const handleSendMessageThread = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			value?: ThreadValue,
			messageCreate?: IMessageWithUser
		) => {
			if (sessionUser) {
				if (value?.nameValueThread) {
					try {
						Keyboard.dismiss();
						dispatch(appActions.setLoadingMainMobile(true));
						const thread = (await createThread(value)) as ApiChannelDescription;
						if (thread) {
							// sleep for waiting server check exist after insert
							await sleep(100);
							await dispatch(
								channelsActions.joinChat({
									clanId: currentClanId as string,
									channelId: thread.channel_id as string,
									channelType: thread.type as number,
									isPublic: false
								})
							);
							save(STORAGE_CLAN_ID, currentClanId);
							if (messageCreate) {
								await sendMessageThread(
									messageCreate?.content,
									messageCreate?.mentions,
									messageCreate?.attachments,
									undefined,
									thread,
									true
								);
							}
							await sendMessageThread(content, mentions, attachments, references, thread, true);
							await dispatch(
								messagesActions.fetchMessages({
									channelId: thread.channel_id as string,
									isFetchingLatestMessages: true,
									clanId: currentClanId
								})
							);
						}
					} catch (error) {
						console.error('Error creating thread:', error);
					} finally {
						dispatch(appActions.setLoadingMainMobile(false));
					}
				} else {
					await sendMessageThread(content, mentions, attachments, references, threadCurrentChannel);
				}
			} else {
				console.error('Session is not available');
			}
		},
		[sessionUser, createThread, dispatch, currentClanId, sendMessageThread, threadCurrentChannel]
	);

	useEffect(() => {
		const sendMessage = DeviceEventEmitter.addListener(ActionEmitEvent.SEND_MESSAGE, ({ content, mentions, attachments }) => {
			const valueForm = { isPrivate: Number(isPrivate), nameValueThread };
			const contentMessage = content;
			const mentionMessage = mentions;

			const error = validateThreadName(nameValueThread);
			setErrorMessage(error);

			if (!error) {
				handleSendMessageThread(contentMessage, mentionMessage, attachments, [], valueForm, valueThread);
			} else {
				Toast.show({
					type: 'error',
					text1: error
				});
			}
		});
		return () => {
			sendMessage.remove();
		};
	}, [isPrivate, nameValueThread, valueThread]);

	const handleRouteData = async (thread?: IChannel) => {
		const store = await getStoreAsync();
		const channelId = thread?.channel_id;
		const clanId = thread?.clan_id || currentClanId;
		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		store.dispatch(channelsActions.joinChannel({ clanId: clanId ?? '', channelId: channelId, noFetchMembers: false }));
		await sleep(500);
		if (isTabletLandscape) {
			navigation.navigate(APP_SCREEN.HOME);
		} else {
			navigation.navigate(APP_SCREEN.HOME_DEFAULT);
		}
	};

	const handleInputChange = (text: string) => {
		setNameValueThread(text);
		setErrorMessage(validateThreadName(text));
	};

	const handleSwitchChange = (value: boolean) => {
		setIsPrivate(value);
	};

	return (
		<KeyboardAvoidingView
			style={styles.createChannelContent}
			behavior={'padding'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5}
		>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<StatusBarHeight />
			<View style={styles.createChannelContent}>
				<HeaderLeftThreadForm currentChannel={channelThreads || currentChannel} />
				<ScrollView contentContainerStyle={styles.scrollview} keyboardShouldPersistTaps="handled">
					<View style={{ margin: size.s_20, flex: 1 }}>
						<View style={styles.iconContainer}>
							<MezonIconCDN icon={IconCDN.threadIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
						</View>
						<MezonInput
							label={t('threadName')}
							onTextChange={handleInputChange}
							onFocus={() => {
								bottomPickerRef.current?.close();
							}}
							value={nameValueThread}
							placeHolder="New Thread"
							maxCharacter={64}
							errorMessage={errorMessage}
							forcusInput
						/>
					</View>
					{!openThreadMessageState && (
						<View style={styles.threadPolicy}>
							<View style={styles.threadPolicyInfo}>
								<Text style={styles.threadPolicyTitle}>{t('privateThread')}</Text>
								<Text style={styles.threadPolicyContent}>{t('onlyPeopleInviteThread')}</Text>
							</View>
							<MezonSwitch value={isPrivate} onValueChange={handleSwitchChange} />
						</View>
					)}
					{valueThread && openThreadMessageState && (
						<View style={styles.messageBox}>
							<MessageItem
								messageId={valueThread?.id}
								message={valueThread}
								showUserInformation
								mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
								channelId={currentChannel?.channel_id}
								preventAction
							/>
						</View>
					)}
				</ScrollView>
				<ChatBox
					messageAction={EMessageActionType.CreateThread}
					channelId={currentChannel?.channel_id}
					mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
					hiddenIcon={{
						threadIcon: true
					}}
					isPublic={isPublicChannel(currentChannel)}
					topicChannelId={''}
				/>
				<PanelKeyboard currentChannelId={currentChannel?.channel_id} currentClanId={currentChannel?.clan_id} />
			</View>
		</KeyboardAvoidingView>
	);
}
