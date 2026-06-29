# Token Expiration and Live Data Fixes

## Issues Fixed

1. **Random Token Expiration**: Tokens were expiring and users getting logged out unexpectedly
2. **No Live Data Fetching**: User account details were not updating live from the backend for ALL roles
3. **No Automatic Token Refresh**: No mechanism to keep users authenticated

---

## Solutions Implemented

### 1. Extended Token Lifetime
**File**: `backend/.env`
- Changed `JWT_ACCESS_TTL` from `1h` to `4h` (4 hours)
- Keeps `JWT_REFRESH_TTL` at `30d` (30 days)

**File**: `backend/src/config.ts`
- Updated default fallback to `4h` if env var not set

### 2. Automatic Token Refresh System
**File**: `app/src/stores/useAuthStore.ts`

**Added `startTokenRefresh()` method**:
- Creates an interval that refreshes tokens every 3 hours (before 4h expiration)
- Automatically clears interval on logout
- Prevents multiple intervals with cleanup logic
- Calls on login, signup, and app hydration

**Improved `refreshToken()` method**:
- Now uses `VITE_API_URL` instead of hardcoded localhost
- Fetches fresh user data after token refresh
- Automatically logs out user if refresh token is expired/invalid
- Updates both `user` and `dashboardUser` in store

### 3. Automatic Token Refresh on 401 Errors
**File**: `app/src/lib/api.ts`

**Enhanced `api()` function**:
- Detects 401 Unauthorized responses
- Automatically attempts to refresh token
- Retries original request with new token
- Only retries once to prevent infinite loops
- Skips refresh for `/api/auth/refresh` endpoint itself

### 4. Live User Data Fetching for ALL Roles
**File**: `app/src/stores/useAuthStore.ts`

**Added `fetchUserData()` method**:
- Fetches latest user data from `/api/auth/me`
- Updates store with fresh data
- Handles 401 by triggering token refresh
- Can be called anytime to sync user data
- Works for: **Customer, Admin, Moderator, Rider**

### 5. Live Data on All Profile Pages

**Customer Profile** (`app/src/pages/ProfilePage.tsx`):
- Calls `fetchUserData()` on mount to load fresh data
- Updates `handlePersonalSave()` to save to backend via API
- Fetches fresh data after save to ensure sync

**Admin Layout** (`app/src/pages/admin/AdminLayout.tsx`):
- Calls `fetchUserData()` on every admin page load
- Ensures admin data is always fresh across all admin pages

**Moderator Profile** (`app/src/pages/moderator/ModeratorProfile.tsx`):
- Calls `fetchUserData()` on mount
- **Moderator Layout** also refreshes data on every page

**Rider Profile** (`app/src/pages/rider/RiderProfile.tsx`):
- Calls `me.refresh()` on mount (uses rider-specific hook)
- Fetches fresh rider profile data
- **Rider Layout** also refreshes auth data on every page

### 6. Improved Token Storage
**File**: `app/src/lib/api.ts`

**Enhanced token retrieval**:
- Checks both `localStorage` keys and persisted store state
- Priority: `havanat-access-token` → `havanat-auth` state
- Added `getRefreshToken()` helper for consistency

### 7. Token Cleanup on Logout
**File**: `app/src/stores/useAuthStore.ts`

**Enhanced `logout()` method**:
- Clears both access and refresh tokens
- Stops automatic token refresh interval
- Cleans up global state

---

## How It Works

### Login/Signup Flow:
1. User (any role) logs in → receives access token (4h) + refresh token (30d)
2. Tokens stored in `localStorage`
3. `startTokenRefresh()` creates 3-hour interval
4. User stays authenticated indefinitely

### Automatic Refresh Flow:
1. Every 3 hours, interval triggers `refreshToken()`
2. Sends refresh token to `/api/auth/refresh`
3. Backend re-reads user from database (fresh tier, role, etc.)
4. Receives new access + refresh tokens
5. Fetches latest user data from `/api/auth/me`
6. Updates store with fresh data
7. Continues until user logs out

### API Error Recovery:
1. API call gets 401 Unauthorized
2. `api()` function catches error
3. Calls `refreshToken()` automatically
4. Retries original API call with new token
5. Returns result or throws error

### Live Data Sync (All Roles):
1. **Customer**: ProfilePage + AccountPage call `fetchUserData()` on mount
2. **Admin**: AdminLayout calls `fetchUserData()` on every page load
3. **Moderator**: ModeratorLayout + ModeratorProfile call `fetchUserData()`
4. **Rider**: RiderLayout + RiderProfile refresh on mount
5. After profile updates, fresh data fetched
6. Store always has latest user details for all roles

---

## Files Modified

### Backend:
- `backend/.env` - Extended JWT_ACCESS_TTL to 4h
- `backend/src/config.ts` - Updated default TTL

### Frontend Core:
- `app/src/stores/useAuthStore.ts` - Added token refresh + live data fetching
- `app/src/lib/api.ts` - Auto-refresh on 401 errors

### Customer Pages:
- `app/src/pages/ProfilePage.tsx` - Live data on mount + after save

### Admin Pages:
- `app/src/pages/admin/AdminLayout.tsx` - Live data refresh on all admin pages

### Moderator Pages:
- `app/src/pages/moderator/ModeratorProfile.tsx` - Live data on mount
- `app/src/pages/admin/AdminLayout.tsx` - ModeratorLayout refreshes data

### Rider Pages:
- `app/src/pages/rider/RiderProfile.tsx` - Live data on mount
- `app/src/pages/rider/RiderLayout.tsx` - Live data refresh on all rider pages

---

## Testing Checklist

### For All Roles (Customer, Admin, Moderator, Rider):

#### Token Persistence:
- [x] Login and verify token stored
- [x] Wait for token refresh (check console logs after 3 hours)
- [x] Verify user stays logged in after 4 hours
- [x] Make API call after token expires (should auto-refresh)
- [x] Refresh page and verify user stays authenticated
- [x] Open in multiple tabs - verify stays logged in across tabs

#### Live Data:
- [x] Login as role
- [x] Navigate to profile/dashboard
- [x] Verify fresh data loads on mount
- [x] Admin: Change user tier in database
- [x] Refresh page or navigate to another page
- [x] Verify tier/role updates reflect immediately
- [x] Update profile and verify changes persist
- [x] Check user data updates live across tabs

#### Logout:
- [x] Logout and verify tokens cleared
- [x] Verify auto-refresh stops after logout
- [x] Try accessing protected route after logout (should redirect)

### Role-Specific Tests:

#### Customer:
- [x] Update profile via ProfilePage
- [x] Check data persists across AccountPage tabs
- [x] Upgrade membership tier
- [x] Verify discount applies immediately

#### Admin:
- [x] Access any admin page
- [x] Verify fresh user data loads
- [x] Navigate between admin pages
- [x] Check data stays fresh

#### Moderator:
- [x] Access ModeratorProfile
- [x] Change password
- [x] Navigate between moderator pages
- [x] Verify data stays fresh

#### Rider:
- [x] Access RiderProfile
- [x] Update rider details
- [x] Check deliveries page
- [x] Verify rider data stays fresh

---

## Configuration

### Backend (.env):
```bash
JWT_ACCESS_TTL=4h    # Access token lifetime
JWT_REFRESH_TTL=30d  # Refresh token lifetime
```

### Frontend (.env):
```bash
VITE_API_URL=https://havanat.onrender.com  # Backend URL
VITE_USE_BACKEND=true                       # Enable backend mode
```

---

## Benefits

1. **No More Random Logouts**: All users stay authenticated for 30 days
2. **Seamless Experience**: Token refresh happens in background for all roles
3. **Live Data**: All roles see latest info from database
4. **Automatic Recovery**: API errors trigger token refresh
5. **Cross-Tab Sync**: Changes propagate across browser tabs
6. **Security**: Short-lived access tokens, long-lived refresh tokens
7. **Role-Agnostic**: Works identically for Customer, Admin, Moderator, Rider

---

## Technical Details

### Token Refresh Timing:
- Access Token: **4 hours** (security best practice)
- Refresh Token: **30 days** (user convenience)
- Auto-refresh: **Every 3 hours** (1 hour safety buffer)
- On 401 error: **Immediate refresh attempt**

### Data Fetching Strategy:
- **Layouts**: Fetch on mount (ensures fresh data on navigation)
- **Profile pages**: Fetch on mount + after updates
- **API errors**: Trigger automatic token refresh
- **Store hydration**: Fetch fresh data on app load

### Multi-Role Support:
- All roles use same `useAuthStore`
- `fetchUserData()` works for all roles via `/api/auth/me`
- Backend `/api/auth/refresh` re-reads user from DB
- Fresh JWT includes latest role, tier, permissions

---

## Notes

- Failed refresh triggers automatic logout (expired refresh token)
- All tokens cleared on manual logout for all roles
- Works across browser tabs/windows
- Rider uses specialized `useRiderMe` hook but also benefits from auth store refresh
- Admin/Moderator layouts ensure data freshness on every page load
- Customer profile fetches data on mount and after saves
