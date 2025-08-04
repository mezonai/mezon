import { size, useTheme } from '@mezon/mobile-ui';
import { QUICK_MENU_TYPE, QuickMenuType } from '@mezon/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

interface EmptyQuickActionProps {
    selectedTab: QuickMenuType;
}

export const EmptyQuickAction = React.memo(({ selectedTab }: EmptyQuickActionProps) => {
    const { themeValue } = useTheme();
    const { t } = useTranslation('channelSetting');
    const styles = style(themeValue);

    const isFlashMessage = selectedTab === QUICK_MENU_TYPE.FLASH_MESSAGE;

    const title = isFlashMessage
        ? t('quickAction.emptyFlashMessage')
        : t('quickAction.emptyQuickMenu');

    const description = isFlashMessage
        ? t('quickAction.emptyFlashMessageDescription')
        : t('quickAction.emptyQuickMenuDescription');

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <MezonIconCDN
                    icon={IconCDN.quickAction}
                    width={size.s_30}
                    height={size.s_30}
                    color={themeValue.textDisabled}
                />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
        </View>
    );
}); 