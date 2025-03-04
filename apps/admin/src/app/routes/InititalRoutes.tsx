import { selectIsLogin } from '@mezon/store';
import { useSelector } from 'react-redux';

import { Navigate } from 'react-router-dom';

const InitialRoutes = () => {
	const isLogin = useSelector(selectIsLogin);
	if (!isLogin) {
		return <Navigate to="" replace />;
	}
	return <Navigate to="/developers/applications" replace />;
};

export default InitialRoutes;
