import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
    StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: size.s_20,
            paddingVertical: size.s_20,
            gap: size.s_10
        },

        iconContainer: {
            width: size.s_50,
            height: size.s_50,
            borderRadius: size.s_50,
            backgroundColor: colors.secondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: size.s_8
        },

        title: {
            fontSize: size.h5,
            fontWeight: '600',
            color: colors.textStrong,
            textAlign: 'center',
            marginBottom: size.s_8
        },

        description: {
            fontSize: size.label,
            color: colors.textDisabled,
            textAlign: 'center',
            lineHeight: size.label * 1.4,
            maxWidth: '80%'
        }
    }); 