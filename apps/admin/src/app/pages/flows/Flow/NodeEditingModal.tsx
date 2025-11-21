import { Modal } from '@mezon/ui';
import { useContext, useMemo, useRef } from 'react';
import { JSONSchemaBridge } from 'uniforms-bridge-json-schema';
import { AutoForm } from 'uniforms-semantic';
import { FlowContext } from '../../../context/FlowContext';
import { changeOpenModalNodeEditing, updateNodeData } from '../../../stores/flow/flow.action';
import NodeTypes from '../nodes/NodeType';

const NodeEditingModal = () => {
	const { flowState, flowDispatch } = useContext(FlowContext);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const formRef = useRef<any>(null);
	const isSaving = useRef(false);

	const onClose = () => {
		flowDispatch(changeOpenModalNodeEditing(false));
	};

	const selectedNodeData = flowState.nodeEdit;

	const nodeConfig = useMemo(() => {
		if (!selectedNodeData?.label) return null;
		return NodeTypes.find((item) => item.label === selectedNodeData.label);
	}, [selectedNodeData?.label]);

	const bridge = useMemo(() => {
		if (!nodeConfig) return null;
		return new JSONSchemaBridge({
			schema: nodeConfig.bridgeSchema,
			validator: (model: unknown) => {
				try {
					nodeConfig.schema.validateSync(model, { abortEarly: false });
					return null;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (e: any) {
					if (e.inner) {
						return {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							details: e.inner.map((err: any) => ({
								path: err.path,
								message: err.message
							}))
						};
					}
					return { details: [] };
				}
			}
		});
	}, [nodeConfig]);

	const handleSave = () => {
		if (formRef.current) {
			isSaving.current = true;
			formRef.current.submit();
		}
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleSubmit = (model: any) => {
		if (!isSaving.current) return;

		if (selectedNodeData && selectedNodeData.id) {
			flowDispatch(updateNodeData(selectedNodeData.id, model));
			onClose();
		}
		isSaving.current = false;
	};

	if (!selectedNodeData || !nodeConfig || !bridge) {
		return null;
	}

	const modelData = selectedNodeData.data || {};

	return (
		<Modal
			title={`Edit ${nodeConfig.label}`}
			showModal={flowState.openModalNodeEditing}
			onClose={onClose}
			classNameBox={'bg-white w-[500px] rounded-b-lg'}
		>
			<div className="p-4">
				<div className="mt-1">
					<div className="p-6 border border-t-0 border-gray-200 dark:border-gray-600">
						<div className="hidden-submit-field">
							<AutoForm ref={formRef} schema={bridge} model={modelData} onSubmit={handleSubmit}></AutoForm>
						</div>
					</div>
				</div>
			</div>
			<div className="flex justify-end mt-4">
				<button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg mr-2" onClick={handleSave}>
					Save
				</button>
			</div>
		</Modal>
	);
};

export default NodeEditingModal;
