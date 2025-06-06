import React, { ReactNode, createContext, useCallback, useContext, useState } from 'react';

interface PopupManagerContextType {
	getZIndex: (popupId: string) => number;
	bringToFront: (popupId: string) => void;
	registerPopup: (popupId: string) => void;
	unregisterPopup: (popupId: string) => void;
	getActivePopupId: () => string | null;
	isActivePopup: (popupId: string) => boolean;
}

const PopupManagerContext = createContext<PopupManagerContextType | null>(null);

interface PopupManagerProviderProps {
	children: ReactNode;
}

export const PopupManagerProvider: React.FC<PopupManagerProviderProps> = ({ children }) => {
	const [state, setState] = useState<{
		popupLayers: { [popupId: string]: number };
		maxZIndex: number;
		activePopupId: string | null;
	}>({
		popupLayers: {},
		maxZIndex: 1000,
		activePopupId: null
	});

	const registerPopup = useCallback((popupId: string) => {
		setState((prevState) => {
			if (prevState.popupLayers[popupId]) {
				return prevState;
			}

			const newZIndex = prevState.maxZIndex + 1;
			const newState = {
				popupLayers: {
					...prevState.popupLayers,
					[popupId]: newZIndex
				},
				maxZIndex: newZIndex,
				activePopupId: popupId
			};
			return newState;
		});
	}, []);

	const unregisterPopup = useCallback((popupId: string) => {
		setState((prevState) => {
			const newLayers = { ...prevState.popupLayers };
			delete newLayers[popupId];

			let newActivePopupId = prevState.activePopupId;
			if (prevState.activePopupId === popupId) {
				let highestZIndex = 0;
				newActivePopupId = null;
				Object.entries(newLayers).forEach(([id, zIndex]) => {
					if (zIndex > highestZIndex) {
						highestZIndex = zIndex;
						newActivePopupId = id;
					}
				});
			}

			return {
				...prevState,
				popupLayers: newLayers,
				activePopupId: newActivePopupId
			};
		});
	}, []);

	const bringToFront = useCallback((popupId: string) => {
		setState((prevState) => {
			if (!prevState.popupLayers[popupId]) return prevState;

			const newZIndex = prevState.maxZIndex + 1;
			return {
				popupLayers: {
					...prevState.popupLayers,
					[popupId]: newZIndex
				},
				maxZIndex: newZIndex,
				activePopupId: popupId
			};
		});
	}, []);

	const getZIndex = useCallback(
		(popupId: string) => {
			return state.popupLayers[popupId] || 1000;
		},
		[state.popupLayers, state.maxZIndex]
	);

	const getActivePopupId = useCallback(() => {
		return state.activePopupId;
	}, [state.activePopupId]);

	const isActivePopup = useCallback(
		(popupId: string) => {
			const isActive = state.activePopupId === popupId;
			return isActive;
		},
		[state.activePopupId]
	);

	const contextValue: PopupManagerContextType = {
		getZIndex,
		bringToFront,
		registerPopup,
		unregisterPopup,
		getActivePopupId,
		isActivePopup
	};

	return <PopupManagerContext.Provider value={contextValue}>{children}</PopupManagerContext.Provider>;
};

export const usePopupManager = () => {
	const context = useContext(PopupManagerContext);
	if (!context) {
		throw new Error('usePopupManager must be used within a PopupManagerProvider');
	}
	return context;
};
