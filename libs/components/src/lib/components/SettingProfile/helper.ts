import { toastActions } from '@mezon/store';
import { handleUploadFile } from '@mezon/transport';
import type { IUserAccount } from '@mezon/utils';
import { MAX_FILE_SIZE_1MB } from '@mezon/utils';
import { toast } from 'react-toastify';

export const processImage = async (
	imageCropped: File | null,
	dispatch: any,
	clientRef: React.MutableRefObject<any>,
	sessionRef: React.MutableRefObject<any>,
	clanId: string,
	userProfile: IUserAccount | null | undefined,
	setUrlImage: React.Dispatch<React.SetStateAction<string>>,
	setImageObject: React.Dispatch<React.SetStateAction<null>>,
	setImageCropped: React.Dispatch<React.SetStateAction<null>>,
	setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
	setOpenModal: React.Dispatch<React.SetStateAction<boolean>>,
	setFlagOption?: React.Dispatch<React.SetStateAction<boolean>>
) => {
	let isMounted = true;

	if (!(imageCropped instanceof File)) {
		toast.error('Invalid file format');
		return;
	}

	if (imageCropped.size > MAX_FILE_SIZE_1MB) {
		if (isMounted) {
			setOpenModal(true);
			setImageObject(null);
			setImageCropped(null);
			toast.error('File size exceeds 1MB limit');
		}
		return;
	}

	if (!clientRef.current || !sessionRef.current) {
		dispatch(toastActions.addToastError({ message: 'Client or session is not initialized' }));
		return;
	}

	try {
		if (isMounted) setIsLoading(true);

		const imageAvatarResize = imageCropped as File;

		const attachment = await handleUploadFile(clientRef.current, sessionRef.current, imageAvatarResize.name, imageAvatarResize, NaN, true);

		if (isMounted) {
			setUrlImage(attachment.url || '');
			setFlagOption && setFlagOption(attachment.url !== userProfile?.user?.avatar_url);
			setImageObject(null);
			setImageCropped(null);
			setIsLoading(false);
		}
	} catch (error) {
		if (isMounted) {
			toast.error('Error uploading avatar image');
		}
	}

	return () => {
		isMounted = false;
	};
};
