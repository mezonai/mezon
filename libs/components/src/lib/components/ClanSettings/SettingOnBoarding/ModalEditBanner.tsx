import { useEscapeKeyClose } from '@mezon/core';
import { Button, ButtonLoading, Icons } from '@mezon/ui';
import { sanitizeUrlSecure } from '@mezon/utils';
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

type ModalBannerProps = {
    graphic?: { id: string; source: string };
    handleCloseModal: () => void;
    onUpload: (file: File) => Promise<void>;
    onUpdate?: (id: string, newFile: File | null) => Promise<void>;
};

const ModalBanner = ({ graphic, handleCloseModal, onUpload, onUpdate }: ModalBannerProps) => {
    const isEdit = !!graphic;

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(graphic?.source ?? '');
    const [isLoading, setIsLoading] = useState(false);

    const fileRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    useEscapeKeyClose(modalRef, handleCloseModal);

    useEffect(() => {
        if (graphic?.source) {
            setPreviewUrl(graphic.source);
        }
    }, [graphic]);

    const handleChooseFile = (e: ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        const img = new Image();
        const objectUrl = URL.createObjectURL(selected);

        img.onload = () => {
            const width = img.width;
            const height = img.height;
            const aspectRatio = width / height;

            if (width < 1280 || height < 720 || Math.abs(aspectRatio - 16 / 9) > 0.1) {
                alert('Please upload a banner image with minimum size 1280x720 and 16:9 aspect ratio.');
                URL.revokeObjectURL(objectUrl);
                return;
            }
            setFile(selected);
            setPreviewUrl(objectUrl);
        };

        img.onerror = () => {
            alert('Invalid image file.');
            URL.revokeObjectURL(objectUrl);
        };

        img.src = objectUrl;
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            if (isEdit && onUpdate) {
                await onUpdate(graphic.id, file);
            } else if (file) {
                await onUpload(file);
            }
            handleCloseModal();
        } catch (err) {
            console.error('Upload/update failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <div
            ref={modalRef}
            tabIndex={-1}
            className="relative w-full flex flex-col max-w-[684px] bg-theme-setting-primary rounded-lg overflow-hidden"
        >
            <div className="flex justify-end p-4 border-b border-theme-primary">
                <Button
                    className="rounded-full w-6 h-6 text-2xl !p-0 opacity-50 text-theme-primary-hover"
                    onClick={handleCloseModal}
                >
                    ×
                </Button>
            </div>

            <div className="flex-1 flex flex-col gap-4 px-5 py-4 overflow-y-auto hide-scrollbar">
                <div className="text-center select-none">
                    <p className="text-2xl font-semibold text-theme-primary-active">
                        {isEdit ? 'Edit Banner' : 'Upload Banner'}
                    </p>
                    <p className="text-base">File should be PNG, JPG, or GIF</p>
                </div>

                <div>
                    <p className="text-xs font-bold uppercase text-theme-primary-active mb-1">Preview</p>
                    <div className="h-56 w-full bg-item-theme rounded-lg flex items-center justify-center border border-theme-primary overflow-hidden">
                        {previewUrl ? (
                            <PreviewBannerBox preview={previewUrl} />
                        ) : (
                            <Icons.UploadImage className="w-16 h-16" />
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-bold uppercase text-theme-primary-active mb-1">
                        File {isEdit && ' (CANNOT CHANGE)'}
                    </p>
                    <div className="flex justify-between items-center border border-theme-primary rounded-lg px-3 py-2">
                        <p className="truncate flex-1 select-none">
                            {file?.name || (graphic?.source?.split('/').pop() || 'No file chosen')}
                        </p>
                        {!isEdit && (
                            <button className="btn-primary btn-primary-hover rounded-lg px-2 py-1 relative overflow-hidden">
                                Browse
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.gif"
                                    className="absolute w-full h-full top-0 left-0 opacity-0 cursor-pointer"
                                    onChange={handleChooseFile}
                                    ref={fileRef}
                                    onKeyDown={handleOnEnter}
                                />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button className="hover:underline bg-transparent" onClick={handleCloseModal}>
                        Cancel
                    </Button>
                    <ButtonLoading
                        label={isEdit ? 'Save' : 'Upload'}
                        className="btn-primary btn-primary-hover rounded-lg px-4 py-2"
                        disabled={isEdit ? false : !file || isLoading}
                        // loading={isLoading}
                        onClick={handleSave}
                    />
                </div>
            </div>
        </div>
    );
};

export default ModalBanner;

const PreviewBannerBox = ({ preview }: { preview: string }) => {
    const sanitizedPreview = sanitizeUrlSecure(preview, {
        allowedProtocols: ['https:', 'http:', 'data:', 'blob:'],
        allowedDomains: ['cdn.mezon.ai', 'tenor.com'],
        maxLength: 2048
    });

    return (
        <div className="w-full h-full flex items-center justify-center">
            <img src={sanitizedPreview} alt="banner preview" className="max-h-full max-w-full object-contain" />
        </div>
    );
};
