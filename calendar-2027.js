/* Ajuste cronológico 2027 — somente calendário bíblico */
todayView = function(){
  const item = getFocusItem();
  const next = adjacent(item,1);
  const p = percentage();
  return `${hero(item)}
    ${readingCard(item)}
    ${next ? `<section class="card mini-row interactive-card" onclick="openDetail('${next.date}')">
      <div><div class="label">Próxima leitura</div><div class="value">${fmtShort(next.date)} · ${next.reading}</div></div><span class="chev">›</span>
    </section>` : ""}
    <section class="card">
      <div class="mini-row"><div><div class="label">Progresso do plano</div><div class="value">${p.done} / ${p.total} leituras</div></div><strong>${p.pct}%</strong></div>
      <div class="progress-track"><div class="progress-bar" style="width:${p.pct}%"></div></div>
    </section>`;
};

timelineView = function(){
  const blocks = [
    ["Origens e Patriarcas","01 jan – 28 jan","Gênesis → Jó","origens"],
    ["Êxodo e Lei","29 jan – 10 mar","Êxodo → Levítico → Números → Deuteronômio","exodo"],
    ["Conquista e Juízes","11 mar – 24 mar","Josué → Juízes → Rute","conquista"],
    ["Monarquia Unida","25 mar – 12 jun","1 Samuel → Salmos → 2 Samuel → Salmos → 1 Reis 1–11 → Cântico dos Cânticos → Provérbios → Eclesiastes","reino"],
    ["Reino Dividido e Profetas","13 jun – 28 jul","1 Reis 12–22 → 2 Reis → Profetas → queda dos reinos","dividido"],
    ["Queda e Exílio","29 jul – 03 set","Jeremias → Lamentações → Daniel → Ezequiel","exilio"],
    ["Restauração","04 set – 09 out","Esdras → Ageu → Zacarias → Ester → Crônicas → Neemias → Malaquias","retorno"],
    ["Cristo","10 out – 04 nov","Mateus → Marcos → Lucas → João","cristo"],
    ["Igreja Primitiva","05 nov – 23 dez","Atos e cartas apostólicas","igreja"],
    ["Consumação","24 dez – 31 dez","Judas → Apocalipse","consumacao"],
  ];
  return `<h2>Linha do Tempo</h2>
  ${blocks.map((p,i)=>`<section class="timeline-card" data-period="${p[3]}">
    <div class="timeline-art"></div>
    <div><h3>${String(i+1).padStart(2,"0")} ${p[0]}</h3><p class="range">${p[1]}</p><p>${p[2]}</p></div>
  </section>`).join("")}`;
};

render();
