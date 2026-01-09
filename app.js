const $ = (q) => document.querySelector(q);

const step1 = $("#step1");
const step2 = $("#step2");
const step3 = $("#step3");

const nextBtn = $("#nextBtn");
const backBtn = $("#backBtn");
const submitBtn = $("#submitBtn");
const restartBtn = $("#restartBtn");

const q2Title = $("#q2Title");
const q2Text = $("#q2Text");
const count = $("#count");
const statusEl = $("#status");
const honeypot = $("#website");

let q1Value = null; // "yes" | "no"

function showStep(el){
  [step1, step2, step3].forEach(s => s.classList.remove("show"));
  el.classList.add("show");
  statusEl.className = "status";
  statusEl.textContent = "";
}

function setQ2Prompt(){
  if(q1Value === "yes"){
    q2Title.textContent = "Alesan kamu masih menyukai ayaa?";
    q2Text.placeholder = "Ceritain alesannya...";
  } else {
    q2Title.textContent = "Alesan kamu tidak menyukai ayaa lagi apa?";
    q2Text.placeholder = "Ceritain alesannya...";
  }
}

function readQ1(){
  const checked = document.querySelector('input[name="q1"]:checked');
  q1Value = checked ? checked.value : null;
  nextBtn.disabled = !q1Value;
}

document.querySelectorAll('input[name="q1"]').forEach(r => {
  r.addEventListener("change", readQ1);
});

nextBtn.addEventListener("click", () => {
  setQ2Prompt();
  q2Text.value = "";
  count.textContent = "0";
  showStep(step2);
  q2Text.focus();
});

backBtn.addEventListener("click", () => {
  showStep(step1);
});

q2Text.addEventListener("input", () => {
  count.textContent = String(q2Text.value.length);
});

restartBtn.addEventListener("click", () => {
  // reset
  document.querySelectorAll('input[name="q1"]').forEach(r => r.checked = false);
  q1Value = null;
  nextBtn.disabled = true;
  showStep(step1);
});

async function submit(){
  const text = q2Text.value.trim();

  if(honeypot.value.trim()){
    // bot
    statusEl.className = "status warn";
    statusEl.textContent = "Gagal. Coba refresh halaman.";
    return;
  }

  if(!q1Value){
    statusEl.className = "status warn";
    statusEl.textContent = "Pilih jawaban dulu.";
    return;
  }

  if(text.length < 3){
    statusEl.className = "status warn";
    statusEl.textContent = "Jawabannya kependekan.";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";
  statusEl.className = "status";
  statusEl.textContent = "Mengirim jawaban...";

  try{
    const payload = {
      q1: q1Value === "yes",
      q2: text,
      meta: {
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        ua: navigator.userAgent || null,
        lang: navigator.language || null
      }
    };

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if(!res.ok){
      throw new Error(data?.error || "Server error");
    }

    statusEl.className = "status ok";
    statusEl.textContent = "Terkirim.";
    showStep(step3);
  }catch(err){
    statusEl.className = "status warn";
    statusEl.textContent = "Gagal kirim. Coba lagi.";
  }finally{
    submitBtn.disabled = false;
    submitBtn.textContent = "Kirim";
  }
}

submitBtn.addEventListener("click", submit);

// ===== Background animation (soft floating particles) =====
(function bg(){
  const canvas = $("#bg");
  const ctx = canvas.getContext("2d");
  let w=0,h=0, dpr=1;
  let items = [];

  function resize(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    items = Array.from({length: Math.floor(Math.min(70, (innerWidth*innerHeight)/18000))}, () => spawn(true));
  }

  function spawn(initial=false){
    const side = Math.random();
    const x = initial ? Math.random()*w : (side<0.5 ? -50 : w+50);
    const y = Math.random()*h;
    const r = (6 + Math.random()*18) * dpr;
    const vx = (side<0.5 ? 1 : -1) * (0.08 + Math.random()*0.22) * dpr;
    const vy = (-0.03 + Math.random()*0.06) * dpr;
    const a = 0.05 + Math.random()*0.12;
    const t = Math.random()*Math.PI*2;
    return {x,y,r,vx,vy,a,t};
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const p of items){
      p.x += p.vx;
      p.y += p.vy;
      p.t += 0.01;

      const bob = Math.sin(p.t) * 0.35 * dpr;
      const x = p.x;
      const y = p.y + bob;

      // simple glow circle (no fixed colors in CSS; ok here)
      const g = ctx.createRadialGradient(x,y,0,x,y,p.r);
      g.addColorStop(0, `rgba(255,79,216,${p.a})`);
      g.addColorStop(0.55, `rgba(95,211,255,${p.a*0.85})`);
      g.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x,y,p.r,0,Math.PI*2);
      ctx.fill();

      if(p.x < -80 || p.x > w+80 || p.y < -80 || p.y > h+80){
        Object.assign(p, spawn());
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();
