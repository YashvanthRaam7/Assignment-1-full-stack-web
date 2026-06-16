const API = "/api";

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "dashboard.html";
  }
}

function getFileId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("file_id");
}

function initViewer() {
  const fileId = getFileId();
  if (!fileId) {
    window.location.href = "dashboard.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const fileType = params.get("type")?.toLowerCase();
  const fileUrl = `${API}/upload/${fileId}`;

  const image = document.getElementById("fileImage");
  const iframe = document.getElementById("fileFrame");

  if (fileType && ["png", "jpg", "jpeg"].includes(fileType)) {
    image.src = fileUrl;
    image.style.display = "block";
    iframe.style.display = "none";
  } else {
    iframe.src = fileUrl;
    iframe.style.display = "block";
    image.style.display = "none";
  }

  const downloadLink = document.getElementById("downloadLink");
  downloadLink.href = fileUrl;
}

initViewer();
