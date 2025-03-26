import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

/**
 * Custom hook to handle authentication checks and redirects
 * @returns Object with isAuthenticated status and a requireAuth function
 */
export function useAuth() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  /**
   * Checks if user is authenticated and redirects to sign-in if not
   * @param {Function} callback - Optional callback to execute if user is authenticated
   * @returns {boolean} Whether the user is authenticated
   */
  const requireAuth = (callback?: () => void) => {
    // Wait for Clerk to load
    if (!isLoaded) return false;

    // If not signed in, redirect to sign-in page
    if (!isSignedIn) {
      router.push("/auth/sign-in");
      return false;
    }

    // User is authenticated, execute callback if provided
    if (callback) {
      callback();
    }

    return true;
  };

  return {
    isAuthenticated: isSignedIn,
    requireAuth,
  };
}
