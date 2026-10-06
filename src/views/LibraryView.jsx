import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones,
  Loader2,
  Search,
  Mic,
  Plus,
  CheckCircle2,
  User,
  Globe2,
  Heart,
  Clock,
  Filter,
  TrendingUp,
  Square,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import * as store from '../services/store';
import AudioPlayer from '../components/AudioPlayer';

const timestampOf = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const speak = (text) => {
  if (!text) return false;
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  return true;
};

const LibraryPodcastCard = ({
  pod,
  index,
  activeTab,
  currentUser,
  isSpeaking,
  onToggleSpeech,
  onToggleLike,
  animatingHeart,
  onAudioPlay,
  onEnroll,
  enrollingId,
  isEnrolled,
}) => {
  const navigate = useNavigate();

  const isMyPodcast = pod.instructorId === currentUser?.uid;
  const likes = Array.isArray(pod.likes) ? pod.likes : [];
  const hasLiked = currentUser?.uid ? likes.includes(currentUser.uid) : false;
  const playCount = pod.playCount || 0;

  return (
    <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border hairline transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 shadow-md hover:shadow-lg dark:hover:shadow-[0_10px_30px_rgba(0,229,255,0.15)] group relative overflow-hidden flex flex-col">
      {/* Ranking Badge (If Trending) */}
      {activeTab === 'trending' && index < 3 && (
        <div className="absolute top-0 left-0 bg-cyan-500 text-slate-950 px-4 py-1.5 rounded-br-2xl font-black italic tracking-tighter shadow-[2px_2px_10px_rgba(0,229,255,0.3)] z-10">
          #{index + 1} TRENDING
        </div>
      )}

      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-bl-full -z-10 group-hover:bg-cyan-500/10 transition-colors duration-500 blur-2xl" />

      <div className="flex justify-between items-start mb-4 mt-2">
        <div className="flex-1 pr-4">
          <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2 tracking-tight leading-tight transition-colors">
            {pod.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed transition-colors">
            {pod.description}
          </p>
        </div>
      </div>

      {/* Metrics & Instructor Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950/50 p-2.5 pr-4 rounded-2xl border hairline w-fit transition-colors">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-bold mb-0.5 transition-colors">
              Instructor
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
              {pod.instructorName || 'Unknown'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-slate-100 dark:bg-slate-950/50 px-4 py-2 rounded-2xl border hairline transition-colors">
          <button
            type="button"
            onClick={() => onToggleLike(pod.id, hasLiked)}
            aria-pressed={hasLiked}
            aria-label={hasLiked ? 'Remove like' : 'Like this episode'}
            className={`flex items-center space-x-1.5 transition-all duration-300 ${
              animatingHeart === pod.id ? 'scale-125' : 'hover:scale-110'
            } ${hasLiked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-400'}`}
          >
            <Heart className={`w-5 h-5 transition-colors ${hasLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-bold">{likes.length}</span>
          </button>
          <div className="w-px h-6 bg-slate-300 dark:bg-white/10" />
          <div className="flex items-center space-x-1.5 text-cyan-600 dark:text-cyan-400">
            <Headphones className="w-5 h-5" />
            <span className="text-sm font-bold">{playCount}</span>
          </div>
        </div>
      </div>

      {/* Playback */}
      <div className="mt-4 mb-6">
        <AudioPlayer
          key={pod.fileUrl ?? pod.id}
          src={pod.fileUrl}
          title={pod.title}
          onPlay={() => onAudioPlay(pod.id)}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center border-t hairline pt-6 gap-4 transition-colors">
        <button
          type="button"
          onClick={() => onToggleSpeech(pod.description)}
          className="flex items-center justify-center w-full sm:w-auto space-x-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors bg-slate-100 dark:bg-white/5 px-4 py-3 rounded-xl border hairline hover:border-cyan-500/30"
        >
          {isSpeaking ? (
            <>
              <Square className="w-4 h-4 fill-current" /> <span>Stop Reading</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" /> <span>Read Description</span>
            </>
          )}
        </button>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {isMyPodcast ? (
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-500 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">
              Your Episode
            </span>
          ) : isEnrolled ? (
            <button
              type="button"
              onClick={() => navigate(`/course/${pod.courseId}`)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-slate-800 text-white font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-colorstext-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-green-400" /> <span>View Course</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onEnroll(pod.courseId)}
              disabled={enrollingId === pod.courseId}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl shadow-contact hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-alltext-xs hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enrollingId === pod.courseId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Join Course</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const LibraryView = () => {
  const { currentUser, patchUser } = useAppContext();
  const isInstructor = currentUser?.role === 'instructor';

  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);
  const [activeTab, setActiveTab] = useState('latest'); // 'latest' | 'trending'
  const [playedPodcasts, setPlayedPodcasts] = useState(() => new Set());
  const [animatingHeart, setAnimatingHeart] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [speechSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);

  useEffect(
    () => () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    [],
  );

  useEffect(() => {
    if (!currentUser) return undefined;

    const unsubscribe = store.onSnapshot(
      store.collection(store.db, 'podcasts'),
      (snapshot) => {
        const allDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const filtered = allDocs.filter((pod) => {
          if (pod.isPublic === true) return true;
          // Owners always see their own unpublished drafts.
          if (isInstructor && pod.instructorId === currentUser.uid) return true;
          return false;
        });
        setPodcasts(filtered);
        setLoading(false);
      },
      (error) => {
        console.error('Library snapshot error:', error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [currentUser, isInstructor]);

  const handleEnroll = async (courseId) => {
    if (!courseId) return;
    setEnrollingId(courseId);
    try {
      const nextCourses = [...(currentUser.joinedCourses ?? []), courseId];
      await store.updateDoc(store.doc(store.db, 'users', currentUser.uid), {
        joinedCourses: nextCourses,
      });
      patchUser({ joinedCourses: nextCourses });
    } catch (error) {
      console.error('Failed to enroll:', error);
    } finally {
      setEnrollingId(null);
    }
  };

  const handleToggleLike = async (podcastId, hasLiked) => {
    if (!currentUser?.uid) return;
    setAnimatingHeart(podcastId);
    setTimeout(() => setAnimatingHeart(null), 300);

    try {
      const podRef = store.doc(store.db, 'podcasts', podcastId);
      await store.updateDoc(podRef, {
        likes: hasLiked ? store.arrayRemove(currentUser.uid) : store.arrayUnion(currentUser.uid),
      });
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleAudioPlay = async (podcastId) => {
    if (playedPodcasts.has(podcastId)) return; // Prevent spamming
    setPlayedPodcasts((prev) => new Set(prev).add(podcastId));
    try {
      await store.updateDoc(store.doc(store.db, 'podcasts', podcastId), {
        playCount: store.increment(1),
      });
    } catch (err) {
      console.error('Failed to increment play count:', err);
    }
  };

  const handleToggleSpeech = (podcastId, text) => {
    if (speakingId === podcastId) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    const started = speak(text);
    if (started) setSpeakingId(podcastId);
  };

  const displayedPodcasts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? podcasts.filter((p) =>
          [p.title, p.description, p.instructorName].some((field) =>
            String(field ?? '')
              .toLowerCase()
              .includes(term),
          ),
        )
      : podcasts;

    return [...filtered].sort((a, b) => {
      if (activeTab === 'trending') {
        const score = (pod) => (Array.isArray(pod.likes) ? pod.likes.length : 0) * 3 + (pod.playCount || 0);
        return score(b) - score(a);
      }
      return timestampOf(b.createdAt) - timestampOf(a.createdAt);
    });
  }, [podcasts, searchTerm, activeTab]);

  if (!currentUser) return null;

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-32 max-w-6xl mx-auto w-full">
      {/* Global Discovery Hero Banner */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border hairline relative overflow-hidden mb-10 shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] group transition-colors">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/3 -z-10 blur-3xl group-hover:bg-cyan-500/20 transition-colors duration-700" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border hairline shadow-inner w-fit transition-colors">
              <Globe2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-cyan-600 dark:text-cyan-400 text-xs font-semibold">Public Directory</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight transition-colors">
              Global Discovery Hub
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed transition-colors">
              Explore and listen to public lectures from instructors across the campus. Find your next favorite course
              and dive straight into the audio!
            </p>
          </div>
          <div className="hidden md:flex p-6 bg-cyan-500/10 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_30px_rgba(0,229,255,0.1)]">
            <Headphones className="w-24 h-24 text-cyan-500 dark:text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Top Controls: Search & Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              aria-label="Search podcasts"
              placeholder="Search topics, instructors, or episodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
            />
          </div>
          <button
            type="button"
            aria-label="Filter"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl hover:border-cyan-500 dark:hover:border-cyan-400 transition-colors text-slate-600 dark:text-slate-400 flex items-center justify-center"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* The Algorithm Tabs */}
        <div
          role="tablist"
          aria-label="Sort podcasts"
          className="flex space-x-2 bg-slate-200/50 dark:bg-slate-950/50 p-1.5 rounded-2xl border border-slate-300/50 dark:border-white/5 w-full md:w-auto transition-colors"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'latest'}
            onClick={() => setActiveTab('latest')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
              activeTab === 'latest'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" /> <span className="hidden sm:inline">Latest Releases</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'trending'}
            onClick={() => setActiveTab('trending')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
              activeTab === 'trending'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> <span className="hidden sm:inline">Trending</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
          <p className="text-slate-500 font-semibold tracking-wider uppercase text-sm">Syncing Global Hub…</p>
        </div>
      ) : displayedPodcasts.length === 0 ? (
        <div className="flex justify-center pt-10">
          <div className="bg-white dark:bg-slate-900 backdrop-blur-xl border hairline p-16 rounded-[2.5rem] text-center shadow-lg dark:shadow-2xl flex flex-col items-center justify-center transition-colors max-w-xl">
            <Headphones className="w-20 h-20 text-slate-400 dark:text-slate-600 mb-6 opacity-50" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight transition-colors">
              No Public Podcasts Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto text-lg transition-colors">
              {searchTerm
                ? "Try adjusting your search terms to find what you're looking for."
                : 'No public podcasts have been published by any instructors yet.'}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-cyan-600 dark:text-cyan-400 font-semibold text-sm hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedPodcasts.map((pod, index) => (
            <LibraryPodcastCard
              key={pod.id}
              pod={pod}
              index={index}
              activeTab={activeTab}
              currentUser={currentUser}
              isSpeaking={speakingId === pod.id}
              onToggleSpeech={(text) => handleToggleSpeech(pod.id, text)}
              onToggleLike={handleToggleLike}
              animatingHeart={animatingHeart}
              onAudioPlay={handleAudioPlay}
              onEnroll={handleEnroll}
              enrollingId={enrollingId}
              isEnrolled={Boolean(currentUser?.joinedCourses?.includes(pod.courseId))}
            />
          ))}
        </div>
      )}

      {!speechSupported && (
        <p className="text-center text-xs text-slate-400 mt-8">
          Your browser does not support text-to-speech, so “Read Description” is unavailable.
        </p>
      )}
    </div>
  );
};

export default LibraryView;
