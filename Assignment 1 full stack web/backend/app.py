from flask import Flask, request, jsonify, session, send_file, send_from_directory
from flask_cors import CORS
import mysql.connector
import bcrypt
import os
import datetime
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# Load .env (works locally; on Vercel use environment variables in dashboard)
_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    load_dotenv(_env_path)

# Resolve frontend folder from this file's location
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")
UPLOAD_DIR   = "/tmp/uploads"
ALLOWED_EXT  = {"pdf", "png", "jpg", "jpeg"}
os.makedirs(UPLOAD_DIR, exist_ok=True)

IS_PROD = (
    os.environ.get("VERCEL") == "1" or
    os.environ.get("VERCEL_ENV") is not None or
    os.environ.get("SPACE_ID") is not None
)

app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, "..", "frontend", "static"),
    static_url_path="/static",
)

app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key")
CORS(app, supports_credentials=True, origins="*")
app.config["SESSION_COOKIE_SAMESITE"] = "None" if IS_PROD else "Lax"
app.config["SESSION_COOKIE_SECURE"]   = IS_PROD
app.config["SESSION_COOKIE_HTTPONLY"] = True


# ── DB ────────────────────────────────────────────────────────────────────────
def get_db():
    return mysql.connector.connect(
        host     = os.environ.get("DB_HOST"),
        user     = os.environ.get("DB_USER"),
        password = os.environ.get("DB_PASSWORD"),
        database = os.environ.get("DB_NAME"),
        port     = int(os.environ.get("DB_PORT", 3306)),
        ssl_disabled = False,
    )

def allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


# ── Signup ────────────────────────────────────────────────────────────────────
@app.route("/api/signup", methods=["POST"])
def signup():
    d = request.get_json()
    if not all(d.get(f) for f in ["name","age","address","email","mobile","password"]):
        return jsonify({"error": "All fields are required."}), 400
    hashed = bcrypt.hashpw(d["password"].encode(), bcrypt.gensalt()).decode()
    try:
        db = get_db(); cur = db.cursor()
        cur.execute(
            "INSERT INTO users (name,age,address,email,mobile,password_hash) VALUES (%s,%s,%s,%s,%s,%s)",
            (d["name"], d["age"], d["address"], d["email"], d["mobile"], hashed)
        )
        db.commit(); db.close()
        return jsonify({"message": "Signup successful."}), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "Email already registered."}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Login ─────────────────────────────────────────────────────────────────────
@app.route("/api/login", methods=["POST"])
def login():
    d = request.get_json()
    if not d.get("email") or not d.get("password"):
        return jsonify({"error": "Email and password required."}), 400
    try:
        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM users WHERE email=%s", (d["email"],))
        user = cur.fetchone(); db.close()
        if not user or not bcrypt.checkpw(d["password"].encode(), user["password_hash"].encode()):
            return jsonify({"error": "Invalid email or password."}), 401
        session["user_id"]   = user["id"]
        session["user_name"] = user["name"]
        return jsonify({"message": "Login successful.", "name": user["name"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Logout / Me ───────────────────────────────────────────────────────────────
@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out."}), 200

@app.route("/api/me")
def me():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated."}), 401
    return jsonify({"user_id": session["user_id"], "name": session["user_name"]}), 200


# ── Upload ────────────────────────────────────────────────────────────────────
@app.route("/api/upload", methods=["POST"])
def upload():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated."}), 401
    uploaded = []
    for key in ["file1", "file2"]:
        f = request.files.get(key)
        if not f or f.filename == "": continue
        if not allowed(f.filename):
            return jsonify({"error": f"'{f.filename}' must be PDF, PNG or JPEG."}), 400
        ext      = f.filename.rsplit(".", 1)[1].lower()
        safe     = secure_filename(session["user_name"].replace(" ","_").lower())
        ts       = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{safe}_{ts}_{len(uploaded)+1}.{ext}"
        f.save(os.path.join(UPLOAD_DIR, filename))
        try:
            db = get_db(); cur = db.cursor()
            cur.execute(
                "INSERT INTO uploaded_files (user_id,filename,file_type,upload_timestamp) VALUES (%s,%s,%s,%s)",
                (session["user_id"], filename, ext, datetime.datetime.now())
            )
            db.commit(); db.close()
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        uploaded.append(filename)
    if not uploaded:
        return jsonify({"error": "No valid files uploaded."}), 400
    return jsonify({"message": "Uploaded successfully.", "files": uploaded}), 200


# ── My files ──────────────────────────────────────────────────────────────────
@app.route("/api/my-files")
def my_files():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated."}), 401
    try:
        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute(
            "SELECT id,filename,file_type,upload_timestamp FROM uploaded_files WHERE user_id=%s ORDER BY upload_timestamp DESC",
            (session["user_id"],)
        )
        files = cur.fetchall(); db.close()
        for f in files: f["upload_timestamp"] = str(f["upload_timestamp"])
        return jsonify({"files": files}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Download sample ───────────────────────────────────────────────────────────
@app.route("/api/download-sample")
def download_sample():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated."}), 401
    path = "/tmp/sample.txt"
    with open(path, "w") as f:
        f.write(f"Full-Stack App\nUser: {session['user_name']}\nDate: {datetime.datetime.now()}")
    return send_file(path, as_attachment=True, download_name="sample.txt")


# ── View / Delete uploaded file ───────────────────────────────────────────────
@app.route("/api/upload/<int:fid>", methods=["GET","DELETE"])
def file_ops(fid):
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated."}), 401
    try:
        db = get_db(); cur = db.cursor(dictionary=True)
        cur.execute("SELECT filename FROM uploaded_files WHERE id=%s AND user_id=%s", (fid, session["user_id"]))
        row = cur.fetchone()
        if not row:
            db.close(); return jsonify({"error": "Not found."}), 404
        fp = os.path.join(UPLOAD_DIR, row["filename"])
        if request.method == "GET":
            db.close()
            if not os.path.exists(fp): return jsonify({"error": "File missing on server."}), 404
            return send_file(fp)
        else:  # DELETE
            if os.path.exists(fp): os.remove(fp)
            cur.execute("DELETE FROM uploaded_files WHERE id=%s", (fid,))
            db.commit(); db.close()
            return jsonify({"message": "Deleted."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Serve frontend HTML pages ─────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "signup.html")

@app.route("/<path:path>")
def catch_all(path):
    fp = os.path.join(FRONTEND_DIR, path)
    if os.path.exists(fp):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "signup.html"), 404


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port, debug=False)
