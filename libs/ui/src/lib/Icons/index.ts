import * as AttachmentThumbs from './attachmentThumb';
import * as EmojiPanelIcons from './iconInEmojiPanel';
import * as RightClickIcons from './iconRightClick';
import * as LazyIcons from './icons.lazy';

export const Icons = {
	...LazyIcons,
	...AttachmentThumbs,
	...RightClickIcons,
	...EmojiPanelIcons
};
