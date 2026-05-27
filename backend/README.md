# LMS Course Module Backend

This backend implements the course management module using Node.js, Express, and MySQL.

## Setup

1. Copy `.env.example` to `.env` and update database credentials.
2. Create the database schema with `backend/db/schema.sql`.
3. Install dependencies:

```bash
cd backend
npm install
```

4. Start the server:

```bash
npm start
```

## API Endpoints

- `GET /api/courses?role=INSTRUCTOR&userId=...`
- `GET /api/courses?role=ADMIN`
- `GET /api/courses?role=STUDENT`
- `POST /api/courses`
- `POST /api/courses/:id/submit`
- `POST /api/courses/:id/approve`
- `POST /api/courses/:id/reject`
- `POST /api/courses/:id/publish`
- `POST /api/courses/:id/archive`
