import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { ChangeEvent, useRef, useState } from 'react';
import { HTMLFieldProps, connectField } from 'uniforms';
type CustomFormFieldProps = HTMLFieldProps<string[], HTMLDivElement>;
const MultiImageUploadField = connectField((props: CustomFormFieldProps) => {
	const { value = [], onChange } = props;
	const { sessionRef, clientRef } = useMezon();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const handleChooseFiles = async (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const client = clientRef.current;
			const session = sessionRef.current;
			if (!client || !session) {
				setError('Client or session is not initialized');
				return;
			}
			setIsUploading(true);
			setError(null);
			try {
				const newAttachments: string[] = [];
				for (let i = 0; i < e.target.files.length; i++) {
					const file = e.target.files[i];
					const attachment = await handleUploadFile(client, session, '', '', file.name, file);
					if (attachment && attachment.url) {
						newAttachments.push(attachment.url);
					} else {
						console.warn(`Failed to upload file: ${file.name}`);
					}
				}
				if (value === null) {
					onChange([...newAttachments]);
				} else {
					onChange([...value, ...newAttachments]);
				}
			} catch (error) {
				console.error('Error uploading files:', error);
				setError('Failed to upload files. Please try again.');
			} finally {
				setIsUploading(false);
			}
		}
	};
	const extractFileNameFromUrl = (url: string): string => {
		const parts = url.split('undefined');
		return parts[parts.length - 1].split('/').pop() || 'unknown';
	};

	const handleRemoveImage = (index: number) => {
		const newValue = value.filter((_, i) => i !== index);
		onChange(newValue);
	};
	return (
		<div className="MultiImageField mt-2">
			<label className="block text-sm">Upload Images</label>
			<div className="my-1 w-full flex flex-col items-center p-2 gap-4 bg-[#f2f3f5] dark:bg-[#2b2d31] border dark:border-[#4d4f52] rounded-md">
				<input type="file" ref={fileInputRef} hidden onChange={handleChooseFiles} accept="video/*|image/*" multiple />
				<div
					className="relative w-full h-12 cursor-pointer flex justify-center items-center bg-bgLightModeThird dark:bg-[#141416] hover:bg-[#c6ccd2] transition-colors duration-200 rounded-md"
					onClick={() => fileInputRef.current?.click()}
				>
					{isUploading ? (
						<p>Uploading...</p>
					) : (
						<>
							<Icons.SelectFileIcon className="w-8 h-8 text-gray-400" />
							<p className="ml-2">Select Images</p>
						</>
					)}
				</div>
				{value?.length > 0 && (
					<div className="w-full flex gap-1 flex-col ">
						{value.map((file, index) => (
							<div key={index} className="flex justify-between items-center bg-white dark:bg-[#36393f] p-2 rounded-md">
								<span className="truncate max-w-[100%]">{extractFileNameFromUrl(file)}</span>
								<button className="text-red-500 hover:text-red-700" onClick={() => handleRemoveImage(index)}>
									<Icons.CloseIcon className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				)}
				{error && <p className="text-red-500">{error}</p>}
			</div>
		</div>
	);
});
export default MultiImageUploadField;
