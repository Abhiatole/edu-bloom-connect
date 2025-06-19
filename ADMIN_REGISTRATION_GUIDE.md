# Admin Registration Feature

## Overview
Added a dedicated Admin Registration page that allows authorized personnel to create administrator accounts for the EduGrowHub system.

## Access Points

### 1. **Login Page**
- Added "Register as Administrator" button on the login page
- Direct access via: `/register/admin`

### 2. **Home Page**
- **Footer Section**: System Administration section with Admin Registration button
- **Floating Button**: Purple "Admin" button in bottom-right corner (only visible on home page)

### 3. **Direct URL Access**
- **URL**: `http://localhost:8080/register/admin`
- **Production**: `https://edugrowhub.netlify.app/register/admin`

## Features

### Security Features
- **Email Validation**: Required email format validation
- **Password Requirements**: Minimum 6 characters
- **Password Confirmation**: Must match original password
- **Optional Admin Code**: ADMIN2025 (can be enabled/disabled)

### Registration Process
1. User fills out registration form
2. System creates auth user with 'admin' role in metadata
3. Profile is automatically created in `user_profiles` table with role 'ADMIN'
4. Email confirmation may be required (depending on Supabase settings)
5. Admin account is ready for login after confirmation

### Form Fields
- **Full Name**: Administrator's full name
- **Email**: Admin email address (must be unique)
- **Password**: Secure password (min 6 chars)
- **Confirm Password**: Password verification
- **Admin Code** (Optional): Verification code for additional security

## Database Integration

### Table Used
- **Primary**: `user_profiles` table with `role = 'ADMIN'`
- **Alternative**: Falls back to trigger-based profile creation

### Permissions
- Uses existing RLS policies for user_profiles table
- Inherits permissions from database triggers

## Visual Design
- **Purple Theme**: Consistent with admin/security branding
- **Shield Icons**: Security-focused iconography
- **Responsive Design**: Works on all device sizes
- **Consistent Styling**: Matches existing registration pages

## Configuration

### Admin Verification Code
```typescript
// Current default code (can be changed)
const ADMIN_CODE = 'ADMIN2025';
```

### Enable/Disable Admin Code
```typescript
// In AdminRegister.tsx
const [showAdminCode, setShowAdminCode] = useState(false);
```

## Usage Instructions

### For Development
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:8080/`
3. Click the purple "Admin" floating button, or
4. Go to login page and click "Register as Administrator"

### For Production (Netlify)
1. Deploy updated code to Netlify
2. Access via: `https://edugrowhub.netlify.app/register/admin`
3. Or use any of the access points mentioned above

## Security Considerations

### Current Security
- ✅ Password validation
- ✅ Email uniqueness
- ✅ Optional verification code
- ✅ Role-based access control

### Recommended Enhancements
- 🔄 Email domain restrictions (e.g., only @school.edu emails)
- 🔄 Two-factor authentication
- 🔄 Admin approval workflow
- 🔄 IP address restrictions
- 🔄 Audit logging

## Troubleshooting

### Common Issues
1. **"Table admin_profiles does not exist"**: Use user_profiles table instead
2. **Registration fails**: Check database triggers are working
3. **Profile not created**: Verify RLS policies allow insertion

### Testing Registration
```bash
# Test the registration endpoint
node test-registration.js
```

### Verify Database Setup
```sql
-- Check if admin profiles exist
SELECT * FROM user_profiles WHERE role = 'ADMIN';
```

## Integration with Existing System

### Login System
- Admin users login through standard `/login` page
- System detects 'ADMIN' role and redirects to admin dashboard
- Uses existing authentication flow

### Dashboard Access
- After login, admins are redirected to: `/superadmin/dashboard`
- Role stored in localStorage as 'superadmin'
- Full access to admin features

## Future Enhancements

### Planned Features
- [ ] Bulk admin creation
- [ ] Admin role hierarchy (Super Admin, Admin, Moderator)
- [ ] Admin invitation system
- [ ] Advanced security features
- [ ] Admin analytics dashboard

---

**Note**: This feature integrates seamlessly with the existing user management system and maintains all security standards.
