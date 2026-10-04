(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const fmt = n => Number(n || 0).toLocaleString("ru-RU") + " ₽";
  const per = (n, m) => "≈ " + Math.round(n / (m || 36)).toLocaleString("ru-RU") + " ₽/мес";
  const tel = p => { let d = String(p || "").replace(/\D/g, ""); if (d.length === 11 && d[0] === "8") d = "7" + d.slice(1); return "tel:+" + d; };
  const fullName = p => (p.name + " " + (p.variant || "")).trim();
  const productUrl = p => "product.html?id=" + encodeURIComponent(p.id);
  const mapUrl = s => "https://yandex.ru/maps/?text=" + encodeURIComponent(s.city + ", " + s.address);
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const phoneIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';

  async function load() {
    const def = window.DEFAULT_DATA;
    if (!/^https?:$/.test(location.protocol)) return def;
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3000);
      const r = await fetch("/api/data", { cache: "no-store", signal: ctl.signal });
      clearTimeout(t);
      if (r.ok) { const d = await r.json(); if (d && Array.isArray(d.products)) return d; }
    } catch (e) { }
    return def;
  }

  function chrome(D, home) {
    const c = D.contacts, h = home ? "" : "index.html";
    const tk = (D.ticker || []).filter(Boolean);
    const tkHtml = tk.length ? [...tk, ...tk, ...tk, ...tk].map(t => `<span>${esc(t)}</span>`).join("") : "";
    document.getElementById("ticker").innerHTML = `<div class="ticker__track">${tkHtml}</div>`;
    const showGive = D.giveaway && D.giveaway.show;

    document.getElementById("hdr").innerHTML = `<div class="wrap nav">
      <a href="${home ? "#top" : "index.html"}" class="logo"><i></i>раунд</a>
      <nav class="nav__links">
        <a href="${h}#catalog">Цены</a><a href="${h}#why">Условия</a><a href="${h}#used">Б/У</a>
        ${showGive ? `<a href="${h}#give">Розыгрыш</a>` : ""}<a href="#contact">Контакты</a>
      </nav>
      <a class="nav__phone" href="${tel(c.phone)}">${esc(c.phone)}</a></div>`;

    const stores = (c.stores || []).filter(s => s.city || s.address);
    const socials = [["Telegram", c.telegram, "написать"], ["ВКонтакте", c.vk, "сообщество"], ["Канал в MAX", c.max, "подписаться"]].filter(x => x[1]);
    document.getElementById("contact").innerHTML = `<div class="wrap">
      <span class="sec-num rv">звоните, пишите, приходите</span>
      <a class="big-phone rv" href="${tel(c.phone)}" id="bigPhone">${esc(c.phone)}</a>
      <div class="contact__grid rv">
        <div class="cblock"><small>${stores.length > 1 ? "Наши магазины" : "Адрес"}</small>
          <p>${stores.map(s => esc(s.city + ", " + s.address)).join("<br>")}</p>
          ${stores.map(s => `<a class="u" href="${mapUrl(s)}" target="_blank" rel="noopener">${esc(s.city)} на карте →</a>`).join("<br>")}</div>
        <div class="cblock"><small>Часы работы</small><p>${esc(c.hours)}</p>
          <p style="font-size:16px;color:var(--ink-soft);margin-top:10px">Рассрочка до ${D.months || 36} мес · гарантия 1 год</p>
          <a class="u" href="${tel(c.phone)}">Заказать по телефону →</a></div>
        <div class="cblock"><small>Мы в сети</small><div class="socials">
          ${socials.map(s => `<a href="${esc(s[1])}" target="_blank" rel="noopener">${s[0]} <span>${s[2]} →</span></a>`).join("")}</div></div>
      </div>
      <div class="wordmark" id="wm" aria-hidden="true">${[..."раунд"].map((ch, i) => `<span style="transition-delay:${i * 70}ms">${ch}</span>`).join("")}</div>
      <footer><span>© Раунд, ${esc(stores.map(s => s.city).join(", "))}</span><span>Техника Apple, Samsung, Xiaomi, Sony</span></footer></div>`;

    let fab = document.querySelector(".fab");
    if (!fab) { fab = document.createElement("a"); fab.className = "fab"; fab.setAttribute("aria-label", "Позвонить"); document.body.appendChild(fab); }
    fab.href = tel(c.phone); fab.innerHTML = phoneIcon;
    if (!document.getElementById("toast")) { const t = document.createElement("div"); t.className = "toast"; t.id = "toast"; document.body.appendChild(t); }
  }

  let tt;
  function toast(html) {
    const t = document.getElementById("toast");
    t.innerHTML = html; t.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 4500);
  }

  function ask(D, p) {
    const msg = "Здравствуйте! Есть в наличии " + fullName(p) + "?";
    try { navigator.clipboard.writeText(msg); } catch (e) { }
    toast(`Скопировали: «${esc(fullName(p))}» <a href="${esc(D.contacts.telegram)}" target="_blank" rel="noopener">Открыть Telegram →</a>`);
  }

  function motion() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
    document.querySelectorAll(".rv:not(.in),#wm,#stack").forEach(el => io.observe(el));

    let ly = 0; const hdr = document.getElementById("hdr");
    addEventListener("scroll", () => { const y = scrollY; hdr.classList.toggle("hide", y > ly && y > 300); ly = y; }, { passive: true });

    if (matchMedia("(hover:hover)").matches) {
      const bp = document.getElementById("bigPhone");
      if (bp) {
        bp.innerHTML = [...bp.textContent].map(c => `<span>${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
        bp.addEventListener("mousemove", e => bp.querySelectorAll("span").forEach(s => { const r = s.getBoundingClientRect(); const k = Math.max(0, 1 - Math.abs(e.clientX - (r.left + r.width / 2)) / 160); s.style.transform = `translateY(${-k * 14}px)`; }));
        bp.addEventListener("mouseleave", () => bp.querySelectorAll("span").forEach(s => s.style.transform = ""));
      }
    }
  }

  function swing(el) {
    if (!matchMedia("(hover:hover)").matches) return;
    el.addEventListener("mouseenter", e => {
      const r = el.getBoundingClientRect(); const dir = e.clientX < r.left + r.width / 2 ? -1 : 1;
      el.animate([{ transform: "rotate(0deg)" }, { transform: `rotate(${-dir * 14}deg)` }, { transform: `rotate(${dir * 7}deg)` }, { transform: `rotate(${-dir * 3}deg)` }, { transform: "rotate(0deg)" }], { duration: 1400, easing: "cubic-bezier(.3,.7,.3,1)", composite: "add" });
    });
  }

  window.R = { esc, md, fmt, per, tel, fullName, productUrl, arrow, load, chrome, toast, ask, motion, swing };
})();
