import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { db, getFirebaseAuth } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { featuredSports } from '../data';

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function SettingsPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const auth = getFirebaseAuth();
  const storage = getStorage();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  // Auth form state
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences state
  const [favoriteSports, setFavoriteSports] = useState([]);
  const [defaultLocation, setDefaultLocation] = useState('');
  const [locationRadius, setLocationRadius] = useState(5);
  const [gameUpdatesNotif, setGameUpdatesNotif] = useState(true);
  const [gameCancelledNotif, setGameCancelledNotif] = useState(true);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Load profile from Firestore
  useEffect(() => {
    async function loadProfile() {
      if (!currentUser?.email) return;

      try {
        setLoading(true);
        const profileRef = doc(db, 'users', currentUser.email);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile(data);
          setDisplayName(data.displayName || '');
          setBio(data.bio || '');
          setPhotoURL(data.photoURL || '');
          setFavoriteSports(data.favoriteSports || []);
          setDefaultLocation(data.defaultLocation || '');
          setLocationRadius(data.locationRadius || 5);
          setGameUpdatesNotif(data.notificationPreferences?.gameUpdates ?? true);
          setGameCancelledNotif(data.notificationPreferences?.gameCancelled ?? true);
        } else {
          // Create default profile
          const defaultProfile = {
            userId: currentUser.email,
            displayName: currentUser.name || '',
            bio: '',
            gamesJoined: [],
            gamesCreated: [],
            favoriteSports: [],
            notificationPreferences: {
              gameUpdates: true,
              gameCancelled: true,
            },
          };
          setProfile(defaultProfile);
          setDisplayName(currentUser.name || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile settings');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [currentUser]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.email) return;

    try {
      setUploadingPhoto(true);

      // Upload to Firebase Storage
      const storageRef = ref(
        storage,
        `profile-photos/${currentUser.email}/${Date.now()}`,
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setPhotoURL(url);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfileInfo = async () => {
    if (!currentUser?.email) return;

    try {
      setSaving(true);
      const profileRef = doc(db, 'users', currentUser.email);

      const data = {
        userId: currentUser.email,
        displayName: displayName || currentUser.name || '',
        bio: bio || '',
        photoURL: photoURL || '',
        gamesJoined: profile?.gamesJoined || [],
        gamesCreated: profile?.gamesCreated || [],
        updatedAt: new Date().toISOString(),
      };

      await setDoc(profileRef, data, { merge: true });
      toast.success('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const updateEmailAddress = async () => {
    if (!newEmail || !currentPassword || !auth) return;

    try {
      setSaving(true);

      // Re-authenticate first
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update email
      await updateEmail(auth.currentUser, newEmail);

      // Update Firestore document with new email as ID
      const oldRef = doc(db, 'users', currentUser.email);
      const newRef = doc(db, 'users', newEmail);

      const profileData = await getDoc(oldRef);
      if (profileData.exists()) {
        await setDoc(newRef, {
          ...profileData.data(),
          userId: newEmail,
        });
        await deleteDoc(oldRef);
      }

      setNewEmail('');
      setCurrentPassword('');
      toast.success('Email updated successfully. Please sign in again.');
      setTimeout(() => onLogout(), 1500);
    } catch (error) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use');
      } else {
        toast.error('Failed to update email');
      }
    } finally {
      setSaving(false);
    }
  };

  const updatePasswordField = async () => {
    if (!newPassword || !confirmPassword || !currentPassword || !auth) return;

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSaving(true);

      // Re-authenticate first
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect current password');
      } else {
        toast.error('Failed to update password');
      }
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    if (!currentUser?.email) return;

    try {
      setSaving(true);
      const profileRef = doc(db, 'users', currentUser.email);

      await updateDoc(profileRef, {
        favoriteSports,
        defaultLocation,
        locationRadius: Number(locationRadius),
        notificationPreferences: {
          gameUpdates: gameUpdatesNotif,
          gameCancelled: gameCancelledNotif,
        },
        updatedAt: new Date().toISOString(),
      });

      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      setSaving(true);

      if (!auth?.currentUser) {
        throw new Error('No user authenticated');
      }

      // Delete Firestore document
      const profileRef = doc(db, 'users', currentUser.email);
      await deleteDoc(profileRef);

      // Delete auth account
      await deleteUser(auth.currentUser);

      toast.success('Account deleted successfully');
      onLogout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  if (!currentUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-20 pt-24">
        <p className="text-cream-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-24 md:pb-12">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-cream md:text-4xl">Settings</h1>

        {/* Profile Section */}
        <SettingsSection title="Profile">
          <div className="space-y-4">
            <div className="flex items-end gap-6">
              {/* Photo Preview */}
              <div className="shrink-0">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt="Profile"
                    className="h-20 w-20 rounded-full border-2 border-brand-400 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-400 bg-gradient-to-br from-brand-500 to-brand-400 text-2xl font-extrabold text-ink">
                    {initials(displayName || currentUser.name)}
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto || saving}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-cream hover:bg-white/15 disabled:opacity-50"
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </div>
            </div>

            {/* Display Name */}
            <FormField
              label="Display Name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Your name"
            />

            {/* Bio */}
            <FormField
              label="Bio"
              value={bio}
              onChange={setBio}
              placeholder="Tell others about yourself"
              isTextarea
            />

            <Button onClick={saveProfileInfo} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection title="Account">
          <div className="space-y-6">
            {/* Current Email */}
            <FormField
              label="Current Email"
              value={currentUser.email}
              disabled
              readonly
            />

            {/* Change Email */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-cream mb-3">Change Email</h3>
              <div className="space-y-3">
                <FormField
                  label="New Email"
                  type="email"
                  value={newEmail}
                  onChange={setNewEmail}
                  placeholder="new@email.com"
                />
                <FormField
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="••••••••"
                />
                <Button
                  variant="secondary"
                  onClick={updateEmailAddress}
                  disabled={!newEmail || !currentPassword || saving}
                  className="w-full"
                >
                  Update Email
                </Button>
              </div>
            </div>

            {/* Change Password */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-cream mb-3">Change Password</h3>
              <div className="space-y-3">
                <FormField
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="••••••••"
                />
                <FormField
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="••••••••"
                />
                <FormField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                />
                <Button
                  variant="secondary"
                  onClick={updatePasswordField}
                  disabled={
                    !newPassword || !confirmPassword || !currentPassword || saving
                  }
                  className="w-full"
                >
                  Update Password
                </Button>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="Preferences">
          <div className="space-y-6">
            {/* Favorite Sports */}
            <div>
              <label className="block text-sm font-semibold text-cream mb-3">
                Favorite Sports
              </label>
              <div className="flex flex-wrap gap-2">
                {featuredSports.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() =>
                      setFavoriteSports((prev) =>
                        prev.includes(sport)
                          ? prev.filter((s) => s !== sport)
                          : [...prev, sport],
                      )
                    }
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      favoriteSports.includes(sport)
                        ? 'bg-gradient-to-r from-brand-500 to-brand-400 text-ink'
                        : 'border border-white/15 bg-white/5 text-cream hover:bg-white/10'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Location */}
            <FormField
              label="Default Location"
              value={defaultLocation}
              onChange={setDefaultLocation}
              placeholder="e.g., Hutchson Field"
            />

            {/* Location Radius */}
            <div>
              <label className="block text-sm font-semibold text-cream mb-2">
                Search Radius: {locationRadius} miles
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={locationRadius}
                onChange={(e) => setLocationRadius(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Notifications */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={gameUpdatesNotif}
                  onChange={(e) => setGameUpdatesNotif(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-semibold text-cream">
                  Notify me when a game I joined is updated
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={gameCancelledNotif}
                  onChange={(e) => setGameCancelledNotif(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-semibold text-cream">
                  Notify me when a game I joined is cancelled
                </span>
              </label>
            </div>

            <Button onClick={savePreferences} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </SettingsSection>

        {/* Delete Account Section */}
        <SettingsSection title="Danger Zone">
          <div className="rounded-xl border-2 border-red-500/30 bg-red-500/10 p-4">
            <h3 className="text-sm font-semibold text-red-300 mb-2">Delete Account</h3>
            <p className="text-xs text-red-200/70 mb-4">
              This action cannot be undone. Your profile, all your game data, and account
              will be permanently deleted.
            </p>
            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full border-red-400/40 bg-red-500/10 text-red-200 hover:border-red-400/60 hover:bg-red-500/15"
                variant="ghost"
              >
                Delete Account
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-cream-muted">
                  Type <span className="font-bold">DELETE</span> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-cream placeholder-cream-muted focus:border-brand-400 focus:outline-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={saving}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || saving}
                    className="flex-1 border-red-400/40 bg-red-500/20 text-red-200 hover:border-red-400/60 hover:bg-red-500/30"
                  >
                    Delete Forever
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-cream">{title}</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">{children}</div>
    </section>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  isTextarea = false,
  disabled = false,
  readonly = false,
}) {
  const inputClassName =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-cream placeholder-cream-muted focus:border-brand-400 focus:outline-none disabled:opacity-50';

  return (
    <div>
      <label className="block text-sm font-semibold text-cream mb-2">{label}</label>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          className={`${inputClassName} resize-none`}
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          className={inputClassName}
        />
      )}
    </div>
  );
}
