# Admin Dashboard Setup

This is the admin dashboard for the Learning Facilitating System, built with Next.js and shadcn/ui components.

## Prerequisites

- Node.js 18+ installed
- Backend server running on port 3001
- Redis server running
- PostgreSQL database with the schema from `backend/db/db.sql`

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
# Create .env.local file (already created)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Running the Application

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

## Authentication Flow

The admin authentication system uses a 3-step process:

1. **Username/Password Verification**: Admin enters credentials
2. **OTP Generation**: System sends OTP to registered phone number
3. **OTP Verification**: Admin enters OTP to complete login

### For Development/Testing

- The OTP is always `123456` in development mode
- Make sure your admin user in the database has a phone number registered

### Database Requirements

Ensure your admin user in the database has:

- `role = 'admin'`
- `is_active = true`
- `phone_number` field populated
- Valid `password_hash`

## File Structure

```
src/
├── app/
│   ├── login/page.js          # Admin login page
│   ├── home/page.js           # Admin dashboard
│   ├── layout.js              # Root layout with AuthProvider
│   └── page.js                # Redirect page
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── ProtectedRoute.js      # Route protection wrapper
├── context/
│   └── AuthContext.js         # Authentication context
└── config/
    └── api.js                 # API configuration
```

## Security Features

- JWT token-based authentication
- Secure cookie storage
- Rate limiting on login attempts
- Account lockout after failed attempts
- OTP verification with attempt limiting
- IP-based protection against brute force attacks

## Backend Routes

The following routes are added to the backend:

- `POST /auth/admin-verify-credentials` - Verify username/password
- `POST /auth/admin-send-otp` - Send OTP to phone number
- `POST /auth/admin-verify-otp` - Verify OTP and complete login

## Testing

1. Start the backend server
2. Start the Next.js development server
3. Navigate to `http://localhost:3000`
4. You'll be redirected to the login page
5. Enter admin credentials
6. Use OTP `123456` for testing
7. You'll be redirected to the admin dashboard

## Production Deployment

For production:

1. Update `NEXT_PUBLIC_API_URL` to your production backend URL
2. Set up proper OTP delivery (AWS SES)
3. Configure secure cookie settings
4. Set up proper environment variables
