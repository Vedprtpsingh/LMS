# LMS Course Module

This workspace contains a React frontend and a Node.js backend dedicated to the course management module.

## Backend

- Folder: `backend`
- Tech: Node.js, Express, MySQL
- Run:
  - `cd backend`
  - `npm install`
  - `npm start`

## Frontend

- Folder: `frontend`
- Tech: React, Vite, Bootstrap
- Run:
  - `cd frontend`
  - `npm install`
  - `npm run dev`

## Notes

- The frontend proxies API calls to `http://localhost:8080`.
- Use `backend/db/schema.sql` to initialize the MySQL `lmsdb` schema.
