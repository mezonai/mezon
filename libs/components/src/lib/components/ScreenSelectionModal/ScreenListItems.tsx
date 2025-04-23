import { memo, useCallback, useEffect, useState } from 'react';
import ScreenItems from './ScreenItem';

type ScreenListItemsProp = {
	source: string;
	onClose: () => void;
	audio: boolean;
};
type ScreenItems = {
	id: string;
	name: string;
	thumbnail: string;
};

const ScreenListItems = memo(({ source, onClose, audio }: ScreenListItemsProp) => {
	const [screens, setScreens] = useState<ScreenItems[]>([]);

	const getListScreen = useCallback(async () => {
		const screenSources = await window.electron.getScreenSources(source);
		setScreens(screenSources);
	}, [source]);

	useEffect(() => {
		getListScreen();
	}, [getListScreen]);

	return (
		<>
			{screens.map((screen) => (
				<ScreenItems key={screen.id} onClose={onClose} id={screen.id} name={screen.name} thumbnail={screen.thumbnail} audio={audio} />
			))}
		</>
	);
});

export default ScreenListItems;
