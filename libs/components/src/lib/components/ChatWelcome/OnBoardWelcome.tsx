import { channelsActions, selectAllChannels, selectCurrentClanId, selectMembersClanCount, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ReactNode, useEffect } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import ModalInvite from '../ListMemberInvite/modalInvite';
export type OnBoardWelcomeProps = {
	nextMessageId?: string;
};

export function OnBoardWelcome({ nextMessageId }: OnBoardWelcomeProps) {
	const numberMemberClan = useAppSelector(selectMembersClanCount);
	const numberChannel = useSelector(selectAllChannels);
	const currentClanId = useSelector(selectCurrentClanId);

	const dispatch = useDispatch();
	const [openInviteClanModal, closeInviteClanModal] = useModal(() => <ModalInvite onClose={closeInviteClanModal} open={true} />);

	// const { openHighLight, closeHighLight } = useDriver();

	const handleSendMessage = () => {
		// openHighLight(EElementHightLight.MAIN_INPUT, undefined, 'Write content and press Enter to send message!');
	};

	const handleCreateChannel = () => {
		if (numberChannel.length < 1) {
			return;
		}
		dispatch(channelsActions.openCreateNewModalChannel({ isOpen: true, clanId: currentClanId as string }));
	};

	useEffect(() => {
		if (nextMessageId) {
			// closeHighLight();
		}
	}, [nextMessageId]);

	return (
		<div className="w-full p-4 mb-0  flex-1 flex flex-col items-center gap-2">
			<Onboarditem icon={<Icons.AddPerson />} title="Invite your friends" tick={numberMemberClan > 1} onClick={openInviteClanModal} />
			<Onboarditem icon={<Icons.Sent />} title="Send your first message" tick={!!nextMessageId} onClick={handleSendMessage} />
			<Onboarditem icon={<Icons.Download />} title="Download the Mezon App" tick={true} onClick={handleSendMessage} />
			<Onboarditem icon={<Icons.Hashtag />} title="Create your channel" tick={numberChannel.length > 1} onClick={handleCreateChannel} />
		</div>
	);
}

const Onboarditem = ({ icon, title, tick, onClick }: { icon: ReactNode; title: string; tick: boolean; onClick: () => void }) => {
	const handleOnClickItem = () => {
		if (!tick) {
			onClick();
		}
	};
	return (
		<div
			className="w-[400px] gap-4 h-[72px] items-center flex p-4 text-sm font-semibold bg-[#232428] hover:bg-[#393c41] rounded-lg"
			onClick={handleOnClickItem}
		>
			{icon}
			<div className="flex-1">{title}</div>
			{tick ? (
				<div className="flex items-center justify-center rounded-full aspect-square h-8 bg-green-600">
					<Icons.Tick fill="white" />
				</div>
			) : (
				<Icons.ArrowRight />
			)}
		</div>
	);
};
