const messages: Record<string, string> = {
  google_unavailable: "Google sign-in is not configured yet. Please use your email and password.",
  google_cancelled: "Google sign-in was cancelled.",
  google_email: "Google did not share a verified email address. Please try another sign-in method.",
  google_failed: "We could not complete Google sign-in. Please try again.",
};

export function authErrorMessage(code?: string | null) {
  if (!code) return null;
  return messages[code] ?? "Something went wrong. Please try again.";
}
