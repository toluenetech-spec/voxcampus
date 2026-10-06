import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Save, Loader2, User, LogOut, RotateCcw, GraduationCap, Presentation } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import * as store from '../services/store'
import { uploadFile as uploadToStorage } from '../services/upload'
import { avatarDataUri } from '../lib/avatars'

const ProfileView = () => {
  const { currentUser, patchUser, logout, isDemo, resetDemoData } = useAppContext()
  const navigate = useNavigate()

  // The form is a draft overlay: until a field is edited it mirrors the live
  // profile, so snapshot updates and role switches are picked up automatically.
  const [draft, setDraft] = useState({ fullName: null, bio: null, institution: null, avatarUrl: null })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const fileInputRef = useRef(null)
  const successTimer = useRef(null)

  const valueOf = (field) => {
    const edited = draft[field]
    if (edited !== null && edited !== undefined) return edited
    return currentUser?.[field] ?? ''
  }

  const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }))

  const clearDraft = () => setDraft({ fullName: null, bio: null, institution: null, avatarUrl: null })

  useEffect(() => () => clearTimeout(successTimer.current), [])

  const flash = (message, isError = false) => {
    clearTimeout(successTimer.current)
    if (isError) setErrorMsg(message)
    else setSuccessMsg(message)
    successTimer.current = setTimeout(() => {
      setSuccessMsg('')
      setErrorMsg('')
    }, 3000)
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      flash('Please choose an image file.', true)
      return
    }

    setIsUploading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const newUrl = await uploadToStorage(file)
      updateDraft('avatarUrl', newUrl)
      await store.updateDoc(store.doc(store.db, 'users', currentUser.uid), { avatarUrl: newUrl })
      patchUser({ avatarUrl: newUrl })
      flash('Profile photo updated.')
    } catch (error) {
      console.error('Avatar upload failed', error)
      flash(error.message ?? 'Could not upload that image.', true)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const updates = {
        fullName: valueOf('fullName').trim(),
        bio: valueOf('bio').trim(),
        institution: valueOf('institution').trim(),
        avatarUrl: valueOf('avatarUrl'),
      }
      if (!updates.fullName) {
        flash('Please enter your name.', true)
        return
      }
      await store.updateDoc(store.doc(store.db, 'users', currentUser.uid), updates)
      patchUser(updates)
      clearDraft()
      flash('Profile updated successfully!')
    } catch (error) {
      console.error('Failed to save profile', error)
      flash('Could not save your profile. Please try again.', true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRoleChange = async (role) => {
    if (role === currentUser?.role) return
    try {
      await store.updateDoc(store.doc(store.db, 'users', currentUser.uid), { role })
      patchUser({ role })
      flash(`You are now set up as an ${role}.`)
    } catch (error) {
      console.error('Failed to change role', error)
      flash('Could not change your role. Please try again.', true)
    }
  }

  const handleSignOut = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  if (!currentUser) return null

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 max-w-4xl mx-auto w-full transition-colors duration-300">
      <div className="flex items-center mb-8">
        <div className="p-3 bg-cyan-500/10 rounded-2xl mr-4 border border-cyan-500/30">
          <User className="text-cyan-600 dark:text-cyan-400 w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-wide">Your Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage your personal information and preferences.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border hairline shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors duration-300">
        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-xl font-semibold text-center text-sm transition-colors duration-300">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl font-semibold text-center text-sm transition-colors duration-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-8">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div
              role="button"
              tabIndex={0}
              onClick={handleAvatarClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleAvatarClick()
                }
              }}
              className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-200 dark:bg-slate-900 cursor-pointer group shadow-xl transition-all hover:border-cyan-400"
            >
              <img
                src={valueOf('avatarUrl') || avatarDataUri(valueOf('fullName') || currentUser.email || 'User')}
                alt="Your avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-400 mt-4">Change Photo</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              aria-label="Upload a profile photo"
            />
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2"
              >
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={valueOf('fullName')}
                onChange={(e) => updateDraft('fullName', e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950/50 border hairline rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2"
              >
                Email <span className="text-xs text-slate-400 lowercase normal-case ml-2">(Read Only)</span>
              </label>
              <input
                id="profile-email"
                type="email"
                value={currentUser.email ?? ''}
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-900/80 border border-transparent rounded-2xl px-5 py-4 text-slate-500 focus:outline-none cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="profile-institution"
                className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2"
              >
                Institution
              </label>
              <input
                id="profile-institution"
                type="text"
                value={valueOf('institution')}
                onChange={(e) => updateDraft('institution', e.target.value)}
                placeholder="e.g. Bolmor Polytechnic"
                className="w-full bg-slate-50 dark:bg-slate-950/50 border hairline rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
              />
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                Account Type
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'student', label: 'Student', icon: GraduationCap },
                  { value: 'instructor', label: 'Instructor', icon: Presentation },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRoleChange(value)}
                    aria-pressed={currentUser.role === value}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-bold transition-all ${
                      currentUser.role === value
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                        : 'hairline text-slate-600 dark:text-slate-400 hover:border-cyan-500/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-bio"
                className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2"
              >
                Bio
              </label>
              <textarea
                id="profile-bio"
                rows="4"
                value={valueOf('bio')}
                onChange={(e) => updateDraft('bio', e.target.value)}
                placeholder="Tell us a bit about yourself..."
                className="w-full bg-slate-50 dark:bg-slate-950/50 border hairline rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t hairline">
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl hover:bg-cyan-400 transition-colorsflex justify-center items-center shadow-contact disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" /> Save Profile
                </>
              )}
            </button>
          </div>
        </form>

        {isDemo && (
          <div className="mt-8 pt-6 border-t hairline">
            <h3 className="text-sm font-semibold text-slate-500 mb-3">Demo workspace</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
              Demo data lives in this browser only. Reset it to restore the original sample courses, episodes and
              submissions.
            </p>
            <button
              type="button"
              onClick={resetDemoData}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-xshover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <RotateCcw size={16} /> Reset demo data
            </button>
          </div>
        )}

        {/* Mobile Sign Out */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 md:hidden flex justify-center">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-600 dark:text-rose-500 rounded-xl border border-rose-500/20 font-medium hover:bg-rose-500/20 transition-all w-full justify-center"
          >
            <LogOut size={18} /> {isDemo ? 'Leave Demo' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileView
