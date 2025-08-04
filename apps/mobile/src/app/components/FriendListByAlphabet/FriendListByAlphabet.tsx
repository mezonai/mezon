import { size, useTheme } from '@mezon/mobile-ui';
import { FriendsEntity } from '@mezon/store-mobile';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, Text, View } from 'react-native';
import { SeparatorWithLine, SeparatorWithSpace } from '../Common';
import { FriendItem } from '../FriendItem';
import { style } from './styles';
import { IFriendGroupByCharacter, IListUserByAlphabetProps } from './type';

export const FriendListByAlphabet = React.memo((props: IListUserByAlphabetProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { friendList, isSearching, showAction, selectMode, selectedFriendDefault = [], handleFriendAction, onSelectedChange } = props;
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

	const sortByAlphabet = (a, b) => {
		if (a.character < b.character) {
			return -1;
		}
		if (a.character > b.character) {
			return 1;
		}
		return 0;
	};

	useEffect(() => {
		if (selectedFriendDefault?.length) {
			setFriendIdSelectedList(selectedFriendDefault);
		}
	}, [selectedFriendDefault]);

	const allFriendGroupByAlphabet = useMemo(() => {
		const groupedByCharacter = friendList.reduce((acc, friend) => {
			const name = friend?.user?.display_name ? friend?.user?.display_name : friend?.user?.username;
			const firstNameCharacter = name?.charAt(0)?.toUpperCase();
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

	const renderListFriendGroupByAlphabet = ({ item }: { item: IFriendGroupByCharacter }) => {
		return (
			<View>
				<Text style={styles.groupFriendTitle}>{item.character}</Text>
				<View style={styles.groupWrapper}>
					<FlatList
						data={item.friendList}
						style={styles.groupByAlphabetWrapper}
						ItemSeparatorComponent={SeparatorWithLine}
						keyExtractor={(friend) => friend.id.toString()}
						showsVerticalScrollIndicator={false}
						scrollEventThrottle={100}
						keyboardShouldPersistTaps="handled"
						onScrollBeginDrag={() => Keyboard.dismiss()}
						initialNumToRender={1}
						maxToRenderPerBatch={5}
						windowSize={10}
						renderItem={({ item }) => (
							<FriendItem
								friend={item}
								showAction={showAction}
								selectMode={selectMode}
								disabled={selectedFriendDefault.includes(item?.user?.id)}
								isChecked={friendIdSelectedList.includes(item?.user?.id)}
								handleFriendAction={handleFriendAction}
								onSelectChange={onSelectChange}
							/>
						)}
					/>
				</View>
			</View>
		);
	};
	return (
		<View style={styles.listUserByAlphabetContainer}>
			{isSearching ? (
				<View style={{ flex: 1 }}>
					{friendList?.length ? <Text style={styles.friendText}>{t('friends:friends')}</Text> : null}
					<View style={styles.groupWrapper}>
						<FlatList
							data={friendList}
							keyExtractor={(friend) => friend.id.toString()}
							ItemSeparatorComponent={SeparatorWithLine}
							scrollEventThrottle={100}
							initialNumToRender={1}
							maxToRenderPerBatch={5}
							windowSize={10}
							keyboardShouldPersistTaps="handled"
							onScrollBeginDrag={() => Keyboard.dismiss()}
							contentContainerStyle={{ paddingBottom: size.s_50 }}
							showsVerticalScrollIndicator={false}
							renderItem={({ item }) => (
								<FriendItem
									friend={item}
									showAction={showAction}
									selectMode={selectMode}
									disabled={selectedFriendDefault.includes(item?.user?.id)}
									isChecked={friendIdSelectedList.includes(item?.user?.id)}
									handleFriendAction={handleFriendAction}
									onSelectChange={onSelectChange}
								/>
							)}
						/>
					</View>
				</View>
			) : (
				<FlatList
					data={allFriendGroupByAlphabet}
					keyExtractor={(item) => item.character}
					showsVerticalScrollIndicator={false}
					ItemSeparatorComponent={SeparatorWithSpace}
					renderItem={renderListFriendGroupByAlphabet}
					initialNumToRender={1}
					maxToRenderPerBatch={5}
					windowSize={10}
				/>
			)}
		</View>
	);
});
