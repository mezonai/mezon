import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';
import { Icons } from '@mezon/ui';
import { LocalParticipant, Track } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';

interface BackgroundEffectsMenuProps {
	participant: LocalParticipant;
}

const darkGradientBackgroundUrl =
	'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+CiAgPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM4MDgwODAiLz4KPC9zdmc+';

export const BackgroundEffectsMenu: React.FC<BackgroundEffectsMenuProps> = ({ participant }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [activeEffect, setActiveEffect] = useState<'none' | 'blur' | 'background'>('none');
	const [isLoading, setIsLoading] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const blurProcessorRef = useRef<any>(null);
	const bgProcessorRef = useRef<any>(null);

	useEffect(() => {
		blurProcessorRef.current = BackgroundBlur(10, { delegate: 'GPU' });
		bgProcessorRef.current = VirtualBackground(darkGradientBackgroundUrl, { delegate: 'GPU' });

		return () => {
			const videoTrackPublication = participant.getTrackPublication(Track.Source.Camera);
			if (videoTrackPublication?.track) {
				videoTrackPublication.track.stopProcessor().catch(console.error);
			}
		};
	}, [participant]);

	const applyBlur = async () => {
		setIsLoading(true);

		try {
			const videoTrackPublication = participant.getTrackPublication(Track.Source.Camera);
			if (!videoTrackPublication?.track) {
				setIsLoading(false);
				return;
			}

			if (videoTrackPublication.track.getProcessor()?.name !== 'background-blur') {
				await videoTrackPublication.track.stopProcessor();
				await videoTrackPublication.track.setProcessor(blurProcessorRef.current);
			}

			setActiveEffect('blur');
			setIsOpen(false);
		} catch (error) {
			console.error('Failed to apply blur:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const applyVirtualBackground = async () => {
		setIsLoading(true);

		try {
			const videoTrackPublication = participant.getTrackPublication(Track.Source.Camera);
			if (!videoTrackPublication?.track) {
				setIsLoading(false);
				return;
			}

			if (videoTrackPublication.track.getProcessor()?.name !== 'virtual-background') {
				await videoTrackPublication.track.stopProcessor();
				await videoTrackPublication.track.setProcessor(bgProcessorRef.current);
			}

			setActiveEffect('background');
			setIsOpen(false);
		} catch (error) {
			console.error('Failed to apply virtual background:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const removeEffects = async () => {
		setIsLoading(true);

		try {
			const videoTrackPublication = participant.getTrackPublication(Track.Source.Camera);
			if (videoTrackPublication?.track) {
				await videoTrackPublication.track.stopProcessor();
				setActiveEffect('none');
				setIsOpen(false);
			}
		} catch (error) {
			console.error('Failed to remove effects:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div className="relative" ref={menuRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="absolute bottom-0 right-0 bg-zinc-900 rounded-full p-1 cursor-pointer"
				title="Background effects"
				disabled={isLoading}
			>
				<Icons.SettingProfile className={`w-4 h-4 ${isLoading ? 'text-gray-500' : 'text-white'}`} />
			</button>

			{isOpen && (
				<div className="absolute bottom-12 right-0 bg-zinc-800 rounded-lg p-2 shadow-lg z-50 w-48">
					<div className="text-white text-sm font-medium mb-2">Background Effects</div>
					<div className="space-y-2">
						<button
							onClick={applyBlur}
							className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-zinc-700 ${activeEffect === 'blur' ? 'bg-zinc-700 text-white' : 'text-white'}`}
							disabled={isLoading}
						>
							{isLoading && activeEffect === 'blur' ? 'Applying...' : 'Blur Background'}
						</button>
						<button
							onClick={applyVirtualBackground}
							className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-zinc-700 ${activeEffect === 'background' ? 'bg-zinc-700 text-white' : 'text-white'}`}
							disabled={isLoading}
						>
							{isLoading && activeEffect === 'background' ? 'Applying...' : 'Dark Background'}
						</button>
						<button
							onClick={removeEffects}
							className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-zinc-700 ${activeEffect === 'none' ? 'bg-zinc-700 text-white' : 'text-white'}`}
							disabled={isLoading}
						>
							{isLoading && activeEffect === 'none' ? 'Removing...' : 'No Effect'}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
