(() => {
  'use strict';

  const LS_COMPANY = 'proforma.company';
  const LS_LOGO = 'proforma.logo';
  const LS_DRAFT = 'proforma.draft';
  const LS_SAVED = 'proforma.saved';

  const DEFAULT_FOOTER = [
    "Pour paiement : Prière d'émettre chèque à l'ordre de Bill-Metz Auto Garage.",
    'Virement à la Sogebel : Compte courant $US # 154 010 2751 & Compte courant HTG # 4910 0993',
    'Services offerts : Transport de marchandises et location de véhicules - Diagnostic complet – Climatisation – Douco – Dressage – Suspension - Electricité auto - Programmation clé - Installation GPS - Installation alarme - Service d’entretien.',
  ].join('\n');

  const DEFAULT_COMPANY = {
    name: 'BILL-METZ AUTO GARAGE',
    address: '5, rue V La Tortue, Delmas 33',
    phone: '(509) 3614 3734/4362 0141',
    email: 'billmetzautogarage17@gmail.com',
    showText: true,
    footer: DEFAULT_FOOTER,
  };

  const SAMPLE = {
    id: null,
    number: 'Bill-G-13102026-1',
    date: '2026-10-22',
    client: "Banque De La Republique D'Haiti",
    attention: 'Nicolas BIENAISE',
    marque: 'Vitara',
    model: '', annee: '', serie: '', moteur: '', mileage: '',
    plaque: 'AA-41779',
    notes: '',
    labor: 75000, applyTca: true, tcaRate: 10,
    hideSignature: false,
    items: [
      [1, 'Air Filter', 4500], [1, 'Oil Filter', 3000], [1, 'Fuel Filter', 7000],
      [1, 'Cabine Filter', 4500], [1, 'Gl 10W30 Castrol Oil', 6000],
      [1, 'Brake Pad Set Front', 16500], [1, 'Brake Pad Set Rear', 15000],
      [2, 'Engine Mounting', 24000], [1, 'Transmission Mounting', 24500],
      [2, 'Lower Arm', 27000], [2, 'Link Stabilizer Fr', 17000],
      [2, 'Tie Rod Inner', 16000], [2, 'Tie Rod Outer', 12000],
      [1, 'Main Seal', 14500], [1, 'Seal Rear', 12500],
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
  const docFields = ['number', 'date', 'client', 'attention', 'marque', 'model', 'annee', 'serie', 'moteur', 'mileage', 'plaque',
    'notes', 'signer', 'signerTitle', 'labor', 'tcaRate'];
  const coFields = ['name', 'address', 'phone', 'email', 'footer'];
  const tcaRate = () => (doc.tcaRate === undefined ? 10 : parseNum(doc.tcaRate));

  function fillForm() {
    docFields.forEach((f) => { $(f).value = doc[f] || ''; });
    $('showSignature').checked = !doc.hideSignature;
    if (doc.tcaRate === undefined) doc.tcaRate = 10;
    if (doc.applyTca === undefined) doc.applyTca = true;
    $('tcaRate').value = doc.tcaRate;
    $('applyTca').checked = !!doc.applyTca;
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
    text('pv_number', doc.number);
    text('pv_footer', company.footer);

    // Encadré véhicule (la plaque n'apparaît que si elle est remplie)
    const veh = $('pv_vehicle');
    veh.innerHTML = '';
    [['Date', frDate(doc.date)], ['Marque', doc.marque], ['Modèle', doc.model], ['Année', doc.annee],
      ['Série', doc.serie], ['Moteur', doc.moteur], ['Mileage', doc.mileage], ['Plaque', doc.plaque, true]]
      .forEach(([k, v, optional]) => {
        if (optional && !String(v || '').trim()) return;
        const row = document.createElement('div');
        row.className = 'kv';
        row.innerHTML = '<span class="k"></span><span class="sep">:</span><span></span>';
        row.children[0].textContent = k;
        row.children[2].textContent = v || '';
        veh.appendChild(row);
      });
    text('pv_notes', doc.notes);
    $('pv_signature').hidden = !!doc.hideSignature;
    text('pv_sigName', doc.signer);
    text('pv_sigRole', doc.signerTitle);

    const tb = $('pv_items');
    tb.innerHTML = '';
    let total = 0;
    doc.items.forEach((it) => {
      // Ligne ignorée : sans prix et sans vrai texte (vide ou seulement des chiffres)
      if (!parseNum(it.price) && !/[A-Za-zÀ-ÿ]/.test(String(it.desc || ''))) return;
      const q = parseNum(it.qty), p = parseNum(it.price), amt = q * p;
      total += amt;
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
    // Encadré des totaux (une seule fois, après le dernier article)
    const labor = parseNum(doc.labor);
    const sub = total + labor;
    const rate = tcaRate();
    const tca = doc.applyTca ? Math.round(sub * rate) / 100 : 0;
    const rows = [];
    if (labor) rows.push(["Main d'oeuvre", labor]);
    if (doc.applyTca) {
      rows.push(['Sous-total', sub]);
      rows.push([`TCA (${String(rate).replace('.', ',')} %)`, tca]);
    }
    rows.push(['TOTAL', sub + tca, 'grand']);
    const sm = $('pv_summary');
    sm.innerHTML = '';
    rows.forEach(([k, v, cls]) => {
      const tr = document.createElement('tr');
      if (cls) tr.className = cls;
      tr.innerHTML = '<td class="k"></td><td class="v"></td>';
      tr.children[0].textContent = k + ' :';
      tr.children[1].textContent = fmt(v);
      sm.appendChild(tr);
    });
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
      client: '', attention: '', marque: '', model: '', annee: '', serie: '', moteur: '', mileage: '', plaque: '',
      notes: doc.notes || '', labor: '', applyTca: doc.applyTca !== false, tcaRate: doc.tcaRate ?? 10,
      hideSignature: !!doc.hideSignature, signer: doc.signer || '', signerTitle: doc.signerTitle || '', items: [{ qty: 1, desc: '', price: '' }],
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
  const fileName = () => ([doc.number, doc.plaque].filter(Boolean).join(' ') || 'Proforma').replace(/[\\/:*?"<>|]+/g, '-');

  function printDoc() {
    $('sheet').style.zoom = '';
    const old = document.title;
    // Nom proposé pour le fichier PDF
    document.title = fileName();
    const restore = () => { document.title = old; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    preparePrint();
    window.print();
    setTimeout(restore, 3000);
  }

  // Découpe la feuille en pages A4 : lignes entières, en-tête du tableau répété,
  // total uniquement à la fin, signature jamais coupée.
  function paginate(first, host) {
    const MAX = 266 * 96 / 25.4; // hauteur utile d'une page A4 (297 - marges) en px
    const table = first.querySelector('table.invoice');
    const tbody = table.tBodies[0];
    const rows = [...tbody.rows];
    const tail = [...first.querySelectorAll('.summary, .notes, .signature, .footer-msg')];
    tail.forEach((el) => el.remove());
    rows.forEach((r) => r.remove());
    const pages = [first];
    let page = first, body = tbody;
    const bodies = [tbody];
    const newPage = () => {
      page = document.createElement('div');
      page.className = 'sheet pdf-sheet';
      const t = table.cloneNode(false);
      [...table.children].forEach((ch) => { if (ch.tagName !== 'TBODY') t.appendChild(ch.cloneNode(true)); });
      body = document.createElement('tbody');
      bodies.push(body);
      t.appendChild(body);
      page.appendChild(t);
      host.appendChild(page);
      pages.push(page);
    };
    rows.forEach((r) => {
      body.appendChild(r);
      if (page.offsetHeight > MAX && body.rows.length > 1) { r.remove(); newPage(); body.appendChild(r); }
    });
    // Totaux + signature + message : si ils ne tiennent pas, les derniers articles et le total
    // passent avec elles sur la page suivante (la signature n'est jamais seule).
    tail.forEach((el) => page.appendChild(el));
    if (tail.length && page.offsetHeight > MAX) {
      tail.forEach((el) => el.remove());
      const k = Math.min(3, body.rows.length - 1); // 3 derniers articles
      const moved = k > 0 ? [...body.rows].slice(-k) : [];
      if (moved.length) {
        moved.forEach((r) => r.remove());
        newPage();
        moved.forEach((r) => body.appendChild(r));
      } else {
        page = document.createElement('div');
        page.className = 'sheet pdf-sheet';
        host.appendChild(page); pages.push(page);
      }
      tail.forEach((el) => page.appendChild(el));
    }
    // Le total ne doit jamais être seul : la dernière page du tableau reçoit
    // au moins 3 articles + le total (pris à la fin de la page précédente).
    if (bodies.length > 1) {
      const last = bodies[bodies.length - 1], prev = bodies[bodies.length - 2];
      const need = Math.min(3 - last.rows.length, prev.rows.length - 1);
      if (need > 0) {
        [...prev.rows].slice(-need).reverse().forEach((r) => last.insertBefore(r, last.firstChild));
      }
    }
    // Dernière page à pleine hauteur : le message de paiement se place tout en bas
    page.style.height = Math.floor(MAX) + 'px';
    return pages;
  }

  // Construit les pages A4 dans un conteneur donné (utilisé pour le PDF et l'impression)
  function buildPages(host) {
    const copy = $('sheet').cloneNode(true);
    copy.removeAttribute('id'); copy.style.zoom = ''; copy.classList.add('pdf-sheet');
    copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    host.appendChild(copy);
    return paginate(copy, host);
  }

  // Impression navigateur : on imprime les mêmes pages que le PDF
  function preparePrint() {
    cleanupPrint();
    $('sheet').style.zoom = '';
    const host = document.createElement('div');
    host.className = 'pdf-measure';
    document.body.appendChild(host);
    buildPages(host);
    host.className = 'print-pages';
    document.body.classList.add('printing');
  }
  function cleanupPrint() {
    document.querySelectorAll('.print-pages').forEach((el) => el.remove());
    document.body.classList.remove('printing');
    fitPreview();
  }

  // PDF généré à partir d'une copie de la feuille à taille A4 fixe :
  // le résultat est identique quel que soit l'écran (téléphone, tablette, ordinateur).
  let busy = false;
  async function downloadPdf() {
    if (busy) return;
    if (!window.html2pdf) { alert('Le module PDF est encore en chargement (connexion internet requise). Réessayez dans un instant.'); return; }
    busy = true;
    const btn = $('btnPdf'); const label = btn.textContent;
    btn.textContent = 'Création du PDF…'; btn.disabled = true;
    const host = document.createElement('div');
    host.className = 'pdf-measure';
    document.body.appendChild(host);
    try {
      const imgs = [...document.querySelectorAll('#sheet img')].filter((i) => !i.hidden);
      await Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
      const pages = buildPages(host);
      const opt = {
        margin: [14, 15, 14, 15],
        filename: fileName() + '.pdf',
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: [] },
      };
      // Chaque page est rendue séparément : aucune ligne n'est coupée entre deux pages
      let worker = html2pdf().set(opt).from(pages[0]).toPdf();
      pages.slice(1).forEach((pg) => {
        worker = worker.get('pdf').then((pdf) => { pdf.addPage(); }).from(pg).toContainer().toCanvas().toPdf();
      });
      await worker.save();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création du PDF : ' + err.message);
    } finally {
      host.remove();
      btn.textContent = label; btn.disabled = false; busy = false;
    }
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
  $('showSignature').addEventListener('change', (e) => { doc.hideSignature = !e.target.checked; update(); });
  $('applyTca').addEventListener('change', (e) => { doc.applyTca = e.target.checked; update(); });
  $('btnFooterReset').addEventListener('click', () => {
    company.footer = DEFAULT_FOOTER; $('co_footer').value = DEFAULT_FOOTER; store(LS_COMPANY, company); renderPreview();
  });

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
  $('btnPdf').addEventListener('click', downloadPdf);

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
  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('afterprint', cleanupPrint);

  // ---------- Démarrage ----------
  applyLogo();
  fillForm();
  renderPreview();
  renderSaved();
  fitPreview();
})();
