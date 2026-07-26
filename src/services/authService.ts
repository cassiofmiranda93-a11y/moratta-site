import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, firebaseConfigurationError } from "@/config/firebase";

function requireAuth() {
  if (!auth) throw new Error(firebaseConfigurationError ?? "Firebase Auth indisponível.");
  return auth;
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle() {
  return signInWithPopup(requireAuth(), new GoogleAuthProvider());
}

export async function logout() {
  return signOut(requireAuth());
}
