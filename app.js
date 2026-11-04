(() => {
  'use strict';

  const LS_COMPANY = 'proforma.company';
  const LS_LOGO = 'proforma.logo';
  const LS_DRAFT = 'proforma.draft';
  const LS_SAVED = 'proforma.saved';

  const DEFAULT_COMPANY = {
    name: 'BILL-METZ AUTO GARAGE',
    address: '5, rue V La Tortue, Delmas 33',
    phone: '(509) 3614 3734/4362 0141',
    email: 'billmetzautogarage17@gmail.com',
    showText: true,
  };

  const SAMPLE = {
    id: null,
    number: 'Bill-G-13102026-1',
    date: '2026-10-22',
    client: "Banque De La Republique D'Haiti",
    attention: 'Nicolas BIENAISE',
    marque: 'Vitara',
    model: '',
    plaque: 'AA-41779',
    notes: '',
    showSignature: false,
    items: [
      [1, 'Air Filter', 4500], [1, 'Oil Filter', 3000], [1, 'Fuel Filter', 7000],
      [1, 'Cabine Filter', 4500], [1, 'Gl 10W30 Castrol Oil', 6000],
      [1, 'Brake Pad Set Front', 16500], [1, 'Brake Pad Set Rear', 15000],
      [2, 'Engine Mounting', 24000], [1, 'Transmission Mounting', 24500],
      [2, 'Lower Arm', 27000], [2, 'Link Stabilizer Fr', 17000],
      [2, 'Tie Rod Inner', 16000], [2, 'Tie Rod Outer', 12000],
      [1, 'Main Seal', 14500], [1, 'Seal Rear', 12500], [1, "Main D'oeuvre", 75000],
    ].map(([qty, desc, price]) => ({ qty, desc, price })),
  };

  const $ = (id) => document.getElementById(id);
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parseNum = (s) => {
    const n = parseFloat(String(s).replace(/[\s,]/g, ''));
    return isNaN(n) ? 0 : n;
  };
  const frDate = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  let company = { ...DEFAULT_COMPANY, ...load(LS_COMPANY, {}) };
  let doc = load(LS_DRAFT, null) || clone(SAMPLE);

  // Numéro auto : Bill-G-JJMMAAAA-n (n = nombre de proformas déjà faites ce jour-là + 1)
  function nextNumber(iso) {
    const [y, m, d] = (iso || todayISO()).split('-');
    const prefix = `Bill-G-${d}${m}${y}-`;
    const used = load(LS_SAVED, [])
      .map((p) => p.number || '')
      .filter((n) => n.startsWith(prefix))
      .map((n) => parseInt(n.slice(prefix.length), 10) || 0);
    return prefix + (used.length ? Math.max(...used) + 1 : 1);
  }

  // ---------- Logo ----------
  function applyLogo() {
    const img = $('pv_logo');
    const custom = load(LS_LOGO, null);
    const head = $('pv_letterhead');
    img.onerror = () => { img.hidden = true; head.classList.remove('has-logo'); };
    img.onload = () => { img.hidden = false; head.classList.add('has-logo'); };
    // Logo importé dans le navigateur, sinon logo.png du dépôt
    img.src = custom || 'logo.png?v=2';
  }

  // ---------- Formulaire ----------
  const docFields = ['number', 'date', 'client', 'attention', 'marque', 'model', 'plaque', 'notes'];
  const coFields = ['name', 'address', 'phone', 'email'];

  function fillForm() {
    docFields.forEach((f) => { $(f).value = doc[f] || ''; });
    $('showSignature').checked = !!doc.showSignature;
    coFields.forEach((f) => { $('co_' + f).value = company[f] || ''; });
    $('co_showText').checked = company.showText !== false;
    renderItemRows();
  }

  function renderItemRows() {
    const tb = $('itemsBody');
    tb.innerHTML = '';
    doc.items.forEach((it, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input inputmode="decimal" data-k="qty" value="${it.qty ?? ''}"></td>
        <td><input data-k="desc"></td>
        <td><input inputmode="decimal" data-k="price" value="${it.price ?? ''}"></td>
        <td><button type="button" class="del" title="Supprimer">✕</button></td>`;
      tr.querySelector('[data-k=desc]').value = it.desc || '';
      tr.querySelectorAll('input').forEach((inp) => {
        inp.addEventListener('input', () => {
          const k = inp.dataset.k;
          doc.items[i][k] = k === 'desc' ? inp.value : inp.value;
          update();
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (i === doc.items.length - 1) addRow(); else tb.rows[i + 1].querySelector('input').focus();
          }
        });
      });
      tr.querySelector('.del').addEventListener('click', () => {
        doc.items.splice(i, 1);
        renderItemRows(); update();
      });
      tb.appendChild(tr);
    });
  }

  function addRow() {
    doc.items.push({ qty: 1, desc: '', price: '' });
    renderItemRows(); update();
    $('itemsBody').lastElementChild.querySelector('[data-k=desc]').focus();
  }

  // ---------- Aperçu ----------
  function text(id, v) { $(id).textContent = v || ''; }

  function renderPreview() {
    text('pv_coName', company.name);
    text('pv_coAddress', company.address);
    text('pv_coPhone', company.phone);
    text('pv_coEmail', company.email);
    $('pv_coText').classList.toggle('hidden', company.showText === false);

    text('pv_client', doc.client);
    text('pv_attention', doc.attention);
    text('pv_date', frDate(doc.date));
    text('pv_marque', doc.marque);
    text('pv_model', doc.model);
    text('pv_plaque', doc.plaque);
    text('pv_number', doc.number);
    text('pv_notes', doc.notes);
    $('pv_signature').hidden = !doc.showSignature;

    const tb = $('pv_items');
    tb.innerHTML = '';
    let totalPU = 0, total = 0;
    doc.items.forEach((it) => {
      if (!String(it.desc || '').trim() && !parseNum(it.price)) return;
      const q = parseNum(it.qty), p = parseNum(it.price), amt = q * p;
      totalPU += p; total += amt;
      const tr = document.createElement('tr');
      const cells = [
        [String(it.qty ?? ''), 'qty'],
        [it.desc || '', 'l'],
        [fmt(p), 'r'],
        [fmt(amt), 'r'],
      ];
      cells.forEach(([v, cls]) => {
        const td = document.createElement('td');
        td.className = cls; td.textContent = v; tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    text('pv_totalPU', fmt(totalPU));
    text('pv_total', fmt(total));
  }

  let draftTimer;
  function update() {
    renderPreview();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => store(LS_DRAFT, doc), 300);
  }

  // ---------- Enregistrées ----------
  function renderSaved() {
    const list = load(LS_SAVED, []);
    $('savedCount').textContent = list.length;
    const ul = $('savedList');
    ul.innerHTML = '';
    if (!list.length) { ul.innerHTML = '<li><small>Aucune proforma enregistrée.</small></li>'; return; }
    list.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)).forEach((p) => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.innerHTML = `<b></b><br><small></small>`;
      span.querySelector('b').textContent = p.number || '(sans numéro)';
      span.querySelector('small').textContent = `${frDate(p.date)} · ${p.client || ''} · ${p.plaque || ''}`;
      const open = document.createElement('button'); open.textContent = 'Ouvrir';
      const dup = document.createElement('button'); dup.textContent = 'Copier'; dup.title = 'Dupliquer comme nouvelle proforma';
      const del = document.createElement('button'); del.textContent = '✕'; del.title = 'Supprimer';
      open.onclick = () => { doc = clone(p); fillForm(); update(); };
      dup.onclick = () => {
        doc = clone(p); doc.id = null; doc.date = todayISO(); doc.number = nextNumber(doc.date);
        fillForm(); update(); toast('Copie créée — pensez à enregistrer.');
      };
      del.onclick = () => {
        if (!confirm(`Supprimer ${p.number} ?`)) return;
        store(LS_SAVED, load(LS_SAVED, []).filter((x) => x.id !== p.id));
        renderSaved();
      };
      li.append(span, open, dup, del);
      ul.appendChild(li);
    });
  }

  function saveDoc() {
    const list = load(LS_SAVED, []);
    if (!doc.id) doc.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    doc.savedAt = Date.now();
    const i = list.findIndex((x) => x.id === doc.id);
    if (i >= 0) list[i] = clone(doc); else list.push(clone(doc));
    if (store(LS_SAVED, list)) toast('Proforma enregistrée ✔'); else alert("Impossible d'enregistrer (stockage plein ?)");
    store(LS_DRAFT, doc);
    renderSaved();
  }

  function newDoc() {
    if (!confirm('Commencer une nouvelle proforma ? (les modifications non enregistrées seront perdues)')) return;
    const d = todayISO();
    doc = {
      id: null, number: nextNumber(d), date: d,
      client: '', attention: '', marque: '', model: '', plaque: '', notes: doc.notes || '',
      showSignature: doc.showSignature, items: [{ qty: 1, desc: '', price: '' }],
    };
    fillForm(); update();
  }

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div'); t.className = 'toast no-print';
      Object.assign(t.style, { position: 'fixed', bottom: '18px', left: '18px', background: '#222', color: '#fff',
        padding: '8px 14px', borderRadius: '6px', fontSize: '14px', zIndex: 99, transition: 'opacity .3s' });
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = 1;
    clearTimeout(t._h); t._h = setTimeout(() => { t.style.opacity = 0; }, 2200);
  }

  // ---------- Impression ----------
  function printDoc() {
    const old = document.title;
    // Nom proposé pour le fichier PDF
    document.title = [doc.number, doc.plaque].filter(Boolean).join(' ') || 'Proforma';
    const restore = () => { document.title = old; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    window.print();
    setTimeout(restore, 3000);
  }

  // ---------- Mise à l'échelle de l'aperçu (petits écrans) ----------
  function fitPreview() {
    const sheet = $('sheet');
    sheet.style.zoom = '';
    const avail = sheet.parentElement.clientWidth - 24;
    const w = sheet.offsetWidth;
    if (w > avail && avail > 0) sheet.style.zoom = (avail / w).toFixed(3);
  }

  // ---------- Événements ----------
  docFields.forEach((f) => $(f).addEventListener('input', () => {
    doc[f] = $(f).value;
    update();
  }));
  $('date').addEventListener('change', () => {
    // Si le numéro suit le format auto, l'adapter à la nouvelle date
    if (/^Bill-G-\d{8}-\d+$/.test(doc.number || '') && !doc.id) { doc.number = nextNumber(doc.date); $('number').value = doc.number; update(); }
  });
  $('showSignature').addEventListener('change', (e) => { doc.showSignature = e.target.checked; update(); });

  coFields.forEach((f) => $('co_' + f).addEventListener('input', () => {
    company[f] = $('co_' + f).value; store(LS_COMPANY, company); renderPreview();
  }));
  $('co_showText').addEventListener('change', (e) => { company.showText = e.target.checked; store(LS_COMPANY, company); renderPreview(); });

  $('logoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Réduire l'image pour tenir dans le stockage du navigateur
      const img = new Image();
      img.onload = () => {
        const max = 1600, s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const url = c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92);
        if (!store(LS_LOGO, url)) alert('Image trop lourde pour être mémorisée, essayez une image plus petite.');
        applyLogo();
        toast('Logo mis à jour ✔');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  $('btnLogoReset').addEventListener('click', () => { localStorage.removeItem(LS_LOGO); applyLogo(); });

  $('btnAddRow').addEventListener('click', addRow);
  $('btnSave').addEventListener('click', saveDoc);
  $('btnNew').addEventListener('click', newDoc);
  $('btnPrint').addEventListener('click', printDoc);

  $('btnExport').addEventListener('click', () => {
    const data = { company, logo: load(LS_LOGO, null), saved: load(LS_SAVED, []) };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
    a.download = `proformas-sauvegarde-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('importInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((t) => {
      const data = JSON.parse(t);
      if (data.company) { company = { ...DEFAULT_COMPANY, ...data.company }; store(LS_COMPANY, company); }
      if (data.logo) store(LS_LOGO, data.logo);
      if (Array.isArray(data.saved)) {
        const list = load(LS_SAVED, []);
        data.saved.forEach((p) => { if (!list.some((x) => x.id === p.id)) list.push(p); });
        store(LS_SAVED, list);
      }
      applyLogo(); fillForm(); update(); renderSaved();
      toast('Sauvegarde importée ✔');
    }).catch(() => alert('Fichier invalide.'));
    e.target.value = '';
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveDoc(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') { e.preventDefault(); printDoc(); }
  });
  window.addEventListener('resize', fitPreview);

  // ---------- Démarrage ----------
  applyLogo();
  fillForm();
  renderPreview();
  renderSaved();
  fitPreview();
})();
