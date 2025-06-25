/* eslint-disable prettier/prettier */
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (theme: any) =>
    StyleSheet.create({
        container: {
            marginVertical: size.s_16,
            alignItems: 'flex-start',
            paddingHorizontal: size.s_10
        },
        badge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.secondary,
            paddingHorizontal: size.s_16,
            paddingVertical: size.s_8,
            borderRadius: size.s_20
        },
        icon: {
            fontSize: size.s_20,
            marginRight: size.s_8
        },
        title: {
            fontSize: size.s_16,
            fontWeight: '600',
            color: theme.textStrong,
        }
    });