import { selectCurrentUserId, selectIncomingCallData, selectIsShowIncomingGroupCall, selectIsVideoGroupCall } from '@mezon/store';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { GroupCallComponent, GroupPopupNotiCall } from '.';

const GroupCallManager = memo(
	() => {
		const userId = useSelector(selectCurrentUserId);
		const isShowIncomingGroupCall = useSelector(selectIsShowIncomingGroupCall);
		const incomingCallData = useSelector(selectIncomingCallData);
		const isVideoGroupCall = useSelector(selectIsVideoGroupCall);

		return (
			<>
				<GroupCallComponent />
				{isShowIncomingGroupCall && <GroupPopupNotiCall dataCall={incomingCallData} userId={userId} />}
			</>
		);
	},
	() => true
);

GroupCallManager.displayName = 'GroupCallManager';

export default GroupCallManager;
