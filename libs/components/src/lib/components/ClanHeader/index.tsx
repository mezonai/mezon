import { useAuth, useChannelMembersActions, usePermissionChecker } from '@mezon/core';
import {
	categoriesActions,
	clansActions,
	defaultNotificationCategoryActions,
	emojiSuggestionSlice,
	hasGrandchildModal,
	selectCurrentClan,
	selectCurrentClanId,
	selectCurrentClanName,
	selectCurrentClanProPlan,
	selectCurrentVoiceChannelId,
	selectInvitePeopleStatus,
	selectIsShowEmptyCategory,
	selectToOnboard,
	settingClanStickerActions,
	settingClanStickerSlice,
	soundEffectActions,
	toastActions,
	useAppDispatch
} from '@mezon/store';
import { CLAN_PRO_PLAN_MIN_PRICE, EPermission, generateE2eId } from '@mezon/utils';
import type { ApiCreateCategoryDescRequest } from 'mezon-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ClanSetting from '../ClanSettings';
import { ItemSetting } from '../ClanSettings/ItemObj';
import ModalInvite from '../ListMemberInvite/modalInvite';
import ModalConfirm from '../ModalConfirm';
import ModalNotificationSetting from '../NotificationSetting';
import Header from './Header';
import ModalCreateCategory from './ModalCreateCategory';
import ModalPanel from './ModalPanel';

export type ClanHeaderProps = {
	name?: string;
	type: string;
	bannerImage?: string;
};

function ClanHeader({ name, type }: ClanHeaderProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const modalRef = useRef<HTMLDivElement | null>(null);
	const dispatch = useAppDispatch();
	const params = useParams();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClan = useSelector(selectCurrentClan);
	const currentClanName = useSelector(selectCurrentClanName);
	const isClanPro = useSelector(selectCurrentClanProPlan);
	const { t, i18n } = useTranslation(['clan', 'clanMenu']);
	const [isClanOwner, canManageClan, adminClan] = usePermissionChecker([EPermission.clanOwner, EPermission.manageClan, EPermission.administrator]);
	const { removeMemberClan } = useChannelMembersActions();
	const { userProfile } = useAuth();
	const proPlanRecipientUserId = process.env.NX_PRO_PLAN_RECIPIENT_ID?.trim() ?? '';
	const parsedClanProPlanPrice = Number(process.env.NX_PRO_PLAN_CLAN_PRICE || 0);
	const clanProPlanPrice =
		Number.isSafeInteger(parsedClanProPlanPrice) && parsedClanProPlanPrice > 0
			? Math.max(parsedClanProPlanPrice, CLAN_PRO_PLAN_MIN_PRICE)
			: CLAN_PRO_PLAN_MIN_PRICE;
	const isCurrentUserClanOwner = !!currentClan?.creator_id && currentClan.creator_id === userProfile?.user?.id;
	const currentChannelId = useSelector(selectCurrentVoiceChannelId);
	const navigate = useNavigate();
	const toOnboard = useSelector(selectToOnboard);
	const [openCreateCate, setOpenCreateCate] = useState(false);
	const [isClanProConfirmOpen, setIsClanProConfirmOpen] = useState(false);
	const [isBuyingClanPro, setIsBuyingClanPro] = useState(false);
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
		dispatch(defaultNotificationCategoryActions.fetchChannelCategorySetting({ clanId: currentClanId || '' }));
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
		window.dispatchEvent(new CustomEvent('open-search-modal'));
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

	const handleShowClanBenefits = () => {
		if (!isCurrentUserClanOwner || isClanPro) return;
		setIsClanProConfirmOpen(true);
		setIsShowModalPanelClan(false);
	};

	const isClanProPurchaseAvailable = Boolean(currentClanId && userProfile?.user?.id && isCurrentUserClanOwner && !isClanPro);
	const handleBuyClanProPlan = async () => {
		const senderUserId = userProfile?.user?.id;
		if (!isClanProPurchaseAvailable || !currentClanId || !senderUserId || isBuyingClanPro) return;
		if (!proPlanRecipientUserId || clanProPlanPrice <= 0) {
			dispatch(toastActions.addToast({ message: t('clanMenu:proPlanConfirm.purchaseUnavailable'), type: 'error' }));
			return;
		}

		setIsBuyingClanPro(true);
		try {
			const result = await dispatch(
				clansActions.buyClanProPlan({
					clanId: currentClanId,
					clanPrice: clanProPlanPrice,
					proPlanRecipientUserId,
					senderUserId,
					senderUsername: userProfile?.user?.username || ''
				})
			);
			if (clansActions.buyClanProPlan.fulfilled.match(result)) {
				dispatch(toastActions.addToast({ message: t('clanMenu:proPlanConfirm.purchaseSubmitted'), type: 'success' }));
				setIsClanProConfirmOpen(false);
			}
		} finally {
			setIsBuyingClanPro(false);
			setIsClanProConfirmOpen(false);
		}
	};

	const closeModalClan = useCallback(() => {
		setIsShowModalPanelClan(false);
	}, []);

	const handleLeaveClan = async () => {
		await removeMemberClan({ channelId: currentChannelId, clanId: currentClanId as string, userIds: [userProfile?.user?.id as string] });
		dispatch(emojiSuggestionSlice.actions.invalidateCache());
		dispatch(settingClanStickerSlice.actions.invalidateCache());
		dispatch(soundEffectActions.invalidateCache());
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
				initialSetting={toOnboard ? ItemSetting.ON_BOARDING : adminClan ? ItemSetting.OVERVIEW : ItemSetting.EMOJI}
			/>
		),
		[canManageClan, hasChildModalRef, closeModalClan, toOnboard]
	);

	useEffect(() => {
		if (toOnboard === null) return;
		if (toOnboard) {
			openServerSettingsModal();
		}
	}, [toOnboard]);

	return (
		<>
			{type === 'direct' ? (
				<div
					className="contain-strict px-3 font-semibold  h-heightHeader flex items-center border-b-theme-primary "
					data-e2e={generateE2eId('chat.direct_message.button.search')}
				>
					<input
						ref={inputRef}
						placeholder={t('findOrStartConversation')}
						className={`font-[500] px-[16px] rounded-lg outline-none text-[14px] w-full h-[36px] bg-theme-input color-text-secondary border-theme-primary`}
						type="text"
						onFocus={handleInputFocus}
					/>
				</div>
			) : (
				<Header
					name={name}
					isPro={isClanPro}
					handleShowModalClan={handleShowModalClan}
					isShowModalPanelClan={isShowModalPanelClan}
					modalRef={modalRef}
				>
					<ModalPanel
						handleShowCreateCategory={handleShowCreateCategory}
						handleShowClanBenefits={handleShowClanBenefits}
						showClanBenefits={isCurrentUserClanOwner}
						isClanPro={isClanPro}
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
					modalName={currentClanName}
					title={t('leaveClanTitle')}
					buttonName={t('leaveClan')}
				/>
			)}
			{openCreateCate && <ModalCreateCategory onClose={onClose} onCreateCategory={handleCreateCate} />}
			{isClanProConfirmOpen && (
				<ModalConfirm
					handleCancel={() => setIsClanProConfirmOpen(false)}
					handleConfirm={handleBuyClanProPlan}
					title={t('clanMenu:proPlanConfirm.title')}
					buttonName={isBuyingClanPro ? t('clanMenu:proPlanConfirm.processing') : t('clanMenu:proPlanConfirm.confirmButton')}
					buttonColor="bg-indigo-600 hover:bg-indigo-700"
					customTitle={t('clanMenu:proPlanConfirm.message', {
						clanName: currentClanName || t('clanMenu:proPlanConfirm.yourClan'),
						price: new Intl.NumberFormat(i18n.language).format(clanProPlanPrice)
					})}
				/>
			)}
			<InviteClanModal />
		</>
	);
}

export default React.memo(ClanHeader, (prevProps, nextProps) => {
	return prevProps.name === nextProps.name && prevProps.type === nextProps.type;
});

const InviteClanModal: React.FC = () => {
	const dispatch = useDispatch();
	const invitePeopleStatus = useSelector(selectInvitePeopleStatus);
	const [openInviteClanModal, closeInviteClanModal] = useModal(
		() => (
			<ModalInvite
				onClose={() => {
					dispatch(clansActions.toggleInvitePeople({ status: false }));
				}}
				open={true}
			/>
		),
		[]
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
