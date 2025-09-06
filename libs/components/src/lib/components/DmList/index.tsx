import { useFriends } from '@mezon/core';
import { appActions, selectDirectsOpenlistOrder, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { memo, useEffect, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import CreateMessageGroup from './CreateMessageGroup';
import ListDMChannel from './listDMChannel';

export type ChannelListProps = { className?: string };
export type CategoriesState = Record<string, boolean>;

function DirectMessageList() {
	const dmGroupChatList = useSelector(selectDirectsOpenlistOrder);
	const { quantityPendingRequest } = useFriends();
	return (
		<>
			<div className="mt-5 px-2 py-1">
				<div className="w-full flex flex-row items-center">
					<FriendsButton navigateToFriend={dmGroupChatList?.length === 0} />
					{quantityPendingRequest > 0 ? (
						<div className="absolute w-[16px] h-[16px] rounded-full bg-colorDanger text-[#fff] font-bold flex items-center justify-center right-[25px]">
							<div className="text-[9px] leading-[9px]">{quantityPendingRequest}</div>
						</div>
					) : null}
				</div>

				<div className="text-xs font-semibold tracking-wide left-sp text-theme-primary mt-6 flex flex-row items-center w-full justify-between px-2 pb-0 h-5 cursor-default text-theme-primary-hover">
					<p>DIRECT MESSAGES</p>
					<CreateMessageGroupModal />
				</div>
			</div>
			<div className={`flex-1 font-medium  px-2`}>
				<div className="flex flex-col gap-1 text-center relative">
					<ListDMChannel listDM={dmGroupChatList} />
				</div>
			</div>
		</>
	);
}
const CreateMessageGroupModal = memo(
	() => {
		const buttonPlusRef = useRef<HTMLDivElement | null>(null);

		const [openCreateMessageGroup, closeCreateMessageGroup] = useModal(
			() => (
				<div className="fixed inset-0 flex items-center justify-center z-50">
					<div className="absolute inset-0 bg-black bg-opacity-80" />
					<CreateMessageGroup
						onClose={closeCreateMessageGroup}
						isOpen={true}
						rootRef={buttonPlusRef}
						classNames="relative" // Remove absolute positioning
					/>
				</div>
			),
			[]
		);

		return (
			<div
				ref={buttonPlusRef}
				onClick={openCreateMessageGroup}
				className="relative cursor-pointer flex flex-row justify-end ml-0 dark:hover:bg-bgSecondary hover:bg-bgLightMode rounded-full whitespace-nowrap"
				data-e2e={generateE2eId('chat.direct_message.button.button_plus')}
			>
				<span title="Create DM">
					<Icons.Plus className="w-4 h-4" />
				</span>
			</div>
		);
	},
	() => true
);

const FriendsButton = memo(({ navigateToFriend }: { navigateToFriend: boolean }) => {
	const navigate = useNavigate();
	const pathname = useLocation().pathname;
	const dispatch = useAppDispatch();
	useEffect(() => {
		if (navigateToFriend) {
			navigate('/chat/direct/friends');
		}
	}, [navigateToFriend, navigate]);

	const handleOpenFriendList = async () => {
		dispatch(appActions.setStatusMenu(false));
		navigate('/chat/direct/friends');
	};

	return (
		<button
			className={`py-2 px-3 rounded-lg font-medium text-theme-primary-hover w-full flex gap-4 items-center ${pathname.includes('friends') ? 'text-theme-secondary bg-button-secondary' : 'text-theme-primary'}`}
			onClick={handleOpenFriendList}
		>
			<Icons.IconFriends />
			Friends
		</button>
	);
});

export default memo(DirectMessageList, () => true);
