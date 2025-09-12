import { useEscapeKeyClose } from '@mezon/core';
import { RefObject, useCallback, useEffect, useRef } from 'react';
import ModalUserProfile from '../ModalUserProfile';

type ModalFooterProfileProps = {
	userId: string;
	avatar?: string;
	name?: string;
	isDM: boolean;
	userStatusProfile: string;
	rootRef?: RefObject<HTMLElement>;
	onCloseModal?: () => void;
};

const ModalFooterProfile = ({ userId, avatar, name, isDM, userStatusProfile, rootRef, onCloseModal }: ModalFooterProfileProps) => {
	const modalRef = useRef<HTMLDivElement>(null);

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
			className={`outline-none fixed sbm:left-[50px] left-5 bottom-[70px]  mt-[10px] w-[340px] max-w-[89vw] rounded-lg flex flex-col z-30 opacity-100 shadow-md shadow-bgTertiary-500/40 origin-bottom bg-outside-footer `}
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
			/>
		</div>
	);
};

export default ModalFooterProfile;
