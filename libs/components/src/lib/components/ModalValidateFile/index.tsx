import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { ModalLayout } from '../../components';

export enum ELimitSize {
	MB = '1 MB',
	KB_512 = '512 KB',
	KB_256 = '256 KB',
	MB_10 = '10 MB',
	MB_8 = '8 MB'
}

type ModalValidateFileProps = {
	open?: boolean;
	title?: string;
	content?: string;
	onClose: () => void;
};

const ModalValidateFile = ({ title, content, onClose, open = true }: ModalValidateFileProps) => {
	if (!open) {
		return null;
	}
	return (
		<ModalLayout onClose={onClose}>
			<div className="bg-red-500 rounded-lg relative p-3" data-e2e={generateE2eId('modal.validate_file')}>
				<div className="space-y-6 h-52 border-dashed border-2 flex text-center justify-center flex-col p-6">
					<Icons.FileAndFolder />
					<h3 className="text-white text-3xl font-semibold">{title}</h3>
					<h4 className="text-white text-xl">{content}</h4>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ModalValidateFile;
