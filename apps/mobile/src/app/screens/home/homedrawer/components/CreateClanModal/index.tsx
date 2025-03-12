import { useTheme } from '@mezon/mobile-ui';
import { MezonModal } from '../../../../../componentUI/MezonModal';
import ContentModal from './ContentModal';
import { style } from './CreateClanModal.styles';

interface ICreateClanProps {
	visible: boolean;
	setVisible: (value: boolean) => void;
}
const CreateClanModal = ({ visible, setVisible }: ICreateClanProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<MezonModal
			visible={visible}
			visibleChange={(visible) => {
				setVisible(visible);
			}}
			headerStyles={styles.headerModal}
		>
			<ContentModal visible={visible} setVisible={setVisible} />
		</MezonModal>
	);
};

export default CreateClanModal;
