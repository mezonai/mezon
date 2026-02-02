import { useTheme } from "@mezon/mobile-ui";
import { selectAllFriends } from "@mezon/store-mobile";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSelector } from "react-redux";
import { style } from "./styles";

export const FriendsHeaderTitle = () => {
    const { themeValue } = useTheme();
    const styles = style(themeValue);
    const { t } = useTranslation(['screen', 'friends', 'common']);
    const allUser = useSelector(selectAllFriends);
    const friendCount = useMemo(() => {
        const allFriends = allUser?.filter((user) => user?.state === 0) || [];
        return allFriends.length;
    }, [allUser]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {t('headerTitle.Friends')}
            </Text>
            {friendCount > 0 && (
                <Text style={styles.subtitle}>
                    {friendCount} {friendCount === 1 ? t('common:friend') : t('friends:friends')}
                </Text>
            )}
        </View>
    );
};