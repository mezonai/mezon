import { useAppNavigation, useOnClickOutside } from '@mezon/core';
import type { EventManagementEntity, RootState } from '@mezon/store';
import {
	eventManagementActions,
	selectChannelById,
	selectChooseEvent,
	selectCurrentClanLogo,
	selectCurrentClanName,
	selectMemberClanByUserId,
	selectMembersByUserIds,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { timeFomat } from '../timeFomatEvent';

enum tabs {
	event = 'Events',
	interest = 'Interested'
}

type ModalDetailItemEventProps = {
	onCloseAll?: () => void;
};

const ModalDetailItemEvent = (props?: ModalDetailItemEventProps) => {
	const { onCloseAll } = props || {};
	const [currentTab, setCurrentTab] = useState('Events');
	const event = useSelector(selectChooseEvent);
	const dispatch = useAppDispatch();
	const { t } = useTranslation('eventCreator');

	const clearChooseEvent = useCallback(() => {
		dispatch(eventManagementActions.setChooseEvent(null));
		dispatch(eventManagementActions.showModalDetailEvent(false));
	}, [dispatch]);

	const panelRef = useRef(null);
	const modalRef = useRef<HTMLDivElement>(null);
	useOnClickOutside(panelRef, clearChooseEvent);

	useEffect(() => {
		if (modalRef.current) {
			modalRef.current.focus();
		}
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			clearChooseEvent();
		}
	};

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			onKeyDown={handleKeyDown}
			className="outline-none w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
		>
			<div
				ref={panelRef}
				className="w-[600px] min-h-[400px] max-h-[600px] rounded-lg overflow-hidden text-base bg-theme-setting-primary text-theme-primary"
				data-e2e={generateE2eId('clan_page.modal.create_event.event_management.item.modal_detail_item')}
			>
				{event?.logo && <img src={event?.logo} alt={event?.title} className="w-full h-44 object-cover" />}
				<div className="flex justify-between items-center pt-4 border-b font-bold  cursor-pointer ">
					<div className="flex items-center gap-x-4 ml-4">
						<div className="gap-x-6 flex items-center">
							<h4
								className={`pb-4 ${currentTab === tabs.event ? 'text-theme-primary-active border-b border-white' : 'text-zinc-400'}`}
								onClick={() => setCurrentTab(tabs.event)}
							>
								{t('eventDetail.eventInfo')}
							</h4>
							<h4
								className={`pb-4 ${currentTab === tabs.interest ? 'text-theme-primary-active border-b border-white' : 'text-zinc-400'}`}
								onClick={() => setCurrentTab(tabs.interest)}
							>
								{t('eventDetail.interested', { count: event?.user_ids?.length || 0 })}
							</h4>
						</div>
					</div>
					<span
						className=" leading-3  mr-4 -mt-[14px] text-theme-primary-active hover:text-red-500 cursor-pointer"
						onClick={() => clearChooseEvent()}
						data-e2e={generateE2eId('clan_page.modal.create_event.event_management.item.button.close_detail_modal')}
					>
						✕
					</span>
				</div>
				{currentTab === tabs.event && <EventInfoDetail event={event} onClose={clearChooseEvent} onCloseAll={onCloseAll} />}
				{currentTab === tabs.interest && <InterestedDetail userIds={event?.user_ids || []} />}
			</div>
		</div>
	);
};

export default ModalDetailItemEvent;

type EventInfoDetailProps = {
	event: EventManagementEntity | null;
	onClose: () => void;
	onCloseAll?: () => void;
};

const EventInfoDetail = (props: EventInfoDetailProps) => {
	const { event, onClose, onCloseAll } = props;
	const { t } = useTranslation('eventCreator');
	const channelVoice = useAppSelector((state) => selectChannelById(state, event?.channel_voice_id ?? '')) || {};

	const currentClanLogo = useSelector(selectCurrentClanLogo);
	const currentClanName = useSelector(selectCurrentClanName);
	const avatarClan = currentClanName?.charAt(0).toUpperCase();
	const userCreate = useAppSelector((state) => selectMemberClanByUserId(state, event?.creator_id || ''));
	const time = useMemo(() => timeFomat(event?.start_time || ''), [event?.start_time]);

	const { toChannelPage, navigate } = useAppNavigation();

	const hasAddress = !!event?.address;
	const hasVoiceChannel = !!event?.channel_voice_id && !!channelVoice?.channel_id;
	const isPrivateEvent = event?.is_private;

	const handleStopPropagation = (e: any) => {
		e.stopPropagation();
	};

	const redirectToVoice = () => {
		if (channelVoice && channelVoice.channel_id) {
			const channelUrl = toChannelPage(channelVoice.channel_id as string, channelVoice.clan_id as string);
			navigate(channelUrl);
			onClose();
			if (onCloseAll) {
				onCloseAll();
			}
		}
	};
	const avatarDefault = userCreate?.clan_avatar || userCreate?.user?.avatar_url;
	const avatarLetter = (userCreate?.clan_nick || userCreate?.user?.display_name || userCreate?.user?.username)?.trim().charAt(0).toUpperCase();

	return (
		<div className="px-4 py-8 space-y-2 text-theme-primary max-h-[370px] h-fit hide-scrollbar overflow-auto">
			<h4
				className="font-semibold inline-flex gap-x-3"
				data-e2e={generateE2eId('clan_page.modal.create_event.event_management.item.modal_detail_item.start_date_time')}
			>
				<Icons.IconEvents />
				{time}
			</h4>
			<p
				className="font-bold text-theme-primary-active text-lg"
				data-e2e={generateE2eId('clan_page.modal.create_event.event_management.item.modal_detail_item.topic')}
			>
				{event?.title}
			</p>
			<div className="flex items-center gap-x-3">
				{currentClanLogo ? (
					<img src={currentClanLogo} alt={currentClanName} className="size-5 rounded-full" />
				) : (
					<div className="size-5 bg-bgAvatarDark rounded-full flex justify-center items-center text-bgAvatarLight text-lg font-bold">
						{avatarClan}
					</div>
				)}
				<p className="hover:underline">{currentClanName}</p>
			</div>
			<div
				className="flex items-center gap-x-3 "
				data-e2e={generateE2eId('clan_page.modal.create_event.event_management.item.modal_detail_item.channel_name')}
			>
				{(() => {
					if (hasAddress) {
						return (
							<>
								<Icons.Location />
								<p>{event?.address}</p>
							</>
						);
					}

					if (hasVoiceChannel && !isPrivateEvent) {
						const linkProps = {
							onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
								handleStopPropagation(e);
								redirectToVoice();
							}
						};
						return (
							<a {...linkProps} className="flex gap-x-3 cursor-pointer items-center">
								<Icons.Speaker />
								<p className="hover:underline">{channelVoice?.channel_label}</p>
							</a>
						);
					}

					if (isPrivateEvent) {
						return (
							<>
								<Icons.SpeakerLocked />
								<p>{t('eventDetail.privateRoom')}</p>
							</>
						);
					}

					return (
						<>
							<Icons.Location />
							<p className="hover:underline">No location specified</p>
						</>
					);
				})()}
			</div>
			<div className="flex items-center gap-x-3">
				<Icons.MemberList />
				<p>{t('eventDetail.personInterested', { count: event?.user_ids?.length || 0 })}</p>
			</div>
			<div className="flex items-center gap-x-3">
				{avatarDefault ? (
					<img
						src={createImgproxyUrl(avatarDefault)}
						alt={userCreate?.clan_nick || userCreate?.user?.username}
						className="size-5 rounded-full object-cover"
					/>
				) : (
					<div className="size-5 bg-bgAvatarDark rounded-full flex justify-center items-center text-bgAvatarLight text-lg ">
						{avatarLetter || '?'}
					</div>
				)}
				<p>{t('eventDetail.createdBy', { username: userCreate?.clan_nick || userCreate?.user?.username })}</p>
			</div>
			<div className="break-all" data-e2e={generateE2eId('clan_page.modal.create_event.event_management.item.modal_detail_item.description')}>
				{event?.description}
			</div>
		</div>
	);
};

type InterestedDetailProps = {
	userIds: Array<string>;
};

const InterestedDetail = ({ userIds }: InterestedDetailProps) => {
	const userData = useSelector((state: RootState) => selectMembersByUserIds(state, userIds));
	const { t } = useTranslation('eventCreator');

	return (
		<div className="p-4 space-y-1 dark:text-zinc-300 text-colorTextLightMode text-base font-semibold max-h-[250px] h-[250px] hide-scrollbar overflow-auto">
			{userData.map((user, index) => {
				const name = user?.clan_nick || user?.user?.display_name || user?.user?.username;
				const avatarUrl = user?.clan_avatar || user?.user?.avatar_url;
				const avatarLetter = name?.trim().charAt(0).toUpperCase();

				return (
					<div key={index} className="flex items-center gap-x-3 rounded bg-item-theme-hover p-2">
						{avatarUrl ? (
							<img src={createImgproxyUrl(avatarUrl)} alt={name} className="size-7 rounded-full object-cover" />
						) : (
							<div className="size-7 bg-bgAvatarDark rounded-full flex justify-center items-center text-bgAvatarLight">
								{avatarLetter || '?'}
							</div>
						)}
						<p className="text-theme-primary">{name}</p>
					</div>
				);
			})}
		</div>
	);
};
