/* Visual V5: banners mensais em alta resolução com fallback para o sprite antigo. */
const HQ_MONTH_BANNERS = [
  "banners/01-janeiro.webp",
  "banners/02-fevereiro.webp",
  "banners/03-marco.webp",
  "banners/04-abril.webp",
  "banners/05-maio.webp",
  "banners/06-junho.webp",
  "banners/07-julho.webp",
  "banners/08-agosto.webp",
  "banners/09-setembro.webp",
  "banners/10-outubro.webp",
  "banners/11-novembro.webp",
  "banners/12-dezembro.webp"
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
