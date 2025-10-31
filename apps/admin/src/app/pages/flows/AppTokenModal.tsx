/* eslint-disable no-console */
import { Modal } from '@mezon/ui';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { JSONSchemaBridge } from 'uniforms-bridge-json-schema';
import { AutoForm } from 'uniforms-semantic';
import * as yup from 'yup';
import CustomTextField from '../../components/InputField/CustomTextField';

type FormData = {
	token: string;
};

interface ValidationError {
	path: string;
	message: string;
}

interface ValidatorResult {
	details: ValidationError[];
}

const schema = yup.object().shape({
	token: yup.string().required('Token is required')
});

interface AppTokenModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	onSave?: (data: FormData) => void;
}

const AppTokenModal = ({ open, onClose, title, onSave }: AppTokenModalProps) => {
	const submitBtnRef = useRef<any>(null);
	const { t } = useTranslation('adminApplication');

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
				token: { type: 'string', uniforms: { component: CustomTextField, label: 'Token', name: 'token' } }
			},
			required: ['token']
		},
		validator
	});

	const handleSubmitForm = (formData: FormData) => {
		onSave?.(formData);
		onClose();
	};

	return (
		<Modal
			classNameBox="bg-slate-200 dark:bg-slate-500 rounded-lg"
			classNameHeader="bg-slate-300 dark:bg-slate-600 rounded-t-lg"
			title={title}
			showModal={open}
			onClose={onClose}
		>
			<div className="p-4 hidden-submit-field">
				<AutoForm onSubmit={handleSubmitForm} ref={submitBtnRef} schema={bridge}></AutoForm>
				<div className="flex justify-end mt-4">
					<button
						type="button"
						className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg "
						onClick={() => submitBtnRef.current?.submit()}
					>
						{t('flows.appTokenModal.saveButton')}
					</button>
				</div>
			</div>
		</Modal>
	);
};
export default AppTokenModal;
