import { useFriends } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { requestAddFriendParam } from '@mezon/store-mobile';
import { EStateFriend, selectCurrentUsername } from '@mezon/store-mobile';
import type { ApiAddFriendsResponse } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonButton from '../../../../../componentUI/MezonButton';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { style } from './styles';

export const AddFriendModal = React.memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentUsername = useSelector(selectCurrentUsername);
	const { addFriend, friends } = useFriends();
	const [requestAddFriend, setRequestAddFriend] = useState<requestAddFriendParam>({
		usernames: [],
		ids: []
	});
	const { t } = useTranslation(['friends', 'friendsPage']);
	const inputRef = useRef<TextInput>(null);

	const onClose = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (inputRef?.current) {
				inputRef.current.focus();
			}
		}, 300);

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				resetField();
			}
		};
	}, []);

	const handleTextChange = (text: string) => {
		if ((text || '')?.trim()?.length) {
			setRequestAddFriend({ ...requestAddFriend, usernames: [text] });
		} else {
			setRequestAddFriend({ ...requestAddFriend, usernames: [] });
		}
	};

	const firstUsername = useMemo(
		() => (Array.isArray(requestAddFriend.usernames) && requestAddFriend.usernames.length > 0 ? requestAddFriend.usernames[0] : ''),
		[requestAddFriend.usernames]
	);

	const resetField = () => {
		setRequestAddFriend({
			usernames: [],
			ids: []
		});
	};

	const sentFriendRequest = useCallback(async () => {
		const firstUsername = Array.isArray(requestAddFriend.usernames) && requestAddFriend.usernames.length > 0 ? requestAddFriend.usernames[0] : '';
		if (!(firstUsername || '')?.trim()?.length) return null;
		if (inputRef?.current) {
			inputRef.current.blur();
		}

		const friend = friends?.find((u) => u?.user?.username === firstUsername);

		if (friend?.user?.username === currentUsername) {
			Toast.show({
				type: 'error',
				text1: t('toast.sendAddFriendFail')
			});
			return;
		}
		if (friend?.state === EStateFriend.FRIEND) {
			Toast.show({
				type: 'error',
				text1: t('friendsPage:addFriendModal.alreadyFriends')
			});
			return;
		}
		if (friend?.state === EStateFriend.OTHER_PENDING) {
			Toast.show({
				type: 'error',
				text1: t('friendsPage:addFriendModal.waitAccept')
			});
			return;
		}

		try {
			const response = await addFriend({ ...requestAddFriend, isMobile: true });
			const payload = response?.payload as ApiAddFriendsResponse;
			if (payload?.ids?.[0] && payload.ids[0] !== '0') {
				resetField();
				Toast.show({
					type: 'success',
					text1: t('toast.sendAddFriendSuccess')
				});
			} else {
				Toast.show({
					type: 'error',
					text1: t('toast.sendAddFriendFail')
				});
			}
		} catch (error) {
			console.error('Error send friend request: ', error);
		}
	}, [addFriend, currentUsername, friends, requestAddFriend, t]);

	return (
		<KeyboardAvoidingView
			behavior={'padding'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5}
			style={styles.addFriendModalContainer}
		>
			<StatusBarHeight />
			<Pressable style={styles.btnClose} onPress={() => onClose()}>
				<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_28} height={size.s_28} color={themeValue.white} />
			</Pressable>
			<Text style={styles.titleHeader}>{t('addFriend.addByUserName')}</Text>
			<View style={[styles.form]}>
				<View style={styles.fill}>
					<Text style={styles.defaultText}>{t('addFriend.whoYouWantToAddFriend')}</Text>
					<View style={styles.searchUsernameWrapper}>
						<TextInput
							ref={inputRef}
							value={firstUsername}
							placeholder={t('addFriend.searchUsernamePlaceholder')}
							placeholderTextColor={themeValue.textDisabled}
							style={styles.searchInput}
							onChangeText={handleTextChange}
							autoCapitalize="none"
						/>
					</View>
					<View style={styles.byTheWayText}>
						<Text style={styles.defaultText}>{`${t('addFriend.byTheWay')} ${currentUsername}`}</Text>
					</View>
				</View>
				<MezonButton
					disabled={!firstUsername?.length}
					onPress={() => sentFriendRequest()}
					containerStyle={[styles.sendButton, !firstUsername?.length && { backgroundColor: themeValue.textDisabled }]}
					title={t('addFriend.sendRequestButton')}
					titleStyle={styles.buttonTitleStyle}
				/>
			</View>
		</KeyboardAvoidingView>
	);
});
