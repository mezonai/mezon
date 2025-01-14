import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../WebRTC/WebRTCContext';

interface SFUContextProps {
	isJoined: boolean;
	isTalking: boolean;
	startJoinSFU: () => Promise<void>;
	quitSFU: () => Promise<void>;
	toggleTalking: (talking: boolean) => void;
}

const SFUContext = createContext<SFUContextProps | undefined>(undefined);

export const PushToTalkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { localStream, remoteStream, startLocalStream, stopSession, toggleMicrophone } = useWebRTC();
	const [isJoined, setIsJoined] = useState(false);
	const [isTalking, setIsTalking] = useState(false);

	const localAudioRef = useRef<HTMLAudioElement | null>(null);
	const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		if (localStream && localAudioRef.current) {
			localAudioRef.current.srcObject = localStream;
		}
	}, [localStream]);

	useEffect(() => {
		if (remoteStream && remoteAudioRef.current) {
			remoteAudioRef.current.srcObject = remoteStream;
		}
	}, [remoteStream]);

	useEffect(() => {
		if (remoteStream && remoteAudioRef.current) {
			remoteAudioRef.current.muted = isTalking;
		}
	}, [isTalking]);

	const toggleTalking = (talking: boolean) => {
		setIsTalking(talking);
		toggleMicrophone(talking);
	};

	const startJoinSFU = async () => {
		try {
			setIsJoined(true);
			await startLocalStream();
		} catch (err) {
			console.error('Failed to start Push-to-Talk:', err);
		}
	};

	const quitSFU = useCallback(async () => {
		setIsTalking(false);
		setIsJoined(false);
		toggleMicrophone(false);
		stopSession();
	}, [stopSession, toggleMicrophone]);

	return (
		<SFUContext.Provider
			value={{
				isJoined,
				isTalking,
				startJoinSFU,
				quitSFU,
				toggleTalking
			}}
		>
			<div className="invisible fixed w-[1px] h-[1px] z-0 pointer-events-none">
				<audio ref={localAudioRef} autoPlay muted />
				<audio ref={remoteAudioRef} autoPlay />
			</div>
			{children}
		</SFUContext.Provider>
	);
};

export const usePushToTalk = () => {
	const context = useContext(SFUContext);
	if (!context) {
		throw new Error('usePushToTalk must be used within a PushToTalkProvider');
	}
	return context;
};

SFUContext.displayName = 'SFUContext';
