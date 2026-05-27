# Learning Management System (LMS)

A comprehensive full-stack Learning Management System built with React, Node.js, Express, TypeScript, and Supabase (PostgreSQL).

## Features

### For Students
- Browse and enroll in published courses
- Track learning progress
- Watch video lessons, view PDFs, and take quizzes
- Dashboard with enrolled courses and progress tracking

### For Instructors
- Create and manage courses with a draft → pending → approved → published workflow
- Build course curriculum with modules and lessons
- Add video, PDF, and quiz content
- Track student enrollments and ratings

### For Admins
- Review and approve/reject pending courses
- Publish approved courses
- Archive published courses
- View platform analytics (students, instructors, enrollments)
- Manage users

## Tech Stack

**Frontend**
- React 18 with TypeScript
- React Router v6 for navigation
- Bootstrap 5 for styling
- Vite for fast development

**Backend**
- Node.js with Express
- TypeScript
- Supabase (PostgreSQL) for database
- JWT for authentication
- bcryptjs for password hashing

## Database Schema

The system uses Supabase (PostgreSQL) with the following main tables:
- `users` - User accounts (students, instructors, admins)
- `courses` - Course content with workflow states
- `modules` - Course sections
- `lessons` - Learning content (video, PDF, quiz, text)
- `quizzes` and `quiz_questions` - Quiz engine
- `enrollments` - Student course enrollments
- `progress` - Per-lesson progress tracking
- `course_reviews` - Admin review decisions

All tables have Row Level Security (RLS) enabled with role-based access control.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository

2. Install dependencies for both client and server:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:

   **Server (.env)**
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret_min_32_characters
   JWT_EXPIRES_IN=7d
   ```

   **Client (.env)**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Run the Supabase migration to create all tables (already applied)

### Development

Run both client and server in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Server only
npm run server:dev

# Client only
npm run client:dev
```

- Server runs on http://localhost:5000
- Client runs on http://localhost:5173

### Production Build

Build both client and server:
```bash
npm run build
```

## Project Structure

```
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context (AuthProvider)
│   │   ├── lib/            # API client
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin pages
│   │   │   ├── instructor/ # Instructor pages
│   │   │   └── student/    # Student pages
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   └── index.html
│
├── server/                  # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── lib/           # Supabase client
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   └── index.ts        # Entry point
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Courses
- `GET /api/courses` - List courses (role-based filtering)
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (instructor)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/submit` - Submit for review

### Admin
- `GET /api/admin/courses/pending` - List pending courses
- `POST /api/admin/courses/:id/approve` - Approve course
- `POST /api/admin/courses/:id/reject` - Reject course
- `POST /api/admin/courses/:id/publish` - Publish course
- `POST /api/admin/courses/:id/archive` - Archive course
- `GET /api/admin/analytics` - Get platform analytics

### Modules & Lessons
- `GET /api/courses/:courseId/modules` - List modules
- `POST /api/courses/:courseId/modules` - Create module
- `GET /api/modules/:moduleId/lessons` - List lessons
- `POST /api/modules/:moduleId/lessons` - Create lesson

### Enrollments & Progress
- `GET /api/enrollments/my` - Get my enrollments
- `POST /api/courses/:courseId/enroll` - Enroll in course
- `GET /api/enrollments/:enrollmentId/progress` - Get progress
- `POST /api/enrollments/:enrollmentId/lessons/:lessonId/progress` - Update progress

## Course Workflow

1. **DRAFT** - Instructor creates a new course (editable)
2. **PENDING** - Instructor submits for review (locked)
3. **APPROVED** - Admin approves (ready for publishing)
4. **PUBLISHED** - Admin publishes (visible to students)
5. **ARCHIVED** - Admin archives (hidden from students)

Rejected courses return to REJECTED state where instructors can edit and resubmit.

## Security

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- Row Level Security (RLS) on all database tables
- Role-based access control throughout the application
- Email confirmation is disabled for easier development

## Future Enhancements

- Video/PDF upload with signed URLs (Firebase Storage integration)
- Advanced quiz engine with multiple question types
- Discussion forums
- Certificates on course completion
- Payment integration for paid courses
- Real-time notifications
- Advanced analytics with charts

## License

MIT
