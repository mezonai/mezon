import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';
import flowService from '../../services/flowService';

type CustomChannelSelectFieldProps = HTMLFieldProps<string, HTMLDivElement> & {
	label?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unused-vars
function CustomChannelSelectField({ onChange, value, label, disabled, name, ...props }: CustomChannelSelectFieldProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [channels, setChannels] = useState<{ channel_id: string; channel_name: string }[]>([]);
	const [loading, setLoading] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const { applicationId } = useParams<{ applicationId: string }>();

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	useEffect(() => {
		const fetchChannels = async () => {
			if (!applicationId) return;

			setLoading(true);
			try {
				const channelList = await flowService.getChannelsByApplication(applicationId);
				setChannels(channelList);
			} catch (error) {
				setChannels([]);
			} finally {
				setLoading(false);
			}
		};

		void fetchChannels();
	}, [applicationId]);

	const selectedChannel = useMemo(() => {
		if (!Array.isArray(channels) || !value) return null;
		return channels.find((channel) => channel.channel_id === value);
	}, [channels, value]);

	const handleSelect = (channelId: string) => {
		if (disabled || loading) return;
		onChange(channelId);
		setIsOpen(false);
	};

	const displayValue = useMemo(() => {
		if (loading) {
			return <span className="text-gray-400">Loading channels...</span>;
		}
		if (selectedChannel) {
			return selectedChannel.channel_name;
		}
		if (value) {
			return <span className="text-gray-500">{value}</span>;
		}
		return <span className="text-gray-400">Select channel...</span>;
	}, [loading, selectedChannel, value]);

	return (
		<div className="CustomChannelSelectField mt-2 relative" ref={containerRef}>
			{label && <label className="block text-sm mb-1">{label}</label>}

			<div
				onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
				className={`
					flex items-center justify-between
					bg-transparent border rounded-sm px-2 py-2
					cursor-pointer select-none
					outline-none
					${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
					dark:border-gray-600 dark:text-white
					${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
				`}
			>
				<span className="truncate text-sm">{displayValue}</span>
				<svg
					className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</div>

			{isOpen && !loading && (
				<ul className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-sm shadow-lg max-h-60 overflow-auto">
					{channels.map((channel) => (
						<li
							key={channel.channel_id}
							onClick={() => handleSelect(channel.channel_id)}
							className={`
								px-3 py-2 cursor-pointer text-sm
								hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white
							`}
						>
							{channel.channel_name}
						</li>
					))}
					{channels.length === 0 && <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">No channels available</li>}
				</ul>
			)}
		</div>
	);
}

export default connectField<CustomChannelSelectFieldProps>(CustomChannelSelectField);
