import { Attributes, size, useTheme } from '@mezon/mobile-ui';
import MezonIconCDN from 'apps/mobile/src/app/componentUI/MezonIconCDN';
import { IconCDN } from 'apps/mobile/src/app/constants/icon_cdn';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

interface TransferClanContentProps {
    currentOwner: any;
    newOwner: any;
}

export default function TransferClanContent({
    currentOwner,
    newOwner
}: TransferClanContentProps) {
    const { themeValue } = useTheme();
    const { t } = useTranslation('clanSetting');
    const dashAnimations = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
    const arrowAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createEnergyWave = () => {
            try {
                dashAnimations.forEach(anim => anim.setValue(0));
                arrowAnimation.setValue(0);

                const dashAnimationsSequence = dashAnimations.map((anim, index) =>
                    Animated.sequence([
                        Animated.delay(index * 150),
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ])
                );

                const arrowSequence = Animated.sequence([
                    Animated.delay(1200),
                    Animated.timing(arrowAnimation, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(arrowAnimation, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]);

                Animated.parallel([...dashAnimationsSequence, arrowSequence]).start(() => {
                    setTimeout(createEnergyWave, 2000);
                });
            } catch (error) {
                console.error('Error:', error.message);
                // Fallback: try to restart animation after a delay
                setTimeout(createEnergyWave, 3000);
            }
        };

        createEnergyWave();

        return () => {
            dashAnimations.forEach(anim => anim.stopAnimation());
            arrowAnimation.stopAnimation();
        };
    }, []);

    const styles = style(themeValue);

    const currentOwnerName = useMemo(() =>
        currentOwner?.display_name || currentOwner?.username || 'Owner',
        [currentOwner?.display_name, currentOwner?.username]
    );

    const currentOwnerAvatar = useMemo(() =>
        currentOwner?.avatar || currentOwner?.avatar_url,
        [currentOwner?.avatar, currentOwner?.avatar_url]
    );

    const newOwnerName = useMemo(() =>
        newOwner?.user?.display_name || newOwner?.user?.username || newOwner?.display_name || newOwner?.username || 'New owner',
        [newOwner?.user?.display_name, newOwner?.user?.username, newOwner?.display_name, newOwner?.username]
    );

    const newOwnerAvatar = useMemo(() =>
        newOwner?.user?.avatar || newOwner?.user?.avatar_url || newOwner?.avatar || newOwner?.avatar_url,
        [newOwner?.user?.avatar, newOwner?.user?.avatar_url, newOwner?.avatar, newOwner?.avatar_url]
    );

    return (
        <View style={styles.container}>
            <View style={styles.firstRow}>
                <View style={styles.ownerSection}>
                    <View style={styles.avatar}>
                        {currentOwnerAvatar ? (
                            <Image
                                source={{ uri: currentOwnerAvatar }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.avatarText}>
                                {currentOwnerName.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <Text style={styles.ownerLabel} numberOfLines={2}>
                        {currentOwnerName}
                    </Text>
                </View>

                <View style={styles.transferIndicator}>
                    {Array.from({ length: 8 }, (_, i) => (
                        <Animated.View
                            key={i}
                            style={[
                                styles.dashSegment,
                                {
                                    opacity: dashAnimations[i].interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.2, 1],
                                    }),
                                    transform: [{
                                        scale: dashAnimations[i].interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 1.3],
                                        }),
                                    }],
                                }
                            ]}
                        />
                    ))}
                    <Animated.View
                        style={[
                            styles.arrowHead,
                            {
                                opacity: arrowAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.2, 1],
                                }),
                                transform: [{
                                    scale: arrowAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.2],
                                    }),
                                }],
                            }
                        ]}
                    />
                </View>

                <View style={styles.ownerSection}>
                    <MezonIconCDN customStyle={styles.ownerIcon} icon={IconCDN.ownerIcon} color={themeValue.borderWarning} width={16} height={16} />
                    <View style={styles.avatar}>
                        {newOwnerAvatar ? (
                            <Image
                                source={{ uri: newOwnerAvatar }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.avatarText}>
                                {newOwnerName.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <Text style={styles.ownerLabel} numberOfLines={2}>
                        {newOwnerName}
                    </Text>
                </View>
            </View>

            <View style={styles.secondRow}>
                <Text style={styles.description}>
                    {t('transferOwnership.description', { newOwnerName })}
                </Text>
            </View>
        </View>
    );
}

const style = (themeValue: Attributes) => StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    firstRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size.s_10,
        marginBottom: size.s_24,
    },
    ownerSection: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    avatar: {
        width: size.s_60,
        height: size.s_60,
        borderRadius: size.s_32,
        backgroundColor: themeValue.colorAvatarDefault,
        borderWidth: 2,
        borderColor: themeValue.border,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: size.s_32,
        overflow: 'hidden',
    },
    avatarText: {
        fontSize: size.s_20,
        fontWeight: 'bold',
        color: themeValue.text,
    },
    ownerLabel: {
        fontSize: size.s_12,
        color: themeValue.textNormal || themeValue.text,
        fontWeight: '500',
        textAlign: 'center',
        maxWidth: size.s_80,
    },
    ownerIcon: {
        position: 'absolute',
        top: -size.s_14,
        left: '50%',
        marginLeft: -size.s_8,
        zIndex: 1,
    },
    transferIndicator: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: size.s_2,
        alignSelf: 'center',
        marginBottom: size.s_28,
    },
    dashSegment: {
        width: size.s_10,
        height: size.s_6,
        backgroundColor: themeValue.textNormal,
        opacity: 0.6,
    },
    arrowHead: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: size.s_12,
        borderRightWidth: 0,
        borderBottomWidth: size.s_6,
        borderTopWidth: size.s_6,
        borderLeftColor: themeValue.textNormal,
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderTopColor: 'transparent',
    },
    secondRow: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    description: {
        fontSize: size.s_14,
        color: themeValue.textNormal,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: size.s_20,
    },
});
