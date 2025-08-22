interface TabButtonProps {
  children: any;
  isActive: boolean;
  onClick: () => void;
}

export default function TabButton({ children, isActive, onClick }: TabButtonProps) {
  return (
    <button 
      className={isActive ? 'active' : ''} 
      onClick={onClick}
    >
      {children}
    </button>
  );
} 