type SocketStatus = 'connected' | 'disconnected' | 'connecting';

let _socketStatus: SocketStatus = 'disconnected';

export const socketState = {
	get status(): SocketStatus {
		return _socketStatus;
	},
	set status(value: SocketStatus) {
		_socketStatus = value;
	},
	get isConnected(): boolean {
		return _socketStatus === 'connected';
	}
};
