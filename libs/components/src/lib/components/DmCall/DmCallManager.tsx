import { WebrtcSignalingType } from 'mezon-js';
import { memo } from 'react';
import DmCalling from '../DmCalling';
import ModalCall from '../ModalCall';
import { useDmCall } from './hooks';

export interface DmCallManagerProps {
	userId: string;
	directId?: string;
}

export const DmCallManager = memo(({ userId, directId }: DmCallManagerProps) => {
	const { isPlayRingTone, isInAnyCall, dataCall, groupCallId, triggerCall, clearCallState, dmCallingRef } = useDmCall({ userId });

	return (
		<>
			{isPlayRingTone &&
				!!dataCall &&
				!isInAnyCall &&
				directId !== dataCall?.channel_id &&
				dataCall?.data_type === WebrtcSignalingType.WEBRTC_SDP_OFFER && (
					<ModalCall dataCall={dataCall} userId={userId} triggerCall={triggerCall} clearCallState={clearCallState} />
				)}

			{/* check length make sure groupCallId valid */}
			<DmCalling ref={dmCallingRef} dmGroupId={!!groupCallId && groupCallId?.length > 1 ? groupCallId : directId} directId={directId || ''} />
		</>
	);
});

DmCallManager.displayName = 'DmCallManager';
