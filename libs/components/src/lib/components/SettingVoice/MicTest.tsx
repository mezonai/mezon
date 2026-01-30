import React from 'react';

interface MicTestProps {
	permissionState: 'unknown' | 'granted' | 'denied';
	isTesting: boolean;
	micLevel: number;
	testError: string;
	hasSetSinkId: boolean;
	playbackAudioRef: React.RefObject<HTMLAudioElement>;
	onStartTest: () => void;
	onStopTest: () => void;
	t: (key: string) => string;
}

const MicTestComponent = ({
	permissionState,
	isTesting,
	micLevel,
	testError,
	hasSetSinkId,
	playbackAudioRef,
	onStartTest,
	onStopTest,
	t
}: MicTestProps) => {
	return (
		<div className="mt-6">
			<div>
				<div className="text-lg font-bold text-theme-primary-active tracking-wide mb-2">{t('setting:voice.micTest.title')}</div>
				<p className="text-xs text-theme-primary-hover mb-3">{t('setting:voice.micTest.description')}</p>

				{permissionState === 'denied' && <div className="text-xs text-red-500 mb-3">{t('setting:voice.errors.permissionDenied')}</div>}
				{testError && <div className="text-xs text-red-500 mb-3">{testError}</div>}

				<div className="flex items-center gap-3">
					<button
						className="btn-primary btn-primary-hover inline-flex items-center justify-center h-fit w-[6rem] px-4 py-2 rounded-lg cursor-pointer text-center whitespace-nowrap disabled:opacity-50"
						onClick={() => (isTesting ? onStopTest() : void onStartTest())}
						disabled={permissionState === 'denied'}
					>
						{isTesting ? t('setting:voice.micTest.stop') : t('setting:voice.micTest.letsCheck')}
					</button>

					<div className="flex-1 min-w-0">
						<div className="w-full h-4 flex items-center gap-[5px] overflow-hidden">
							{Array.from({ length: 84 }).map((_, i) => (
								<span
									key={i}
									className={`h-full w-[3px] flex-shrink-0 rounded-sm ${
										i < Math.round(micLevel * 72) ? 'bg-emerald-500' : 'bg-gray-300 opacity-70'
									}`}
								/>
							))}
						</div>
					</div>
				</div>

				<audio ref={playbackAudioRef} className="hidden" />

				{!hasSetSinkId && <div className="mt-2 text-[11px] text-theme-primary-hover">{t('setting:voice.warnings.outputNotSupported')}</div>}
			</div>
		</div>
	);
};

export const MicTest = React.memo(MicTestComponent);
