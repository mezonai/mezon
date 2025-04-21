import { selectAppChannelById, selectTheme, useAppSelector } from '@mezon/store';
import { ApiChannelAppResponseExtend } from '@mezon/utils';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { ChannelApps } from '../pages/channel/ChannelApp';

const ChannelAppLayoutMobile = () => {
	const { channelId } = useParams();
	const location = useLocation();
	const channelApp = useAppSelector((state) => selectAppChannelById(state, channelId || ''));

	let appChannelToresolve: ApiChannelAppResponseExtend = channelApp;
	if (location?.search) {
		const query = new URLSearchParams(location?.search);
		const code = query.get('code');
		const subpath = query.get('subpath');
		appChannelToresolve = {
			...channelApp,
			code: code as string,
			subpath: subpath as string
		};
	}

	const appearanceTheme = useSelector(selectTheme);
	return (
		<div className={`flex flex-1 justify-center overflow-y-auto overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}>
			<ChannelApps appChannel={appChannelToresolve} />
		</div>
	);
};

export default ChannelAppLayoutMobile;
