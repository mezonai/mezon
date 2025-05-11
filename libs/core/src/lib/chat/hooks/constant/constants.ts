// constants.ts
export const DRAG_ITEM_TYPES = {
    CLAN: 'clan',
    CLAN_IN_GROUP: 'clan-in-group',
    GROUP: 'group',
} as const;

export type DraggedItemType = typeof DRAG_ITEM_TYPES[keyof typeof DRAG_ITEM_TYPES];

export const GROUP_PREFIX = 'group_';

export const DRAG_THRESHOLD = 5;
