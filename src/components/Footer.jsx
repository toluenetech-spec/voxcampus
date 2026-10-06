import { Link } from 'react-router-dom';
import Logo from './Logo';

const COLUMNS = [
  {
    heading: 'Platform',
    links: [
      { label: 'Live rooms', to: '/live' },
      { label: 'Lecture library', to: '/library' },
      { label: 'AI assistant', to: '/ai' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Create an account', to: '/signup' },
      { label: 'Sign in', to: '/login' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-3">
          <div>
            <Logo className="scale-[0.62] origin-left" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-500">
              Course audio, live rooms and an assistant that knows your syllabus.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4 className="text-sm font-semibold text-slate-200">{column.heading}</h4>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-slate-500 transition-colors hover:text-slate-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.06] pt-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} VoxCampus</p>
          <p>Built by Toluwalase Samuel</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
