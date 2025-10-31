import {
	channelsActions,
	selectAllChannels,
	selectCurrentChannelId,
	selectCurrentChannelType,
	selectCurrentClanBanner,
	selectCurrentClanId,
	selectLastMessageByChannelId,
	selectMembersClanCount,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { TypeMessage, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { ReactNode } from 'react';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import ModalInvite from '../ListMemberInvite/modalInvite';
export type OnBoardWelcomeProps = {
	nextMessageId?: string;
};

export function OnBoardWelcome({ nextMessageId }: OnBoardWelcomeProps) {
	const { t } = useTranslation('chatWelcome');
	const numberMemberClan = useAppSelector(selectMembersClanCount);
	const numberChannel = useSelector(selectAllChannels);
	const currentChannelObjectId = useSelector(selectCurrentChannelId);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanBanner = useSelector(selectCurrentClanBanner);
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, currentChannelObjectId as string));
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
		dispatch(channelsActions.openCreateNewModalChannel({ isOpen: true, clanId: currentClanId as string }));
	};

	useEffect(() => {
		if (nextMessageId) {
			// closeHighLight();
		}
	}, [nextMessageId]);

	return (
		<div className="w-full p-4 mb-0  flex-1 flex flex-col items-center gap-2">
			{currentChannelType === ChannelType.CHANNEL_TYPE_APP ? (
				<div className="w-[400px] p-4 bg-item-theme rounded-lg">
					{currentClanBanner ? (
						<img src={currentClanBanner} />
					) : (
						<div className="w-full h-28 font-bold text-2xl text-theme-primary rounded-lg flex items-center justify-center">
							<p className="[text-shadow:_0_1px_2px_#ffffff]">{t('onboard.clickLaunchToStart')}</p>
						</div>
					)}
				</div>
			) : (
				<>
					<Onboarditem
						icon={<Icons.AddPerson />}
						title={t('onboard.inviteFriends')}
						tick={numberMemberClan > 1}
						onClick={openInviteClanModal}
					/>
					<Onboarditem icon={<Icons.Sent />} title={t('onboard.sendFirstMessage')} tick={checkLastMessage} onClick={handleSendMessage} />
					<Onboarditem icon={<Icons.Download />} title={t('onboard.downloadApp')} tick={true} onClick={handleSendMessage} />
					<Onboarditem
						icon={<Icons.Hashtag />}
						title={t('onboard.createChannel')}
						tick={numberChannel.length > 1}
						onClick={handleCreateChannel}
					/>
				</>
			)}
		</div>
	);
}

const Onboarditem = memo(({ icon, title, tick, onClick }: { icon: ReactNode; title: string; tick: boolean; onClick: () => void }) => {
	const handleOnClickItem = () => {
		if (!tick) {
			onClick();
		}
	};
	return (
		<div
			className="w-[400px] gap-4 h-[72px] items-center flex p-4 text-sm font-semibold text-theme-primary-active text-theme-primary-hover bg-item-hover bg-item-theme rounded-lg hover:cursor-pointer"
			onClick={handleOnClickItem}
			data-e2e={generateE2eId('onboarding.chat.guide_sections')}
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
});
