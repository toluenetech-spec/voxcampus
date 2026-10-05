import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

const CourseParticipants = ({ courseId }) => {
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !db) return;

    // The voxcampus data model stores enrollments as an array of course IDs on the user document
    const enrollmentsQ = query(collection(db, 'users'), where('joinedCourses', 'array-contains', courseId));
    
    const unsubscribe = onSnapshot(enrollmentsQ, (snapshot) => {
      const studentDocs = snapshot.docs.map((docSnap) => {
        const userData = docSnap.data();
        return {
          id: docSnap.id,
          displayName: userData.fullName || userData.displayName || 'Unknown Student',
          avatarUrl: userData.avatarUrl || null,
        };
      });
      
      setParticipants(studentDocs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [courseId]);

  const totalStudents = participants.length;
  const displayLimit = 5;
  const visibleParticipants = participants.slice(0, displayLimit);
  const remaining = totalStudents - displayLimit;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md transition-colors duration-300 w-full">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Enrolled Students</h3>
        <p className="text-slate-400 font-semibold mt-1">
          <span className="text-2xl text-cyan-400 mr-2">{totalStudents}</span>
          Students
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-2 text-cyan-400 font-bold uppercase tracking-widest text-xs animate-pulse">
          Loading...
        </div>
      ) : totalStudents > 0 ? (
        <div className="flex -space-x-3 overflow-hidden p-2">
          {visibleParticipants.map((student) => (
            <img 
              key={student.id} 
              src={student.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.displayName) + '&background=random'} 
              alt={student.displayName}
              className="inline-block h-10 w-10 rounded-full ring-2 ring-slate-950 object-cover hover:z-10 hover:scale-110 transition-transform cursor-pointer"
              title={student.displayName}
            />
          ))}
          {remaining > 0 && (
            <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-slate-950 bg-slate-800 text-xs font-bold text-cyan-400 z-0 cursor-default">
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
