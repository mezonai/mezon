import { useEscapeKeyClose } from '@mezon/core';
import { selectIsProUser, useAppSelector } from '@mezon/store';
import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import ModalUserProfile from '../ModalUserProfile';
import { proCardStyle, useProPalette } from '../ProfileBadges';

type ModalFooterProfileProps = {
	userId: string;
	avatar?: string;
	name?: string;
	isDM: boolean;
	userStatusProfile: string;
	rootRef?: RefObject<HTMLElement>;
	onCloseModal?: () => void;
	modalControlRef?: RefObject<HTMLDivElement>;
};

const ModalFooterProfile = ({ userId, avatar, name, isDM, userStatusProfile, rootRef, onCloseModal, modalControlRef }: ModalFooterProfileProps) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const isPro = useAppSelector((state) => selectIsProUser(state, userId));
	const proPalette = useProPalette();
	const cardStyle = useMemo(() => (isPro ? proCardStyle(proPalette) : undefined), [isPro, proPalette]);

	const handleCloseModalFooterProfile = useCallback(() => {
		onCloseModal?.();
	}, [onCloseModal]);

	useEscapeKeyClose(rootRef || modalRef, handleCloseModalFooterProfile);

	useEffect(() => {
		const focusModal = () => {
			if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
				modalRef.current.focus();
			}
		};

		focusModal();

		const handleWindowFocus = () => {
			setTimeout(focusModal, 0);
		};

		const handleDocumentClick = (event: MouseEvent) => {
			if (modalRef.current && modalRef.current.contains(event.target as Node)) {
				setTimeout(focusModal, 0);
			}
		};

		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && modalRef.current) {
				const modalElement = modalRef.current;
				const modalRect = modalElement.getBoundingClientRect();
				const isVisible = modalRect.width > 0 && modalRect.height > 0;

				if (isVisible) {
					handleCloseModalFooterProfile();
				}
			}
		};

		window.addEventListener('focus', handleWindowFocus);
		document.addEventListener('click', handleDocumentClick, true);
		document.addEventListener('keydown', handleEscapeKey);

		return () => {
			window.removeEventListener('focus', handleWindowFocus);
			document.removeEventListener('click', handleDocumentClick, true);
			document.removeEventListener('keydown', handleEscapeKey);
		};
	}, [handleCloseModalFooterProfile]);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			onClick={(e) => e.stopPropagation()}
			style={cardStyle}
			className={`outline-none fixed sbm:left-[50px] left-5 bottom-[70px]  mt-[10px] w-[340px] max-w-[89vw] rounded-lg flex flex-col z-30 opacity-100 ${isPro ? '' : 'shadow-md shadow-bgTertiary-500/40'} origin-bottom bg-outside-footer `}
		>
			<ModalUserProfile
				rootRef={rootRef}
				onClose={handleCloseModalFooterProfile}
				userID={userId}
				isFooterProfile
				avatar={avatar}
				name={name}
				isDM={isDM}
				userStatusProfile={userStatusProfile}
				modalControlRef={modalControlRef}
			/>
		</div>
	);
};

export default ModalFooterProfile;
