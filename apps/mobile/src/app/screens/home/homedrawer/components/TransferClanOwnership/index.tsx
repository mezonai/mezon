import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { ActionEmitEvent, load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllMembersInClan, selectCurrentClanId, transferClan, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { User } from '@sentry/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Keyboard, Text, View } from 'react-native';
import { SeparatorWithLine } from '../../../../../components/Common';
import MezonConfirm from '../../../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../../componentUI/MezonInput';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { normalizeString } from '../../../../../utils/helpers';
import { ActionType, FriendListItem, Receiver } from '../../Reusables';
import { style } from './styles';
import TransferClanContent from './TransferClanContent';

export default function TransferClanOwnership({ currentOwner }: { currentOwner?: User }) {
    const { themeValue } = useTheme();
    const styles = style(themeValue);
    const { t } = useTranslation('clanSetting');
    const dispatch = useAppDispatch();
    const currentClanId = useAppSelector(selectCurrentClanId) as string;
    const members = useAppSelector(selectAllMembersInClan as any) as any[];
    const myUserId = useMemo(() => load(STORAGE_MY_USER_ID) as string, []);

    const [searchUserText, setSearchUserText] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const receiverMembers: Receiver[] = useMemo(() => {
        return (members || [])
            .filter((m: any) => m?.id !== myUserId)
            .map((m: any) => ({
                id: m?.id,
                user: m?.user,
                channel_label: m?.clan_nick || m?.user?.display_name || m?.user?.username
            }));
    }, [members, myUserId]);

    const filteredMembers = useMemo(() => {
        const q = normalizeString(searchUserText);
        return receiverMembers.filter((m: Receiver) => normalizeString(m?.channel_label).includes(q));
    }, [receiverMembers, searchUserText]);

    const closeBottomSheet = useCallback(() => {
        DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
    }, []);

    const confirmTransfer = useCallback(
        (newOwner: any) => {
            const data = {
                children: (
                    <MezonConfirm
                        title={t('transferOwnership.confirmTitle', 'Transfer clan owner')}
                        confirmText={t('transferOwnership.confirm', 'Transfer')}
                        onConfirm={async () => {
                            try {
                                DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });

                                await dispatch(transferClan({
                                    clanId: currentClanId,
                                    new_clan_owner: newOwner?.user?.id
                                }));

                                closeBottomSheet();
                                DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
                            } catch (error) {
                                DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
                            }
                        }}
                    >
                        <TransferClanContent
                            newOwner={newOwner}
                            currentOwner={currentOwner}
                        />
                    </MezonConfirm>
                )
            };
            DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
        },
        [dispatch, currentClanId, t, closeBottomSheet, currentOwner]
    );

    const onPressItem = useCallback((newOwner: Receiver) => {
        if (newOwner?.user) confirmTransfer(newOwner);
    }, []);

    return (
        <View style={styles.bottomSheetWrapper}>
            {!isKeyboardVisible && (
                <View style={styles.inviteHeader}>
                    <Text style={styles.inviteHeaderText}>{t('transferOwnership.title', 'Transfer ownership')}</Text>
                </View>
            )}

            <View style={styles.searchInviteFriendWrapper}>
                <MezonInput
                    placeHolder={t('transferOwnership.searchPlaceholder', 'Search members')}
                    onTextChange={setSearchUserText}
                    value={searchUserText}
                    prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={20} width={20} />}
                />
            </View>

            {filteredMembers?.length ? (
                <BottomSheetFlatList
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    data={filteredMembers}
                    initialNumToRender={10}
                    keyExtractor={(item: Receiver) => `${item?.id}_item_transfer`}
                    ItemSeparatorComponent={() => (<SeparatorWithLine style={{ backgroundColor: themeValue.border }} />)}
                    style={styles.inviteList}
                    contentContainerStyle={{ paddingBottom: size.s_20 }}
                    renderItem={({ item, index }) => {
                        return (
                            <FriendListItem
                                key={`transfer_item_${item?.id}_${index}`}
                                dmGroup={item}
                                user={item}
                                onPress={() => onPressItem(item)}
                                isSent={false}
                                actionType={ActionType.TRANSFER_CLAN}
                            />
                        );
                    }}
                />
            ) : (
                <Text style={styles.inviteHeaderText}>{t('transferOwnership.empty', 'No members found')}</Text>
            )}
        </View>
    );
}


