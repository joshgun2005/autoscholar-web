import { useState, useCallback } from 'react';

export interface AuthorProfile {
  name: string;
  university: string;
  department: string;
  email: string;
}

const STORAGE_KEY = 'autoscholar_author_profile';

function loadProfile(): AuthorProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthorProfile;
  } catch {
    return null;
  }
}

export function useAuthorProfile() {
  const [profile, setProfile] = useState<AuthorProfile | null>(loadProfile);

  const saveProfile = useCallback((p: AuthorProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  return { profile, saveProfile, clearProfile };
}
