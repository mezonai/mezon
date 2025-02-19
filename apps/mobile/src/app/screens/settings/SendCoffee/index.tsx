import { useDirect, useSendInviteMessage } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { appActions, getStoreAsync, giveCoffeeActions, selectAllAccount, selectDirectsOpenlist, selectUpdateToken } from '@mezon/store-mobile';
import { TypeMessage, formatMoney } from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { captureRef } from 'react-native-view-shot';
import { useSelector } from 'react-redux';
import { APP_SCREEN, SettingScreenProps } from '../../../navigation/ScreenTypes';
import { Sharing } from '../Sharing';
import { style } from './styles';

type ScreenSettingSendCoffee = typeof APP_SCREEN.SETTINGS.SEND_COFFEE;
export const SendCoffeeScreen = ({ navigation, route }: SettingScreenProps<ScreenSettingSendCoffee>) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['token']);
	const styles = style(themeValue);
	const { formValue } = route.params;
	const jsonObject: ApiTokenSentEvent = safeJSONParse(formValue || '{}');
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [fileShared, setFileShared] = useState<any>();
	const viewToSnapshotRef = useRef();
	const formatTokenAmount = (amount: any) => {
		let sanitizedText = String(amount).replace(/[^0-9]/g, '');
		if (sanitizedText === '') return '0';
		sanitizedText = sanitizedText.replace(/^0+/, '');
		const numericValue = parseInt(sanitizedText, 10) || 0;
		return numericValue.toLocaleString();
	};

	const formattedAmount = formatTokenAmount(jsonObject?.amount || '1');
	const [tokenCount, setTokenCount] = useState(formattedAmount);
	const [note, setNote] = useState(jsonObject?.note || t('sendToken'));
	const [plainTokenCount, setPlainTokenCount] = useState(jsonObject?.amount || 1);
	const [successTime, setSuccessTime] = useState('');
	const [showSharingModal, setShowSharingModal] = useState(false);
	const userProfile = useSelector(selectAllAccount);
	const listDM = useSelector(selectDirectsOpenlist);
	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();

	const tokenInWallet = useMemo(() => {
		return userProfile?.wallet ? safeJSONParse(userProfile?.wallet || '{}')?.value : 0;
	}, [userProfile?.wallet]);
	const getTokenSocket = useSelector(selectUpdateToken(userProfile?.user?.id ?? ''));

	const directMessageId = useMemo(() => {
		const directMessage = listDM?.find?.((dm) => dm?.user_id?.length === 1 && dm?.user_id[0] === jsonObject?.receiver_id);
		return directMessage?.id;
	}, [jsonObject?.receiver_id, listDM]);

	const sendToken = async () => {
		const store = await getStoreAsync();
		try {
			if (Number(plainTokenCount || 0) <= 0) {
				Toast.show({
					type: 'error',
					text1: t('toast.error.amountMustThanZero')
				});
				return;
			}

			if (Number(plainTokenCount || 0) > Number(tokenInWallet)) {
				Toast.show({
					type: 'error',
					text1: t('toast.error.exceedWallet')
				});
				return;
			}
			store.dispatch(appActions.setLoadingMainMobile(true));

			const tokenEvent: ApiTokenSentEvent = {
				sender_id: userProfile?.user?.id || '',
				sender_name: userProfile?.user?.username || '',
				receiver_id: jsonObject?.receiver_id || '',
				extra_attribute: jsonObject?.extra_attribute || '',
				amount: Number(plainTokenCount || 1),
				note: note || ''
			};

			const res = store.dispatch(giveCoffeeActions.sendToken(tokenEvent));
			store.dispatch(giveCoffeeActions.updateTokenUser({ tokenEvent }));
			store.dispatch(appActions.setLoadingMainMobile(false));

			if (directMessageId) {
				sendInviteMessage(
					`${t('tokensSent')} ${formatMoney(Number(plainTokenCount || 1))}₫ | ${note || ''}`,
					directMessageId,
					ChannelStreamMode.STREAM_MODE_DM,
					TypeMessage.SendToken
				);
			} else {
				const response = await createDirectMessageWithUser(jsonObject?.receiver_id);
				if (response?.channel_id) {
					sendInviteMessage(
						`${t('tokensSent')} ${formatMoney(Number(plainTokenCount || 1))}₫ | ${note || ''}`,
						response?.channel_id,
						ChannelStreamMode.STREAM_MODE_DM,
						TypeMessage.SendToken
					);
				}
			}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			if (res?.action?.action?.requestStatus === 'rejected' || !res) {
				Toast.show({
					type: 'error',
					text1: t('toast.error.anErrorOccurred')
				});
			} else {
				const now = new Date();
				const formattedTime = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
					.toString()
					.padStart(2, '0')}/${now.getFullYear()} ${now
					.getHours()
					.toString()
					.padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
				setSuccessTime(formattedTime);
				setShowConfirmModal(true);
			}
		} catch (err) {
			store.dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const handleConfirmSuccessful = () => {
		setShowConfirmModal(false);
		navigation.pop(2);
	};

	const handleChangeText = (text: string) => {
		let sanitizedText = text.replace(/[^0-9]/g, '');

		if (sanitizedText === '') {
			setTokenCount('0');
			setPlainTokenCount(0);
			return;
		}

		sanitizedText = sanitizedText.replace(/^0+/, '');
		const numericValue = parseInt(sanitizedText, 10) || 0;

		setPlainTokenCount(numericValue);
		setTokenCount(numericValue.toLocaleString());
	};

	const handleShare = async () => {
		const dataUri = await captureRef(viewToSnapshotRef, { result: 'tmpfile' });
		if (!dataUri) {
			console.error('Failed to capture screenshot');
			return;
		}
		const shareData = {
			subject: null,
			mimeType: 'image/jpeg',
			fileName: `share` + Date.now(),
			text: null,
			weblink: null,
			contentUri: dataUri,
			filePath: dataUri
		};
		setShowConfirmModal(false);
		setShowSharingModal(true);
		setFileShared([shareData]);
	};

	const handleSendNewToken = () => {
		setShowConfirmModal(false);
		navigation.pop(2);
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.SEND_TOKEN });
	};

	const onCloseFileShare = useCallback(() => {
		setFileShared(undefined);
		setShowSharingModal(false);
		navigation.goBack();
	}, [navigation]);

	return (
		<View style={styles.container}>
			<ScrollView style={styles.form}>
				<Text style={styles.heading}>{t('receiverInfo')}</Text>
				<View>
					<Text style={styles.title}>{t('username')}</Text>
					<View style={styles.textField}>
						<TextInput
							style={styles.textInput}
							placeholderTextColor="#535353"
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-expect-error
							value={jsonObject?.receiver_name || 'KOMU'}
							editable={false}
						/>
					</View>
				</View>
				<View>
					<Text style={styles.title}>{t('tokenCount')}</Text>
					<View style={styles.textField}>
						<TextInput
							style={styles.textInput}
							value={tokenCount}
							keyboardType="numeric"
							placeholderTextColor="#535353"
							editable={!jsonObject?.amount}
							onChangeText={handleChangeText}
						/>
					</View>
				</View>
				<View>
					<Text style={styles.title}>{t('note')}</Text>
					<View style={styles.textField}>
						<TextInput
							style={[styles.textInput, { height: size.s_100, paddingVertical: size.s_10, paddingTop: size.s_10 }]}
							placeholderTextColor="#535353"
							autoCapitalize="none"
							value={note}
							numberOfLines={5}
							multiline={true}
							editable={!jsonObject?.note}
							textAlignVertical="top"
							onChangeText={(text) => setNote(text)}
						/>
					</View>
				</View>
			</ScrollView>
			<Pressable style={styles.button} onPress={sendToken}>
				<Text style={styles.buttonTitle}>{t('sendToken')}</Text>
			</Pressable>
			<Modal
				isVisible={showConfirmModal}
				animationIn="fadeIn"
				animationOut="fadeOut"
				hasBackdrop={true}
				coverScreen={true}
				backdropColor="rgba(0,0,0, 0.9)"
				deviceHeight={Dimensions.get('screen').height}
				style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
			>
				<View ref={viewToSnapshotRef} style={styles.fullscreenModal}>
					<View style={styles.modalHeader}>
						<View>
							<Icons.TickIcon width={100} height={100} />
						</View>
						<Text style={styles.successText}>{t('toast.success.sendSuccess')}</Text>
						<Text style={styles.amountText}>
							{tokenCount} {plainTokenCount === 1 ? `token` : `tokens`}
						</Text>
					</View>

					<View style={styles.modalBody}>
						<View style={styles.infoRow}>
							<Text style={styles.label}>{t('receiver')}</Text>
							<Text style={[styles.value, { fontSize: size.s_20 }]}>
								{
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-expect-error
									jsonObject?.receiver_name || 'KOMU'
								}
							</Text>
						</View>

						<View style={styles.infoRow}>
							<Text style={styles.label}>{t('note')}</Text>
							<Text style={styles.value}>{note || ''}</Text>
						</View>

						<View style={styles.infoRow}>
							<Text style={styles.label}>{t('date')}</Text>
							<Text style={styles.value}>{successTime}</Text>
						</View>
					</View>
					<View style={styles.action}>
						<View style={styles.actionMore}>
							<TouchableOpacity activeOpacity={1} style={styles.buttonActionMore} onPress={handleShare}>
								<Icons.ShareIcon width={24} height={24} />
								<Text style={styles.textActionMore}>{t('share')}</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.buttonActionMore} onPress={handleSendNewToken}>
								<Icons.ArrowLeftRightIcon />
								<Text style={styles.textActionMore}>{t('sendNewToken')}</Text>
							</TouchableOpacity>
						</View>

						<TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSuccessful}>
							<Text style={styles.confirmText}>{t('complete')}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
			{!!fileShared && (
				<Modal
					isVisible={showSharingModal}
					animationIn="fadeIn"
					animationOut="fadeOut"
					hasBackdrop={true}
					coverScreen={true}
					backdropColor="rgba(0,0,0, 0.9)"
					deviceHeight={Dimensions.get('screen').height}
					style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
				>
					<Sharing data={fileShared} onClose={onCloseFileShare} />
				</Modal>
			)}
		</View>
	);
};
