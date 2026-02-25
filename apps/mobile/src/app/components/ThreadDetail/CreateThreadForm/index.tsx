import type BottomSheet from '@gorhom/bottom-sheet';
import { useChannelMembers, useThreads } from '@mezon/core';
import { ActionEmitEvent, STORAGE_CLAN_ID, STORAGE_DATA_CLAN_CHANNEL_CACHE, getUpdateOrAddClanChannelCache, save } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity, RootState } from '@mezon/store-mobile';
import {
	appActions,
	channelMetaActions,
	channelsActions,
	createNewChannel,
	getStore,
	getStoreAsync,
	messagesActions,
	selectAllChannelMembers,
	selectAllRolesClan,
	selectChannelById,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectLatestMessageId,
	selectOpenThreadMessageState,
	selectThreadCurrentChannel,
	useAppDispatch
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import type { IChannel, IMessageSendPayload, IMessageWithUser, ThreadValue } from '@mezon/utils';
import { checkIsThread, getMobileUploadedAttachments, isPublicChannel, uniqueUsers } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiChannelDescription, ApiCreateChannelDescRequest, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import MezonSwitch from '../../../componentUI/MezonSwitch';
import { IconCDN } from '../../../constants/icon_cdn';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import type { MenuThreadScreenProps } from '../../../navigation/ScreenTypes';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { ChatBox } from '../../../screens/home/homedrawer/ChatBox';
import MessageItem from '../../../screens/home/homedrawer/MessageItem';
import PanelKeyboard from '../../../screens/home/homedrawer/PanelKeyboard';
import { EMessageActionType } from '../../../screens/home/homedrawer/enums';
import { checkNotificationPermissionMiddleware } from '../../../utils/notificationPermissionHelper';
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
	const currentChannel = useSelector(selectCurrentChannel);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const channelByChannelId = useSelector((state) => selectChannelById(state, channelThreads?.channel_id ?? ''));

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

	const { clientRef, sessionRef, socketRef } = useMezon();
	const { addMemberToThread } = useChannelMembers({
		channelId: currentChannelId,
		mode: ChannelStreamMode.STREAM_MODE_CHANNEL || 0
	});
	const bottomPickerRef = useRef<BottomSheet>(null);

	const targetParentChannel = useMemo(() => {
		return channelThreads ? channelByChannelId : currentChannel;
	}, [channelByChannelId, currentChannel, channelThreads]);

	const sessionUser = useSelector((state: RootState) => state.auth.session);

	const sendMessageThread = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			thread?: ApiChannelDescription
		) => {
			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;

			if (!client || !session || !socket || !thread || !currentClanId) {
				throw new Error('Client is not initialized');
			}
			let uploadedFiles: ApiMessageAttachment[] = [];
			if (attachments && attachments.length > 0) {
				try {
					uploadedFiles = await getMobileUploadedAttachments({ attachments, client, session });
				} catch (error: any) {
					console.error('Error uploading attachments:', error);
					if (error?.code === 'ENOENT') {
						uploadedFiles = attachments;
					}
				}
			}

			try {
				const store = getStore();
				const membersOfChild = selectAllChannelMembers(store.getState(), channelByChannelId?.id || currentChannelId || '0');
				const rolesClan = selectAllRolesClan(store.getState());

				const mapToMemberIds = membersOfChild?.map((item) => item.id) || [];

				const userIds = uniqueUsers(mentions as ApiMessageMention[], mapToMemberIds, rolesClan, []);
				if (userIds.length) {
					await addMemberToThread(thread as ChannelsEntity, userIds as string[]);
				}

				await client.sendChannelMessage(
					session,
					currentClanId,
					thread.channel_id as string,
					ChannelStreamMode.STREAM_MODE_THREAD,
					thread.channel_private === 0,
					typeof content === 'object' ? JSON.stringify(content) : content,
					mentions,
					uploadedFiles,
					references
				);

				const timestamp = Date.now() / 1000;
				const lastMessageId = store ? selectLatestMessageId(store.getState(), channelByChannelId?.id || currentChannelId || '0') : '';
				dispatch(
					channelMetaActions.setChannelLastSeenTimestamp({
						channelId: channelByChannelId?.id || currentChannelId || '0',
						timestamp,
						messageId: lastMessageId || undefined
					})
				);
			} catch (error) {
				console.error('Error adding members to thread:', error);
			}
		},
		[addMemberToThread, channelByChannelId?.id, clientRef, currentChannelId, currentClanId, dispatch, sessionRef, socketRef]
	);

	const createThread = useCallback(
		async (value: ThreadValue) => {
			const body: ApiCreateChannelDescRequest = {
				clan_id: currentClanId?.toString(),
				channel_label: value.nameValueThread,
				channel_private: value.isPrivate,
				parent_id: targetParentChannel?.id || '',
				category_id: targetParentChannel?.category_id,
				type: ChannelType.CHANNEL_TYPE_THREAD
			};
			try {
				const newThreadResponse = await dispatch(createNewChannel(body));
				if (newThreadResponse?.meta?.requestStatus === 'rejected') {
					Toast.show({
						type: 'error',
						text1: t('threadFailed.title'),
						text2: t('threadFailed.content')
					});
				} else {
					handleRouteData(newThreadResponse?.payload as IChannel);
					return newThreadResponse?.payload;
				}
			} catch (error) {
				Toast.show({
					type: 'error',
					text1: t('threadFailed.title'),
					text2: t('threadFailed.content')
				});
			}
		},
		[currentClanId, targetParentChannel?.id, targetParentChannel?.category_id, dispatch, t]
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
							await sleep(100);
							await dispatch(
								channelsActions.joinChat({
									clanId: currentClanId as string,
									channelId: thread?.channel_id as string,
									channelType: ChannelType.CHANNEL_TYPE_THREAD,
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
									thread
								);
							}
							await sendMessageThread(content, mentions, attachments, references, thread);
							await dispatch(
								messagesActions.fetchMessages({
									channelId: thread?.channel_id as string,
									isFetchingLatestMessages: true,
									clanId: currentClanId || '0'
								})
							);
							dispatch(appActions.setLoadingMainMobile(false));
							await checkNotificationPermissionMiddleware({ showBottomSheet: true });
							DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
								isShow: false
							});
						}
					} catch (error) {
						dispatch(appActions.setLoadingMainMobile(false));
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

	const handleRouteData = useCallback(
		async (thread?: IChannel) => {
			const store = await getStoreAsync();
			const channelId = thread?.channel_id;
			const clanId = thread?.clan_id || currentClanId;
			const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
			save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
			store.dispatch(channelsActions.joinChannel({ clanId: clanId ?? '', channelId, noFetchMembers: false }));
			await sleep(500);
			if (isTabletLandscape) {
				navigation.navigate(APP_SCREEN.HOME);
			} else {
				navigation.goBack();
				navigation.navigate(APP_SCREEN.HOME_DEFAULT);
			}
		},
		[currentClanId, isTabletLandscape, navigation]
	);

	const handleInputChange = (text: string) => {
		setNameValueThread(text);
		setErrorMessage(validateThreadName(text));
	};

	const handleSwitchChange = (value: boolean) => {
		setIsPrivate(value);
	};

	return (
		<View style={styles.createChannelContent}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<StatusBarHeight />
			<View style={styles.createChannelContent}>
				<HeaderLeftThreadForm currentChannel={targetParentChannel} />
				<ScrollView contentContainerStyle={styles.scrollview} keyboardShouldPersistTaps="handled">
					<View style={styles.contentContainer}>
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
							placeHolder={t('newThread')}
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
								mode={
									checkIsThread(targetParentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL
								}
								channelId={targetParentChannel?.channel_id}
								preventAction
							/>
						</View>
					)}
				</ScrollView>
				<ChatBox
					messageAction={EMessageActionType.CreateThread}
					channelId={targetParentChannel?.channel_id}
					mode={ChannelStreamMode.STREAM_MODE_THREAD}
					isPublic={isPublicChannel(targetParentChannel)}
					topicChannelId={''}
					hiddenAdvanceFunc={true}
				/>
				<PanelKeyboard
					currentChannelId={targetParentChannel?.channel_id}
					currentClanId={targetParentChannel?.clan_id}
					messageAction={EMessageActionType.CreateThread}
				/>
			</View>
		</View>
	);
}
