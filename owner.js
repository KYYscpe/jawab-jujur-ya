const $ = (q) => document.querySelector(q);

const pwInput = $("#pw");
const loadBtn = $("#load");
const logoutBtn = $("#logout");
const st = $("#st");
const list = $("#list");

function setStatus(msg, cls=""){
  st.className = "status " + cls;
  st.textContent = msg || "";
}

function fmtTime(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString("id-ID", { dateStyle:"medium", timeStyle:"short" });
  }catch{ return iso; }
}

function escapeHtml(s){
  return (s || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

async function load(){
  const pw = pwInput.value.trim() || sessionStorage.getItem("OWNER_PW");
  if(!pw){
    setStatus("Password wajib diisi.", "warn");
    return;
  }

  setStatus("Memuat data...");
  loadBtn.disabled = true;

  try{
    const res = await fetch("/api/admin", {
      headers: { "Authorization": "Bearer " + pw }
    });

    const data = await res.json().catch(() => ({}));
    if(!res.ok) throw new Error(data?.error || "Gagal");

    sessionStorage.setItem("OWNER_PW", pw);
    setStatus("Berhasil masuk.", "ok");

    const rows = Array.isArray(data?.rows) ? data.rows : [];
    if(rows.length === 0){
      list.innerHTML = `<div class="item">Belum ada jawaban.</div>`;
      return;
    }

    list.innerHTML = rows.map(r => {
      const yesno = r.q1 ? "Iya" : "Tidak";
      const prompt = r.q1 ? "Alesan masih suka:" : "Alesan sudah tidak suka:";
      return `
        <div class="item">
          <div class="meta">
            <span class="pill">${escapeHtml(fmtTime(r.created_at))}</span>
            <span class="pill">Q1: <b>${escapeHtml(yesno)}</b></span>
          </div>
          <div class="ans"><b>${escapeHtml(prompt)}</b>\n${escapeHtml(r.q2)}</div>
        </div>
      `;
    }).join("");
  }catch(e){
    setStatus("Password salah / gagal ambil data.", "warn");
  }finally{
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", load);

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("OWNER_PW");
  pwInput.value = "";
  list.innerHTML = "";
  setStatus("Logout.", "");
});

// auto-load kalau sudah pernah login
if(sessionStorage.getItem("OWNER_PW")){
  load();
}
