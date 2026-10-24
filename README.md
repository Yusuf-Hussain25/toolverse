# Toolverse

An AI toolkit for creators: write articles, brainstorm blog titles, generate images, remove backgrounds and objects, and get feedback on your resume.

## Stack

| Part | Tech |
|---|---|
| Client | React, Vite, Tailwind CSS, Clerk |
| API | Node.js, Express, Neon Postgres |
| AI | Google Gemini, ClipDrop, Cloudinary AI |

## Project structure

```
toolverse/
├── client/   # React app
└── server/   # Express API
```

## Getting started

Requirements: Node.js 20+, a [Neon](https://neon.tech) database, a [Clerk](https://dashboard.clerk.com) application, and Gemini, ClipDrop and Cloudinary keys.

```bash
git clone https://github.com/Yusuf-Hussain25/toolverse.git
cd toolverse
npm install && npm run install:all

cp client/.env.example client/.env   # fill in the values
cp server/.env.example server/.env   # fill in the values

npm run dev                          # API on :3000, client on :5173
```

## Author

Yusuf Hussain · https://github.com/Yusuf-Hussain25
