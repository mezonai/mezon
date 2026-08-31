import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

export interface MediaPermissionModalProps {
	source: 'microphone' | 'camera' | null;
	onClose: () => void;
	onRetry: () => void;
}

export const MediaPermissionModal = ({ source, onClose, onRetry }: MediaPermissionModalProps) => {
	const { t } = useTranslation('channelVoice');

	if (!source) return null;

	const title = source === 'camera' ? t('permission.cameraTitle') : t('permission.microphoneTitle');
	const body = source === 'camera' ? t('permission.cameraBody') : t('permission.microphoneBody');

	return (
		<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="w-[420px] rounded-2xl bg-[#2b2d31] p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between">
					<div>
						<div className="text-xl font-semibold mb-2">{title}</div>
						<p className="text-sm text-gray-300">{body}</p>
					</div>
					<button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close permission dialog">
						<Icons.Close />
					</button>
				</div>

				<div className="mt-6 flex gap-3">
					<button
						className="flex-1 rounded-lg border border-gray-600 bg-transparent py-2 text-base font-semibold text-white hover:bg-gray-700 transition-colors"
						onClick={onClose}
					>
						{t('permission.cancel')}
					</button>
					<button
						className="flex-1 rounded-lg bg-[#5865f2] py-2 text-base font-semibold text-white hover:bg-[#4752c4] transition-colors"
						onClick={onRetry}
					>
						{t('permission.deviceSettings')}
					</button>
				</div>
			</div>
		</div>
	);
};
