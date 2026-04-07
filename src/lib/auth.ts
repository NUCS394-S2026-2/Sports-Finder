import type { UserProfile } from '../types';

type RegistrationInput = {
  email: string;
  password: string;
  name: string;
  age: number;
  gender: UserProfile['gender'];
};

type AuthUser = {
  uid: string;
  email: string;
};

type StoredUser = UserProfile & {
  password: string;
};

const USERS_STORAGE_KEY = 'sports_finder_mock_auth_users';
const CURRENT_USER_KEY = 'sports_finder_mock_auth_current_user';

const listeners = new Set<(user: AuthUser | null) => void>();

function readStoredUsers(): StoredUser[] {
  const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function readCurrentAuthUser(): AuthUser | null {
  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || typeof parsed.uid !== 'string' || typeof parsed.email !== 'string') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCurrentAuthUser(user: AuthUser | null) {
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  listeners.forEach((listener) => listener(user));
}

export async function registerWithProfile(
  input: RegistrationInput,
): Promise<UserProfile> {
  const users = readStoredUsers();
  const normalizedEmail = input.email.trim() || `user-${Date.now()}@local.test`;
  const existing = users.find((user) => user.email === normalizedEmail);

  const profile: UserProfile = {
    uid: existing?.uid ?? `u-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    email: normalizedEmail,
    name: input.name.trim() || 'Player',
    age: Number.isFinite(input.age) ? input.age : 18,
    gender: input.gender,
  };

  const nextUsers = users.filter((user) => user.uid !== profile.uid);
  nextUsers.push({
    ...profile,
    password: input.password,
  });
  writeStoredUsers(nextUsers);

  writeCurrentAuthUser({
    uid: profile.uid,
    email: profile.email,
  });

  return profile;
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  const users = readStoredUsers();
  const normalizedEmail = email.trim() || `user-${Date.now()}@local.test`;

  const existing = users.find((user) => user.email === normalizedEmail);

  if (existing) {
    writeCurrentAuthUser({ uid: existing.uid, email: existing.email });
    return;
  }

  const generated: StoredUser = {
    uid: `u-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    email: normalizedEmail,
    name: normalizedEmail.split('@')[0] || 'Player',
    age: 18,
    gender: 'Other',
    password,
  };

  writeStoredUsers([...users, generated]);
  writeCurrentAuthUser({ uid: generated.uid, email: generated.email });
}

export async function logout(): Promise<void> {
  writeCurrentAuthUser(null);
}

export function subscribeToAuth(callback: (user: AuthUser | null) => void): () => void {
  listeners.add(callback);
  callback(readCurrentAuthUser());

  return () => {
    listeners.delete(callback);
  };
}

export async function fetchUserProfile(user: AuthUser): Promise<UserProfile | null> {
  const users = readStoredUsers();
  const storedProfile = users.find((stored) => stored.uid === user.uid);
  if (!storedProfile) {
    return {
      uid: user.uid,
      email: user.email,
      name: user.email.split('@')[0] || 'Player',
      age: 18,
      gender: 'Other',
    };
  }

  const profile: UserProfile = {
    uid: storedProfile.uid,
    email: storedProfile.email,
    name: storedProfile.name,
    age: Number(storedProfile.age ?? 18),
    gender: (storedProfile.gender ?? 'Other') as UserProfile['gender'],
  };

  return profile;
}
