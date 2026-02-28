import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = () =>
    StyleSheet.create({
        loadingVideoSpinner: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.1)',
            justifyContent: 'center',
            alignItems: 'center'
        },
        borderLeftView: {
            marginTop: size.s_6,
            borderLeftWidth: size.s_2,
            borderLeftColor: baseColor.redStrong,
            borderRadius: size.s_4
        }
    });
