# X/Twitter Clone — Project Documentation

## What Is This?

A full-stack Twitter/X clone built from scratch as a learning project. The goal is to replicate core Twitter functionality — auth, posting, likes, comments, follows, and admin moderation — using a modern, production-style stack.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt |
| File Storage | Cloudinary (images) |
| Frontend | Vite + React + Tailwind CSS |

---

## What Can Users Do?

- Register and login
- Create posts (text, image, or video)
- Like and comment on posts
- Follow and unfollow other users
- Search Users (get similar username/Name suggestions)
- Deactivate their own account (soft delete)
- Get Notifications
- Chat (Future Agenda)

## What Can Admins Do?

- List Users and their respective posts
- Block and unblock users

---

## Roadmap

### ✅ Phase 1 — Database Schemas (Done)

**User Schema** — firstName, lastName, username (unique), email (unique), password, gender, DOB (16+ validation), bio, profileImageUrl, isAdmin, isDeactivated, isBlocked, followerCount, followingCount, followers[ ], following[ ]

**Post Schema** — userId, description, mediaUrl, mediaType (image/video), isDeleted, likes[ ], likeCount, comments[ ], commentCount

> Likes and comments are embedded inside the Post document. Follows are embedded inside the User document. Counts are stored separately (denormalized) for fast reads and synced manually on every like/unlike/follow/unfollow operation.

---

### 🔄 Phase 2 — Backend (In Progress)

#### Step 1 — Server Setup
- Express server with CORS, cookie-parser, express.json
- MongoDB connection with Mongoose
- 404 handler and global error handler (handles ValidationError, CastError, duplicate key)

#### Step 2 — API Routes

| Router | Prefix |
|---|---|
| Authentication | `/auth` |
| Users | `/user` |
| Posts | `/post` |
| Admin | `/admin` |

**Auth** — `POST /register`, `POST /login`, `POST /logout`

**Users** — get profile, update profile, deactivate account, follow, unfollow, get followers/following, search accounts with similar username, Name(firstName + lastName), notifications(of who liked, followed)

**Posts** — create post, get feed, get single post, delete post, like/unlike, add/delete comment

**Admin** — list users, block user, unblock user, view each user posts

#### Step 3 — Auth Middleware (verifyToken)
JWT verification middleware that protects all non-public routes. Attaches the logged-in user to `req.user`. Admin routes have an additional `isAdmin` check on top of this.

#### Step 4 — Controllers
Business logic for each route — validation, DB queries, response formatting.

---

### ⏳ Phase 3 — Frontend (Upcoming)

**Pages** — Login, Register, Home Feed, Profile, Single Post, Explore, Notifications, Admin Dashboard

**Key Components** — TweetCard, TweetComposer, Feed, ProfileHeader, FollowButton, NotificationItem

**State** — React Query for server state (posts, users), Zustand for auth state (logged-in user, token)
