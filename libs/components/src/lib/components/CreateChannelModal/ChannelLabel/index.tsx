interface ChannelLabelModalProps {
	labelProp: string;
}
export const ChannelLabelModal: React.FC<ChannelLabelModalProps> = ({ labelProp }) => {
	return <div className="self-stretch text-sm font-bold leading-normal">{labelProp}</div>;
};
