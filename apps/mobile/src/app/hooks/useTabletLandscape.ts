import { useContext } from 'react';
import { DeviceContext } from '../contexts/device';

const useTabletLandscape = () => {
	const { isTabletLandscape } = useContext(DeviceContext);
	return isTabletLandscape;
};

export default useTabletLandscape;
