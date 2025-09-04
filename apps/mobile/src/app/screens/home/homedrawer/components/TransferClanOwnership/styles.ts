import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
    StyleSheet.create({
        inviteHeader: {
            padding: size.s_16,
            width: '100%'
        },
        inviteList: {
            backgroundColor: colors.secondary,
            borderRadius: size.s_10,
            marginHorizontal: size.s_16
        },
        inviteHeaderText: {
            color: colors.white,
            fontWeight: 'bold',
            fontSize: size.s_15,
            textAlign: 'center'
        },
        searchInviteFriendWrapper: {
            padding: size.s_16
        },
        bottomSheetWrapper: {
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            paddingBottom: size.s_10,
            backgroundColor: colors.primary,
            borderTopRightRadius: size.s_8,
            borderTopLeftRadius: size.s_8
        }
    });



