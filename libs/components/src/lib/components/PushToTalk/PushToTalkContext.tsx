import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../WebRTC/WebRTCContext';

interface PushToTalkContextProps {
	isJoined: boolean;
	isTalking: boolean;
	startJoinPTT: () => Promise<void>;
	quitPTT: () => Promise<void>;
	toggleTalking: (talking: boolean) => void;
}

const PushToTalkContext = createContext<PushToTalkContextProps | undefined>(undefined);

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

	const startJoinPTT = async () => {
		try {
			setIsJoined(true);
			await startLocalStream();
		} catch (err) {
			console.error('Failed to start Push-to-Talk:', err);
		}
	};

	const quitPTT = useCallback(async () => {
		setIsTalking(false);
		setIsJoined(false);
		toggleMicrophone(false);
		stopSession();
	}, [stopSession, toggleMicrophone]);

	return (
		<PushToTalkContext.Provider
			value={{
				isJoined,
				isTalking,
				startJoinPTT,
				quitPTT,
				toggleTalking
			}}
		>
			<div className="invisible fixed w-[1px] h-[1px] z-0 pointer-events-none">
				<audio ref={localAudioRef} autoPlay muted />
				<audio ref={remoteAudioRef} autoPlay />
			</div>
			{children}
		</PushToTalkContext.Provider>
	);
};

export const usePushToTalk = () => {
	const context = useContext(PushToTalkContext);
	if (!context) {
		throw new Error('usePushToTalk must be used within a PushToTalkProvider');
	}
	return context;
};
