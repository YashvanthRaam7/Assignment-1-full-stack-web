const API = "/api";

function isFileProtocol() {
  return window.location.protocol === "file:";
}

function ensureHttpOrigin() {
  if (isFileProtocol()) {
    showMsg(
      "msg",
      "Please open the app through http://localhost:5000/signup.html instead of file://.",
      "error"
    );
    return false;
  }
  return true;
}

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `message ${type}`;
}

// ── Signup ──────────────────────────────────────────────────
async function signup() {
  const name     = document.getElementById("name").value.trim();
  const age      = document.getElementById("age").value.trim();
  const address  = document.getElementById("address").value.trim();
  const email    = document.getElementById("email").value.trim();
  const mobile   = document.getElementById("mobile").value.trim();
  const password = document.getElementById("password").value;

  if (!ensureHttpOrigin()) return false;
  if (!name || !age || !address || !email || !mobile || !password) {
    return showMsg("msg", "All fields are required.", "error");
  }
  if (password.length < 6) {
    return showMsg("msg", "Password must be at least 6 characters.", "error");
  }

  try {
    const res  = await fetch(`${API}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, age: parseInt(age), address, email, mobile, password }),
    });
    const data = await res.json();

    if (res.ok) {
      showMsg("msg", "Account created! Redirecting to login…", "success");
      setTimeout(() => window.location.href = "login.html", 1500);
    } else {
      showMsg("msg", data.error || "Signup failed.", "error");
    }
  } catch {
    showMsg("msg", "Could not connect to server.", "error");
  }
}

// ── Login ───────────────────────────────────────────────────
async function login() {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!ensureHttpOrigin()) return false;
  if (!email || !password) {
    return showMsg("msg", "Email and password are required.", "error");
  }

  try {
    const res  = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      showMsg("msg", `Welcome back, ${data.name}! Redirecting…`, "success");
      setTimeout(() => window.location.href = "dashboard.html", 1200);
    } else {
      showMsg("msg", data.error || "Login failed.", "error");
    }
  } catch {
    showMsg("msg", "Could not connect to server.", "error");
  }
}

// Allow Enter key on login/signup forms
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  if (document.getElementById("signupBtn")) signup();
  else login();
});
