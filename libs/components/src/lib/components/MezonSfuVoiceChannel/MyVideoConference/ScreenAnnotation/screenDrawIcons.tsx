import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';

interface IconProps {
	className?: string;
}

export const ScreenDrawPointerIcon = ({ className }: IconProps) => <MezonIcon icon={MzIcons20.mzCursor} className={className} />;

export const ScreenDrawPenIcon = ({ className }: IconProps) => <MezonIcon icon={MzIcons20.mzDraw} className={className} />;

export const ScreenDrawTextIcon = ({ className }: IconProps) => <MezonIcon icon={MzIcons20.mzText} className={className} />;

export const ScreenDrawEraserIcon = ({ className }: IconProps) => <MezonIcon icon={MzIcons20.mzEraser} className={className} />;

export const ScreenDrawUndoIcon = ({ className }: IconProps) => <MezonIcon icon={MzIcons20.mzUndo} className={className} />;

export const ScreenDrawRedoIcon = ({ className }: IconProps) => <MezonIcon icon={MzIcons20.mzRedo} className={className} />;

export const ScreenDrawTrashIcon = ({ className }: IconProps) => <MezonIcon icon={MzIcons20.mzTrash} className={className} />;

export const ScreenDrawGripIcon = ({ className }: IconProps) => <MezonIcon icon={MzIcons20.mzGrip} className={className} />;

export const ScreenDrawCloseIcon = ({ className }: IconProps) => <MezonIcon icon={MzIcons16.mzClose} className={className} />;
