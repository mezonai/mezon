import BottomSheet from '@gorhom/bottom-sheet';
import { useThreadMessage, useThreads } from '@mezon/core';
import {
	ActionEmitEvent,
	Icons,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	getUpdateOrAddClanChannelCache,
	save
} from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	RootState,
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
import { IChannel, IMessageSendPayload, ThreadValue, checkIsThread, isPublicChannel } from '@mezon/utils';
import { Formik } from 'formik';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiChannelDescription, ApiCreateChannelDescRequest, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonInput from '../../../componentUI/MezonInput';
import MezonSwitch from '../../../componentUI/MezonSwitch';
import { APP_SCREEN, MenuThreadScreenProps } from '../../../navigation/ScreenTypes';
import { ChatBox } from '../../../screens/home/homedrawer/ChatBox';
import MessageItem from '../../../screens/home/homedrawer/MessageItem';
import PanelKeyboard from '../../../screens/home/homedrawer/PanelKeyboard';
import { IModeKeyboardPicker } from '../../../screens/home/homedrawer/components/BottomKeyboardPicker';
import { EMessageActionType } from '../../../screens/home/homedrawer/enums';
import { validInput } from '../../../utils/validate';
import { style } from './CreateThreadForm.style';
import HeaderLeftThreadForm from './HeaderLeftThreadForm';
type CreateThreadFormScreen = typeof APP_SCREEN.MENU_THREAD.CREATE_THREAD_FORM_MODAL;
export default function CreateThreadForm({ navigation, route }: MenuThreadScreenProps<CreateThreadFormScreen>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { channelThreads } = route.params || {};
	const { t } = useTranslation(['createThread']);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentChannelId = useSelector(selectCurrentChannelId);

	const formikRef = useRef(null);
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const { valueThread } = useThreads();
	const { sendMessageThread } = useThreadMessage({
		channelId: '',
		mode: ChannelStreamMode.STREAM_MODE_THREAD
	});
	const panelKeyboardRef = useRef(null);

	const bottomPickerRef = useRef<BottomSheet>(null);
	navigation.setOptions({
		headerShown: true,
		headerTitle: () => <Text></Text>,
		headerLeft: () => <HeaderLeftThreadForm currentChannel={channelThreads || currentChannel} />,
		headerTintColor: themeValue.white
	});

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
			value?: ThreadValue
		) => {
			if (sessionUser) {
				if (value?.nameValueThread) {
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
						await sendMessageThread(content, mentions, attachments, references, thread);
						await dispatch(
							messagesActions.fetchMessages({
								channelId: thread.channel_id as string,
								isFetchingLatestMessages: true,
								clanId: currentClanId
							})
						);
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
		const sendMessage = DeviceEventEmitter.addListener(ActionEmitEvent.SEND_MESSAGE, ({ content, mentions }) => {
			const { isPrivate, nameValueThread } = formikRef.current.values;
			const valueForm = { isPrivate: isPrivate ? 1 : 0, nameValueThread: nameValueThread ?? valueThread?.content?.t };
			const contentMessage = openThreadMessageState ? { t: valueThread?.content?.t } : { t: content?.t };
			const mentionMessage = openThreadMessageState ? valueThread?.mentions : mentions;

			if (validInput(nameValueThread)) {
				handleSendMessageThread(contentMessage, mentionMessage, [], [], valueForm);
			}
		});
		return () => {
			sendMessage.remove();
		};
	}, []);

	const handleRouteData = async (thread?: IChannel) => {
		const store = await getStoreAsync();
		navigation.navigate(APP_SCREEN.HOME);
		const channelId = thread?.channel_id;
		const clanId = thread?.clan_id || currentClanId;
		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		store.dispatch(channelsActions.joinChannel({ clanId: clanId ?? '', channelId: channelId, noFetchMembers: false }));
	};

	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, type?: IModeKeyboardPicker) => {
		if (panelKeyboardRef?.current) {
			panelKeyboardRef.current?.onShowKeyboardBottomSheet(isShow, type);
		}
	}, []);

	return (
		<View style={{ flex: 1 }}>
			<Formik innerRef={formikRef} initialValues={{ nameValueThread: null, isPrivate: false }}>
				{({ setFieldValue, handleChange, handleBlur, handleSubmit, values, touched, errors }) => (
					<KeyboardAvoidingView
						style={styles.createChannelContent}
						behavior={'padding'}
						keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
					>
						<View style={{ margin: size.s_20, flex: 1 }}>
							<View style={styles.iconContainer}>
								<Icons.ThreadIcon width={size.s_20} height={size.s_20} color={themeValue.text} />
							</View>
							<MezonInput
								label={t('threadName')}
								onTextChange={handleChange('nameValueThread')}
								onFocus={() => {
									bottomPickerRef.current?.close();
								}}
								value={values.nameValueThread}
								placeHolder="New Thread"
								maxCharacter={64}
								errorMessage={t('errorMessage')}
							/>
						</View>
						{!openThreadMessageState && (
							<View style={styles.threadPolicy}>
								<View style={styles.threadPolicyInfo}>
									<Text style={styles.threadPolicyTitle}>{t('privateThread')}</Text>
									<Text style={styles.threadPolicyContent}>{t('onlyPeopleInviteThread')}</Text>
								</View>
								<MezonSwitch
									value={values.isPrivate}
									onValueChange={(value) => {
										setFieldValue('isPrivate', value);
									}}
								/>
							</View>
						)}
						{valueThread && openThreadMessageState && (
							<View style={styles.messageBox}>
								<MessageItem
									messageId={valueThread?.id}
									message={valueThread}
									showUserInformation
									mode={
										checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL
									}
									channelId={currentChannel?.channel_id}
									isNumberOfLine={true}
									preventAction
								/>
							</View>
						)}
						<ChatBox
							messageAction={EMessageActionType.CreateThread}
							channelId={currentChannel?.channel_id}
							mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
							hiddenIcon={{
								threadIcon: true
							}}
							onShowKeyboardBottomSheet={onShowKeyboardBottomSheet}
							isPublic={isPublicChannel(currentChannel)}
						/>
						<PanelKeyboard ref={panelKeyboardRef} currentChannelId={currentChannel?.channel_id} currentClanId={currentChannel?.clan_id} />
						<View style={{ height: Platform.OS === 'ios' ? size.s_40 : 0 }} />
					</KeyboardAvoidingView>
				)}
			</Formik>
		</View>
	);
}
