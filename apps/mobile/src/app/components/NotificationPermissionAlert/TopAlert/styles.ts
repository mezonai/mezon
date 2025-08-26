import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (colors: Attributes) => {
    return StyleSheet.create({
        container: {
            backgroundColor: colors.primary,
            paddingHorizontal: size.s_16,
            paddingTop: size.s_24,
            paddingBottom: size.s_10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            position: 'relative',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            zIndex: 1000,
        },

        content: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },

        textContainer: {
            flex: 1,
            marginRight: 24,
        },

        title: {
            fontSize: size.s_14,
            fontWeight: '700',
            color: '#ffffff',
            lineHeight: size.s_16,
            marginBottom: size.s_4,
        },

        subtitle: {
            fontSize: size.s_12,
            color: '#b0b0b0',
            lineHeight: size.s_20,
        },

        enableButton: {
            backgroundColor: colors.bgViolet,
            borderWidth: 2,
            borderColor: colors.primary,
            borderRadius: size.s_28,
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 80,
            height: size.s_40,
        },

        enableButtonText: {
            color: colors.white,
            fontSize: size.s_14,
            fontWeight: '700',
            textAlign: 'center',
        },

        closeButton: {
            right: 0,
            top: 0,
            position: 'absolute',
            width: size.s_24,
            height: size.s_24,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
        },

        closeButtonText: {
            color: colors.white,
            fontSize: size.s_18,
            fontWeight: '600',
            lineHeight: size.s_20,
        },
    });
};
