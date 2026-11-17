---
'vibes-dpc': minor
---

Replace Better Auth with a built-in session implementation. `BETTER_AUTH_SECRET` is no longer needed, sign-in attempts are rate-limited and stricter password rules apply. Existing accounts are removed on upgrade – the first account registered afterwards becomes the admin.
