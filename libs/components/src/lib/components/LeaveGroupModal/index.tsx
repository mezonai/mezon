import type { DirectEntity } from '@mezon/store';
import {
	channelMembersActions,
	directActions,
	directMetaActions,
	getStore,
	selectAllAccount,
	selectDmGroupCurrentId,
	selectLatestMessageId,
	useAppDispatch
} from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface LeaveGroupModalProps {
	onClose: () => void;
	groupWillBeLeave: DirectEntity;
	navigateToFriends: () => void;
}

function LeaveGroupModal({ groupWillBeLeave, onClose, navigateToFriends }: LeaveGroupModalProps) {
	const { t } = useTranslation('leaveGroup');
	const [isChecked, setIsChecked] = useState(false);
	const [isshowcheckbox, setIsShowCheckbox] = useState(false);
	const dispatch = useAppDispatch();
	const currentDmGroupId = useSelector(selectDmGroupCurrentId);
	const userProfile = useSelector(selectAllAccount);
	const handleCheckboxChange = () => {
		setIsChecked(!isChecked);
	};

	const handleLeaveAndClose = async (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		if (groupWillBeLeave.channel_id) {
			await dispatch(
				channelMembersActions.removeMemberChannel({
					channelId: groupWillBeLeave.channel_id,
					userIds: [userProfile?.user?.id || ''],
					kickMember: false
				})
			);
			dispatch(directActions.remove(groupWillBeLeave.channel_id));
			const timestamp = Date.now() / 1000;
			const store = getStore();
			const messageId = store ? selectLatestMessageId(store.getState(), groupWillBeLeave.channel_id) : undefined;
			dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: groupWillBeLeave.channel_id, timestamp, messageId }));
			if (groupWillBeLeave.channel_id === currentDmGroupId) {
				dispatch(directActions.setDmGroupCurrentId(''));
				navigateToFriends();
			}
		}
		onClose();
	};

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="fixed inset-0 bg-black opacity-80"></div>
			<form className="relative z-10 dark:bg-[#313338] bg-bgLightModeSecond rounded-[5px] w-[500px]">
				<div className="top-block p-[16px] dark:text-textDarkTheme text-textLightTheme flex flex-col gap-[15px]">
					<div className="text-xl font-semibold break-words whitespace-normal overflow-wrap-break-word">
						{t('title', { groupName: groupWillBeLeave?.channel_label })}
					</div>
					<div className="text-lg break-all">{t('confirmMessage', { groupName: groupWillBeLeave?.channel_label })}</div>

					{isshowcheckbox && (
						<div className="flex items-center gap-[10px]">
							<input
								type="checkbox"
								id="confirmLeaveNoNotifying"
								checked={isChecked}
								onChange={handleCheckboxChange}
								className="h-4 w-4"
							/>
							<label htmlFor="confirmLeaveNoNotifying" className="text-sm">
								{t('leaveWithoutNotifying')}
							</label>
						</div>
					)}
				</div>
				<div className="bottom-block flex justify-end p-[16px]  items-center gap-[20px] font-semibold rounded-[5px]">
					<div onClick={onClose} className=" cursor-pointer hover:underline text-theme-primary">
						{t('cancel')}
					</div>
					<div
						onClick={handleLeaveAndClose}
						className="bg-[#da373c] text-white hover:bg-[#a12828] rounded-md px-4 py-2 cursor-pointer"
						data-e2e={generateE2eId(`chat.direct_message.leave_group.button`)}
					>
						{t('leaveGroup')}
					</div>
				</div>
			</form>
		</div>
	);
}

export default LeaveGroupModal;
