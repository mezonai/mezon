import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { size, useTheme } from '@mezon/mobile-ui';
import { RolesClanEntity } from '@mezon/store-mobile';
import { UsersClanEntity } from '@mezon/utils';
import Backdrop from 'apps/mobile/src/app/components/BottomSheetRootListener/backdrop';
import { RefObject, memo } from 'react';
import { AddMemberBsContent } from './AddMemberBsContent';

interface IAddMemberBSProps {
	memberList?: UsersClanEntity[];
	role?: RolesClanEntity;
	onClose?: () => void;
	bottomSheetRef: RefObject<BottomSheetModal>;
}

export const AddMemberBS = memo((props: IAddMemberBSProps) => {
	const { memberList = [], role, onClose, bottomSheetRef } = props;
	const { themeValue } = useTheme();
	return (
		<BottomSheetModal
			ref={bottomSheetRef}
			snapPoints={['90%']}
			style={{
				borderTopLeftRadius: size.s_14,
				borderTopRightRadius: size.s_14,
				overflow: 'hidden'
			}}
			backdropComponent={Backdrop}
			backgroundStyle={{ backgroundColor: themeValue.primary }}
		>
			<AddMemberBsContent memberList={memberList} role={role} onClose={onClose} />
		</BottomSheetModal>
	);
});
