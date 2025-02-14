import { UserGroupIcon } from '@mezon/mobile-components';
import { Colors, size, Text, useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import FastImage from 'react-native-fast-image';
import { IForwardIObject } from '..';
import { styles } from '../styles';

function ForwardMessageItem({
	item,
	onSelectChange,
	isItemChecked
}: {
	item: IForwardIObject;
	onSelectChange: (isChecked: boolean, item: IForwardIObject) => void;
	isItemChecked: boolean;
}) {
	const { themeValue } = useTheme();
	const [isChecked, setIsChecked] = useState<boolean>(isItemChecked);

	const renderAvatar = (item: IForwardIObject) => {
		const { type } = item;
		switch (type) {
			case ChannelType.CHANNEL_TYPE_DM:
				if (item?.avatar) {
					return (
						<FastImage
							source={{
								uri: createImgproxyUrl(item?.avatar ?? '', { width: 100, height: 100, resizeType: 'fit' })
							}}
							style={styles.memberAvatar}
						/>
					);
				}
				return (
					<View
						style={{
							height: size.s_34,
							width: size.s_34,
							justifyContent: 'center',
							borderRadius: 50,
							backgroundColor: themeValue.colorAvatarDefault
						}}
					>
						<Text center>{item?.name?.charAt(0)?.toUpperCase()}</Text>
					</View>
				);
			case ChannelType.CHANNEL_TYPE_GROUP:
				return (
					<View style={styles.groupAvatar}>
						<UserGroupIcon />
					</View>
				);
			case ChannelType.CHANNEL_TYPE_CHANNEL:
				return (
					<View style={{ width: size.s_16, height: size.s_34, justifyContent: 'center' }}>
						<Text center h3 color={themeValue.white}>
							#
						</Text>
					</View>
				);
			default:
				break;
		}
	};

	const handleSelectChange = (isChecked: boolean) => {
		setIsChecked(isChecked);
		onSelectChange(isChecked, item);
	};

	return (
		<TouchableOpacity
			onPress={() => {
				handleSelectChange(!isChecked);
			}}
		>
			<View style={{ flexDirection: 'row', padding: size.s_10, gap: size.s_6, justifyContent: 'center' }}>
				<View>{renderAvatar(item)}</View>
				<View style={{ flex: 1, justifyContent: 'center' }}>
					{item.type === ChannelType.CHANNEL_TYPE_CHANNEL ? (
						<Text color={themeValue.textStrong} numberOfLines={1}>{`${item.name} (${item.clanName})`}</Text>
					) : (
						<Text color={themeValue.textStrong} numberOfLines={1}>
							{item.name}
						</Text>
					)}
				</View>
				<View style={{ justifyContent: 'center' }}>
					<BouncyCheckbox
						size={20}
						isChecked={isChecked}
						onPress={(value) => {
							handleSelectChange(value);
						}}
						fillColor={Colors.bgButton}
						iconStyle={{ borderRadius: 5 }}
						innerIconStyle={{
							borderWidth: 1.5,
							borderColor: isChecked ? Colors.bgButton : Colors.white,
							borderRadius: 5,
							opacity: 1
						}}
						textStyle={{ fontFamily: 'JosefinSans-Regular' }}
					/>
				</View>
			</View>
		</TouchableOpacity>
	);
}

export default React.memo(ForwardMessageItem);
