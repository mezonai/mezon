import { ModalInvite } from '@mezon/components';
import { createExternalMezonMeet, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { toast } from 'react-toastify';

export default function MeetPage() {
	const { t } = useTranslation('homepage');
	const dispatch = useAppDispatch();
	const [error, setError] = useState<string | null>(null);
	const [externalLink, setExternalLink] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);

	useEffect(() => {
		const createMeeting = async () => {
			if (isCreating || externalLink) return;

			setIsCreating(true);
			setError(null);
			try {
				const result = await dispatch(createExternalMezonMeet()).unwrap();

				if (result) {
					const link = result as string;
					const fullLink = link.startsWith('http') ? link : `${process.env.NX_CHAT_APP_REDIRECT_URI || ''}${link}`;
					setExternalLink(fullLink);
				} else {
					setError('Failed to create meeting. Please try again.');
				}
			} catch (error) {
				console.error('Error creating meeting:', error);
				setError('Failed to create meeting. Please try again.');
			} finally {
				setIsCreating(false);
			}
		};

		createMeeting();
	}, []);

	const handleJoin = useCallback(() => {
		if (externalLink) {
			window.location.href = externalLink;
		}
	}, [externalLink]);

	const handleCopyLink = useCallback(() => {
		if (externalLink) {
			navigator.clipboard
				.writeText(externalLink)
				.then(() => {
					toast.success(t('externalMeet.toastSuccess'));
				})
				.catch((err) => {
					toast.error(t('externalMeet.toastFail'));
					console.error('Copy error:', err);
				});
		}
	}, [externalLink]);

	const [openInviteModal, closeInviteModal] = useModal(
		() => <ModalInvite onClose={closeInviteModal} open={true} isInviteExternalCalling={true} privateRoomLink={externalLink || ''} />,
		[externalLink]
	);

	const handleInvite = useCallback(() => {
		if (externalLink) {
			openInviteModal();
		}
	}, [externalLink, openInviteModal]);

	return (
		<div
			className="flex flex-col items-center justify-center min-h-screen text-white"
			style={{
				background: 'linear-gradient(135deg, #2b0a3d 0%, #4b137a 35%, #7c1fff 55%, #c026d3 75%, #ec4899 100%)'
			}}
		>
			<div className="w-full max-w-2xl px-4 py-8 flex flex-col items-center">
				{isCreating && !externalLink && (
					<div className="w-full max-w-lg bg-zinc-800 rounded-lg p-8 flex flex-col items-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
					</div>
				)}

				{externalLink && !isCreating && (
					<div className="w-full max-w-lg bg-zinc-800 rounded-lg p-6 flex flex-col items-center gap-4">
						<div className="text-center mb-4">
							<h1 className="text-3xl font-bold mb-2">{t('externalMeet.title')}</h1>
						</div>
						<div className="text-center mb-4">
							<div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-500/20">
								<Icons.Tick defaultSize="w-8 h-8" fill="#10b981" />
							</div>
							<p className="text-lg font-semibold mb-2">{t('externalMeet.creatingMeeting')}</p>
						</div>

						<div className="flex gap-2 w-full flex-col sm:flex-row justify-center">
							<button
								onClick={handleJoin}
								className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm"
							>
								<Icons.IconMeetDM defaultSize="w-4 h-4" />
								<span>{t('externalMeet.joinMeeting')}</span>
							</button>
							<button
								onClick={handleInvite}
								className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm"
							>
								<Icons.IconEvents defaultSize="w-4 h-4" />
								<span>{t('externalMeet.invite')}</span>
							</button>
							<button
								onClick={handleCopyLink}
								className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm"
							>
								<Icons.CopyIcon className="w-4 h-4" />
								<span>{t('externalMeet.copyLink')}</span>
							</button>
						</div>
					</div>
				)}

				{error && (
					<div className="w-full max-w-md mt-4 p-4 bg-red-900/50 border border-red-800 rounded text-red-200 text-sm text-center">
						{error}
					</div>
				)}
			</div>
		</div>
	);
}
