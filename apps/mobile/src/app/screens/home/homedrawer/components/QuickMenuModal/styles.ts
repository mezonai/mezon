import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
    StyleSheet.create({
        quickMenuModalContainer: {
            flex: 1,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1
        },

        quickMenuModalBox: {
            backgroundColor: colors.secondary,
            borderRadius: size.s_12,
            width: '90%',
            height: '45%',
            overflow: 'hidden'
        },

        quickMenuModalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: size.s_16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
        },

        quickMenuModalTitle: {
            fontSize: size.h6,
            fontWeight: 'bold',
            color: colors.textStrong
        },

        closeButton: {
            padding: size.s_4
        },

        searchContainer: {
            padding: size.s_10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
        },

        searchInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primary,
            borderRadius: size.s_8,
            paddingHorizontal: size.s_12,
            paddingVertical: size.s_8
        },

        searchInput: {
            flex: 1,
            height: size.s_24,
            color: colors.text,
            marginLeft: size.s_8,
            padding: 0
        },

        clearButton: {
            padding: size.s_4,
            marginLeft: size.s_4
        },

        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
        },

        quickMenuList: {
            padding: size.s_8
        },

        quickMenuListContainer: {
            maxHeight: 440, // 5 items * 80px height + padding
            flex: 1
        },

        quickMenuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: size.s_8,
            borderRadius: size.s_8,
            marginBottom: size.s_8,
            backgroundColor: colors.primary
        },

        quickMenuIcon: {
            width: size.s_40,
            height: size.s_40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: size.s_12
        },

        quickMenuContent: {
            flex: 1
        },

        quickMenuTitle: {
            fontSize: size.h7,
            fontWeight: '600',
            color: colors.textStrong,
            marginBottom: size.s_4
        },

        quickMenuBotTag: {
            backgroundColor: baseColor.green,
            color: colors.white,
            paddingHorizontal: size.s_8,
            paddingVertical: size.s_4,
            borderRadius: size.s_4,
            fontSize: size.h8,
            fontWeight: '500',
            alignSelf: 'flex-start'
        },

        quickMenuDescription: {
            fontSize: size.h8,
            color: colors.text,
            lineHeight: size.s_16
        },

        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: size.s_40
        },

        emptyStateText: {
            fontSize: size.h7,
            color: colors.text,
            marginTop: size.s_12,
            textAlign: 'center'
        }
    });
