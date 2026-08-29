
const PLAN = window.READING_PLAN;
const state = {
  view: "today",
  selectedDate: null,
  calendarMonth: 0
};


const themeStorageKey = "cronograma-biblico-2027-theme";

function getPreferredTheme(){
  const saved = localStorage.getItem(themeStorageKey);
  if(saved === "light" || saved === "dark") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(themeStorageKey, theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute("content", theme === "dark" ? "#111315" : "#f4efe6");
  const toggle = document.getElementById("themeToggle");
  if(toggle){
    const target = theme === "dark" ? "claro" : "escuro";
    toggle.setAttribute("aria-label", `Ativar modo ${target}`);
    toggle.setAttribute("title", `Ativar modo ${target}`);
  }
}

function toggleTheme(){
  const current = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
  applyTheme(current === "dark" ? "light" : "dark");
}

applyTheme(getPreferredTheme());

const storageKey = "cronograma-biblico-2027-completed";
const completed = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));

const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const monthShort = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function saveCompleted(){
  localStorage.setItem(storageKey, JSON.stringify([...completed]));
}
function dateObj(iso){ return new Date(iso + "T12:00:00"); }
function fmtLong(iso){
  const d = dateObj(iso);
  return `${String(d.getDate()).padStart(2,"0")} de ${months[d.getMonth()].toLowerCase()} de 2027`;
}
function fmtShort(iso){
  const d = dateObj(iso);
  return `${String(d.getDate()).padStart(2,"0")} ${monthShort[d.getMonth()]}`;
}
function todayISO(){
  const now = new Date();
  if(now.getFullYear() === 2027) return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  return "2027-01-01";
}
function itemByDate(iso){ return PLAN.find(x => x.date === iso); }
function getFocusItem(){
  return itemByDate(state.selectedDate || todayISO()) || PLAN[0];
}
function percentage(){
  const readingDays = PLAN.filter(x => !x.review);
  const done = readingDays.filter(x => completed.has(x.date)).length;
  return {done, total: readingDays.length, pct: Math.round(done / readingDays.length * 100)};
}
function toggleDone(iso){
  if(completed.has(iso)) completed.delete(iso); else completed.add(iso);
  saveCompleted(); render();
}
function hero(period){
  return `<section class="hero">
    <div class="hero-art"></div>
    <div class="hero-copy">
      <span class="hero-badge">${period.period}</span>
      <h2>${period.period}</h2>
      <p>${period.periodSubtitle}</p>
    </div>
  </section>`;
}
function readingCard(item){
  const done = completed.has(item.date);
  const isReview = !!item.review;
  return `<section class="card center">
    <div class="date-label">${fmtLong(item.date)}</div>
    <div class="pill">Dia ${item.day} de 365</div>
    <h2 class="reading-title">${item.reading}</h2>
    <div class="reading-subtitle">${isReview ? "Dia flexível do plano" : "Leitura de hoje"}</div>
    <button class="primary ${done ? "done" : ""}" onclick="toggleDone('${item.date}')">${done ? "✓ Lido" : isReview ? "✓ Marcar revisão como concluída" : "✓ Marcar como lido"}</button>
  </section>`;
}
function adjacent(item, offset){
  return PLAN.find(x => x.day === item.day + offset);
}
function todayView(){
  const item = getFocusItem();
  const next = adjacent(item,1);
  const p = percentage();
  return `${hero(item)}
    ${item.day > 355 ? `<div class="notice">O PDF-base encerra a leitura bíblica no Dia 355, em 21/12. Os dias 22 a 31/12 foram mantidos como revisão/recuperação para preservar exatamente a ordem do PDF.</div>` : ""}
    ${readingCard(item)}
    ${next ? `<section class="card mini-row" onclick="openDetail('${next.date}')">
      <div><div class="label">Próxima leitura</div><div class="value">${fmtShort(next.date)} · ${next.reading}</div></div><span class="chev">›</span>
    </section>` : ""}
    <section class="card">
      <div class="mini-row"><div><div class="label">Progresso do plano</div><div class="value">${p.done} / ${p.total} leituras</div></div><strong>${p.pct}%</strong></div>
      <div class="progress-track"><div class="progress-bar" style="width:${p.pct}%"></div></div>
    </section>`;
}
function calendarView(){
  const m = state.calendarMonth;
  const first = new Date(2027,m,1);
  const days = new Date(2027,m+1,0).getDate();
  // Monday-first index
  const start = (first.getDay()+6)%7;
  const cells = [];
  const prevDays = new Date(2027,m,0).getDate();
  for(let i=0;i<start;i++){
    cells.push(`<button class="day out">${prevDays-start+i+1}</button>`);
  }
  for(let d=1;d<=days;d++){
    const iso = `2027-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const item = itemByDate(iso);
    const classes = ["day"];
    if(item) classes.push("plan");
    if(completed.has(iso)) classes.push("completed");
    if(iso===todayISO()) classes.push("today");
    if(item?.review) classes.push("review");
    cells.push(`<button class="${classes.join(" ")}" ${item ? `onclick="openDetail('${iso}')"` : ""}>${d}</button>`);
  }
  while(cells.length%7) cells.push(`<button class="day out"></button>`);
  const focus = PLAN.find(x => dateObj(x.date).getMonth()===m) || PLAN[0];
  return `<div class="month-head"><button onclick="changeMonth(-1)">‹</button><h2>${months[m]} 2027</h2><button onclick="changeMonth(1)">›</button></div>
    <div class="weekdays">${["SEG","TER","QUA","QUI","SEX","SÁB","DOM"].map(x=>`<span>${x}</span>`).join("")}</div>
    <div class="calendar-grid">${cells.join("")}</div>
    <h3 class="section-title">Neste mês</h3>
    <section class="card">
      <div class="mini-row"><div><div class="label">Primeira leitura do mês</div><div class="value">${focus.reading}</div></div><span class="chev">›</span></div>
    </section>
    <div class="notice">Toque em qualquer dia do plano para abrir a leitura. Verde = concluído, dourado = hoje, lilás = revisão.</div>`;
}
const periodData = [
  ["Origens e Patriarcas","01 jan – 27 jan","Gênesis + Jó","origens"],
  ["Êxodo e Lei","28 jan – 13 mar","Êxodo, Levítico, Números, Deuteronômio","exodo"],
  ["Conquista e Juízes","14 mar – 29 mar","Josué, Juízes, Rute","conquista"],
  ["Reino Unido","30 mar – 09 jun","Samuel, Salmos, Reis 1–11, Sabedoria","reino"],
  ["Reino Dividido","10 jun – 22 jul","Reis e Profetas","dividido"],
  ["Queda e Exílio","23 jul – 16 set","Jeremias, Lamentações, Crônicas, Ezequiel, Daniel","exilio"],
  ["Retorno","17 set – 02 out","Esdras, Ageu, Zacarias, Ester, Neemias, Malaquias","retorno"],
  ["Cristo","03 out – 31 out","Mateus, Marcos, Lucas, João","cristo"],
  ["Igreja Primitiva","01 nov – 13 dez","Atos e Cartas","igreja"],
  ["Consumação","14 dez – 21 dez","Judas + Apocalipse","consumacao"],
];
function timelineView(){
  return `<h2> Linha do Tempo</h2><p class="reading-subtitle">A ordem abaixo acompanha o fluxo adotado no PDF-base.</p>
  ${periodData.map((p,i)=>`<section class="timeline-card">
    <div class="timeline-art"></div>
    <div><h3>${String(i+1).padStart(2,"0")} ${p[0]}</h3><p class="range">${p[1]}</p><p>${p[2]}</p></div>
  </section>`).join("")}`;
}
function extractBooks(){
  const names = ["Gênesis","Jó","Êxodo","Levítico","Números","Deuteronômio","Josué","Juízes","Rute","1 Samuel","Salmos","2 Samuel","1 Reis","Cântico dos Cânticos","Provérbios","Eclesiastes","2 Reis","Obadias","Joel","Amós","Jonas","Oséias","Miquéias","Isaías","Naum","Sofonias","Habacuque","Jeremias","Lamentações","1 Crônicas","2 Crônicas","Ezequiel","Daniel","Esdras","Ageu","Zacarias","Ester","Neemias","Malaquias","Mateus","Marcos","Lucas","João","Atos","Tiago","Gálatas","1 Tessalonicenses","2 Tessalonicenses","1 Coríntios","2 Coríntios","Romanos","Efésios","Filipenses","Colossenses","Filemom","1 Timóteo","Tito","2 Timóteo","Hebreus","1 Pedro","2 Pedro","1 João","2 João","3 João","Judas","Apocalipse"];
  return names;
}
function bookCompleted(name){
  const relevant = PLAN.filter(x => !x.review && x.reading.includes(name));
  return relevant.length && relevant.every(x => completed.has(x.date));
}
function progressView(){
  const p = percentage();
  const books = extractBooks();
  const doneBooks = books.filter(bookCompleted).length;
  return `<h2>Progresso</h2>
    <section class="card center">
      <div class="progress-ring" style="--p:${p.pct}%"><div class="inside"><strong>${p.pct}%</strong><span>do plano concluído</span></div></div>
      <div class="stats">
        <div class="stat"><strong>${p.done}</strong><span>leituras</span></div>
        <div class="stat"><strong>${p.total-p.done}</strong><span>restantes</span></div>
        <div class="stat"><strong>${doneBooks}</strong><span>livros concluídos</span></div>
      </div>
    </section>
    <h3 class="section-title">Livros</h3>
    <section class="card book-list">
      ${books.map(name=>`<div class="book-row"><span class="dot ${bookCompleted(name) ? "done" : ""}">${bookCompleted(name) ? "✓" : ""}</span><span>${name}</span></div>`).join("")}
    </section>`;
}
function detailView(){
  const item = getFocusItem();
  const prev = adjacent(item,-1), next = adjacent(item,1);
  return `${hero(item).replace("hero","hero detail-hero")}
    ${readingCard(item)}
    <section class="card context-card">
      <strong>Contexto</strong>
      <p style="margin:7px 0 0;line-height:1.5;font-size:14px">${item.periodSubtitle}. Esta camada serve apenas para localização histórica geral; a ordem diária permanece a do PDF.</p>
    </section>
    <div class="secondary-row">
      ${prev ? `<button class="secondary" onclick="openDetail('${prev.date}')">‹ Ontem<br><small>${prev.reading}</small></button>` : ""}
      ${next ? `<button class="secondary" onclick="openDetail('${next.date}')">Amanhã ›<br><small>${next.reading}</small></button>` : ""}
    </div>`;
}
function changeMonth(delta){
  state.calendarMonth = Math.max(0,Math.min(11,state.calendarMonth+delta)); render();
}
function openDetail(iso){
  state.selectedDate = iso; state.view = "detail"; render();
  window.scrollTo({top:0,behavior:"smooth"});
}
function setView(view){
  state.view = view;
  if(view==="today") state.selectedDate = null;
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view===view));
  render();
  window.scrollTo({top:0,behavior:"smooth"});
}
function render(){
  const app = document.getElementById("app");
  if(state.view==="calendar") app.innerHTML = calendarView();
  else if(state.view==="timeline") app.innerHTML = timelineView();
  else if(state.view==="progress") app.innerHTML = progressView();
  else if(state.view==="detail") app.innerHTML = detailView();
  else app.innerHTML = todayView();

  document.querySelectorAll(".nav-item").forEach(b => {
    const activeView = state.view==="detail" ? "today" : state.view;
    b.classList.toggle("active", b.dataset.view===activeView);
  });
}
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.view)));
document.getElementById("jumpToday").addEventListener("click",()=>setView("today"));
document.getElementById("themeToggle").addEventListener("click", toggleTheme);
state.calendarMonth = dateObj(todayISO()).getMonth();
render();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
