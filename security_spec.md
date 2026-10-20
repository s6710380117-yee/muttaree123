# Security Specification & Threat Model

## 1. Data Invariants
1. **User Identity & Role Immutability**: Normal users can create their own profile `/users/{userId}` where `userId == request.auth.uid`. A standard user cannot self-assign `role: "admin"` or `role: "moderator"`. Only trusted admins can change `role` or `status`.
2. **Resource Integrity & Authorship**: A resource must have `authorId == request.auth.uid`. Normal members can update their own resources (except authorId and status if it was locked). Admins can update/delete any resource or toggle status (published/hidden/deleted).
3. **Public Readability vs Privacy**: Public visitors (unauthenticated & authenticated) can read published resources (`status == "published"`). Hidden/deleted resources can only be viewed by the author or an Admin.
4. **Favorites Privacy**: A user can only create, list, and delete their own favorites (`userId == request.auth.uid`).
5. **Content Reports**: Authenticated members can file a report (`reporterId == request.auth.uid`). Only Admins/Moderators can list, view, resolve, or dismiss reports.
6. **Moderation Logs**: Only Admins/Moderators can view or write moderation logs (`exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or matching bootstrapped admin email).
7. **Settings Protection**: Anyone can read site settings (`settings/general`), but only Admins can create or update settings.
8. **Admin Gate**: Access to admin actions requires verification via `/admins/{uid}` or bootstrapped admin email `s6710380117@pkru.ac.th`.

## 2. The "Dirty Dozen" Threat Payloads
1. **Privilege Escalation on Signup**: An unprivileged user attempts to create `/users/{uid}` with `role: "admin"`. -> REJECT.
2. **Profile Hijacking**: User A attempts to update or overwrite User B's `/users/{userB}` document. -> REJECT.
3. **Impersonated Resource Creation**: User A creates `/resources/{resId}` with `authorId: "userB"`. -> REJECT.
4. **Unauthorized Resource Deletion**: User A attempts to delete User B's published educational resource. -> REJECT.
5. **Hidden Content Sniffing**: Guest user attempts to read resources where `status == "hidden"`. -> REJECT.
6. **Fake Report Injection**: User A submits a report pretending to be User B (`reporterId: "userB"`). -> REJECT.
7. **Report Snooping**: A regular user queries `/reports` collection to see who reported what. -> REJECT.
8. **Unauthorized Settings Overwrite**: Normal user attempts to update `/settings/general` to inject malicious announcements or wipe categories. -> REJECT.
9. **Tampering with Moderation Logs**: Non-admin attempts to insert or purge `/moderationLogs`. -> REJECT.
10. **Favorite Scraping**: Attacker queries `/favorites` without filtering by their own `userId`. -> REJECT.
11. **Account Un-ban Bypass**: A suspended user attempts to flip their status back to "active". -> REJECT.
12. **Denial-of-Wallet Payload**: Malicious user submits resource with a 50MB title or description. -> REJECT via string size limits.
