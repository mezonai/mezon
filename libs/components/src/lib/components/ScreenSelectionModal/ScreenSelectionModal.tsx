import { useEscapeKeyClose } from '@mezon/core';
import { useAppDispatch, voiceActions } from '@mezon/store';
import { memo, useCallback, useRef, useState } from 'react';
import ScreenListItems from './ScreenListItems';

const TABS = [
	{ label: 'Application', value: 'window' },
	{ label: 'Entire Screen', value: 'screen' },
	{ label: 'Device', value: 'Device' }
];

type ScreenSelectionModalProps = {
	onClose: () => void;
};

const ScreenSelectionModal = memo(({ onClose }: ScreenSelectionModalProps) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const dispatch = useAppDispatch();
	const [currentTab, setCurrentTab] = useState(0);
	const [audio, setAudio] = useState(false);

	const handleClose = useCallback(() => {
		dispatch(voiceActions.setShowSelectScreenModal(false));
		onClose?.();
	}, [dispatch, onClose]);

	useEscapeKeyClose(modalRef, handleClose);

	const handleStop = (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
	};
	const handleToggleAudio = () => {
		setAudio(!audio);
	};
	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			onClick={handleClose}
			className="outline-none justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden contain-layout contain-paint"
		>
			<div className="relative w-full sm:h-auto rounded-lg max-w-[600px] contain-layout contain-paint" onClick={handleStop}>
				<div className="flex items-center gap-x-4 dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black gap-2 p-4">
					{TABS.map((tab, index) => (
						<button
							key={tab.value}
							onClick={() => setCurrentTab(index)}
							className={`p-2 text-sm rounded font-semibold ${currentTab === index ? 'bg-green-600' : 'bg-green-500'} text-white`}
						>
							{tab.label}
						</button>
					))}
					<div className="flex-1 items-center justify-end flex gap-2">
						<p className="inline-block text-sm font-semibold">Share Audio</p>
						<input
							type="checkbox"
							checked={audio}
							onChange={handleToggleAudio}
							className={`peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
              bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
              after:bg-slate-500 after:transition-all checked:bg-blue-200 checked:after:left-4 checked:after:bg-blue-500
              ${audio ? 'hover:bg-slate-400 after:hover:bg-slate-600 checked:hover:bg-blue-300 checked:after:hover:bg-blue-600' : ''}
              focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed
              `}
						/>
					</div>
				</div>

				<div className="dark:bg-[#313339] bg-white h-fit min-h-80 max-h-[80vh]  overflow-y-scroll hide-scrollbar p-4 grid grid-cols-2 gap-4 contain-layout contain-paint">
					<ScreenListItems onClose={onClose} source={TABS[currentTab].value} audio={audio} />
				</div>
			</div>
		</div>
	);
});

export default ScreenSelectionModal;
