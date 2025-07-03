import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
    StyleSheet.create({
        buttonCircle: {
            backgroundColor: colors.tertiary,
            padding: size.s_8,
            borderRadius: size.s_22
        },
        text: { fontSize: size.s_20, fontWeight: '600', color: colors.text },
        textDisable: { fontSize: size.s_16, fontWeight: '400', color: colors.textDisabled },
        btnJoinChannel: {
            borderRadius: size.s_40,
            backgroundColor: baseColor.green,
            height: size.s_50,
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1
        },
        textBtnJoinChannel: { fontSize: size.s_16, fontWeight: '600', color: baseColor.black },
        iconChannel: {
            padding: size.s_20,
            borderRadius: '100%',
            backgroundColor: colors.tertiary,
            justifyContent: 'center',
            alignItems: 'center',
        }
    });
