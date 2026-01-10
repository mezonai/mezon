import { useTheme } from '@mezon/mobile-ui';
import type { FriendsEntity } from '@mezon/store-mobile';
import { GROUP_CHAT_MAXIMUM_MEMBERS } from '@mezon/utils';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, Text, View } from 'react-native';
import { SeparatorWithLine, SeparatorWithSpace } from '../Common';
import type { EFriendItemAction } from '../FriendItem';
import { FriendItem } from '../FriendItem';
import { style } from './styles';

interface IFriendListByAlphabetProps {
	friendList: FriendsEntity[];
	selectedFriendDefault?: string[];
	isSearching: boolean;
	showAction?: boolean;
	selectMode?: boolean;
	onSelectedChange?: (friendIdSelectedList: string[]) => void;
	handleFriendAction: (friend: FriendsEntity, action: EFriendItemAction) => void;
	fromDM?: boolean;
}

interface IFriendGroup {
	character: string;
	friendList: FriendsEntity[];
}

export const FriendListByAlphabet = memo(
	({
		friendList,
		isSearching,
		showAction,
		selectMode,
		selectedFriendDefault = [],
		handleFriendAction,
		onSelectedChange,
		fromDM = true
	}: IFriendListByAlphabetProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const [friendIdSelectedList, setFriendIdSelectedList] = useState<string[]>([]);
		const { t } = useTranslation(['friends']);

		const onSelectChange = useCallback(
			(friend: FriendsEntity, value: boolean) => {
				let newValue: string[] = [];
				if (value) {
					newValue = [...friendIdSelectedList, friend?.user?.id];
				} else {
					newValue = friendIdSelectedList.filter((friendId) => friend?.user?.id !== friendId);
				}
				setFriendIdSelectedList(newValue);
				onSelectedChange(newValue);
			},
			[friendIdSelectedList, onSelectedChange]
		);

		const sortByAlphabet = (a: IFriendGroup, b: IFriendGroup) => {
			if (a?.character < b?.character) {
				return -1;
			} else if (a?.character > b?.character) {
				return 1;
			}
			return 0;
		};

		useEffect(() => {
			if (selectedFriendDefault.length > 0) {
				setFriendIdSelectedList(selectedFriendDefault);
			}
		}, [selectedFriendDefault]);

		const allFriendGroupByAlphabet = useMemo(() => {
			if (!friendList?.length) return [];

			const groupedByCharacter = friendList.reduce((acc, friend) => {
				const priorityName = friend?.user?.displayName || friend?.user?.username || '';
				const firstNameCharacter = priorityName.charAt(0).toUpperCase();
				if (!acc[firstNameCharacter]) {
					acc[firstNameCharacter] = [];
				}
				acc[firstNameCharacter].push(friend);
				return acc;
			}, {});

			return Object.keys(groupedByCharacter)
				.map((character) => ({
					character,
					friendList: groupedByCharacter[character]
				}))
				.sort(sortByAlphabet);
		}, [friendList]);

		const isItemDisabled = useCallback(
			(userId: string) => {
				if (selectedFriendDefault.includes(userId)) {
					return true;
				}

				let friendSelectedCount = friendIdSelectedList.length;

				if (!fromDM) {
					friendSelectedCount = friendSelectedCount + 1;
				}

				if (!friendIdSelectedList.includes(userId) && friendSelectedCount >= GROUP_CHAT_MAXIMUM_MEMBERS) {
					return true;
				}

				return false;
			},
			[selectedFriendDefault, friendIdSelectedList, fromDM]
		);

		const renderFriendItem = useCallback(
			({ item }: { item: FriendsEntity }) => {
				return (
					<FriendItem
						friend={item}
						showAction={showAction}
						selectMode={selectMode}
						disabled={isItemDisabled(item?.user?.id)}
						isChecked={friendIdSelectedList.includes(item?.user?.id)}
						handleFriendAction={handleFriendAction}
						onSelectChange={onSelectChange}
					/>
				);
			},
			[friendIdSelectedList, handleFriendAction, isItemDisabled, onSelectChange, selectMode, showAction]
		);

		const renderGroupFriendItem = useCallback(
			({ item }: { item: IFriendGroup }) => {
				return (
					<View>
						<Text style={styles.groupFriendTitle}>{item?.character}</Text>
						<View style={styles.groupWrapper}>
							{item?.friendList?.length > 0 &&
								item.friendList.map((friend, index) => (
									<View key={`friend_item_${friend?.id}_${index}`}>
										{renderFriendItem({ item: friend })}
										<SeparatorWithLine />
									</View>
								))}
						</View>
					</View>
				);
			},
			[renderFriendItem]
		);

		return (
			<View style={styles.listUserByAlphabetContainer}>
				{isSearching ? (
					<View style={styles.searchFriendWrapper}>
						{friendList?.length > 0 && <Text style={styles.friendText}>{t('friends:friends')}</Text>}
						<View style={styles.groupWrapper}>
							<FlatList
								data={friendList || []}
								keyExtractor={(friend, index) => `friend_${friend?.id}_${index}`}
								ItemSeparatorComponent={SeparatorWithLine}
								scrollEventThrottle={100}
								initialNumToRender={1}
								maxToRenderPerBatch={5}
								windowSize={10}
								keyboardShouldPersistTaps="handled"
								onScrollBeginDrag={() => Keyboard.dismiss()}
								contentContainerStyle={styles.contentContainerStyle}
								showsVerticalScrollIndicator={false}
								renderItem={renderFriendItem}
							/>
						</View>
					</View>
				) : (
					<FlatList
						data={allFriendGroupByAlphabet}
						keyExtractor={(item, index) => `group_${item?.character}_${index}`}
						showsVerticalScrollIndicator={false}
						ItemSeparatorComponent={SeparatorWithSpace}
						renderItem={renderGroupFriendItem}
						initialNumToRender={1}
						maxToRenderPerBatch={5}
						windowSize={10}
					/>
				)}
			</View>
		);
	}
);
