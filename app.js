/* Flight Timer & Log PWA — Version 1.0 */
(function(){

  const $ = (sel) => document.querySelector(sel);
  const stateKey = "ftl.state.v1.0";

  const els = {
    elapsedHHMMSS: $("#elapsedHHMMSS"),
    pausedHHMMSS: $("#pausedHHMMSS"),
    elapsedDec: $("#elapsedDec"),
    startedAt: $("#startedAt"),
    startResumeBtn: $("#startResumeBtn"),
    pauseBtn: $("#pauseBtn"),
    resetTimerBtn: $("#resetTimerBtn"),
    timerState: $("#timerState"),
    stdPlus: $("#stdPlus"),
    stdMinus: $("#stdMinus"),
    instPlus: $("#instPlus"),
    instMinus: $("#instMinus"),
    stdCount: $("#stdCount"),
    instCount: $("#instCount"),
    resetLandings: $("#resetLandings"),
    hobbsStart: $("#hobbsStart"),
    hobbsStop: $("#hobbsStop"),
    hobbsTotal: $("#hobbsTotal"),
    clearHobbs: $("#clearHobbs"),
    tachStart: $("#tachStart"),
    tachStop: $("#tachStop"),
    tachTotal: $("#tachTotal"),
    clearTach: $("#clearTach"),
    manStart: $("#manStart"),
    manStop: $("#manStop"),
    manHHMM: $("#manHHMM"),
    manDec: $("#manDec"),
    clearManual: $("#clearManual"),
    summaryBox: $("#summaryBox"),
    copySummary: $("#copySummary"),
    resetAll: $("#resetAll"),
    installBtn: $("#installBtn"),
  };

  const initial = {
    timer: {
      running: false,
      // first moment Start was pressed in this session (persisted)
      firstStartMs: null,
      // when the timer last resumed
      lastResumeMs: null,
      // total elapsed not including current run segment
      baseElapsedMs: 0,
      // when the timer was paused
      lastPauseMs: null,
      // total paused time
      basePausedMs: 0,
    },
    landings: { student: 0, instructor: 0 },
    hobbs: { start: "", stop: "" },
    tach: { start: "", stop: "" },
    manual: { start: "", stop: "" },
    meta: { updatedAt: new Date().toISOString() },
  };

  let st = loadState();

  function loadState(){
    try{
      const raw = localStorage.getItem(stateKey);
      if(!raw) return structuredClone(initial);
      const parsed = JSON.parse(raw);
      // merge with initial in case of upgrades
      return deepMerge(structuredClone(initial), parsed);
    }catch(e){
      console.warn("State load failed", e);
      return structuredClone(initial);
    }
  }

  function save(){
    st.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(stateKey, JSON.stringify(st));
    renderSummary();
  }

  function deepMerge(base, patch){
    for(const k in patch){
      if(patch[k] && typeof patch[k] === "object" && !Array.isArray(patch[k])){
        base[k] = deepMerge(base[k] ?? {}, patch[k]);
      } else {
        base[k] = patch[k];
      }
    }
    return base;
  }

  // ==== TIMER ====
  let tickHandle = null;

  function now(){
    return Date.now();
  }

  function startTimer(){
    if(!st.timer.firstStartMs) st.timer.firstStartMs = now();
    if(st.timer.lastPauseMs){
      st.timer.basePausedMs += Math.max(0, now() - st.timer.lastPauseMs);
      st.timer.lastPauseMs = null;
    }
    st.timer.lastResumeMs = now();
    st.timer.running = true;
    save();
    startTicking();
    renderTimer();
  }

  function pauseTimer(){
    if(!st.timer.running) return;
    const delta = now() - (st.timer.lastResumeMs ?? now());
    st.timer.baseElapsedMs += Math.max(0, delta);
    st.timer.lastResumeMs = null;
    st.timer.running = false;
    st.timer.lastPauseMs = now();
    save();
    renderTimer();
  }

  function resetTimer(){
    st.timer = structuredClone(initial.timer);
    save();
    renderTimer();
    stopTicking();
  }

  function getElapsedMs(){
    const base = st.timer.baseElapsedMs || 0;
    if(st.timer.running && st.timer.lastResumeMs){
      return base + (now() - st.timer.lastResumeMs);
    }
    return base;
  }

  function getPausedMs(){
    const base = st.timer.basePausedMs || 0;
    if(!st.timer.running && st.timer.lastPauseMs){
      return base + (now() - st.timer.lastPauseMs);
    }
    return base;
  }
  function msToHHMMSS(ms){
    const totalSec = Math.floor(ms/1000);
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    const ss = totalSec % 60;
    return String(hh).padStart(2,'0') + ":" + String(mm).padStart(2,'0') + ":" + String(ss).padStart(2,'0');
  }

  function msToDec(ms){
    const dec = ms / 3600000; // hours
    return dec.toFixed(2);
  }

  function renderTimer(){
    const ms = getElapsedMs();
    els.elapsedHHMMSS.textContent = msToHHMMSS(ms);
    els.elapsedDec.textContent = msToDec(ms);
    const pms = getPausedMs();
    els.pausedHHMMSS.textContent = msToHHMMSS(pms);
    const running = st.timer.running;
    els.timerState.textContent = running ? "running" : "stopped";
    els.timerState.classList.toggle("running", running);
    els.timerState.classList.toggle("stopped", !running);
    if(st.timer.firstStartMs){
      const d = new Date(st.timer.firstStartMs);
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      const ss = String(d.getSeconds()).padStart(2,'0');
      els.startedAt.textContent = `${hh}:${mm}:${ss}`;
    } else {
      els.startedAt.textContent = "--:--:--";
    }
    els.startResumeBtn.textContent = st.timer.running ? "Resume" : (st.timer.baseElapsedMs>0 ? "Resume" : "Start");
  }

  function startTicking(){
    if(tickHandle) return;
    tickHandle = setInterval(renderTimer, 1000);
  }
  function stopTicking(){
    if(tickHandle){
      clearInterval(tickHandle);
      tickHandle = null;
    }
  }

  els.startResumeBtn.addEventListener("click", ()=>{
    // If currently running, this acts like "Resume" label shows but logic should be start if stopped.
    if(!st.timer.running){
      startTimer();
    }
  });
  els.pauseBtn.addEventListener("click", pauseTimer);
  els.resetTimerBtn.addEventListener("click", ()=>{
    if(confirm("Reset the live timer?")) resetTimer();
  });

  // Resume ticking if re-opened
  if(st.timer.running || st.timer.lastPauseMs) startTicking();
  renderTimer();

  // ==== LANDINGS ====
  function updateDisplayCounts(){
    els.stdCount.textContent = String(st.landings.student);
    els.instCount.textContent = String(st.landings.instructor);
  }

  function bump(which, delta){
    st.landings[which] = Math.max(0, (st.landings[which]||0) + delta);
    save(); updateDisplayCounts();
  }

  els.stdPlus.addEventListener("click", ()=> bump("student", +1));
  els.stdMinus.addEventListener("click", ()=> bump("student", -1));
  els.instPlus.addEventListener("click", ()=> bump("instructor", +1));
  els.instMinus.addEventListener("click", ()=> bump("instructor", -1));
  els.resetLandings.addEventListener("click", ()=>{
    if(confirm("Reset landings?")){
      st.landings = { student: 0, instructor: 0 };
      save(); updateDisplayCounts();
    }
  });
  updateDisplayCounts();

  // ==== HOBBS & TACH ====
  function calcDecimal(startStr, stopStr){
    const a = parseFloat(String(startStr).replace(',', '.'));
    const b = parseFloat(String(stopStr).replace(',', '.'));
    if(Number.isFinite(a) && Number.isFinite(b) && b >= a) return (b - a).toFixed(2);
    return "0.00";
  }

  function renderHobbs(){
    els.hobbsStart.value = st.hobbs.start;
    els.hobbsStop.value = st.hobbs.stop;
    els.hobbsTotal.textContent = calcDecimal(st.hobbs.start, st.hobbs.stop);
  }
  function renderTach(){
    els.tachStart.value = st.tach.start;
    els.tachStop.value = st.tach.stop;
    els.tachTotal.textContent = calcDecimal(st.tach.start, st.tach.stop);
  }

  function bindDecimalInput(el, path){
    el.addEventListener("input", () => {
      // allow digits and one dot
      el.value = el.value.replace(/[^0-9.]/g, '');
      const parts = el.value.split('.');
      if(parts.length > 2) { el.value = parts[0] + '.' + parts.slice(1).join(''); }
      setByPath(path, el.value);
      save();
      if(path.startsWith('hobbs')) renderHobbs();
      if(path.startsWith('tach')) renderTach();
    });
  }

  function setByPath(path, value){
    const [group, key] = path.split('.');
    st[group][key] = value;
  }

  bindDecimalInput(els.hobbsStart, 'hobbs.start');
  bindDecimalInput(els.hobbsStop, 'hobbs.stop');
  bindDecimalInput(els.tachStart, 'tach.start');
  bindDecimalInput(els.tachStop, 'tach.stop');

  els.clearHobbs.addEventListener("click", ()=>{
    if(confirm("Clear Hobbs values?")) {
      st.hobbs = { start: "", stop: "" }; save(); renderHobbs();
    }
  });
  els.clearTach.addEventListener("click", ()=>{
    if(confirm("Clear Tach values?")) {
      st.tach = { start: "", stop: "" }; save(); renderTach();
    }
  });

  renderHobbs(); renderTach();

  // ==== MANUAL TIME (HH:MM) ====
  function bindTimeInput(el, path){
    el.addEventListener("input", () => {
      // digits only; auto-colon after 2 digits
      const digits = el.value.replace(/[^0-9]/g, '').slice(0,4);
      let formatted = digits;
      if(digits.length >= 3) formatted = digits.slice(0,2) + ":" + digits.slice(2);
      else if(digits.length >= 1) formatted = digits;
      el.value = formatted;
      const [group, key] = path.split('.');
      st[group][key] = formatted;
      save();
      renderManual();
    });
  }

  function hhmmToMinutes(str){
    const m = /^([0-2]\d):([0-5]\d)$/.exec(str);
    if(!m) return null;
    let h = parseInt(m[1],10);
    let mi = parseInt(m[2],10);
    return h*60 + mi;
  }

  function renderManual(){
    els.manStart.value = st.manual.start;
    els.manStop.value = st.manual.stop;
    const a = hhmmToMinutes(st.manual.start);
    const b = hhmmToMinutes(st.manual.stop);
    let hhmm = "00:00", dec = "0.00";
    if(a != null && b != null){
      let diff = b - a;
      if(diff < 0) diff += 24*60; // cross-midnight
      const hh = Math.floor(diff/60);
      const mm = diff % 60;
      hhmm = String(hh).padStart(2,'0') + ":" + String(mm).padStart(2,'0');
      dec = (diff/60).toFixed(2);
    }
    els.manHHMM.textContent = hhmm;
    els.manDec.textContent = dec;
  }

  bindTimeInput(els.manStart, 'manual.start');
  bindTimeInput(els.manStop, 'manual.stop');
  els.clearManual.addEventListener("click", ()=>{
    if(confirm("Reset manual times?")) {
      st.manual = { start: "", stop: "" }; save(); renderManual();
    }
  });
  renderManual();

  // ==== SUMMARY ====
  function renderSummary(){
    const lines = [];
    lines.push("Flight Timer & Log — Summary");
    lines.push("Version: 1.0");
    const updated = new Date(st.meta.updatedAt);
    lines.push("Saved: " + updated.toLocaleString());
    lines.push("");
    // Live timer
    if (st.timer.firstStartMs) {
      const timerHHMM = document.getElementById("elapsedHHMMSS").textContent;
      const timerDec = document.getElementById("elapsedDec").textContent;
      const started = document.getElementById("startedAt").textContent;
      lines.push("[Live Timer]");
      lines.push("  Started: " + started);
      lines.push("  Elapsed: " + timerHHMM + " (" + timerDec + " h)");
      lines.push("");
    }
    // Landings
    if (st.landings.student > 0 || st.landings.instructor > 0) {
      lines.push("[Landings]");
      if (st.landings.student > 0) lines.push("  Student: " + st.landings.student);
      if (st.landings.instructor > 0) lines.push("  Instructor: " + st.landings.instructor);
      lines.push("");
    }
    // Hobbs
    const hobbsStart = st.hobbs.start;
    const hobbsStop = st.hobbs.stop;
    const hobbsTotal = document.getElementById("hobbsTotal").textContent;
    if (hobbsStart || hobbsStop) {
      lines.push("[Hobbs]");
      if (hobbsStart) lines.push("  Start: " + hobbsStart);
      if (hobbsStop) lines.push("  Stop : " + hobbsStop);
      if (hobbsStart && hobbsStop) lines.push("  Total: " + hobbsTotal + " h");
      lines.push("");
    }
    // Tach
    const tachStart = st.tach.start;
    const tachStop = st.tach.stop;
    const tachTotal = document.getElementById("tachTotal").textContent;
    if (tachStart || tachStop) {
      lines.push("[Tach]");
      if (tachStart) lines.push("  Start: " + tachStart);
      if (tachStop) lines.push("  Stop : " + tachStop);
      if (tachStart && tachStop) lines.push("  Total: " + tachTotal + " h");
      lines.push("");
    }
    // Manual
    const manStart = st.manual.start;
    const manStop = st.manual.stop;
    const manHHMM = document.getElementById("manHHMM").textContent;
    const manDec = document.getElementById("manDec").textContent;
    if (manStart || manStop) {
      lines.push("[Manual Time]");
      if (manStart) lines.push("  Start: " + manStart);
      if (manStop) lines.push("  Stop : " + manStop);
      if (manStart && manStop) lines.push("  Elapsed: " + manHHMM + " (" + manDec + " h)");
      lines.push("");
    }
    els.summaryBox.value = lines.join("\n");
  }
  renderSummary();

  els.copySummary.addEventListener("click", async ()=>{
    try {
      await navigator.clipboard.writeText(els.summaryBox.value);
      toast("Summary copied to clipboard");
    } catch(e) {
      alert("Copy failed. You can select and copy manually.");
    }
  });

  // ==== RESET ALL ====
  els.resetAll.addEventListener("click", ()=>{
    if(confirm("Reset ALL fields and data? This cannot be undone.")){
      localStorage.removeItem(stateKey);
      st = structuredClone(initial);
      save();
      // re-render all
      resetTimer();
      updateDisplayCounts();
      renderHobbs(); renderTach();
      renderManual(); renderSummary();
      toast("All data cleared");
    }
  });

  // Simple toast
  let toastEl = null, toastT = null;
  function toast(msg){
    if(!toastEl){
      toastEl = document.createElement('div');
      toastEl.style.position = 'fixed';
      toastEl.style.left = '50%';
      toastEl.style.bottom = '24px';
      toastEl.style.transform = 'translateX(-50%)';
      toastEl.style.padding = '10px 14px';
      toastEl.style.borderRadius = '12px';
      toastEl.style.border = '1px solid var(--border)';
      toastEl.style.background = '#111827';
      toastEl.style.color = 'var(--text)';
      toastEl.style.boxShadow = '0 10px 30px rgba(0,0,0,.25)';
      toastEl.style.zIndex = '9999';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    clearTimeout(toastT);
    toastT = setTimeout(()=>{ toastEl.style.opacity = '0'; }, 1600);
  }

  // ==== PWA INSTALL ====
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    els.installBtn.style.display = 'inline-block';
  });
  els.installBtn.addEventListener('click', async ()=>{
    els.installBtn.style.display = 'none';
    if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt = null; }
  });

  // ==== SW REGISTER ====
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('service-worker.js')
        .catch((err)=>console.warn('SW registration failed', err));
    });
  }

})();
