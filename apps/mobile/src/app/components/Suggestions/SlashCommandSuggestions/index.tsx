import { debounce, KEY_SLASH_COMMAND_EPHEMERAL } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { listQuickMenuAccess, selectQuickMenuByChannelId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { QUICK_MENU_TYPE } from '@mezon/utils';
import type { ApiQuickMenuAccess } from 'mezon-js/api.gen';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { style } from './styles';

interface SlashCommand {
	id: string;
	display?: string;
	description?: string;
}

interface SlashCommandSuggestionsProps {
	keyword: string;
	onSelectCommand: (command: SlashCommand) => void;
	channelId?: string;
}

export const SlashCommandSuggestions = memo(({ keyword, onSelectCommand, channelId }: SlashCommandSuggestionsProps) => {
	const { t } = useTranslation('message');
	const dispatch = useAppDispatch();
	const slashCommands: SlashCommand[] = [
		{
			id: KEY_SLASH_COMMAND_EPHEMERAL,
			display: 'ephemeral',
			description: t('ephemeral.description')
		}
	];

	useEffect(() => {
		if (channelId) {
			dispatch(listQuickMenuAccess({ channelId, menuType: QUICK_MENU_TYPE.FLASH_MESSAGE }));
		}
	}, [channelId, dispatch]);

	const quickMenuList: ApiQuickMenuAccess[] = useAppSelector((state) => selectQuickMenuByChannelId(state, channelId));

	const allCommands: SlashCommand[] = [
		...slashCommands,
		...(quickMenuList ?? []).map((item) => ({ id: item.id, display: item.menu_name, description: item.action_msg }))
	];

	const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>(slashCommands);
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	useEffect(() => {
		const debounceFilter = debounce(() => {
			if (slashCommands?.length === 0) return;
			const suggestionCommands = allCommands?.filter((command) => command?.display?.toLowerCase().includes(keyword?.toLowerCase()));
			setFilteredCommands(suggestionCommands);
		}, 300);

		debounceFilter();
	}, [keyword, quickMenuList]);

	const renderCommands = ({ item }: { item: SlashCommand }) => {
		if (!item?.display) return <View />;
		return (
			<Pressable style={styles.commandItem} onPress={() => onSelectCommand(item)}>
				<Text style={styles.commandDisplay}>/{item?.display}</Text>
				<Text style={styles.commandDescription}>{item?.description}</Text>
			</Pressable>
		);
	};

	return (
		<View style={styles.container}>
			{filteredCommands?.length > 0 && (
				<View style={styles.commandItem}>
					<Text style={styles.headerTitle}>COMMANDS</Text>
				</View>
			)}
			<FlatList
				style={styles.container}
				data={filteredCommands}
				renderItem={renderCommands}
				keyExtractor={(item, index) => `${item?.id}_${index}_slash_command`}
				keyboardShouldPersistTaps="handled"
				initialNumToRender={1}
				maxToRenderPerBatch={1}
				windowSize={2}
				disableVirtualization
				removeClippedSubviews={true}
				getItemLayout={(_, index) => ({
					length: size.s_60,
					offset: size.s_60 * index,
					index
				})}
			/>
		</View>
	);
});
