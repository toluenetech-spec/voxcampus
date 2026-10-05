const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center font-bold tracking-tight ${className}`}>
      <span className="text-3xl text-slate-900 dark:text-white transition-colors duration-300">VO</span>
      <span className="text-6xl italic font-serif text-transparent bg-clip-text bg-gradient-to-br from-[#1F6AE1] to-[#E916E6] mx-1 leading-none drop-shadow-md">X</span>
      <span className="text-3xl text-cyan-500">CAMPUS</span>
    </div>
  );
};

export default Logo;
