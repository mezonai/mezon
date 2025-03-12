import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { size, useTheme } from '@mezon/mobile-ui';
import { memo, useCallback } from 'react';
import { Dimensions } from 'react-native';
import Backdrop from '../../../../components/BottomSheetRootListener/backdrop';
import useTabletLandscape from '../../../../hooks/useTabletLandscape';
import { IAddMemberOrRoleBSProps } from '../../types/channelPermission.type';
import { AddMemberOrRoleContent } from './AddMemberOrRoleContent';

const marginWidth = Dimensions.get('screen').width * 0.3;

export const AddMemberOrRoleBS = memo(({ bottomSheetRef, channel }: IAddMemberOrRoleBSProps) => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();

	const onDismiss = useCallback(() => {
		bottomSheetRef.current?.dismiss();
	}, [bottomSheetRef]);

	return (
		<BottomSheetModal
			ref={bottomSheetRef}
			snapPoints={['85%']}
			style={{
				borderTopLeftRadius: size.s_14,
				borderTopRightRadius: size.s_14,
				overflow: 'hidden',
				marginHorizontal: isTabletLandscape ? marginWidth : 0
			}}
			backdropComponent={Backdrop}
			backgroundStyle={{ backgroundColor: themeValue.primary }}
		>
			<AddMemberOrRoleContent channel={channel} onDismiss={onDismiss} />
		</BottomSheetModal>
	);
});
