import { useAuth, useChannelMembersActions, usePermissionChecker } from '@mezon/core';
import {
	categoriesActions,
	clansActions,
	hasGrandchildModal,
	selectCurrentClan,
	selectCurrentClanId,
	selectCurrentVoiceChannelId,
	selectInviteChannelId,
	selectInviteClanId,
	selectInvitePeopleStatus,
	selectIsShowEmptyCategory,
	settingClanStickerActions,
	useAppDispatch
} from '@mezon/store';
import { EPermission } from '@mezon/utils';
import { ApiCreateCategoryDescRequest } from 'mezon-js/api.gen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ClanSetting from '../ClanSettings';
import { ItemSetting } from '../ClanSettings/ItemObj';
import ModalInvite from '../ListMemberInvite/modalInvite';
import ModalConfirm from '../ModalConfirm';
import ModalNotificationSetting from '../NotificationSetting';
import SearchModal from '../SearchModal';
import Header from './Header';
import ModalCreateCategory from './ModalCreateCategory';
import ModalPanel from './ModalPanel';

export type ClanHeaderProps = {
	name?: string;
	type: string;
	bannerImage?: string;
};

function ClanHeader({ name, type, bannerImage }: ClanHeaderProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const modalRef = useRef<HTMLDivElement | null>(null);
	const dispatch = useAppDispatch();
	const params = useParams();
	const currentClanId = useSelector(selectCurrentClanId);
	const [isClanOwner, canManageClan] = usePermissionChecker([EPermission.clanOwner, EPermission.manageClan]);
	const { removeMemberClan } = useChannelMembersActions();
	const { userProfile } = useAuth();
	const currentChannelId = useSelector(selectCurrentVoiceChannelId);
	const currentClan = useSelector(selectCurrentClan);
	const navigate = useNavigate();
	const [openSearchModal, closeSearchModal] = useModal(() => <SearchModal onClose={closeSearchModal} open={true} />);

	const [openCreateCate, setOpenCreateCate] = useState(false);
	const [openServerSettings, setOpenServerSettings] = useState(false);
	const [isShowModalPanelClan, setIsShowModalPanelClan] = useState<boolean>(false);
	const hasChildModal = useSelector(hasGrandchildModal);
	const hasChildModalRef = useRef(false);
	if (hasChildModal) {
		hasChildModalRef.current = true;
	} else {
		hasChildModalRef.current = false;
	}
	const [openNotiSettingModal, closeNotiSettingModal] = useModal(() => <ModalNotificationSetting onClose={closeNotiSettingModal} open={true} />);

	const handleShowNotificationSetting = () => {
		openNotiSettingModal();
		setIsShowModalPanelClan(false);
	};

	const isShowEmptyCategory = useSelector(selectIsShowEmptyCategory);
	const [isShowLeaveClanPopup, setIsShowLeaveClanPopup] = useState(false);
	const toggleLeaveClanPopup = () => {
		setIsShowLeaveClanPopup(!isShowLeaveClanPopup);
		setIsShowModalPanelClan(false);
	};

	const onClose = () => {
		setOpenCreateCate(false);
	};

	const handleCreateCate = async (nameCate: string) => {
		const body: ApiCreateCategoryDescRequest = {
			clan_id: currentClanId?.toString(),
			category_name: nameCate
		};
		await dispatch(categoriesActions.createNewCategory(body));
		onClose();
	};

	const handleInputFocus = () => {
		openSearchModal();
		inputRef.current?.blur();
	};

	const handleShowModalClan = useCallback(() => {
		setIsShowModalPanelClan(!isShowModalPanelClan);
	}, [isShowModalPanelClan]);

	const handleShowCreateCategory = () => {
		setOpenCreateCate(true);
		setIsShowModalPanelClan(false);
	};

	const handleShowInviteClanModal = () => {
		dispatch(clansActions.toggleInvitePeople({ status: true }));
		setIsShowModalPanelClan(false);
	};

	const handleShowServerSettings = () => {
		openServerSettingsModal();
		setIsShowModalPanelClan(false);
	};

	const closeModalClan = useCallback(() => {
		setIsShowModalPanelClan(false);
	}, []);

	const handleLeaveClan = async () => {
		await removeMemberClan({ channelId: currentChannelId, clanId: currentClan?.clan_id as string, userIds: [userProfile?.user?.id as string] });
		toggleLeaveClanPopup();
		navigate('/chat/direct/friends');
	};

	const toggleShowEmptyCategory = () => {
		if (isShowEmptyCategory) {
			dispatch(categoriesActions.setHideEmptyCategory(currentClanId as string));
		} else {
			dispatch(categoriesActions.setShowEmptyCategory(currentClanId as string));
		}
	};

	const closeAllModals = useCallback(() => {
		closeServerSettingsModal();
		setOpenCreateCate(false);
		closeNotiSettingModal();
		dispatch(clansActions.toggleInvitePeople({ status: false }));
	}, [closeNotiSettingModal]);

	useEffect(() => {
		if (params?.clanId) {
			closeAllModals();
		}
	}, [closeAllModals, params]);

	useEffect(() => {
		dispatch(settingClanStickerActions.closeModalInChild());
	}, []);

	const [openServerSettingsModal, closeServerSettingsModal] = useModal(
		() => (
			<ClanSetting
				onClose={() => {
					closeServerSettingsModal();
					if (!hasChildModalRef.current) {
						closeModalClan();
					}
				}}
				initialSetting={canManageClan ? ItemSetting.OVERVIEW : ItemSetting.EMOJI}
			/>
		),
		[canManageClan, hasChildModalRef, closeModalClan]
	);

	return (
		<>
			{type === 'direct' ? (
				<div className="contain-strict px-3 font-semibold text-white h-heightHeader flex items-center shadow border-b-[1px] dark:border-bgTertiary border-gray-200">
					<input
						ref={inputRef}
						placeholder="Find or start a conversation"
						className={`font-[400] px-[16px] rounded dark:text-white text-black outline-none text-[14px] w-full dark:bg-bgTertiary bg-[#E1E1E1] dark:border-borderDefault h-[36px]`}
						type="text"
						onFocus={handleInputFocus}
					/>
				</div>
			) : (
				<Header name={name} handleShowModalClan={handleShowModalClan} isShowModalPanelClan={isShowModalPanelClan} modalRef={modalRef}>
					<ModalPanel
						handleShowCreateCategory={handleShowCreateCategory}
						handleShowInviteClanModal={handleShowInviteClanModal}
						handleShowServerSettings={handleShowServerSettings}
						toggleShowEmptyCategory={toggleShowEmptyCategory}
						toggleLeaveClanPopup={toggleLeaveClanPopup}
						handleShowNotificationSetting={handleShowNotificationSetting}
						isShowEmptyCategory={isShowEmptyCategory}
						isClanOwner={isClanOwner}
						setIsShowModalPanelClan={setIsShowModalPanelClan}
						rootRef={modalRef}
					/>
				</Header>
			)}

			{isShowLeaveClanPopup && (
				<ModalConfirm
					handleCancel={toggleLeaveClanPopup}
					handleConfirm={handleLeaveClan}
					modalName={currentClan?.clan_name}
					title="leave"
					buttonName="Leave Clan"
				/>
			)}

			<ModalCreateCategory openCreateCate={openCreateCate} onClose={onClose} onCreateCategory={handleCreateCate} />
			<InviteClanModal />
		</>
	);
}

export default ClanHeader;

const InviteClanModal: React.FC = () => {
	const dispatch = useDispatch();
	const invitePeopleStatus = useSelector(selectInvitePeopleStatus);
	const invitePeopleChannelId = useSelector(selectInviteChannelId);
	const invitePeopleClanId = useSelector(selectInviteClanId);
	const [openInviteClanModal, closeInviteClanModal] = useModal(
		() => (
			<ModalInvite
				onClose={() => {
					dispatch(clansActions.toggleInvitePeople({ status: false }));
				}}
				channelID={invitePeopleChannelId}
				open={true}
				clanId={invitePeopleClanId}
			/>
		),
		[invitePeopleChannelId, invitePeopleClanId]
	);

	useEffect(() => {
		if (invitePeopleStatus) {
			openInviteClanModal();
		} else {
			closeInviteClanModal();
		}
	}, [invitePeopleStatus, openInviteClanModal, closeInviteClanModal]);

	return null;
};
