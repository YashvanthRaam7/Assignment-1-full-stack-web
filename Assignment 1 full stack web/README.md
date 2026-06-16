# Full-Stack Web Application

A full-stack web app built with **Python (Flask)**, **MySQL**, and vanilla **HTML/CSS/JS**.

## Features
- User Sign-Up with name, age, address, email, mobile, password
- Secure Login (bcrypt password hashing)
- Dashboard with:
  - File upload (PDF, PNG, JPEG) — two fields, filenames include the user's name
  - Sample file download
  - Upload history table

---

## Project Structure
```
fullstack-app/
├── backend/
│   ├── app.py              # Flask API
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── signup.html
│   ├── login.html
│   ├── dashboard.html
│   └── static/
│       ├── css/style.css
│       └── js/auth.js / dashboard.js
├── database/
│   └── schema.sql
└── uploads/               # Created automatically
```

---

## Local Setup

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # Edit .env with your MySQL credentials
python app.py
```
Backend runs at **http://localhost:5000**

### 3. Frontend
Serve the frontend folder with any static server:
```bash
# Option A – Python
cd frontend
python -m http.server 8080

# Option B – VS Code Live Server extension
# Right-click signup.html → Open with Live Server
```
Open **http://localhost:8080/signup.html** in your browser.

---

## Deployment

### Recommended: Render (free tier)

**Backend (Flask)**
1. Push code to GitHub
2. New Web Service → connect repo
3. Build command: `pip install -r backend/requirements.txt`
4. Start command: `gunicorn -w 2 -b 0.0.0.0:$PORT backend.app:app`
5. Add environment variables in the Render dashboard (from `.env.example`)

**Database**
- Use [PlanetScale](https://planetscale.com) or [Railway](https://railway.app) for a hosted MySQL instance
- Update `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in Render env vars

**Frontend**
1. Update `const API = "..."` in both JS files to your Render backend URL
2. Deploy `frontend/` folder to **Netlify** or **Vercel** (drag-and-drop)

---

## Security Practices Applied
- Passwords hashed with **bcrypt** (never stored in plain text)
- File uploads validated for type (whitelist: pdf, png, jpg, jpeg)
- Filenames sanitized with `werkzeug.utils.secure_filename`
- Server-side session authentication on all protected routes
- Environment variables for all secrets (never hardcoded)

---

## Assumptions
- A single MySQL database instance is used
- Sessions are cookie-based (works for same-origin or CORS-enabled cross-origin)
- Uploaded files are stored on the server filesystem (for production, swap for S3 or similar)
