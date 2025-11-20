import { Modal } from '@mezon/ui';
import { useContext, useMemo, useRef } from 'react';
import { JSONSchemaBridge } from 'uniforms-bridge-json-schema';
import { AutoForm } from 'uniforms-semantic';
import { FlowContext } from '../../../context/FlowContext';
import { changeOpenModalNodeEditing, updateNodeData } from '../../../stores/flow/flow.action';
import NodeTypes from '../nodes/NodeType';

const NodeEditingModal = () => {
	const { flowState, flowDispatch } = useContext(FlowContext);
	const formRef = useRef<any>(null);

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
			validator: (model) => {
				return null;
			}
		});
	}, [nodeConfig]);

	const handleSave = () => {
		if (formRef.current) {
			formRef.current.submit();
		}
	};

	const handleSubmit = (model: any) => {
		if (selectedNodeData && selectedNodeData.id) {
			flowDispatch(updateNodeData(selectedNodeData.id, model));
			onClose();
		}
	};

	if (!selectedNodeData || !nodeConfig || !bridge) {
		// eslint-disable-next-line no-console
		console.log('Invalid data for NodeEditingModal', { selectedNodeData, nodeConfig, bridge });
		return null;
	}

	const modelData = selectedNodeData.data;

	return (
		<Modal title={`Edit ${nodeConfig.label}`} showModal={flowState.openModalNodeEditing} onClose={onClose} classNameBox={'bg-white w-[500px]'}>
			<div className="p-4">
				<div className="mt-1">
					<div className="p-4 border border-t-0 border-gray-200 dark:border-gray-600 rounded-b-md">
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
