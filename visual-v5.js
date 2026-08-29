/* Visual V5: banners mensais em alta resolução com fallback para o sprite antigo. */
const HQ_MONTH_BANNERS = [
  "01-janeiro.webp",
  "02-fevereiro.webp",
  "03-marco.webp",
  "04-abril.webp",
  "05-maio.webp",
  "06-junho.webp",
  "07-julho.webp",
  "08-agosto.webp",
  "09-setembro.webp",
  "10-outubro.webp",
  "11-novembro.webp",
  "12-dezembro.webp"
];

hero = function(item){
  const monthIndex = dateObj(item.date).getMonth();
  const monthClass = `month-${String(monthIndex + 1).padStart(2,"0")}`;
  return `<section class="hero monthly-hero">
    <div class="hero-fallback ${monthClass}" aria-hidden="true"></div>
    <img class="hero-image-hq" src="${HQ_MONTH_BANNERS[monthIndex]}" alt="Ilustração bíblica de ${months[monthIndex]}" loading="eager" decoding="async" onerror="this.style.display='none'">
    <div class="hero-shade" aria-hidden="true"></div>
  </section>`;
};

render();
