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

	const handleClose = useCallback(() => {
		dispatch(voiceActions.setShowSelectScreenModal(false));
		onClose?.();
	}, [dispatch, onClose]);

	useEscapeKeyClose(modalRef, handleClose);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="outline-none justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-10 outline-none focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden contain-layout contain-paint"
		>
			<div className="relative w-full sm:h-auto rounded-lg max-w-[600px] contain-layout contain-paint">
				<div className="rounded-lg text-sm overflow-hidden">
					<div className="dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black flex justify-between items-center p-4">
						<div className="flex items-center gap-x-4">
							<div className="gap-x-2 flex items-center">
								{TABS.map((tab, index) => (
									<button
										key={tab.value}
										onClick={() => setCurrentTab(index)}
										className={`px-4 py-2 rounded ${currentTab === index ? 'bg-green-600' : 'bg-green-500'} text-white`}
									>
										{tab.label}
									</button>
								))}
							</div>
						</div>
					</div>
					<div className="dark:bg-[#313339] bg-white h-fit min-h-80 max-h-[80vh]  overflow-y-scroll hide-scrollbar p-4 grid grid-cols-2 gap-5 contain-layout contain-paint">
						<ScreenListItems onClose={onClose} source={TABS[currentTab].value} />
					</div>
				</div>
			</div>
		</div>
	);
});

export default ScreenSelectionModal;
