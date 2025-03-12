import { useAuth, useFriends } from '@mezon/core';
import { CheckIcon, CloseIcon } from '@mezon/mobile-components';
import { Colors, baseColor, size, useTheme } from '@mezon/mobile-ui';
import { friendsActions, requestAddFriendParam, selectStatusSentMobile } from '@mezon/store-mobile';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { MezonButton } from '../../../../../componentUI/MezonButton';
import { MezonModal } from '../../../../../componentUI/MezonModal';
import { EAddFriendBy, EAddFriendWays } from '../../../enum';
import { style } from './styles';

interface IAddFriendModal {
	type: EAddFriendWays;
	onClose: () => void;
}

export const AddFriendModal = React.memo((props: IAddFriendModal) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { type, onClose } = props;
	const { userProfile } = useAuth();
	const { addFriend } = useFriends();
	const statusSentMobile = useSelector(selectStatusSentMobile);
	const dispatch = useDispatch();
	const [visibleModal, setVisibleModal] = useState<boolean>(false);
	const [requestAddFriend, setRequestAddFriend] = useState<requestAddFriendParam>({
		usernames: [],
		ids: []
	});
	const [isKeyBoardShow, setIsKeyBoardShow] = useState<boolean>(false);
	const { t } = useTranslation('friends');
	const inputRef = useRef(null);

	useEffect(() => {
		if (statusSentMobile !== null) {
			if (statusSentMobile?.isSuccess) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('toast.sendAddFriendSuccess'),
						leadingIcon: <CheckIcon color={Colors.green} width={20} height={20} />
					}
				});
			} else {
				Toast.show({
					type: 'success',
					props: {
						text2: t('toast.sendAddFriendFail'),
						leadingIcon: <CloseIcon color={Colors.red} width={20} height={20} />
					}
				});
			}
			dispatch(friendsActions.setSentStatusMobile(null));
		}
	}, [statusSentMobile]);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		setVisibleModal(type !== null);

		if (type === EAddFriendWays.UserName) {
			timeoutId = setTimeout(() => {
				if (inputRef?.current) {
					inputRef.current.focus();
				}
			}, 300);
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				resetField();
			}
		};
	}, [type]);

	const handleTextChange = (type: EAddFriendBy, text: string) => {
		switch (type) {
			case EAddFriendBy.Username:
				if ((text || '')?.trim()?.length) {
					setRequestAddFriend({ ...requestAddFriend, usernames: [text] });
				} else {
					setRequestAddFriend({ ...requestAddFriend, usernames: [] });
				}
				break;
			case EAddFriendBy.Id:
				setRequestAddFriend({ ...requestAddFriend, ids: [text] });
				break;
			default:
				break;
		}
	};

	const onVisibleChange = (visible: boolean) => {
		if (!visible) {
			onClose();
		}
	};

	const resetField = () => {
		setRequestAddFriend({
			usernames: [],
			ids: []
		});
	};

	const sentFriendRequest = async () => {
		if (!(requestAddFriend.usernames[0] || '')?.trim()?.length) return null;
		if (inputRef?.current) {
			inputRef.current.blur();
		}
		await addFriend(requestAddFriend);
		resetField();
	};

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
			setIsKeyBoardShow(true);
		});

		const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
			setIsKeyBoardShow(false);
		});

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	const addFriendByUsernameContent = () => {
		return (
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
				<View style={[styles.fill, { paddingVertical: 20 }]}>
					<View style={styles.fill}>
						<Text style={styles.headerTitle}>{t('addFriend.addByUserName')}</Text>
						<Text style={styles.defaultText}>{t('addFriend.whoYouWantToAddFriend')}</Text>
						<View style={styles.searchUsernameWrapper}>
							<TextInput
								ref={inputRef}
								value={requestAddFriend.usernames[0]}
								placeholder={t('addFriend.searchUsernamePlaceholder')}
								placeholderTextColor={themeValue.textDisabled}
								style={styles.searchInput}
								onChangeText={(text) => handleTextChange(EAddFriendBy.Username, text)}
							/>
						</View>
						<View style={styles.byTheWayText}>
							<Text style={styles.defaultText}>{t('addFriend.byTheWay')}</Text>
							<Text style={styles.whiteText}>{userProfile?.user?.username}</Text>
						</View>
					</View>
					<View style={[styles.buttonWrapper, isKeyBoardShow && { marginBottom: 120 }]}>
						<View style={{ height: size.s_50 }}>
							<MezonButton
								disabled={!requestAddFriend.usernames[0]?.length}
								onPress={() => sentFriendRequest()}
								viewContainerStyle={styles.sendButton}
								textStyle={{ color: baseColor.white, fontSize: size.medium }}
							>
								{t('addFriend.sendRequestButton')}
							</MezonButton>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		);
	};

	const findYourFriendContent = () => {
		return (
			<View>
				{/* TODO: update later */}
				<Text style={styles.whiteText}>Find Your Friend</Text>
				<Text style={styles.whiteText}>Let's see which of your contacts are already on Mezon</Text>
			</View>
		);
	};

	const content = useMemo(() => {
		switch (type) {
			case EAddFriendWays.FindFriend:
				return findYourFriendContent();
			case EAddFriendWays.UserName:
				return addFriendByUsernameContent();
			default:
				return <View />;
		}
	}, [type, requestAddFriend, isKeyBoardShow]);

	return (
		<MezonModal visible={visibleModal} visibleChange={onVisibleChange} containerStyle={{ paddingHorizontal: 0 }}>
			<View style={styles.addFriendModalContainer}>{content}</View>
		</MezonModal>
	);
});
