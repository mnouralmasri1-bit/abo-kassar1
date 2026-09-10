# Abu Kassar - MongoDB deployment

## Recommended deployment
This project is a Node.js + Express server that also serves the frontend.
Deploy it as a **Web Service**, not as a static site.

### Render
1. Push this project to GitHub.
2. In Render, create a **Web Service** from the repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add these environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
6. Deploy.
7. Open `https://YOUR-SERVICE.onrender.com/api/health`
   and confirm the database says `connected`.

### Important
Do NOT upload `.env` or `node_modules`.
The included `.env.example` contains placeholders only.

The current application uses the normal Node.js MongoDB/Mongoose stack, so a Node.js web-service host such as Render is the simplest direct deployment for this project.
