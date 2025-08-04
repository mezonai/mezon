import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
    StyleSheet.create({
        emptyContainer: {
            gap: size.s_10,
            marginTop: size.s_50,
            alignItems: 'center'
        },
        emptyTitle: {
            fontSize: size.h5,
            color: colors.text,
            fontWeight: '600'
        },
        emptyDescription: {
            fontSize: size.medium,
            color: colors.textDisabled,
            fontWeight: '400',
            textAlign: 'center',
            lineHeight: size.s_20
        }
    });
