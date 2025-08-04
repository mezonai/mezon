import { Modal } from '@mezon/ui';
import { useRef } from 'react';
import { JSONSchemaBridge } from 'uniforms-bridge-json-schema';
import { AutoForm } from 'uniforms-semantic';
import * as yup from 'yup';
import CustomTextField from '../../../components/InputField/CustomTextField';
type FormData = {
	flowName: string;
	description: string;
};

interface ValidationError {
	path: string;
	message: string;
}
interface ValidatorResult {
	details: ValidationError[];
}

const schema = yup.object().shape({
	flowName: yup.string().required('Flow Name is required'),
	description: yup.string()
});

interface SaveFlowModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	changeFlowData?: (data: FormData) => void;
	flowData?: FormData;
}
const SaveFlowModal = ({ open, onClose, title, changeFlowData, flowData }: SaveFlowModalProps) => {
	const submitBtnRef = useRef<any>(null);
	const validator = (model: unknown): ValidatorResult | null => {
		try {
			schema.validateSync(model, { abortEarly: false });
			return null; // no error
		} catch (e: unknown) {
			if (e instanceof yup.ValidationError) {
				// return list error of yup validation
				const details = e.inner.map((error) => ({
					path: error.path ?? '',
					message: error.message
				}));
				return { details };
			}
			return null;
		}
	};

	const bridge = new JSONSchemaBridge({
		schema: {
			type: 'object',
			properties: {
				flowName: { type: 'string', uniforms: { component: CustomTextField, label: 'Flow Name', name: 'flowName' } },
				description: { type: 'string', uniforms: { component: CustomTextField, label: 'Discription', name: 'description' } }
			},
			required: []
		},
		validator
	});
	const confirmSave = () => {
		const data = submitBtnRef.current?.getModel();
		submitBtnRef.current?.submit();
		const validationResult = validator(data);
		if (validationResult) {
			return;
		}
		changeFlowData?.(data);
	};
	const handleSubmitForm = (formData: FormData) => {
		changeFlowData?.(formData);
		onClose();
	};
	return (
		<Modal classNameBox='bg-slate-200 dark:bg-slate-500 rounded-lg' classNameHeader='bg-slate-300 dark:bg-slate-600 rounded-t-lg' confirmButton={confirmSave} title={title} showModal={open} onClose={onClose}>
			<div className="p-4 hidden-submit-field">
				<AutoForm onSubmit={handleSubmitForm} model={flowData} ref={submitBtnRef} schema={bridge}></AutoForm>
			</div>
		</Modal>
	);
};
export default SaveFlowModal;
