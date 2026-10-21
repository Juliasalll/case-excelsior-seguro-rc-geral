/* © 2026 Júlia Sales · JSALES-EXC-RCGERAL-2026-1021-7F3A9C · proibida a cópia sem autorização */
/* Excelsior · Seguro RC Geral · comportamento da página */
(() => {
  'use strict';

  // Para ligar o formulário: coloque aqui o endereço que recebe o POST (CRM, e-mail transacional, Formspree etc.).
  // Enquanto estiver vazio, o envio é só simulado na tela e nada sai do navegador.
  const FORM_ENDPOINT = '';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  const nav = $('#nav'), main = $('main'), hero = $('#topo'), quote = $('#cotacao');
  const sheets = $$('main > .sheet');
  const R = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--r')) || 28;

  /* ---------- faixas empilhadas (a próxima sobe por cima da anterior) ---------- */
  // Cada faixa fica fixa quando o fundo dela encosta no fim da tela; a seguinte desliza por cima.
  let tops = [];
  const measure = () => {
    const navH = nav.offsetHeight, vh = window.innerHeight, r = R();
    let y = main.getBoundingClientRect().top + window.scrollY;
    tops = sheets.map((s, i) => {
      const t = y; y = t + s.offsetHeight - r; // a seguinte começa r px por cima (margem negativa)
      if (!s.classList.contains('sheet--free')) s.style.top = Math.min(navH, vh - s.offsetHeight) + 'px';
      return t;
    });
  };
  if (!reduce) {
    document.documentElement.classList.add('stack');
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(measure); sheets.forEach(s => ro.observe(s)); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }
  const topOf = (el) => { const i = sheets.indexOf(el); if (i < 0) return el.getBoundingClientRect().top + window.scrollY; if (!tops.length) measure(); return tops[i]; };

  /* ---------- rolagem: topo, hero, fotos, link ativo, botão fixo ---------- */
  const links = $$('.nav__links a');
  const spyIds = links.map(a => a.getAttribute('href').slice(1));
  const par = $$('[data-parallax]').map(img => ({ img, box: img.parentElement, amp: parseFloat(img.dataset.parallax) || 40 }));
  const sticky = $('#sticky');
  let ticking = false;

  const frame = () => {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 8);

    // topo: progresso 0 → 1 enquanto a próxima faixa cobre o hero
    const p = reduce ? 0 : clamp(y / (hero.offsetHeight * 0.85), 0, 1);
    hero.style.setProperty('--p', p.toFixed(4));

    // fotos com paralaxe suave dentro da moldura
    if (!reduce) par.forEach(({ img, box, amp }) => {
      const r = box.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const t = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
      img.style.translate = `0 ${(-t * amp).toFixed(1)}px`;
    });

    // seção atual no menu
    if (tops.length) {
      const ref = y + nav.offsetHeight + vh * 0.35;
      let cur = null;
      sheets.forEach((s, i) => { if (spyIds.includes(s.id) && tops[i] <= ref) cur = s.id; });
      if (hero && y < hero.offsetHeight * 0.6) cur = null;
      if (quote && tops[sheets.indexOf(quote)] <= ref) cur = null;
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + cur));
    }

    // botão fixo no celular
    if (sticky) {
      const on = y > hero.offsetHeight - 80 && (quote.getBoundingClientRect().top > vh * 0.85);
      sticky.classList.toggle('is-on', on);
      sticky.setAttribute('aria-hidden', String(!on));
      $('a', sticky).tabIndex = on ? 0 : -1;
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- links internos (levam em conta as faixas fixas) ---------- */
  $$('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    a.addEventListener('click', (e) => {
      const el = $(id); if (!el) return;
      e.preventDefault();
      const top = Math.max(0, topOf(el) - (el === hero ? 0 : nav.offsetHeight - 1));
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
      try { history.replaceState(null, '', id); } catch (_) { /* quadros isolados bloqueiam */ }
    });
  });

  /* ---------- menu do celular ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (burger.getAttribute('aria-expanded') === 'false') menu.hidden = true; }, 320); }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); } });
  matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---------- títulos palavra por palavra ---------- */
  if (!reduce) $$('.h2, .index__title').forEach(h => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', words.join(' '));
    const acc = parseInt(h.dataset.accent || '0', 10);
    h.innerHTML = words.map((w, i) => `<span class="w${acc && i >= words.length - acc ? ' acc' : ''}" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  });

  /* ---------- palavras que trocam (estilo PicPay): uma por vez, subindo ---------- */
  $$('[data-rotate]').forEach(box => {
    const ws = $$('em', box); if (ws.length < 2) return;
    ws[0].classList.add('is-on');
    if (reduce) { box.classList.add('rot--static'); return; }
    let i = 0, timer = null;
    const step = () => {
      const cur = ws[i], nxt = ws[(i + 1) % ws.length];
      cur.classList.remove('is-on'); cur.classList.add('is-out');
      nxt.classList.remove('is-out'); nxt.style.transition = 'none'; nxt.style.transform = 'translateY(110%)'; void nxt.offsetWidth;
      nxt.style.transition = ''; nxt.style.transform = ''; nxt.classList.add('is-on');
      setTimeout(() => { cur.classList.remove('is-out'); }, 900);
      i = (i + 1) % ws.length;
    };
    const run = () => { if (!timer) timer = setInterval(step, 2400); };
    const stop = () => { clearInterval(timer); timer = null; };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? run() : stop()), { threshold: .3 }).observe(box);
    else run();
  });

  /* ---------- entrada ao rolar (cartões, pílulas, títulos) ---------- */
  $$('[data-stagger]').forEach(box => {
    Array.from(box.children).forEach((el, i) => {
      if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
      el.style.setProperty('--d', i * 90 + 'ms');
    });
  });
  const settle = (el) => { // devolve a transição de hover ao elemento depois que ele apareceu
    const wait = (el.dataset.reveal === 'mask' ? 1500 : 1000) + (parseInt(el.style.getPropertyValue('--d'), 10) || 0);
    setTimeout(() => { el.removeAttribute('data-reveal'); el.style.removeProperty('--d'); }, wait);
  };
  const revealEls = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => { el.removeAttribute('data-reveal'); el.classList.add('is-in'); });
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in'); io.unobserve(en.target); settle(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- perguntas frequentes ---------- */
  const items = $$('.acc__item');
  items.forEach(item => {
    const btn = $('.acc__btn', item), panel = $('.acc__panel', item);
    panel.setAttribute('aria-hidden', String(!item.classList.contains('is-open')));
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      items.forEach(o => {
        const on = o === item && open;
        o.classList.toggle('is-open', on);
        $('.acc__btn', o).setAttribute('aria-expanded', String(on));
        $('.acc__panel', o).setAttribute('aria-hidden', String(!on));
      });
      setTimeout(measure, 520); // a altura da seção muda com a pergunta aberta
    });
  });

  /* ---------- "Sou empresa" / "Sou corretor" ---------- */
  const seg = $('.seg'), tabs = $$('.seg__btn');
  const copy = {
    empresa:  { nome: 'Nome da empresa',  ph: 'Ex.: Padaria Boa Esquina', seg: 'Segmento' },
    corretor: { nome: 'Nome da corretora', ph: 'Ex.: Corretora Horizonte', seg: 'Segmento dos seus clientes' }
  };
  const setTab = (name) => {
    seg.dataset.on = name;
    tabs.forEach(t => { const on = t.dataset.tab === name; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    $('#l-nome').textContent = copy[name].nome; $('#f-nome').placeholder = copy[name].ph; $('#l-seg').textContent = copy[name].seg;
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => setTab(t.dataset.tab));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); setTab(n.dataset.tab);
    });
  });
  $$('a[data-tab]').forEach(a => a.addEventListener('click', () => setTab(a.dataset.tab)));
  setTab('empresa');

  /* ---------- formulário ---------- */
  const form = $('#lead'), glass = $('.glass'), done = $('#done');
  const wpp = $('#f-wpp');
  wpp.addEventListener('input', () => {
    const d = wpp.value.replace(/\D/g, '').slice(0, 11);
    let v = d;
    if (d.length > 10) v = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    else if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    else if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    else if (d.length) v = `(${d}`;
    wpp.value = v;
  });
  const rules = {
    nome:     v => v.trim().length >= 2 || 'Informe o nome.',
    segmento: v => !!v || 'Escolha um segmento.',
    email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Informe um e-mail válido, como voce@empresa.com.br.',
    whatsapp: v => { const n = v.replace(/\D/g, ''); return (n.length === 10 || n.length === 11) || 'Informe o DDD e o número, como (11) 99999-9999.'; }
  };
  const check = (el) => {
    const r = rules[el.name]; if (!r) return true;
    const res = r(el.value), box = el.closest('.field'), err = $('.field__err', box);
    const ok = res === true;
    box.classList.toggle('is-bad', !ok); el.setAttribute('aria-invalid', String(!ok));
    err.textContent = ok ? '' : res;
    return ok;
  };
  $$('input, select', form).forEach(el => {
    el.addEventListener('blur', () => { if (el.value || el.closest('.field').classList.contains('is-bad')) check(el); });
    el.addEventListener('input', () => { if (el.closest('.field').classList.contains('is-bad')) check(el); });
    el.addEventListener('change', () => { if (el.closest('.field').classList.contains('is-bad')) check(el); });
  });

  const sendLead = async (data) => {
    if (!FORM_ENDPOINT) { await new Promise(r => setTimeout(r, 900)); console.info('[demo] solicitação de cotação (não enviada a nenhum servidor):', data); return; }
    const res = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Falha no envio');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = $$('input[name], select[name]', form);
    const bad = fields.filter(el => !check(el));
    if (bad.length) { bad[0].focus(); return; }
    const btn = $('button[type="submit"]', form), label = $('.btn__t', btn);
    btn.disabled = true; label.textContent = 'Enviando…';
    const data = Object.fromEntries(fields.map(f => [f.name, f.value.trim()]));
    data.perfil = seg.dataset.on; data.origem = 'landing-rc-geral';
    try {
      await sendLead(data);
      glass.style.minHeight = glass.offsetHeight + 'px'; // evita o salto de altura ao trocar pelo aviso
      glass.classList.add('is-done'); done.hidden = false; done.focus();
      form.reset(); fields.forEach(f => { f.closest('.field').classList.remove('is-bad'); f.removeAttribute('aria-invalid'); });
    } catch (err) {
      label.textContent = 'Não foi possível enviar. Tentar de novo';
      setTimeout(() => { label.textContent = 'Enviar solicitação'; }, 3500);
    } finally {
      btn.disabled = false; if (label.textContent === 'Enviando…') label.textContent = 'Enviar solicitação';
    }
  });
  $('#again').addEventListener('click', () => { glass.style.minHeight = ''; glass.classList.remove('is-done'); done.hidden = true; $('#f-nome').focus(); });

  frame();
})();


/* ---------- autoria ---------- */
(() => {
  const AUTORIA = 'JSALES-EXC-RCGERAL-2026-1021-7F3A9C';
  try { console.log('%cCase de portfólio · Júlia Sales', 'font:700 14px Montserrat,sans-serif;color:#45B97C'); console.log('Design, código e animações © 2026 Júlia Sales. Proibida a cópia sem autorização. ' + AUTORIA + ' · https://www.behance.net/DesignerJuliaSales'); } catch (_) {}
  const guard = (e) => { if (e.target && e.target.closest && e.target.closest('img, video')) e.preventDefault(); };
  document.addEventListener('contextmenu', guard);
  document.addEventListener('dragstart', guard);
  window.__autoria = AUTORIA;
})();
