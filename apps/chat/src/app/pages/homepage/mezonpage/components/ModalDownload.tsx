import mezonPackage from '@mezon/package-js';
import { Icons } from '@mezon/ui';
import { useEffect, useRef } from 'react';

interface ModalDownloadProps {
	isOpen: boolean;
	onClose: () => void;
}

export const ModalDownload: React.FC<ModalDownloadProps> = ({ isOpen, onClose }) => {
	const version = mezonPackage.version;
	const modalRef = useRef<HTMLDivElement>(null);

	const downloadLinks = {
		windows: 'https://apps.microsoft.com/detail/9pf25lf1fj17',
		windowsPortable: `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64-portable.exe`,
		macos: 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12',
		macosIntel: 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12',
		linux: `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-linux-amd64.deb`
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		const handleEscKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleEscKey);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscKey);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4" onClick={onClose}>
			<div
				ref={modalRef}
				className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-[9999] border border-purple-200 transform transition-all"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold text-gray-800">Choose your platform</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div className="flex flex-col gap-2">
					<a
						href={downloadLinks.windows}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300 text-purple-500 hover:text-pink-500"
					>
						<Icons.Windows className="w-6 h-6" />
						<span className="font-medium text-gray-800 group-hover:text-purple-600">Windows (Store)</span>
					</a>
					<a
						href={downloadLinks.windowsPortable}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300 text-purple-500 hover:text-pink-500"
					>
						<Icons.Windows className="w-6 h-6" />
						<span className="font-medium text-gray-800 group-hover:text-purple-600">Windows (Portable)</span>
					</a>
					<a
						href={downloadLinks.macos}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300 text-purple-500 hover:text-pink-500"
					>
						<Icons.Apple className="w-6 h-6" />
						<span className="font-medium text-gray-800 group-hover:text-purple-600">macOS (Apple)</span>
					</a>
					<a
						href={downloadLinks.macosIntel}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300 text-purple-500 hover:text-pink-500"
					>
						<Icons.Apple className="w-6 h-6" />
						<span className="font-medium text-gray-800 group-hover:text-purple-600">macOS (Intel)</span>
					</a>
					<a
						href={downloadLinks.linux}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300 text-purple-500 hover:text-pink-500"
					>
						<Icons.Linux className="w-6 h-6" />
						<span className="font-medium text-gray-800 group-hover:text-purple-600">Linux</span>
					</a>
				</div>
			</div>
		</div>
	);
};
