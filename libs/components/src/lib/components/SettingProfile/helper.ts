import { toastActions } from '@mezon/store';
import { handleUploadFile } from '@mezon/transport';
import { MAX_FILE_SIZE_1MB, resizeFileImage } from '@mezon/utils';
import { ApiAccount } from 'mezon-js/api.gen';

export const processImage = async (
	imageCropped: File | null,
	dispatch: any,
	clientRef: React.MutableRefObject<any>,
	sessionRef: React.MutableRefObject<any>,
	clanId: string,
	userProfile: ApiAccount | null | undefined,
	setUrlImage: React.Dispatch<React.SetStateAction<string>>,
	setImageObject: React.Dispatch<React.SetStateAction<null>>,
	setImageCropped: React.Dispatch<React.SetStateAction<null>>,
	setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
	setOpenModal: React.Dispatch<React.SetStateAction<boolean>>,
	setFlagOption?: React.Dispatch<React.SetStateAction<boolean>>
) => {
	let isMounted = true;

	if (!(imageCropped instanceof File)) {
		dispatch(toastActions.addToastError({ message: 'Invalid file format' }));
		return;
	}

	if (imageCropped.size > MAX_FILE_SIZE_1MB) {
		if (isMounted) {
			setOpenModal(true);
			setImageObject(null);
			setImageCropped(null);
			dispatch(toastActions.addToastError({ message: 'File size exceeds 1MB limit' }));
		}
		return;
	}

	if (!clientRef.current || !sessionRef.current) {
		dispatch(toastActions.addToastError({ message: 'Client or session is not initialized' }));
		return;
	}

	try {
		if (isMounted) setIsLoading(true);

		const imageAvatarResize = (await resizeFileImage(imageCropped, 120, 120, 'file', 80, 80)) as File;

		const attachment = await handleUploadFile(
			clientRef.current,
			sessionRef.current,
			clanId,
			userProfile?.user?.id || '0',
			imageAvatarResize.name,
			imageAvatarResize
		);

		if (isMounted) {
			setUrlImage(attachment.url || '');
			setFlagOption && setFlagOption(attachment.url !== userProfile?.user?.avatar_url);
			setImageObject(null);
			setImageCropped(null);
			setIsLoading(false);
		}
	} catch (error) {
		if (isMounted) {
			dispatch(toastActions.addToastError({ message: 'Error uploading avatar image' }));
		}
	}

	return () => {
		isMounted = false;
	};
};
