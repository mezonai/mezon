import { useTranslation } from 'react-i18next';
import ModalValidateFile, { ELimitSize } from '.';

export const ModalOverData = ({ onClose, open, size = ELimitSize.MB }: { onClose: () => void; open?: boolean; size?: string }) => {
	const { t } = useTranslation('common');
	return <ModalValidateFile onClose={onClose} open={open} title={t('filesTooPowerful')} content={t('maxFileSize', { sizeLimit: size })} />;
};

export const ModalErrorTypeUpload = ({ onClose, open }: { onClose: () => void; open?: boolean; size?: string }) => {
	const { t } = useTranslation('common');
	return <ModalValidateFile onClose={onClose} open={open} title={t('onlyImageFiles')} content={t('uploadImageTypes')} />;
};

export const ModalErrorTypeUploadVoice = ({ onClose, open }: { onClose: () => void; open?: boolean; size?: string }) => {
	const { t } = useTranslation('common');
	return <ModalValidateFile onClose={onClose} open={open} title={t('onlyAudioFiles')} content={t('uploadAudioTypes')} />;
};
