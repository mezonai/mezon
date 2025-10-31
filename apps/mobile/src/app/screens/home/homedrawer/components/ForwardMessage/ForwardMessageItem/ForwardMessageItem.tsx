import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import ImageNative from 'apps/mobile/src/app/components/ImageNative';
import { ChannelType } from 'mezon-js';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import FastImage from 'react-native-fast-image';
import type { IForwardIObject } from '..';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import { style } from '../styles';
import { getCheckboxInnerIconStyle, style as localStyles } from './ForwardMessageItem.styles';

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
	const styles = style(themeValue);
	const componentStyles = localStyles(themeValue);
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
					<View style={styles.memberAvatarDefaultContainer}>
						<Text style={styles.memberAvatarDefaultText}>{item?.name?.charAt(0)?.toUpperCase()}</Text>
					</View>
				);
			case ChannelType.CHANNEL_TYPE_GROUP:
				return item?.avatar && !item?.avatar?.includes('avatar-group.png') ? (
					<View style={styles.groupAvatarContainer}>
						<ImageNative url={createImgproxyUrl(item?.avatar ?? '')} style={componentStyles.imageFullSize} resizeMode={'cover'} />
					</View>
				) : (
					<View style={styles.groupAvatarDefaultContainer}>
						<MezonIconCDN icon={IconCDN.userGroupIcon} width={size.s_16} height={size.s_16} color={themeValue.white} />
					</View>
				);
			case ChannelType.CHANNEL_TYPE_CHANNEL:
				return (
					<View style={styles.iconTextContainer}>
						<Text style={componentStyles.channelHashText}>#</Text>
					</View>
				);
			case ChannelType.CHANNEL_TYPE_THREAD:
				return (
					<View style={styles.iconTextContainer}>
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
			<View style={styles.renderContentContainer}>
				<View>{renderAvatar(item)}</View>
				<View style={componentStyles.nameContainer}>
					{item.type === ChannelType.CHANNEL_TYPE_CHANNEL ? (
						<Text style={componentStyles.nameText} numberOfLines={1}>{`${item.name} (${item.clanName})`}</Text>
					) : (
						<Text style={componentStyles.nameText} numberOfLines={1}>
							{item.name}
						</Text>
					)}
				</View>
				<View style={componentStyles.checkboxContainer}>
					<BouncyCheckbox
						size={size.s_20}
						isChecked={isChecked}
						onPress={(value) => {
							handleSelectChange(value);
						}}
						fillColor={baseColor.bgButtonPrimary}
						iconStyle={componentStyles.checkboxIconStyle}
						innerIconStyle={getCheckboxInnerIconStyle(isChecked, themeValue)}
						textStyle={{ fontFamily: 'JosefinSans-Regular' }}
					/>
				</View>
			</View>
		</TouchableOpacity>
	);
}

export default React.memo(ForwardMessageItem);
