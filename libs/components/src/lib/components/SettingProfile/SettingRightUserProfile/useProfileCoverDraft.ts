import { handleUploadPublicFile, isValidUrl, useMezon } from '@mezon/transport';
import { MAX_FILE_SIZE_10MB } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const coverImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
type CoverDraft = { previewUrl: string; file?: File; uploadedUrl?: string };

export function useProfileCoverDraft(savedBanner: string) {
	const { clientRef, sessionRef } = useMezon();
	const { t } = useTranslation('profileSetting');
	const [draft, setDraft] = useState<CoverDraft>();
	const [isPreparing, setIsPreparing] = useState(false);
	const generation = useRef(0);
	const localPreview = draft?.file ? draft.previewUrl : undefined;

	useEffect(
		() => () => {
			generation.current++;
		},
		[]
	);
	useEffect(
		() => () => {
			if (localPreview) URL.revokeObjectURL(localPreview);
		},
		[localPreview]
	);

	const reset = () => {
		generation.current++;
		setIsPreparing(false);
		setDraft(undefined);
	};

	const selectFile = async (file: File) => {
		if (!coverImageTypes.includes(file.type)) {
			toast.error(t('coverPhoto.invalidType'));
			return;
		}
		if (file.size > MAX_FILE_SIZE_10MB) {
			toast.error(t('coverPhoto.tooLarge'));
			return;
		}
		const requestGeneration = ++generation.current;
		setIsPreparing(true);
		const previewUrl = URL.createObjectURL(file);
		let accepted = false;
		try {
			const image = new Image();
			const readable = await new Promise<boolean>((resolve) => {
				image.onload = () => resolve(true);
				image.onerror = () => resolve(false);
				image.src = previewUrl;
			});
			if (generation.current !== requestGeneration) return;
			if (!readable) throw new Error('Image could not be decoded');
			setDraft({ file, previewUrl });
			if (process.env.NODE_ENV !== 'production') {
				// eslint-disable-next-line no-console -- Requested diagnostics for the cover save flow.
				console.info('[Profile cover] Local preview ready; waiting for Save Changes', { type: file.type, size: file.size });
			}
			accepted = true;
		} catch {
			if (generation.current === requestGeneration) toast.error(t('coverPhoto.invalidImage'));
		} finally {
			if (!accepted) URL.revokeObjectURL(previewUrl);
			if (generation.current === requestGeneration) setIsPreparing(false);
		}
	};

	// Only Save Changes uploads the selected file; Reset/Remove discard the local preview.
	const uploadForSave = async (): Promise<{ banner?: string } | null> => {
		if (isPreparing) return null;
		if (!draft) return {};
		if (!draft.file) return { banner: draft.previewUrl === savedBanner ? undefined : '' };
		if (draft.uploadedUrl) return { banner: draft.uploadedUrl };
		const client = clientRef.current;
		const session = sessionRef.current;
		const requestGeneration = generation.current;
		try {
			if (!client || !session) {
				if (process.env.NODE_ENV !== 'production')
					console.error('[Profile cover] Client or session is not initialized', { clientReady: !!client, sessionReady: !!session });
				throw new Error('Client or session is not initialized');
			}
			const attachment = await handleUploadPublicFile(client, session, draft.file.name, draft.file, { preserveContentType: true });
			if (generation.current !== requestGeneration) return null;
			if (!attachment?.url || !isValidUrl(attachment.url) || attachment.url.length > 255) {
				if (process.env.NODE_ENV !== 'production') {
					console.error('[Profile cover] Invalid public image URL', {
						url: attachment?.url?.split('?')[0],
						length: attachment?.url?.length
					});
				}
				throw new Error('Invalid cover URL');
			}
			// Reuse the uploaded image if UpdateAccount fails and the user retries Save.
			setDraft({ ...draft, uploadedUrl: attachment.url });
			return { banner: attachment.url };
		} catch {
			if (generation.current === requestGeneration) toast.error(t('coverPhoto.uploadFailed'));
			return null;
		}
	};

	const banner = draft?.previewUrl ?? savedBanner;
	return {
		banner,
		hasChanges: banner !== savedBanner,
		isPreparing,
		selectFile,
		uploadForSave,
		reset,
		remove: () => {
			generation.current++;
			setIsPreparing(false);
			setDraft({ previewUrl: '' });
		}
	};
}
