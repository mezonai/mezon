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
import { Icons } from '@mezon/ui';

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
		setOpenServerSettings(true);
		setIsShowModalPanelClan(false);
	};

	const closeModalClan = useCallback(() => {
		setIsShowModalPanelClan(false);
		if (!hasChildModalRef.current) {
			setOpenServerSettings(false);
		}
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
		setOpenServerSettings(false);
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

	return (
		<div className={`!h-heightHeader flex items-center justify-center px-4 w-widthChannelList ${type !== 'direct' ? 'dark:hover:bg-[#35373C] hover:bg-[#E2E7F6]' : ''}`}>
			<div className={`cursor-pointer w-full flex  justify-between items-center gap-2  `}>
				{type !== 'direct' ?
					<>
						<p className="dark:text-white text-black text-base font-semibold select-none one-line">{name?.toLocaleUpperCase()}</p>
						<Icons.ArrowDown size='mr-2' />
					</>
					:
					<div onClick={handleInputFocus} className={`font-normal leading-9 px-4 rounded dark:text-white text-black outline-none text-sm w-full dark:bg-bgTertiary bg-[#E1E1E1] dark:border-borderDefault h-9`}>
						Find or start a conversation
					</div>
				}
			</div>
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

			{/* {isShowLeaveClanPopup && (
				<ModalConfirm
					handleCancel={toggleLeaveClanPopup}
					handleConfirm={handleLeaveClan}
					modalName={currentClan?.clan_name}
					title="leave"
					buttonName="Leave Clan"
				/>
			)} */}

			{/* {openServerSettings && <ClanSetting onClose={closeModalClan} initialSetting={canManageClan ? ItemSetting.OVERVIEW : ItemSetting.EMOJI} />}

			<ModalCreateCategory openCreateCate={openCreateCate} onClose={onClose} onCreateCategory={handleCreateCate} />
			<InviteClanModal />  */}
		</div>
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
