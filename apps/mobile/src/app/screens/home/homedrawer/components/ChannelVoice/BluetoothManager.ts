import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const BluetoothModule = NativeModules?.BluetoothModule;
const bluetoothEventEmitter = Platform.OS === 'android' ? new NativeEventEmitter(BluetoothModule) : undefined;

type BluetoothConnectionChangeEvent = {
	connected: boolean;
};

class BluetoothManager {
	private listeners: Array<ReturnType<typeof bluetoothEventEmitter.addListener>>;

	constructor() {
		this.listeners = [];
	}

	async requestPermissions(): Promise<boolean> {
		if (Platform.OS === 'android' && Platform.Version >= 31) {
			try {
				// For Android 12+ use the native module method
				return await BluetoothModule?.requestPermissions();
			} catch (err) {
				console.error('Failed to request Bluetooth permissions:', err);
				return false;
			}
		}

		// For iOS or older Android, permissions handled differently
		return true;
	}

	async isBluetoothHeadsetConnected(): Promise<boolean> {
		try {
			// Request permissions first
			if (Platform.OS === 'android' && Platform.Version >= 31) {
				await this.requestPermissions();
			}

			// Then check connection status
			return await BluetoothModule.isBluetoothHeadsetConnected();
		} catch (error) {
			console.error('Failed to check Bluetooth headset connection:', error);
			return false;
		}
	}

	async startListeningForConnectionChanges(callback: (connected: boolean) => void): Promise<void> {
		// Request permissions first
		if (Platform.OS === 'android' && Platform.Version >= 31) {
			const hasPermission = await this.requestPermissions();
			if (!hasPermission) {
				console.warn('Bluetooth permissions denied');
				return;
			}
		}

		// Start the native listener
		BluetoothModule?.startBluetoothListener();

		// Register for events
		const listener = bluetoothEventEmitter.addListener('bluetoothHeadsetConnectionChanged', (event: BluetoothConnectionChangeEvent) => {
			callback(event.connected);
		});

		this.listeners.push(listener);
	}

	stopListeningForConnectionChanges(): void {
		// Cleanup all event listeners
		this.listeners.forEach((listener) => listener.remove());
		this.listeners = [];

		// Stop the native listener
		BluetoothModule?.stopBluetoothListener();
	}
}

export default new BluetoothManager();
