# User Management Backend with MongoDB

This project implements the MongoDB + Node.js backend required for the assignment. It uses Express for REST APIs and Mongoose for schema validation, querying, and index management, and it is configured to connect to MongoDB Atlas.

## Features

- MongoDB connection using Mongoose
- Environment-based connection string with `.env`
- `users` collection with required schema validations
- CRUD APIs for creating, reading, updating, and deleting users
- Futuristic web UI served from Express
- Querying with search, filter, sorting, and pagination
- MongoDB indexes:
  - single-field index on `name`
  - compound index on `email` and `age`
  - multikey index on `hobbies`
  - text index on `bio`
  - hashed index on `userId`
  - TTL index on `createdAt`
- Index analysis using `explain("executionStats")`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example` and paste your MongoDB Atlas connection string:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/user_management_db?retryWrites=true&w=majority&appName=<app-name>
MONGODB_URI_FALLBACK=
DNS_SERVERS=8.8.8.8,1.1.1.1
SYNC_INDEXES=false
```

3. In MongoDB Atlas:

- create a cluster
- create a database user
- allow your current IP address in Network Access
- replace `<username>`, `<password>`, `<cluster-name>`, and `<app-name>` in the connection string
- if your network blocks SRV DNS lookups, copy the standard `mongodb://...` Atlas driver string into `MONGODB_URI_FALLBACK`
- keep `SYNC_INDEXES=false` on Vercel to avoid slow serverless cold starts; use `true` locally only when you intentionally want to sync indexes

4. Run the server:

```bash
npm start
```

5. Open the UI in your browser:

```text
http://localhost:5000
```

## API Endpoints

### Create user

`POST /api/users`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 24,
  "hobbies": ["coding", "music"],
  "bio": "Backend developer who likes MongoDB.",
  "userId": "user-john-001"
}
```

### Get all users

`GET /api/users`

Supported query params:

- `page`
- `limit`
- `sortBy`
- `order`
- `name`
- `email`
- `age`
- `hobby`
- `search`

Example:

```bash
GET /api/users?page=1&limit=5&name=john&hobby=music&sortBy=age&order=asc
```

### Get one user

`GET /api/users/:id`

### Update user

`PUT /api/users/:id`

### Delete user

`DELETE /api/users/:id`

## Index Test

Run:

```bash
npm run index:test
```

This script:

- syncs the declared indexes
- inserts sample data
- displays available indexes
- analyzes query performance using `explain("executionStats")`

## Notes

- The TTL index is configured on `createdAt` and currently expires documents after 365 days.
- If you want a shorter TTL for demonstration, update the `createdAt` field or TTL index configuration in the schema.
- `index-test.js` also uses the same Atlas connection string from `.env`.
