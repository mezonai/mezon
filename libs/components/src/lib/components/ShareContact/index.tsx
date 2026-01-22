import type { ChannelMembersEntity } from '@mezon/store';
import { generateE2eId, normalizeString } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalLayout } from '../../components';
import { ContactPreview } from './ContactPreview';
import { ShareItemRow } from './ShareItemRow';
import { useShareContact } from './useShareContact';

type ShareContactModalProps = {
	contactUser: ChannelMembersEntity;
	onClose: () => void;
};

const ShareContactModal = ({ contactUser, onClose }: ShareContactModalProps) => {
	const { t } = useTranslation('shareContact');

	const searchInputRef = useRef<HTMLInputElement>(null);
	const [searchText, setSearchText] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => {
			searchInputRef.current?.focus();
		}, 200);
		return () => clearTimeout(timer);
	}, []);

	const { selectedItemIds, isSending, shareItemsList, handleToggleItem, handleShareContact, setSelectedItemIds } = useShareContact({
		contactUser,
		t
	});

	const handleCloseModal = () => {
		setSelectedItemIds([]);
		setSearchText('');
		onClose();
	};

	const handleShare = async () => {
		const success = await handleShareContact();
		if (success) {
			handleCloseModal();
		}
	};

	const normalizedSearchText = normalizeString(searchText);

	const filteredItems = useMemo(() => {
		if (!normalizedSearchText) return shareItemsList;
		return shareItemsList.filter(
			(item) => item.name.toUpperCase().includes(normalizedSearchText) || item.displayName.toUpperCase().includes(normalizedSearchText)
		);
	}, [shareItemsList, normalizedSearchText]);

	const displayName = contactUser?.clan_nick || contactUser?.user?.display_name || contactUser?.user?.username || '';
	const username = contactUser?.user?.username || '';
	const avatar = contactUser?.clan_avatar || contactUser?.user?.avatar_url || '';

	return (
		<ModalLayout onClose={handleCloseModal}>
			<div className="bg-theme-setting-primary w-[550px] text-theme-primary pt-4 rounded" data-e2e={generateE2eId('modal.share_contact')}>
				<div>
					<h1 className="text-xl font-semibold text-center">{t('modal.title')}</h1>
				</div>

				<div className="px-4 pt-4">
					<input
						ref={searchInputRef}
						type="text"
						className="bg-theme-input outline-none w-full h-10 p-[10px] border-theme-primary text-base rounded-lg"
						placeholder={t('modal.searchPlaceholder')}
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						data-e2e={generateE2eId('modal.share_contact.input.search')}
					/>

					<div className="mt-4 mb-2 overflow-y-auto h-[300px] thread-scroll">
						{filteredItems.length === 0 ? (
							<span className="flex flex-row justify-center">{searchText ? t('modal.noResults') : t('modal.noFriends')}</span>
						) : (
							filteredItems.map((item) => {
								const isSelected = selectedItemIds.includes(item.id);
								return (
									<ShareItemRow
										key={item.id}
										item={item}
										isSelected={isSelected}
										onToggle={handleToggleItem}
										searchText={searchText}
										t={t}
									/>
								);
							})
						)}
					</div>
				</div>

				<ContactPreview displayName={displayName} username={username} avatar={avatar} t={t} />

				<div className="flex justify-end p-4 rounded-b gap-4">
					<button
						className="py-2 h-10 px-4 rounded-lg border-theme-primary hover:!underline focus:ring-transparent"
						type="button"
						onClick={handleCloseModal}
						disabled={isSending}
						data-e2e={generateE2eId('modal.share_contact.button.cancel')}
					>
						{t('modal.cancel')}
					</button>
					<button
						onClick={handleShare}
						className="py-2 h-10 px-4 rounded text-white bg-bgSelectItem hover:!bg-bgSelectItemHover focus:ring-transparent disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isSending || selectedItemIds.length === 0}
						data-e2e={generateE2eId('modal.share_contact.button.share')}
					>
						{isSending ? t('modal.sharing') : `${t('modal.share')} ${selectedItemIds.length > 0 ? `(${selectedItemIds.length})` : ''}`}
					</button>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ShareContactModal;
