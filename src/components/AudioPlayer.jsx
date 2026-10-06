import { useEffect, useRef, useState } from 'react'
import { Pause, Play, AlertTriangle } from 'lucide-react'
import { claimAudio, releaseAudio, formatTime } from '../lib/audioManager'

/**
 * Shared podcast player.
 *
 * Replaces the per-card inline audio with a real scrubber: it reports actual
 * progress, supports seeking, and coordinates with `audioManager` so only one
 * episode can play at a time.
 */
const AudioPlayer = ({ src, title, onPlay }) => {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    return () => releaseAudio(audio)
  }, [])

  if (!src) {
    return (
      <p className="text-red-500 text-sm italic py-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Audio link is missing from the database.
      </p>
    )
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      releaseAudio(audio)
      return
    }

    claimAudio(audio)
    audio
      .play()
      .then(() => {
        setIsPlaying(true)
        onPlay?.()
      })
      .catch((error) => {
        console.error('Playback failed', error)
        setIsPlaying(false)
        setFailed(true)
      })
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    if (audio.duration && Number.isFinite(audio.duration)) {
      setProgress((audio.currentTime / audio.duration) * 100)
    }
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (audio) setDuration(audio.duration)
  }

  const handleSeek = (event) => {
    const audio = audioRef.current
    if (!audio || !audio.duration || !Number.isFinite(audio.duration)) return
    const next = (Number(event.target.value) / 100) * audio.duration
    audio.currentTime = next
    setCurrentTime(next)
    setProgress(Number(event.target.value))
  }

  return (
    <div className="flex items-center space-x-4 w-full">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? `Pause ${title ?? 'episode'}` : `Play ${title ?? 'episode'}`}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white bg-cyan-500 transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 shrink-0 ${
          isPlaying ? 'shadow-[0_0_20px_rgba(6,182,212,0.8)]' : ''
        }`}
      >
        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
      </button>

      <div className="flex-1 min-w-0">
        <input
          type="range"
          min="0"
          max="100"
          step="0.5"
          value={progress}
          onChange={handleSeek}
          disabled={!duration}
          aria-label="Seek"
          className="w-full h-1.5 appearance-none rounded-full bg-slate-200 dark:bg-slate-700 accent-cyan-500 cursor-pointer disabled:cursor-default [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,229,255,0.7)]"
          style={{
            background: `linear-gradient(to right, rgb(6 182 212) ${progress}%, transparent ${progress}%)`,
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {failed ? 'Playback failed' : isPlaying ? 'Now Playing' : 'Listen Now'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {formatTime(currentTime)} / {duration ? formatTime(duration) : '--:--'}
          </p>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false)
          setProgress(0)
          setCurrentTime(0)
        }}
        onError={() => {
          setFailed(true)
          setIsPlaying(false)
        }}
      />
    </div>
  )
}

export default AudioPlayer
