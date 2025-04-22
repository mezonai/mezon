import { Attributes, Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
    StyleSheet.create({
        cameraPicker: {
            width: '32%',
            backgroundColor: colors.border,
            borderRadius: size.s_6,
            margin: size.s_2,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 120
        },
        itemGallery: {
            width: '32%',
            margin: size.s_2,
            borderRadius: size.s_6,
            overflow: 'hidden'
        },
        imageGallery: {
            flex: 1,
            width: '100%',
            height: 120,
            resizeMode: 'cover',
            borderRadius: size.s_6
        },
        videoOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center'
        },
        iconSelected: {
            position: 'absolute',
            top: size.s_6,
            right: size.s_6,
            backgroundColor: colors.secondary,
            borderRadius: size.s_20,
            padding: size.s_4,
            zIndex: size.s_2
        },
        selectedOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: colors.selectedOverlay
        },
        disable: {
            opacity: 0.5
        },
        loadingContainer: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.selectedOverlay
        }
    });
