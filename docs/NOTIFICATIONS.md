# Havanat — Notification System Spec (Backend Cutover)

> Source of truth for how notifications flow in production. Mirrors the mock
> implementation in `app/src/stores/useNotificationStore.ts` so the backend
> can implement the same contract without guessing.

## 1. Data model

```
type NotificationChannel = "in_app" | "email" | "both"
type NotificationScope   = "user" | "tier" | "all"
type NotificationCategory = "general" | "order" | "return" | "membership" | "promotion" | "system"

interface Notification {
  id:             uuid
  title:          string       (≤120 chars)
  body:           text         (≤500 chars)
  category:       NotificationCategory
  channels:       NotificationChannel
  scope:          NotificationScope
  targetUserId:   uuid?        -- when scope = "user"
  targetTier:     enum?        -- when scope = "tier"
  authorId:       uuid         -- admin / moderator / system
  authorName:     string
  authorRole:     "admin" | "moderator" | "system"
  createdAt:      timestamp
  readBy:         jsonb        -- { userId: boolean }
}
```

## 2. Endpoints

| Verb | Path | Auth | Purpose |
|------|------|------|---------|
| `POST` | `/api/notifications` | admin / moderator | Broadcast a new notification |
| `GET`  | `/api/notifications` | customer | Per-user feed (auto-scoped by JWT) |
| `GET`  | `/api/notifications/unread-count` | customer | Bell badge count |
| `PATCH`| `/api/notifications/:id/read` | customer | Mark single notification read |
| `PATCH`| `/api/notifications/read-all` | customer | Mark all visible read |
| `DELETE`| `/api/notifications/:id` | admin | Soft-delete (audit log entry required) |

## 3. Authorisation rules

- Only `admin` or `moderator` may broadcast.
- `moderator` broadcasts are scoped to `category ∈ {general, promotion, membership}` (no order/return/system).
- Customer feeds are filtered server-side: only `scope = "all"` OR (`scope = "user"` AND `targetUserId = me`) OR (`scope = "tier"` AND `targetTier = myTier`).
- Admins can `DELETE` any notification; moderators only their own.

## 4. Channels & delivery

| Channel | When to send |
|---------|--------------|
| `in_app` | Always persist + return in GET. Bell badge polls `/unread-count` every 30s OR receives via SSE/WebSocket on later iteration. |
| `email` | Server-side: dispatch via **Resend** to either (a) the specific user when `scope = "user"`, (b) all users in tier when `scope = "tier"`, (c) all users with `marketing_opt_in = true` PLUS all footer-newsletter subscribers when `scope = "all"` AND `category = "general"`. |
| `both`   | Both of the above. |

### Footer newsletter → general email delivery

- The footer form (`/`) submits to `POST /api/newsletter/subscribe` with `{ email }`.
- Server upserts email into `newsletter_subscribers` table (with `marketing_opt_in = true`).
- A welcome email is dispatched via Resend using the broadcast system above (`scope = "user"`, `targetUserId = email`, `channels = "email"`).
- Future `category = "general"` broadcasts with `scope = "all"` deliver to `newsletter_subscribers ∪ users WHERE marketing_opt_in = true`.

## 5. Audit logging

Every broadcast creation is logged:

```
audit_log: { actorId, actorName, actorRole, action: "create", entityType: "notification",
             entityId: notification.id, entityLabel: title, summary: "Broadcast all via both",
             changes: { before: null, after: { title, scope, channels } } }
```

Mark-read / mark-all-read are NOT audited (high-frequency, low-value).
Soft-delete IS audited with `action: "delete"`.

## 6. Failure modes

- **Email dispatch failure** → retry 3× with exponential backoff (Resend). On final failure, mark notification `email_failed = true` and surface a banner to the admin author.
- **Customer deleted mid-broadcast** → email dispatch is skipped (the recipient lookup excludes soft-deleted users).

## 7. Frontend contract (mirrors backend)

The `useNotificationStore` mock store implements the same shape. When the
backend is live, swap `useNotificationStore` for a thin fetch wrapper:

```ts
// app/src/stores/useNotificationStore.ts — backend cutover
const fetchJson = (url: string, init?: RequestInit) => fetch(url, {
  ...init,
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', ...init?.headers },
}).then(r => r.json());

broadcast: async (input, actor) => fetchJson('/api/notifications', { method: 'POST', body: JSON.stringify(input) }),
forUser: async (userId) => fetchJson('/api/notifications'),
markRead: async (id, _userId) => fetchJson(`/api/notifications/${id}/read`, { method: 'PATCH' }),
markAllRead: async () => fetchJson('/api/notifications/read-all', { method: 'PATCH' }),
unreadCount: async () => (await fetchJson('/api/notifications/unread-count')).count,
```

UI components (`<NotificationsPage>`, `<AdminBroadcast>`, Navbar bell, Footer
newsletter form) require ZERO changes at the call-site level — they consume the
store methods, which transparently switch from localStorage to HTTP.

## 8. Frontend surfaces to verify at mock stage

- Customer bell icon shows correct badge count from `useNotificationStore.unreadCount`
- `/notifications` page filters by category, marks read on click, "Mark all read" button
- `/admin/broadcast` sends to all/tier/user with channel selector
- Footer newsletter submission triggers an in-app + console-email notification
- Admin `AdminNotifications` page (legacy) is replaced by `/admin/broadcast` going forward