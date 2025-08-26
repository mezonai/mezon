import { size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import FastImage from 'react-native-fast-image';
import { IForwardIObject } from '..';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
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
						<Text
							style={{
								textAlign: 'center'
							}}
						>
							{item?.name?.charAt(0)?.toUpperCase()}
						</Text>
					</View>
				);
			case ChannelType.CHANNEL_TYPE_GROUP:
				return (
					<View style={styles.groupAvatar}>
						<MezonIconCDN icon={IconCDN.userGroupIcon} />
					</View>
				);
			case ChannelType.CHANNEL_TYPE_CHANNEL:
				return (
					<View style={{ width: size.s_16, height: size.s_34, justifyContent: 'center' }}>
						<Text
							style={{
								fontSize: verticalScale(20),
								textAlign: 'center',
								color: themeValue.white
							}}
						>
							#
						</Text>
					</View>
				);
			case ChannelType.CHANNEL_TYPE_THREAD:
				return (
					<View style={{ width: size.s_16, height: size.s_34, justifyContent: 'center' }}>
						<MezonIconCDN icon={IconCDN.threadIcon} width={16} height={16} color={themeValue.white} />
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
						<Text
							style={{
								color: themeValue.textStrong
							}}
							numberOfLines={1}
						>{`${item.name} (${item.clanName})`}</Text>
					) : (
						<Text
							style={{
								color: themeValue.textStrong
							}}
							numberOfLines={1}
						>
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
						fillColor={'#5865f2'}
						iconStyle={{ borderRadius: 5 }}
						innerIconStyle={{
							borderWidth: 1.5,
							borderColor: isChecked ? '#5865f2' : themeValue.white,
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
