import { IMessageWithUser } from '@mezon/utils';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useModal } from 'react-modal-hook';
import GiveCoffeeModal from './index';

type GiveCoffeeModalContextValue = {
	openGiveCoffeeModal: (message: IMessageWithUser, isTopic?: boolean) => void;
};

export const GiveCoffeeModalContext = createContext<GiveCoffeeModalContextValue>({
	openGiveCoffeeModal: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	}
});

export const GiveCoffeeModalProvider = ({ children }: { children: React.ReactNode }) => {
	const [currentMessage, setCurrentMessage] = useState<IMessageWithUser | null>(null);

	const [openModal, closeModal] = useModal(() => {
		if (!currentMessage) {
			console.warn('GiveCoffeeModal: No message provided');
			return null;
		}

		return <GiveCoffeeModal message={currentMessage} onClose={closeModal} />;
	}, [currentMessage]);

	const openGiveCoffeeModal = useCallback(
		(message: IMessageWithUser) => {
			if (!message) {
				console.warn('GiveCoffeeModal: Message is required');
				return;
			}
			setCurrentMessage(message);
			openModal();
		},
		[openModal]
	);

	const value = useMemo(
		() => ({
			openGiveCoffeeModal
		}),
		[openGiveCoffeeModal]
	);

	return <GiveCoffeeModalContext.Provider value={value}>{children}</GiveCoffeeModalContext.Provider>;
};

export const useGiveCoffeeModal = () => useContext(GiveCoffeeModalContext);
