import { useState } from 'react';
import { Loader2, GraduationCap, Presentation, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import * as store from '../services/store';

const RoleSelectionModal = () => {
  const { currentUser, patchUser } = useAppContext();
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState('');

  const handleSelectRole = async (role) => {
    if (!currentUser?.uid || loadingRole) return;
    setLoadingRole(role);
    setError('');

    try {
      await store.updateDoc(store.doc(store.db, 'users', currentUser.uid), { role });
      // Update context straight away so the modal unmounts without waiting for
      // the snapshot round-trip (which can be slow or blocked offline).
      patchUser({ role });
    } catch (err) {
      console.error('Error updating role:', err);
      setError(
        'We could not save your role. Check your connection and try again — you need a role before you can continue.',
      );
    } finally {
      setLoadingRole(null);
    }
  };

  const options = [
    {
      role: 'student',
      icon: GraduationCap,
      title: 'Student',
      blurb: 'Listen to lectures, join live rooms, and learn.',
    },
    {
      role: 'instructor',
      icon: Presentation,
      title: 'Instructor',
      blurb: 'Host live rooms, upload podcasts, and teach.',
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-modal-title"
        className="max-w-3xl w-full bg-slate-900/50 border border-white/10 rounded-panel p-8 md:p-12 shadow-2xl flex flex-col items-center"
      >
        <h2 id="role-modal-title" className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
          Welcome to VoxCampus! <span className="text-aqua-400">Choose your path.</span>
        </h2>
        <p className="text-slate-400 text-center mb-10 max-w-lg">
          Select how you want to use VoxCampus. You can change this later in your profile settings.
        </p>

        {error && (
          <div className="mb-8 w-full max-w-lg bg-red-500/10 border border-red-500/40 text-red-300 p-4 rounded-card text-sm font-semibold flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {options.map(({ role, icon: Icon, title, blurb }) => (
            <button
              key={role}
              type="button"
              onClick={() => handleSelectRole(role)}
              disabled={Boolean(loadingRole)}
              className={`relative group flex flex-col items-center text-center p-8 rounded-card border border-white/5 bg-white/5 hover:border-aqua-500 hover:bg-white/10 transition-all cursor-pointer overflow-hidden disabled:cursor-wait ${
                loadingRole && loadingRole !== role ? 'opacity-50' : ''
              }`}
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-aqua-500/12 text-aqua-400 transition-colors group-hover:bg-aqua-500/20">
                {loadingRole === role ? <Loader2 className="w-10 h-10 animate-spin" /> : <Icon className="w-10 h-10" />}
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
              <p className="text-slate-400">{blurb}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
