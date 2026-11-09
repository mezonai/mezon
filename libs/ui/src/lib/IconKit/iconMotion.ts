export const ICON_MOTION_KEY = 'mezon-icon-motion';

export const getIconMotion = (store: Pick<Storage, 'getItem'> = localStorage): boolean => store.getItem(ICON_MOTION_KEY) !== 'false';

export const applyIconMotion = (on = getIconMotion(), root: Element = document.documentElement): void => {
	root.classList.toggle('mz-motion-off', !on);
};

export const setIconMotion = (on: boolean, store: Pick<Storage, 'setItem'> = localStorage, root?: Element): void => {
	store.setItem(ICON_MOTION_KEY, String(on));
	applyIconMotion(on, root);
};
