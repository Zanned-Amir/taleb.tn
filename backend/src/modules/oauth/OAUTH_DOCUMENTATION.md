# OAuth - Login & Link Guide

## Login with OAuth

Redirect user to login:

```
GET /api/oauth/{provider}/login?action=login&auth_type={auth_type}
```

**Path Parameters:**

- `provider` - OAuth provider: `google`, `facebook`, `github`, `apple`

**Query Parameters:**

- `action` - `login` (required)
- `auth_type` - Authentication method: `cookie` or `header` (required)

**Example - Cookie Authentication:**

```
GET /api/oauth/google/login?action=login&auth_type=cookie
```

**Example - Header Authentication (JWT):**

```
GET /api/oauth/google/login?action=login&auth_type=header
```

**What happens:**

- User authenticates with OAuth provider
- If account exists → Login with selected auth method
- If new user → Create account and login
- If email matches existing user → Link and login

---

## Link OAuth Account

### Step 1: Get Link Token

User must be authenticated (has JWT token).

```bash
POST /api/oauth/{provider}/link
Authorization: Bearer {jwt_token}
```

**Path Parameters:**

- `provider` - OAuth provider: `google`, `facebook`, `github`, `apple`

**Response:**

```json
{
  "success": true,
  "url": "http://localhost:3000/api/oauth/google/login?action=link&user_id=123&link_token=uuid-string",
  "expires_at": "2026-02-01T10:05:00Z",
  "message": "Click the link to authorize google account linking. The link expires in 5 minutes."
}
```

### Step 2: Redirect to Link URL

```
GET /api/oauth/{provider}/login?action=link&user_id={user_id}&link_token={link_token}
```

**Path Parameters:**

- `provider` - OAuth provider: `google`, `facebook`, `github`, `apple`

**Query Parameters:**

- `action` - `link` (required)
- `user_id` - User ID to link to (required)
- `link_token` - Token from step 1, expires in 5 minutes (required)

**Example:**

```
GET /api/oauth/google/login?action=link&user_id=123&link_token=uuid-string-here
```

### Step 3: User Authenticates

OAuth provider redirects back → Account is linked ✅

---

## All Parameters Reference

| Parameter            | Type   | Location | Required           | Description                                             |
| -------------------- | ------ | -------- | ------------------ | ------------------------------------------------------- |
| `provider`           | string | Path     | ✅                 | OAuth provider: `google`, `facebook`, `github`, `apple` |
| `action`             | string | Query    | ✅                 | `login` or `link`                                       |
| `auth_type`          | string | Query    | ⚠️ If action=login | Authentication method: `cookie` or `header`             |
| `user_id`            | number | Query    | ⚠️ If action=link  | User ID to link account to                              |
| `link_token`         | string | Query    | ⚠️ If action=link  | Token from link-token endpoint (expires 5 min)          |
| `device_fingerprint` | string | Query    | ❌                 | Optional device fingerprint for security                |

---

## Authentication Methods

### Cookie Authentication (`auth_type=cookie`)

- Response includes secure HTTP-only cookies
- Best for web applications
- Tokens stored automatically in browser
- Good for same-origin requests

**Example:**

```
GET /api/oauth/google/login?action=login&auth_type=cookie
```

### Header Authentication (`auth_type=header`)

- Response includes JWT token in JSON body
- Best for mobile apps and SPAs
- Token must be stored by client
- Send token in `Authorization: Bearer {token}` header

**Example:**

```
GET /api/oauth/google/login?action=login&auth_type=header
```

---

## Quick Examples

### Login with Google (Cookie)

```javascript
window.location.href = '/api/oauth/google/login?action=login&auth_type=cookie';
```

### Login with Google (JWT Header)

```javascript
window.location.href = '/api/oauth/google/login?action=login&auth_type=header';
```

### Link Google Account

```javascript
// 1. Get token (after user auth)
const res = await fetch('/api/oauth/link-token', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ provider: 'google', user_id: 123 }),
});
const { link_url } = await res.json();

// 2. Redirect to link
window.location.href = link_url;
```

---

## Quick Examples

### Login with Google (Cookie)

```javascript
window.location.href = '/api/oauth/google/login?action=login&auth_type=cookie';
```

### Login with Google (JWT Header)

```javascript
window.location.href = '/api/oauth/google/login?action=login&auth_type=header';
```

### Link Google Account

```javascript
// 1. Get link URL (after user auth)
const res = await fetch('/api/oauth/google/link', {
  method: 'GET',
  headers: { Authorization: `Bearer ${token}` },
});
const { url } = await res.json();

// 2. Redirect to link
window.location.href = url;
```
