import React, { useState, useRef, useEffect } from 'react';
import { Colors } from '@mezon/mobile-ui';
import { Keyboard, Pressable, Text, TextInput, TouchableWithoutFeedback, View, VirtualizedList } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';
import { darkColor } from '../../../../../constants/Colors';
import { FriendListItem } from '../../Reusables';
import { styles } from './styles';
import { LINK_EXPIRE_OPTION, MAX_USER_OPTION } from '../../constants';
import BottomSheet from 'react-native-raw-bottom-sheet';
import { friendList } from '../fakeData';
import { useCategory, useClans, useInvite } from '@mezon/core';
import Clipboard from '@react-native-clipboard/clipboard';
import { IUser } from '@mezon/utils';
import { normalizeString } from '../../../../../utils/helpers';
import { MezonModal, MezonSwitch } from '../../../../../temp-ui';
import { useTranslation } from 'react-i18next';
import { EMaxUserCanInvite } from '../../enums';
import { LinkIcon } from '@mezon/mobile-components';
import Toast from 'react-native-toast-message';

export const InviteToChannel = React.memo(() => {
	const [isVisibleEditLinkModal, setIsVisibleEditLinkModal] = useState(false);
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [currentInviteLink, setCurrentInviteLink] = useState('');
	const [searchUserText, setSearchUserText] = useState('');
    const { currentClanId } = useClans();
    const { createLinkInviteUser } = useInvite();
	const { t } = useTranslation(['inviteToChannel']);

	const refRBSheet = useRef(null);
	//TODO: get from API
	const [maxUserCanInviteSelected, setMaxUserCanInviteSelected] =
		useState<EMaxUserCanInvite>(EMaxUserCanInvite.Five);
	const [expiredTimeSelected, setExpiredTimeSelected] =
		useState<number>(2);
	const [isTemporaryMembership, setIsTemporaryMembership] = useState(false);
    const { categorizedChannels } = useCategory();

	const renderUserItem = ({ item }) => <FriendListItem user={item} />;

	const openEditLinkModal = () => {
		refRBSheet.current.close();
		setIsVisibleEditLinkModal(true);
	}

    const onVisibleEditLinkModalChange = (isVisible: boolean) => {
        if (!isVisible) {
            backToInviteModal();
        }
    }

	const backToInviteModal = () => {
		setIsVisibleEditLinkModal(false);
		refRBSheet.current.open();
	}

	const saveInviteLinkSettings = () => {
		//TODO: save invite link
		setIsVisibleEditLinkModal(false);
	}

    const addInviteLinkToClipboard = () => {
        Clipboard.setString(currentInviteLink);
		Toast.show({
            type: 'success',
            props: {
                text2: t('copyLink'),
                leadingIcon: <LinkIcon color={Colors.textLink} />
            }
        });
    }

	const getListOfUser = () => {
		if (!(searchUserText || '').trim()) {
			return friendList;
		}
		const filteredUserList = friendList.filter((user: IUser) => normalizeString(user.name).includes(normalizeString(searchUserText)));
		return filteredUserList;
	}

	const resetSearch = () => {
		if (isVisibleEditLinkModal) {
			return
		}
		setSearchUserText('');
	}

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener(
			'keyboardDidShow',
			() => {
				setIsKeyboardVisible(true);
			}
		);
		const keyboardDidHideListener = Keyboard.addListener(
			'keyboardDidHide',
			() => {
				setIsKeyboardVisible(false);
			}
		);

		return () => {
		  keyboardDidShowListener.remove();
		  keyboardDidHideListener.remove();
		};
	}, []);

    useEffect(() => {
        const fetchInviteLink = async () => {
            const channelId = categorizedChannels.at(0)?.channels.at(0)?.channel_id;
            const response = await createLinkInviteUser(currentClanId ?? '', channelId ?? '', 10);
            if (!response) {
                return;
            }
            setCurrentInviteLink(`https://mezon.vn/invite/${response.invite_link}`);
        };
    
        fetchInviteLink();
    }, [categorizedChannels, currentClanId, createLinkInviteUser]);
  
	return (
		<View
			style={styles.inviteToChannelWrapper}
		>
			<Pressable  onPress={() => refRBSheet.current.open()}>
				<Feather size={16} name="user-plus" style={{ color: darkColor.Backgound_Subtle }} />
			</Pressable>
			<BottomSheet
				ref={refRBSheet}
				onClose={() => resetSearch()}
				height={700}
                draggable
                dragOnContent
				customStyles={{
				container: {
					backgroundColor: 'transparent'
				}
			}}>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View style={styles.inviteWrapper}>
						{!isKeyboardVisible ?
							<>
							<View style={styles.inviteHeader}>
								<Text style={styles.inviteHeaderText}>Invite a friend</Text>
							</View>
							<View style={styles.iconAreaWrapper}>
								<Pressable style={styles.inviteIconWrapper}>
									<Feather size={25} name="twitter" style={styles.shareToInviteIcon} />
									<Text style={styles.inviteIconText}>{t('iconTitle.twitter')}</Text>
								</Pressable>
								<Pressable style={styles.inviteIconWrapper}>
									<Feather size={25} name="facebook" style={styles.shareToInviteIcon} />
									<Text style={styles.inviteIconText}>{t('iconTitle.faceBook')}</Text>
								</Pressable>
								<Pressable style={styles.inviteIconWrapper}>
									<Feather size={25} name="youtube" style={styles.shareToInviteIcon} />
									<Text style={styles.inviteIconText}>{t('iconTitle.youtube')}</Text>
								</Pressable>
								<Pressable style={styles.inviteIconWrapper}>
									<Feather size={25} name="link" style={styles.shareToInviteIcon} onPress={() => addInviteLinkToClipboard() } />
									<Text style={styles.inviteIconText}>{t('iconTitle.copyLink')}</Text>
								</Pressable>
								<Pressable style={styles.inviteIconWrapper}>
									<Feather size={25} name="mail" style={styles.shareToInviteIcon} />
									<Text style={styles.inviteIconText}>{t('iconTitle.email')}</Text>
								</Pressable>
							</View>
							</>:
						<View />}
						<View style={styles.searchInviteFriendWrapper}>
							<View style={styles.searchFriendToInviteWrapper}>
								<TextInput
									placeholder={'Invite friend to channel'}
									placeholderTextColor={Colors.tertiary}
									style={styles.searchFriendToInviteInput}
									onChangeText={setSearchUserText}
								/>
								<Feather size={18} name="search" style={{ color: Colors.tertiary }} />
							</View>
							<View style={styles.editInviteLinkWrapper}>
								<Text style={styles.defaultText}>Your invite link expires in 7 days </Text>
								<Pressable onPress={() => openEditLinkModal()}>
									<Text style={styles.linkText}>Edit invite link.</Text>
								</Pressable>
							</View>
						</View>
                        
						<VirtualizedList
							scrollEnabled={true}
							data={getListOfUser()}
							renderItem={renderUserItem}
							keyExtractor={item => item?.id?.toString()}
							getItemCount={() => getListOfUser().length}
							getItem={(data, index) => data[index]}
						/>
					</View>
				</TouchableWithoutFeedback>
			</BottomSheet>
            <MezonModal
                visible={isVisibleEditLinkModal}
                title='Link Settings'
                confirmText='SAVE'
                onConfirm={saveInviteLinkSettings}
                visibleChange={onVisibleEditLinkModalChange}
            >
                <View style={styles.inviteChannelListWrapper}>
                    <Text style={styles.inviteChannelListTitle}>INVITE CHANNEL</Text>
                    <View style={styles.channelInviteItem}>
                        {/* <HashSignIcon width={18} height={18} /> */}
                        <Text style={styles.channelInviteTitle}>mezon</Text>
                    </View>
                </View>
                <View style={styles.advancedSettingWrapper}>
                    <Text style={styles.advancedSettingTitle}>ADVANCED SETTINGS</Text>
                    <Text style={styles.advancedSettingSubTitle}>EXPIRE AFTER</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        <View style={styles.radioContainer}>
                            {LINK_EXPIRE_OPTION.map(option => (
                                <Pressable
                                    key={option.value}
                                    style={[styles.radioItem, option.value === expiredTimeSelected ? styles.radioItemActive : styles.radioItemDeActive]}
                                    onPress={() => setExpiredTimeSelected(option.value)}
                                >
                                    <Text style={[{ color: option.value === expiredTimeSelected ? Colors.white : Colors.textGray, textAlign: 'center' }]}>{option.label}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                    <Text style={styles.advancedSettingSubTitle}>MAX USERS</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        <View style={styles.radioContainer}>
                            {MAX_USER_OPTION.map(option => (
                                <Pressable
                                    key={option}
                                    style={[styles.radioItem, option === maxUserCanInviteSelected ? styles.radioItemActive : styles.radioItemDeActive]}
                                    onPress={() => setMaxUserCanInviteSelected(option)}
                                >
                                    <Text style={[{ color: option === maxUserCanInviteSelected ? Colors.white : Colors.textGray, textAlign: 'center' }]}>{option}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                    <View style={styles.temporaryMemberWrapper}>
                        <Text style={styles.temporaryMemberTitle}>Temporary Membership</Text>
                        <MezonSwitch 
                            value={isTemporaryMembership}
                            onValueChange={setIsTemporaryMembership}
                        />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={{color: Colors.textGray}}>Members are automatically kicked when they disconnect unless a role is assigned.</Text>
                    </View>
                </View>
            </MezonModal>
		</View>
	)
})
