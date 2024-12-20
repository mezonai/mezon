import { useRef, useState, useEffect } from "react";
import { useEscapeKeyClose } from "@mezon/core";
import { useSelector } from "react-redux";
import { selectIsInCall } from "@mezon/store";
import { Dropdown } from "flowbite-react";
import { Icons } from "@mezon/ui"

type CallSettingProps = {
	onClose: () => void;
};

export const CallSetting: React.FC<CallSettingProps> = ({ onClose }) => {
	const isInCall = useSelector(selectIsInCall);
	const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
	const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
	const [currentInputDevice, setCurrentInputDevices] = useState<MediaDeviceInfo> ();
	const [currentOutputDevice, setCurrentOutputDevice] = useState<string | null>(null);
	const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
	const [destination, setDestination] = useState<MediaStreamAudioDestinationNode | null>(null);
	
	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	
	const changeInputDevice = async(deviceId: string) => {
		const constraints = {
			video: false,
			audio: {
				deviceId: deviceId
			}
		}
		
		
		const newInputDevice = await navigator.mediaDevices.getUserMedia(constraints)
		const newInputDeviceId = newInputDevice.getAudioTracks()[0].id;
		console.log(newInputDevice.getAudioTracks())
		const result = inputDevices.find(device => device.deviceId === deviceId);
		setCurrentInputDevices(result)
	}
	
	const handleOutputDeviceChange = async (deviceId: string) => {
		try {
			if (!audioContext) {
				const context = new AudioContext();
				const destinationNode = context.createMediaStreamDestination();
				console.log({context, destinationNode})
				setAudioContext(context);
				setDestination(destinationNode);
			}
			
			if (destination && destination.stream) {
				const audioTrack = destination.stream.getAudioTracks()[0];
				if (audioTrack && "setSinkId" in audioTrack) {
					// Chỉ định thiết bị đầu ra mới
					await (audioTrack as any).setSinkId(deviceId);
					setCurrentOutputDevice(deviceId);
					console.log(`Output device changed to: ${deviceId}`);
				} else {
					console.error("This track does not support setSinkId.");
				}
			}
		} catch (error) {
			console.error("Error changing output device:", error);
		}
	};
	
	useEffect(() => {
		
		
		// Fetch audio devices
		const fetchDevices = async () => {
			try {
				const devices = await navigator.mediaDevices.enumerateDevices();
				if (isInCall) {
					const inputOption = devices.filter((device) => device.kind === "audioinput");
					const outputOption = devices.filter((device) => device.kind === "audiooutput");
					console.log("check media devices: ", inputOption, outputOption);
					// setCurrentInputDevices(inputOption[0]);
					setInputDevices(inputOption); // Update state with input devices
					setOutputDevices(outputOption); // Update state with output devices
				} else {
					setInputDevices(devices.filter((device) => device.kind === "audioinput"));
				}
			} catch (error) {
				console.error("Error fetching media devices:", error);
			}
		};
		
		fetchDevices();
	}, []);
	
	useEffect (() => {
		navigator.mediaDevices.getUserMedia({ audio: true, video: false })
			.then(function(stream) {
				const audioTracks = stream.getAudioTracks();
				const currentInput: MediaDeviceInfo | undefined = inputDevices.find(device => device.label === audioTracks[0]?.label);
				// setCurrentInputDevices(currentInput);
				console.log('Audio tracks:', audioTracks); // Xuất ra các audio track
			})
			.catch(function(error) {
				console.error('Error getting media:', error);
			});
	}, [currentInputDevice?.deviceId]);
	
	return (
		<>
			<div ref={modalRef} tabIndex={-1} className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
				<div className="fixed inset-0 bg-black opacity-80" />
				<div className="relative z-10 w-[700px]" onClick={(e) => e.stopPropagation()}>
					<div className="dark:bg-[#313338] bg-white rounded-md flex dark:text-textDarkTheme text-textLightTheme">
						<div className="flex-none basis-64 border-r-[1px] border-white flex flex-col">
							<p className={"m-6 h-fit text-lg"}>Call Setting</p>
						</div>
						<div className={"flex-1"}>
							<div className={"h-[42px]"}></div>
							<div>
								<Dropdown
									// value={pageSize}
									renderTrigger={() => (
										<div
											className={
												'flex flex-row items-center justify-between p-2 text-center dark:bg-slate-800 bg-slate-300 dark:text-contentTertiary text-colorTextLightMode border-[1px] dark:border-borderDivider border-buttonLightTertiary rounded mx-1 px-3 truncate'
											}
										>
											<span className="mr-1">{currentInputDevice?.label}</span>
											<Icons.ArrowDown />
										</div>
									)}
									label={''}
								>
									{inputDevices.map(device => (
										<Dropdown.Item
											className={'dark:hover:bg-bgModifierHover hover:bg-bgModifierHoverLight'}
											onClick={() => changeInputDevice(device.deviceId)}
											key={device.deviceId}
										>
											{device.label}
										</Dropdown.Item>
									))}
								</Dropdown>
								<Dropdown
									// value={pageSize}
									renderTrigger={() => (
										<div
											className={
												'flex flex-row items-center justify-between p-2 text-center dark:bg-slate-800 bg-slate-300 dark:text-contentTertiary text-colorTextLightMode border-[1px] dark:border-borderDivider border-buttonLightTertiary rounded mx-1 px-3'
											}
										>
											<span className="mr-1">Output hehe</span>
											<Icons.ArrowDown />
										</div>
									)}
									label={''}
								>
									{outputDevices.map(device => (
										<Dropdown.Item
											className={'dark:hover:bg-bgModifierHover hover:bg-bgModifierHoverLight'}
											onClick={() => handleOutputDeviceChange(device.deviceId)}
										>
											{device.label}
										</Dropdown.Item>
									))}
								</Dropdown>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
