import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (colors: Attributes) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },

        content: {
            backgroundColor: colors.primary,
            paddingHorizontal: size.s_20,
            paddingTop: size.s_24,
            paddingBottom: size.s_40,
            minHeight: size.s_400,
        },

        header: {
            alignItems: 'center',
            marginBottom: size.s_32,
        },

        iconContainer: {
            width: size.s_80,
            height: size.s_80,
            borderRadius: size.s_40,
            backgroundColor: colors.bgViolet,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: size.s_16,
        },

        bellIcon: {
            fontSize: size.s_32,
            color: colors.white,
        },

        title: {
            fontSize: size.s_20,
            fontWeight: 'bold',
            color: colors.white,
            marginBottom: size.s_12,
            textAlign: 'center',
        },

        subtitle: {
            fontSize: size.s_14,
            color: '#bdc3c7',
            textAlign: 'center',
            lineHeight: size.s_20,
            paddingHorizontal: size.s_16,
        },

        featuresList: {
            marginBottom: size.s_24,
        },

        featureItem: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: size.s_20,
            paddingHorizontal: size.s_8,
        },
        featureIconContainer: {
            width: size.s_32,
            height: size.s_32,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: size.s_16,
        },
        featureIcon: {
            fontSize: size.s_20,
        },

        featureTextContainer: {
            flex: 1,
        },

        featureTitle: {
            fontSize: size.s_16,
            fontWeight: '600',
            color: colors.white,
            marginBottom: size.s_4,
        },

        featureDescription: {
            fontSize: size.s_14,
            color: '#bdc3c7',
            lineHeight: size.s_18,
        },

        openSettingsButton: {
            backgroundColor: colors.bgViolet,
            paddingVertical: size.s_12,
            borderRadius: size.s_12,
            alignItems: 'center',
            justifyContent: 'center',
        },

        openSettingsButtonText: {
            color: colors.white,
            fontSize: size.s_16,
            fontWeight: '600',
        },
    });
};
