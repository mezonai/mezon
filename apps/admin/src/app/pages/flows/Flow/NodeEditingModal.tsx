import { Modal } from '@mezon/ui';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
		setCurrentModel(null);
		flowDispatch(changeOpenModalNodeEditing(false));
	};

	const selectedNodeData = flowState.nodeEdit;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [currentModel, setCurrentModel] = useState<any>(null);

	useEffect(() => {
		if (selectedNodeData?.data) {
			setCurrentModel(selectedNodeData.data);
		}
	}, [selectedNodeData?.data]);

	const nodeConfig = useMemo(() => {
		if (!selectedNodeData?.label) return null;
		const baseConfig = NodeTypes.find((item) => item.label === selectedNodeData.label);

		if (baseConfig?.isDynamicSchema && baseConfig?.getDynamicConfig) {
			const dynamicConfig = baseConfig.getDynamicConfig(currentModel || selectedNodeData.data);
			return {
				...baseConfig,
				schema: dynamicConfig.schema,
				bridgeSchema: dynamicConfig.bridgeSchema
			};
		}

		return baseConfig;
	}, [selectedNodeData?.label, selectedNodeData?.data, currentModel]);

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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleModelChange = useCallback((key: string, value: any) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		setCurrentModel((prev: any) => ({
			...prev,
			[key]: value
		}));
	}, []);

	if (!selectedNodeData || !nodeConfig || !bridge) {
		return null;
	}

	const modelData = currentModel || selectedNodeData.data || {};
	const isEmbedMessage = nodeConfig.label === 'Embed Message';

	if (isEmbedMessage) {
		return (
			flowState.openModalNodeEditing && (
				<>
					<div className="fixed inset-0 z-50 flex items-center justify-center p-10 overflow-hidden outline-none focus:outline-none">
						{/* Backdrop */}
						<div className="fixed inset-0 bg-black opacity-80" onClick={onClose}></div>

						{/* Custom Modal Content */}
						<div className="relative w-full h-full bg-white flex flex-col rounded-2xl shadow-2xl transition-all">
							{/* Header */}
							<div className="flex items-center justify-between p-4 border-b border-gray-100">
								<h3 className="text-xl font-bold text-gray-800">Edit {nodeConfig.label}</h3>
								<button
									className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
									onClick={onClose}
								>
									<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path
											d="M1 1L13 13M1 13L13 1"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</button>
							</div>

							{/* Body - Allow child components to handle their own overflow */}
							<div className="flex-1 flex flex-col min-h-0">
								<div className="hidden-submit-field h-full">
									<AutoForm ref={formRef} schema={bridge} model={modelData} onSubmit={handleSubmit} onChange={handleModelChange} />
								</div>
							</div>

							{/* Footer */}
							<div className="flex justify-end p-4 border-t border-gray-100 bg-gray-50/50">
								<button
									type="button"
									className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition-all active:scale-95"
									onClick={handleSave}
								>
									Save Changes
								</button>
							</div>
						</div>
					</div>
					<div className="fixed inset-0 z-40 opacity-25"></div>
				</>
			)
		);
	}

	return (
		<Modal
			title={`Edit ${nodeConfig.label}`}
			showModal={flowState.openModalNodeEditing}
			onClose={onClose}
			classNameBox={'bg-white w-[500px] rounded-3xl'}
		>
			<div className="p-4">
				<div className="mt-1">
					<div className="p-6 border rounded-3xl border-t-1 border-gray-200 dark:border-gray-600">
						<div className="hidden-submit-field">
							<AutoForm ref={formRef} schema={bridge} model={modelData} onSubmit={handleSubmit} onChange={handleModelChange} />
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
