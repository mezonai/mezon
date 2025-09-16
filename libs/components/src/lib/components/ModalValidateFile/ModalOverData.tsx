import ModalValidateFile, { ELimitSize } from '.';

export const ModalOverData = ({ onClose, open, size = ELimitSize.MB }: { onClose: () => void; open?: boolean; size?: string }) => {
	return <ModalValidateFile onClose={onClose} open={open} title={'Your files are too powerful'} content={`Max file size is ${size}, please!`} />;
};

export const ModalErrorTypeUpload = ({ onClose, open, size = ELimitSize.MB }: { onClose: () => void; open?: boolean; size?: string }) => {
	return (
		<ModalValidateFile onClose={onClose} open={open} title={'Only image files are allowed'} content={`Just upload type file images, please!`} />
	);
};
