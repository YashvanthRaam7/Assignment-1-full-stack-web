const API = "/api";

function ensureHttpOrigin() {
  if (window.location.protocol === "file:") {
    alert("This app must be opened over HTTP. Start the backend and open http://localhost:5000/signup.html");
    return false;
  }
  return true;
}

// ── Auth guard ──────────────────────────────────────────────
async function checkAuth() {
  if (!ensureHttpOrigin()) return;

  try {
    const res = await fetch(`${API}/me`, { credentials: "include" });
    if (!res.ok) { window.location.href = "login.html"; return; }
    const data = await res.json();
    document.getElementById("welcomeMsg").textContent = `Hello, ${data.name}`;
  } catch {
    window.location.href = "login.html";
  }
}

async function logout() {
  await fetch(`${API}/logout`, { method: "POST", credentials: "include" });
  window.location.href = "login.html";
}

// ── File preview ────────────────────────────────────────────
function previewFile(input, labelId) {
  const label = document.getElementById(labelId);
  label.textContent = input.files[0] ? input.files[0].name : "Click or drag file here";
}

function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add("drag-over");
}

function onDrop(e, inputId) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const input = document.getElementById(inputId);
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  const labelId = inputId === "file1" ? "preview1" : "preview2";
  document.getElementById(labelId).textContent = file.name;
}

// ── Upload ──────────────────────────────────────────────────
async function uploadFiles() {
  const f1 = document.getElementById("file1").files[0];
  const f2 = document.getElementById("file2").files[0];

  if (!f1 && !f2) {
    return showMsg("uploadMsg", "Please select at least one file.", "error");
  }

  const formData = new FormData();
  if (f1) formData.append("file1", f1);
  if (f2) formData.append("file2", f2);

  try {
    const res  = await fetch(`${API}/upload`, { method: "POST", credentials: "include", body: formData });
    const data = await res.json();

    if (res.ok) {
      showMsg("uploadMsg", `Uploaded: ${data.files.join(", ")}`, "success");
      // Reset inputs
      ["file1","file2"].forEach(id => {
        document.getElementById(id).value = "";
      });
      document.getElementById("preview1").textContent = "Click or drag File 1";
      document.getElementById("preview2").textContent = "Click or drag File 2";
      loadFiles();
    } else {
      showMsg("uploadMsg", data.error || "Upload failed.", "error");
    }
  } catch {
    showMsg("uploadMsg", "Could not connect to server.", "error");
  }
}

// ── Download sample ──────────────────────────────────────────
async function downloadSample() {
  const a = document.createElement("a");
  a.href = `${API}/download-sample`;
  a.click();
}

async function deleteFile(fileId) {
  if (!confirm("Delete this uploaded file?")) return;

  try {
    const res = await fetch(`${API}/upload/${fileId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();

    if (res.ok) {
      showMsg("uploadMsg", "File deleted.", "success");
      loadFiles();
    } else {
      showMsg("uploadMsg", data.error || "Could not delete file.", "error");
    }
  } catch {
    showMsg("uploadMsg", "Could not connect to server.", "error");
  }
}

// ── My files ─────────────────────────────────────────────────
async function loadFiles() {
  const listEl = document.getElementById("fileList");
  try {
    const res  = await fetch(`${API}/my-files`, { credentials: "include" });
    const data = await res.json();

    if (!res.ok || !data.files.length) {
      listEl.innerHTML = `<p class="muted">No files uploaded yet.</p>`;
      return;
    }

    listEl.innerHTML = data.files.map(f => `
      <div class="file-item">
        <span class="file-type-badge">${f.file_type}</span>
        <span class="file-name">${f.filename}</span>
        <span class="file-date">${new Date(f.upload_timestamp).toLocaleString()}</span>
        <div class="file-actions">
          <button class="btn-secondary btn-small" onclick="window.location.href='view.html?file_id=${f.id}&type=${f.file_type}'">View</button>
          <button class="btn-danger btn-small" onclick="deleteFile(${f.id})">Delete</button>
        </div>
      </div>
    `).join("");
  } catch {
    listEl.innerHTML = `<p class="muted">Could not load files.</p>`;
  }
}

// ── Message helper ───────────────────────────────────────────
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `message ${type}`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.className = "message hidden", 5000);
}

// ── Init ─────────────────────────────────────────────────────
checkAuth();
loadFiles();
