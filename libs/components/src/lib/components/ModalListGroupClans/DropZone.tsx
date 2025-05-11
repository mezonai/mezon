const DropZone = ({
  index,
  isDragging,
  setDropIndex,
  active
}: {
  index: number;
  isDragging: boolean;
  setDropIndex: (index: number) => void;
  active: boolean;
}) => {
  if (!isDragging) return null;

  return (
    <div
      className={`h-[3px] my-[6px] mx-2 rounded-sm transition-all duration-150 ${active ? 'bg-sky-500' : 'bg-transparent'
        }`}
      onMouseEnter={() => setDropIndex(index)}
    />
  );
};

export default DropZone;
