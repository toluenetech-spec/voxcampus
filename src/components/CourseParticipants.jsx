import { useEffect, useState } from 'react';
import * as store from '../services/store';
import { avatarDataUri } from '../lib/avatars';

const CourseParticipants = ({ courseId }) => {
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return undefined;

    // Enrolments are stored as an array of course ids on the user document.
    const enrollmentsQ = store.query(
      store.collection(store.db, 'users'),
      store.where('joinedCourses', 'array-contains', courseId),
    );

    const unsubscribe = store.onSnapshot(
      enrollmentsQ,
      (snapshot) => {
        setParticipants(
          snapshot.docs.map((docSnap) => {
            const userData = docSnap.data();
            return {
              id: docSnap.id,
              displayName: userData.fullName || userData.displayName || 'Unknown Student',
              avatarUrl: userData.avatarUrl || null,
            };
          }),
        );
        setIsLoading(false);
      },
      (error) => {
        console.error('Participants snapshot error:', error);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [courseId]);

  const totalStudents = participants.length;
  const displayLimit = 5;
  const visibleParticipants = participants.slice(0, displayLimit);
  const remaining = totalStudents - displayLimit;

  return (
    <div className="bg-white dark:bg-white/5 border hairline p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md transition-colors duration-300 w-full">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">
          Enrolled Students
        </h3>
        <p className="text-slate-500 dark:text-slate-400 font-semibold mt-1 transition-colors">
          <span className="text-2xl text-cyan-600 dark:text-cyan-400 mr-2">{totalStudents}</span>
          Students
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-2 text-cyan-600 dark:text-cyan-400 font-semibold text-sm animate-pulse">
          Loading…
        </div>
      ) : totalStudents > 0 ? (
        <div className="flex -space-x-3 overflow-hidden p-2">
          {visibleParticipants.map((student) => (
            <img
              key={student.id}
              src={student.avatarUrl || avatarDataUri(student.displayName)}
              alt={student.displayName}
              className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-950 object-cover hover:z-10 hover:scale-110 transition-transform cursor-pointer"
              title={student.displayName}
            />
          ))}
          {remaining > 0 && (
            <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-950 bg-slate-200 dark:bg-slate-800 text-xs font-bold text-cyan-600 dark:text-cyan-400 z-0 cursor-default">
              +{remaining}
            </div>
          )}
        </div>
      ) : (
        <div className="text-slate-500 text-sm italic py-2">No students enrolled yet.</div>
      )}
    </div>
  );
};

export default CourseParticipants;
