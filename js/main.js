(async () => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const L = document.documentElement.lang.startsWith('ar') ? 'ar' : 'en';
  // site root, worked out from this script's own address so /ar/ and the root page both resolve
  const ROOT = new URL('../', document.currentScript.src);

  /* ---- content: everything Nabel edits lives in /content ---- */
  const getJSON = async (path, fallback) => {
    try {
      const ctl = new AbortController();
      setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(new URL(path, ROOT), { cache: 'no-cache', signal: ctl.signal });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (err) {
      console.warn(`Could not load ${path}:`, err);
      return fallback;
    }
  };
  const [site, projects] = await Promise.all([getJSON('content/site.json', {}), getJSON('content/projects.json', [])]);
  const email = site.email || 'atelier@nabelelmasry.com';

  // contact details and stats
  $$('[data-bind="email"]').forEach(el => { el.textContent = email; if (el.href !== undefined && el.tagName === 'A') el.href = `mailto:${email}`; });
  if (site.phone) $$('[data-bind="phone"]').forEach(el => { el.textContent = site.phone; el.href = `tel:${site.phone.replace(/[^\d+]/g, '')}`; });
  if (site.instagram) $$('[data-bind="instagram"]').forEach(el => { el.href = site.instagram; });
  $$('[data-bind-count]').forEach(el => {
    const v = site[el.dataset.bindCount];
    if (v === undefined || v === '' || isNaN(+v)) return;
    el.dataset.count = +v;
    el.textContent = +v + (el.dataset.suffix || '');
  });

  // portfolio tiles
  const img = p => new URL(String(p || '').replace(/^\/+/, ''), ROOT).href;
  const grid = $('[data-projects]');
  projects.forEach(p => {
    const title = p[`title_${L}`] || p.title_en || '';
    const caption = [p[`details_${L}`] || p.details_en, p.year].filter(Boolean).join(' · ');
    const tile = document.createElement('article');
    tile.className = 'tile';
    tile.dataset.k = p.category || 'res';
    tile.innerHTML = '<button class="ph" type="button" data-reveal="img"><span class="px" data-parallax="0.07"><img loading="lazy" decoding="async"></span></button><h3 data-reveal></h3><div class="small" data-reveal></div>';
    const b = $('button', tile), im = $('img', tile);
    b.setAttribute('aria-label', `${L === 'ar' ? 'تكبير' : 'Enlarge'}: ${title}`);
    im.src = img(p.image);
    im.alt = p[`alt_${L}`] || p.alt_en || '';
    $('h3', tile).textContent = title;
    $('.small', tile).textContent = caption;
    grid.append(tile);
  });
  const years = projects.map(p => +p.year).filter(Boolean);
  if (years.length) $$('[data-year-range]').forEach(el => {
    el.textContent = el.dataset.yearRange.replace('{from}', Math.min(...years)).replace('{to}', Math.max(...years));
  });

  /* ---- interface text, per language ---- */
  const mail = `<a href="mailto:${email}" dir="ltr">${email}</a>`;
  const T = L === 'ar' ? {
    menu: 'القائمة', close: 'إغلاق',
    noName: 'من فضلك اكتب اسمك.',
    noEmail: 'من فضلك أضف بريدك الإلكتروني لنتمكن من الرد.',
    badEmail: 'يبدو البريد غير مكتمل. جرّب صيغة مثل name@example.com.',
    subject: 'طلب زيارة: ', name: 'الاسم', email: 'البريد', type: 'نوع المشروع',
    sent: `سيفتح تطبيق البريد وفيه طلبك جاهزًا. إن لم يفتح، راسلنا على ${mail}.`
  } : {
    menu: 'Menu', close: 'Close',
    noName: 'Please add your name.',
    noEmail: 'Please add an email so we can reply.',
    badEmail: 'That email looks incomplete. Try something like name@example.com.',
    subject: 'Visit request: ', name: 'Name', email: 'Email', type: 'Project type',
    sent: `Your email app should open with the request filled in. If it doesn't, write to ${mail}.`
  };

  /* ---- split headings into masked words ---- */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.innerHTML = `<span style="--i:${i++}"></span>`;
            w.firstChild.textContent = part;
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
  });

  /* ---- stagger siblings that reveal together ---- */
  const groups = new Map();
  $$('[data-reveal],[data-split]').forEach(el => {
    const p = el.closest('.hero-body,.igrid>div,.pf-head,.tile,.craft .body,.pgrid,.partners,.consult .body,.stats,.spec') || el.parentElement;
    const n = groups.get(p) || 0;
    groups.set(p, n + 1);
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${n * 90}ms`);
  });
  // the hero plays once the loader lifts, not on scroll
  const heroTargets = $$('.hero [data-reveal],.hero [data-split]');
  heroTargets.forEach((el, n) => el.style.setProperty('--d', `${250 + n * 140}ms`));
  const startHero = () => heroTargets.forEach(el => el.classList.add('in'));

  /* ---- reveal on scroll ---- */
  const targets = $$('[data-reveal],[data-split]').filter(el => !heroTargets.includes(el));
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in'));
  } else {
    // clip-path hides image frames from the observer, so watch a proxy element for those
    const proxy = new Map();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        (proxy.get(e.target) || [e.target]).forEach(t => t.classList.add('in'));
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    targets.forEach(el => {
      if (el.dataset.reveal !== 'img') return io.observe(el);
      const p = el.parentElement;
      proxy.set(p, [...(proxy.get(p) || []), el]);
    });
    proxy.forEach((_, p) => io.observe(p));
  }

  /* ---- count-up stats ---- */
  const counters = $$('[data-count]');
  const runCount = el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end + suf; return; }
    const t0 = performance.now(), dur = 1800;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * e) + (p === 1 ? suf : '');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
    }), { threshold: 0.6 });
    counters.forEach(c => { if (!reduce) c.textContent = '0'; cio.observe(c); });
  }

  /* ---- scroll: parallax, ghost drift, header state ---- */
  const header = $('#top');
  const par = $$('[data-parallax]');
  const ghost = $('[data-drift]');
  let lastY = scrollY, ticking = false;

  const onScroll = () => {
    const y = scrollY, vh = innerHeight;
    header.classList.toggle('solid', y > 60);
    header.classList.toggle('away', y > 400 && y > lastY && !document.body.classList.contains('menu-open'));
    lastY = y;
    if (!reduce) {
      par.forEach(el => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < -100 || box.top > vh + 100) return;
        const mid = box.top + box.height / 2 - vh / 2;
        el.style.transform = `translate3d(0,${(-mid * +el.dataset.parallax).toFixed(1)}px,0)`;
      });
      if (ghost) {
        const r = ghost.parentElement.getBoundingClientRect();
        ghost.style.transform = `translate3d(${(-r.top * 0.25).toFixed(1)}px,${(-r.top * 0.1).toFixed(1)}px,0)`;
      }
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---- mobile menu ---- */
  const menu = $('#menu'), mBtn = $('.menu-btn');
  const setMenu = open => {
    mBtn.setAttribute('aria-expanded', open);
    mBtn.firstElementChild.textContent = open ? T.close : T.menu;
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('open')); }
    else { menu.classList.remove('open'); setTimeout(() => { if (!menu.classList.contains('open')) menu.hidden = true; }, reduce ? 0 : 700); }
  };
  mBtn.addEventListener('click', () => setMenu(mBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); mBtn.focus(); } });

  /* ---- portfolio filter with fade out / in ---- */
  const chips = $$('.chips button'), tiles = $$('.tile'), empty = $('.empty');
  // desktop: lay visible tiles out in groups of six (one large, two halves, three thirds),
  // choosing a shape for a short last group so the grid never has holes
  const PATTERN = { 1: ['full'], 2: ['half', 'half'], 3: ['big', 'half', 'half'], 4: ['half', 'half', 'half', 'half'],
    5: ['big', 'half', 'half', 'half', 'half'], 6: ['big', 'half', 'half', '', '', ''] };
  // tablet: stretch the last tile if it would sit alone in the two-column grid
  const balance = () => {
    const vis = tiles.filter(t => !t.hidden);
    tiles.forEach(t => t.classList.remove('big', 'half', 'full', 'wide'));
    for (let i = 0; i < vis.length; i += 6) {
      const group = vis.slice(i, i + 6);
      group.forEach((t, n) => { const c = PATTERN[group.length][n]; if (c) t.classList.add(c); });
    }
    const pairs = vis.filter(t => !t.classList.contains('big') && !t.classList.contains('full'));
    if (pairs.length % 2) pairs[pairs.length - 1].classList.add('wide');
  };
  balance();
  empty.hidden = tiles.length > 0;
  const filter = f => {
    chips.forEach(x => x.setAttribute('aria-pressed', x.dataset.f === f));
    const show = t => f === 'all' || t.dataset.k === f;
    const wait = reduce ? 0 : 380;
    tiles.forEach(t => { if (!t.hidden) t.classList.add('out'); });
    setTimeout(() => {
      tiles.forEach(t => { t.hidden = !show(t); });
      empty.hidden = tiles.some(t => !t.hidden);
      balance();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        tiles.filter(t => !t.hidden).forEach((t, n) => {
          t.style.transitionDelay = reduce ? '0ms' : `${n * 80}ms`;
          t.classList.remove('out');
          $$('[data-reveal]', t).forEach(r => r.classList.add('in'));
          setTimeout(() => { t.style.transitionDelay = ''; }, 1200);
        });
      }));
    }, wait);
  };
  chips.forEach(b => b.addEventListener('click', () => {
    filter(b.dataset.f);
    b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }));
  // phones: the chip row scrolls sideways; drop the edge fade once it reaches the end
  const chipRow = $('.chips');
  const chipEnd = () => chipRow.classList.toggle('end', Math.abs(chipRow.scrollLeft) + chipRow.clientWidth >= chipRow.scrollWidth - 2);
  chipRow.addEventListener('scroll', chipEnd, { passive: true });
  addEventListener('resize', chipEnd);
  chipEnd();
  $('button', empty).addEventListener('click', () => filter('all'));

  /* ---- lightbox ---- */
  const lb = $('#lb');
  if (lb && lb.showModal) {
    const lbImg = $('img', lb);
    $$('.tile button.ph').forEach(b => b.addEventListener('click', () => {
      const tile = b.closest('.tile'), img = $('img', b);
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      $('.lb-t', lb).textContent = $('h3', tile).textContent;
      $('.lb-s', lb).textContent = $('.small', tile).textContent;
      lb.showModal();
    }));
    $('.lb-x', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'FIGURE') lb.close(); });
  }

  /* ---- "View" cursor over portfolio images ---- */
  const cur = $('.cursor');
  if (cur && matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    let x = -200, y = -200, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(loop);
    };
    loop();
    $$('.tile .ph').forEach(p => {
      p.addEventListener('pointerenter', () => cur.classList.add('on'));
      p.addEventListener('pointerleave', () => cur.classList.remove('on'));
    });
  }

  /* ---- consultation form ---- */
  const form = $('#f'), note = $('#note');
  const fields = {
    n: { el: $('#n'), msg: v => v.trim() ? '' : T.noName },
    e: { el: $('#e'), msg: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : v.trim() ? T.badEmail : T.noEmail }
  };
  const check = k => {
    const f = fields[k], m = f.msg(f.el.value);
    f.el.setAttribute('aria-invalid', !!m);
    $(`#${k}-err`).textContent = m;
    return !m;
  };
  Object.keys(fields).forEach(k => fields[k].el.addEventListener('blur', () => { if (fields[k].el.value) check(k); }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ok = Object.keys(fields).map(check).every(Boolean);
    if (!ok) { Object.values(fields).find(f => f.el.getAttribute('aria-invalid') === 'true').el.focus(); return; }
    const d = new FormData(form);
    const body = `${T.name}: ${d.get('n')}\n${T.email}: ${d.get('e')}\n${T.type}: ${d.get('t')}\n\n${d.get('m') || ''}`;
    location.href = `mailto:${email}?subject=${encodeURIComponent(T.subject + d.get('t'))}&body=${encodeURIComponent(body)}`;
    note.className = 'note sent';
    note.innerHTML = T.sent;
  });

  /* ---- loading screen ---- */
  const root = document.documentElement;
  const loader = $('#loader');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reveal = () => { root.classList.add('ready'); startHero(); };

  if (!loader) { root.classList.remove('is-loading'); reveal(); return; }

  $$('.ld-w>span', loader).forEach((s, i) => s.style.setProperty('--i', i));
  const pctEl = $('.ld-pct', loader);
  let target = 0, shown = 0, done = false;
  const bump = n => { target = Math.min(100, target + n); };

  // real milestones drive the counter: fonts, hero photo, full page load
  const fonts = Promise.race([
    // pass the name itself so the right script subset (Latin or Arabic) is fetched
    document.fonts ? document.fonts.load(`1em ${getComputedStyle($('.ld-name', loader)).fontFamily}`, $('.ld-name', loader).textContent).catch(() => {}) : Promise.resolve(),
    wait(1500)
  ]).then(() => bump(30));
  const heroImg = $('.hero-media img');
  const photo = new Promise(r => {
    if (heroImg.complete) return r();
    heroImg.addEventListener('load', r, { once: true });
    heroImg.addEventListener('error', r, { once: true });
  }).then(() => bump(40));
  const page = new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })).then(() => bump(30));

  // start the name once its typeface is in, so letters don't swap font mid-animation
  fonts.then(() => requestAnimationFrame(() => loader.classList.add('go')));

  const tick = () => {
    shown += (target - shown) * 0.08;
    if (target - shown < 0.5) shown = target;
    pctEl.textContent = Math.round(shown);
    if (!done) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const minShow = reduce ? 700 : 2600; // long enough for the name to finish drawing
  Promise.race([Promise.all([fonts, photo, page, wait(minShow)]), wait(7000)])
    .then(async () => {
      target = 100;
      await wait(reduce ? 0 : 450); // let the counter land on 100
      loader.classList.add('out');
      await wait(reduce ? 0 : 650);
      loader.classList.add('lift');
      root.classList.remove('is-loading');
      reveal();
      await wait(1200);
      done = true;
      loader.remove();
    });
})();
