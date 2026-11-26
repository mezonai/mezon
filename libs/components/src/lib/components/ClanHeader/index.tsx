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
import BenefitModal, { type BenefitPlanId, type CouponValidationResult } from '../BenefitModal';
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
	const isClanPro = currentClan?.pro_plan === true;
	const currentChannelId = useSelector(selectCurrentVoiceChannelId);
	const navigate = useNavigate();
	const toOnboard = useSelector(selectToOnboard);
	const [openCreateCate, setOpenCreateCate] = useState(false);
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
		openClanBenefitModal();
		setIsShowModalPanelClan(false);
	};

	const isClanProPurchaseAvailable = Boolean(currentClanId && userProfile?.user?.id && isCurrentUserClanOwner && !isClanPro);
	const handleBuyClanProPlan = useCallback(async (): Promise<boolean> => {
		const senderUserId = userProfile?.user?.id;
		if (!isClanProPurchaseAvailable || !currentClanId || !senderUserId || isBuyingClanPro) return false;
		if (!proPlanRecipientUserId || clanProPlanPrice <= 0) {
			dispatch(toastActions.addToast({ message: t('clanMenu:proPlanConfirm.purchaseUnavailable'), type: 'error' }));
			return false;
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
				return true;
			}
			return false;
		} finally {
			setIsBuyingClanPro(false);
		}
	}, [
		clanProPlanPrice,
		currentClanId,
		dispatch,
		isBuyingClanPro,
		isClanProPurchaseAvailable,
		proPlanRecipientUserId,
		t,
		userProfile?.user?.id,
		userProfile?.user?.username
	]);
	const handleApplyBenefitCoupon = useCallback(
		async (plan: BenefitPlanId, couponCode: string): Promise<CouponValidationResult> => {
			try {
				if (plan === 'clan' && !currentClanId) {
					return {
						success: false,
						message: t('clanMenu:proPlanConfirm.couponFailed')
					};
				}

				await dispatch(
					clansActions.applyCouponPro({
						clanId: plan === 'clan' ? (currentClanId ?? '') : '',
						code: couponCode
					})
				).unwrap();

				return {
					success: true,
					message: t('clanMenu:proPlanConfirm.couponApplied')
				};
			} catch {
				return {
					success: false,
					message: t('clanMenu:proPlanConfirm.couponFailed')
				};
			}
		},
		[currentClanId, dispatch, t]
	);
	const [openClanBenefitModal, closeClanBenefitModal] = useModal(
		() => (
			<BenefitModal
				open
				onClose={closeClanBenefitModal}
				availablePlans={['clan']}
				couponPlans={['clan', 'user']}
				onConfirmPlan={handleBuyClanProPlan}
				onApplyCoupon={handleApplyBenefitCoupon}
				getConfirmation={(plan, action) => {
					const isUserCoupon = action === 'coupon' && plan === 'user';
					const titleKey =
						action !== 'coupon'
							? 'clanMenu:proPlanConfirm.title'
							: isUserCoupon
								? 'clanMenu:proPlanConfirm.userCouponTitle'
								: 'clanMenu:proPlanConfirm.couponTitle';
					const messageKey =
						action !== 'coupon'
							? 'clanMenu:proPlanConfirm.message'
							: isUserCoupon
								? 'clanMenu:proPlanConfirm.userCouponMessage'
								: 'clanMenu:proPlanConfirm.couponMessage';
					const buttonKey =
						action !== 'coupon'
							? 'clanMenu:proPlanConfirm.confirmButton'
							: isUserCoupon
								? 'clanMenu:proPlanConfirm.userCouponConfirmButton'
								: 'clanMenu:proPlanConfirm.couponConfirmButton';
					return {
						title: t(titleKey),
						message: t(messageKey, {
							clanName: currentClanName || t('clanMenu:proPlanConfirm.yourClan'),
							userName: userProfile?.user?.username || t('clanMenu:proPlanConfirm.yourAccount'),
							price: new Intl.NumberFormat(i18n.language).format(clanProPlanPrice)
						}),
						buttonName: t(buttonKey),
						processingButtonName: t(
							action === 'coupon' ? 'clanMenu:proPlanConfirm.couponProcessing' : 'clanMenu:proPlanConfirm.processing'
						),
						buttonColor: 'bg-indigo-600 hover:bg-indigo-700'
					};
				}}
			/>
		),
		[clanProPlanPrice, currentClanName, handleApplyBenefitCoupon, handleBuyClanProPlan, i18n.language, t, userProfile?.user?.username]
	);

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
		closeClanBenefitModal();
		setOpenCreateCate(false);
		closeNotiSettingModal();
		dispatch(clansActions.toggleInvitePeople({ status: false }));
	}, [closeClanBenefitModal, closeNotiSettingModal]);

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
				<Header name={name} handleShowModalClan={handleShowModalClan} isShowModalPanelClan={isShowModalPanelClan} modalRef={modalRef}>
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
