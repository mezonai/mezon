import { memo } from 'react';

const DirectMessageIndexComponent = () => {
	return (
		<div className="flex items-center justify-center h-full w-full">
			<div className="text-center">
				<h2 className="text-2xl font-medium mb-2">Your messages</h2>
				<p className="text-gray-500">Select a conversation to start messaging</p>
			</div>
		</div>
	);
};

export default memo(DirectMessageIndexComponent);
