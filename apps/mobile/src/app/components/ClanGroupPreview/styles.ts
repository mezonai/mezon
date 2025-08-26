/* eslint-disable prettier/prettier */
import { StyleSheet } from 'react-native';

export const style = () =>
    StyleSheet.create({
        previewGroupContainer: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
        }
    });
