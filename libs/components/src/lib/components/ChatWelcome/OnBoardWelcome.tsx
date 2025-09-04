import {
	channelsActions,
	selectAllChannels,
	selectCurrentChannel,
	selectCurrentClan,
	selectLastMessageByChannelId,
	selectMembersClanCount,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { TypeMessage, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { ReactNode, memo, useEffect, useMemo } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import ModalInvite from '../ListMemberInvite/modalInvite';
export type OnBoardWelcomeProps = {
	nextMessageId?: string;
};

export function OnBoardWelcome({ nextMessageId }: OnBoardWelcomeProps) {
	const numberMemberClan = useAppSelector(selectMembersClanCount);
	const numberChannel = useSelector(selectAllChannels);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentClan = useSelector(selectCurrentClan);
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, currentChannel?.id as string));
	const checkLastMessage = useMemo(() => {
		if (lastMessage?.code === TypeMessage.Indicator) {
			return false;
		}
		return true;
	}, [lastMessage]);

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
		dispatch(channelsActions.openCreateNewModalChannel({ isOpen: true, clanId: currentClan?.id as string }));
	};

	useEffect(() => {
		if (nextMessageId) {
			// closeHighLight();
		}
	}, [nextMessageId]);

	return (
		<div className="w-full p-4 mb-0  flex-1 flex flex-col items-center gap-2">
			{currentChannel?.type === ChannelType.CHANNEL_TYPE_APP ? (
				<div className="w-[400px] p-4 bg-item-theme rounded-lg">
					{currentClan?.banner ? (
						<img src={currentClan?.banner} />
					) : (
						<div className="w-full h-28 font-bold text-2xl text-theme-primary rounded-lg flex items-center justify-center">
							<p className="[text-shadow:_0_1px_2px_#ffffff]">Click Launch App To Start</p>
						</div>
					)}
				</div>
			) : (
				<>
					<Onboarditem
						icon={<Icons.AddPerson />}
						title="Invite your friends"
						tick={numberMemberClan > 1}
						onClick={openInviteClanModal}
						dataE2E={generateE2eId('onboarding.chat.container.invite_member')}
					/>
					<Onboarditem
						icon={<Icons.Sent />}
						title="Send your first message"
						tick={checkLastMessage}
						onClick={handleSendMessage}
						dataE2E={generateE2eId('onboarding.chat.container.send_first_message')}
					/>
					<Onboarditem
						icon={<Icons.Download />}
						title="Download the Mezon App"
						tick={true}
						onClick={handleSendMessage}
						dataE2E={generateE2eId('onboarding.chat.container.download_app')}
					/>
					<Onboarditem
						icon={<Icons.Hashtag />}
						title="Create your channel"
						tick={numberChannel.length > 1}
						onClick={handleCreateChannel}
						dataE2E={generateE2eId('onboarding.chat.container.create_channel')}
					/>
				</>
			)}
		</div>
	);
}

const Onboarditem = memo(
	({ icon, title, tick, onClick, dataE2E }: { icon: ReactNode; title: string; tick: boolean; onClick: () => void; dataE2E?: string }) => {
		const handleOnClickItem = () => {
			if (!tick) {
				onClick();
			}
		};
		return (
			<div
				className="w-[400px] gap-4 h-[72px] items-center flex p-4 text-sm font-semibold text-theme-primary-active text-theme-primary-hover bg-item-hover bg-item-theme rounded-lg hover:cursor-pointer"
				onClick={handleOnClickItem}
				data-e2e={dataE2E}
			>
				{icon}
				<div className="flex-1 ">{title}</div>
				{tick ? (
					<div className="flex items-center justify-center rounded-full aspect-square h-8 bg-green-600">
						<Icons.Tick fill="white" />
					</div>
				) : (
					<Icons.ArrowRight />
				)}
			</div>
		);
	}
);
