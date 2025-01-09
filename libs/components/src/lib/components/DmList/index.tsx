import { useFriends, useIdleRender } from '@mezon/core';
import { selectDirectsOpenlistOrder, selectTheme } from '@mezon/store';
import { Icons } from '@mezon/ui';
import Tippy from '@tippy.js/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import CreateMessageGroup from './CreateMessageGroup';
import ListDMChannel from './listDMChannel';

export type ChannelListProps = { className?: string };
export type CategoriesState = Record<string, boolean>;

function DirectMessageList() {
	const dmGroupChatList = useSelector(selectDirectsOpenlistOrder);
	const appearanceTheme = useSelector(selectTheme);
	const { quantityPendingRequest } = useFriends();

	const shouldRender = useIdleRender();

	if (!shouldRender) return null;

	return (
		<>
			<div className="mt-5 px-2 py-1">
				<div className="w-full flex flex-row items-center">
					<FriendsButton navigateToFriend={dmGroupChatList?.length === 0} />
					{quantityPendingRequest > 0 ? (
						<div className="absolute w-[16px] h-[16px] rounded-full bg-colorDanger text-[#fff] font-bold text-[9px] flex items-center justify-center right-[25px]">
							{quantityPendingRequest}
						</div>
					) : null}
				</div>

				<div className="text-xs font-semibold tracking-wide left-sp dark:text-[#AEAEAE] text-[#585858] mt-6 flex flex-row items-center w-full justify-between px-2 pb-0 h-5 cursor-default dark:hover:text-white hover:text-black">
					<p>DIRECT MESSAGES</p>
					<CreateMessageGroupModal />
				</div>
			</div>
			<div className={`flex-1 font-medium text-gray-300 pl-2 h-2/3`}>
				<div className="flex flex-col gap-1 text-[#AEAEAE] text-center relative">
					<ListDMChannel listDM={dmGroupChatList} />
				</div>
			</div>
		</>
	);
}

const CreateMessageGroupModal = memo(
	() => {
		const [isOpen, setIsOpen] = useState<boolean>(false);
		const buttonPlusRef = useRef<HTMLDivElement | null>(null);
		const appearanceTheme = useSelector(selectTheme);

		const onClickOpenModal = () => {
			setIsOpen(!isOpen);
		};

		const handleCloseModal = useCallback(() => {
			setIsOpen(false);
		}, []);

		return (
			<div
				ref={buttonPlusRef}
				onClick={onClickOpenModal}
				className="relative cursor-pointer flex flex-row justify-end ml-0 dark:hover:bg-bgSecondary hover:bg-bgLightMode rounded-full whitespace-nowrap"
			>
				<Tippy content="Create DM" className={`${appearanceTheme === 'light' ? 'tooltipLightMode' : 'tooltip'}`}>
					<span>
						<Icons.Plus className="w-4 h-4" />
					</span>
				</Tippy>
				{isOpen && <CreateMessageGroup onClose={handleCloseModal} isOpen={isOpen} rootRef={buttonPlusRef} />}
			</div>
		);
	},
	() => true
);

const FriendsButton = memo(({ navigateToFriend }: { navigateToFriend: boolean }) => {
	const navigate = useNavigate();
	const pathname = useLocation().pathname;

	useEffect(() => {
		if (navigateToFriend) {
			navigate('/chat/direct/friends');
		}
	}, [navigateToFriend, navigate]);

	return (
		<button
			className={`py-2 px-3 rounded-[4px] dark:text-white text-black w-full flex gap-4 items-center ${pathname.includes('friends') ? 'dark:bg-bgModifierHover bg-[#F7F7F7]' : ''}`}
			onClick={() => {
				navigate('/chat/direct/friends');
			}}
		>
			<Icons.IconFriends />
			Friends
		</button>
	);
});

export default memo(DirectMessageList, () => true);
