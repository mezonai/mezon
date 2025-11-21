import { Modal } from '@mezon/ui';
import { useContext } from 'react';
import { FlowContext } from '../../../context/FlowContext';
import { changeOpenModalNodeDetail } from '../../../stores/flow/flow.action';

const NodeDetailModal = () => {
	const { flowState, flowDispatch } = useContext(FlowContext);
	const onClose = () => {
		flowDispatch(changeOpenModalNodeDetail(false));
	};
	const nodeData = flowState.selectedNode;
	return (
		<Modal title={nodeData?.label} showModal={flowState.openModalNodeDetail} onClose={onClose} classNameBox={'bg-white'}>
			<div className="p-2">
				<div className="grid grid-cols-3 font-semibold p-2 border-b-[1px] border-gray-300">
					<div>Label</div>
					<div>Name</div>
					<div>Type</div>
				</div>
				{nodeData?.parameters?.map((parameter, index) => (
					<div key={index} className="grid grid-cols-3 p-2 border-b-[1px] border-gray-300">
						<div>{parameter.label}</div>
						<div>{parameter.name}</div>
						<div>{parameter.type}</div>
					</div>
				))}
			</div>
		</Modal>
	);
};
export default NodeDetailModal;
