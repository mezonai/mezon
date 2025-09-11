import { ModalLayout } from '../../components';

export enum ELimitSize {
	MB = '1 MB',
	KB_512 = '512 KB',
	KB_256 = '256 KB'
}

type props = {
	openModal: boolean;
	handleClose: () => void;
	sizeLimit?: ELimitSize;
};

export const ModalOverData = ({ openModal, handleClose, sizeLimit = ELimitSize.MB }: props) => {
	if (!openModal) {
		return null;
	}
	return (
		<ModalLayout onClose={handleClose}>
			<div className="bg-red-500 rounded-lg relative">
				<div className="space-y-6 h-52 border-dashed border-2 flex text-center justify-center flex-col">
					<img
						className="w-60 h-60 absolute top-[-130px] left-1/2 translate-x-[-50%]"
						src="https://mezon.ai/assets/images/qr-mezon.png"
						alt="file"
					/>
					<h3 className="text-white text-4xl font-semibold">Your files are too powerful</h3>
					<h4 className="text-white text-xl">Max file size is {sizeLimit}, please!</h4>
				</div>
			</div>
		</ModalLayout>
	);
};

export const ModalErrorTypeUpload = ({ openModal, handleClose }: props) => {
	if (!openModal) {
		return null;
	}
	return (
		<ModalLayout onClose={handleClose}>
			<div className="bg-red-500 rounded-lg relative">
				<div className="space-y-6 h-52 border-dashed border-2 flex text-center justify-center flex-col">
					<img className="w-60 h-60 absolute top-[-130px] left-1/2 translate-x-[-50%]" src="assets/images/file-and-folder.png" alt="file" />
					<h3 className="text-white text-4xl font-semibold">Only image files are allowed</h3>
					<h4 className="text-white text-xl">Just upload type file (JPEG, PNG), please!</h4>
				</div>
			</div>
		</ModalLayout>
	);
};
