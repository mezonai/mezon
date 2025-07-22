import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { memo } from 'react';
import { Text, View } from 'react-native';
import Backdrop from '../../../../components/BottomSheetRootListener/backdrop';
import { EAdvancedPermissionSetting } from '../../types/channelPermission.enum';
import { IAdvancedSettingBSProps } from '../../types/channelPermission.type';

export const AdvancedSettingBS = memo(({ bottomSheetRef, channel, currentAdvancedPermissionType }: IAdvancedSettingBSProps) => {
	const { themeValue } = useTheme();
	return (
		<BottomSheetModal
			ref={bottomSheetRef}
			snapPoints={['70%']}
			style={{
				borderTopLeftRadius: size.s_14,
				borderTopRightRadius: size.s_14,
				overflow: 'hidden'
			}}
			backdropComponent={Backdrop}
			backgroundStyle={{ backgroundColor: themeValue.primary }}
		>
			<View style={{ paddingHorizontal: size.s_14, flex: 1 }}>
				<Text
					style={{
						fontSize: verticalScale(18),
						marginLeft: 0,
						marginRight: 0,
						color: themeValue.white
					}}
				>
					{currentAdvancedPermissionType === EAdvancedPermissionSetting.AddMember ? 'Add Member' : 'Add role'}
				</Text>
				<Text
					style={{
						marginLeft: 0,
						marginRight: 0,
						color: themeValue.text
					}}
				>
					{'Updating...'}
				</Text>
				<BottomSheetScrollView>
					<View />
				</BottomSheetScrollView>
			</View>
		</BottomSheetModal>
	);
});
