/* Sweet Help - Carrito compartido entre pestañas y páginas.
   Los productos se guardan como JSON ({productos:[...]}) en localStorage
   y todas las pestañas se sincronizan con el evento "storage".
   Incluir en CADA página:  <script src="carrito.js"></script>
   Para agregar un producto desde productos.html:
   <button data-agregar data-id="1" data-nombre="Brownie" data-precio="8000" data-img="brownie.png">Agregar</button> */
(function () {
  // Si por error carrito.js se carga dos veces (o lo carga otro script), la segunda copia no hace nada:
  // así nunca hay dos ventanas del carrito una encima de la otra ni productos sumados doble.
  if (window.__shCarritoCargado) return;
  window.__shCarritoCargado = true;
  document.querySelectorAll('.shc-panel').forEach(p => p.remove());

  const KEY = 'sweethelp_carrito';
  const PAGO_URL = 'pago.html'; // <- cambia por tu página de pago
  const fmt = n => '$' + Number(n).toLocaleString('es-CO');

  /* ---------- Soneditos (se generan solos, no necesitan archivos) ----------
     Cada sonido es una lista de notas: [frecuencia Hz, duración s, tipo de onda]. */
  const SONIDO_ACTIVO = true;   // pon false para silenciar todo
  const VOLUMEN = 0.18;         // de 0 a 1
  const SONIDOS = {
    agregar: [[660, .09], [880, .14]],
    sumar:   [[740, .09]],
    restar:  [[520, .09]],
    quitar:  [[520, .08], [390, .08], [293, .16]],
    vaciar:  [[600, .08], [450, .08], [330, .08], [247, .18]],
    abrir:   [[600, .07], [800, .11]],
    cerrar:  [[800, .07], [600, .11]],
    pagar:   [[523, .09], [659, .09], [784, .09], [1047, .2]]
  };
  let ctx = null;
  function sonar(nombre) {
    if (!SONIDO_ACTIVO || !SONIDOS[nombre]) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = ctx || new AC();
      if (ctx.state === 'suspended') ctx.resume();
      let t = ctx.currentTime;
      SONIDOS[nombre].forEach(n => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = n[2] || 'sine';
        o.frequency.setValueAtTime(n[0], t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(VOLUMEN, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + n[1]);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + n[1] + 0.02);
        t += n[1] * 0.8;
      });
    } catch (e) {}
  }

  function leer() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      return d && Array.isArray(d.productos) ? d : { productos: [] };
    } catch (e) { return { productos: [] }; }
  }
  function guardar(d) {
    d.actualizado = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
    render();
  }
  function agregar(p) {
    const d = leer();
    const x = d.productos.find(i => String(i.id) === String(p.id));
    if (x) x.cantidad += 1;
    else d.productos.push({ id: String(p.id), nombre: p.nombre, precio: Number(p.precio) || 0, img: p.img || '', cantidad: 1 });
    guardar(d);
  }
  function cambiar(id, delta) {
    const d = leer();
    const x = d.productos.find(i => i.id === id);
    if (!x) return;
    x.cantidad += delta;
    if (x.cantidad <= 0) { d.productos = d.productos.filter(i => i.id !== id); sonar('quitar'); }
    else sonar(delta > 0 ? 'sumar' : 'restar');
    guardar(d);
  }
  function vaciar() { sonar('vaciar'); guardar({ productos: [] }); }

  const css = `
  .shc-panel{position:fixed;top:150px;right:24px;width:320px;max-width:calc(100vw - 48px);background:#fff;border-radius:22px;
    box-shadow:0 10px 30px rgba(0,0,0,.25);z-index:10001;display:none;font-family:inherit;overflow:hidden;border:3px solid #ff9195}
  .shc-panel.open{display:block}
  .shc-head{background:#ff9195;color:#fff;padding:12px 16px;font-weight:800;display:flex;justify-content:space-between;align-items:center}
  .shc-head button{background:none;border:0;color:#fff;font-size:20px;cursor:pointer}
  .shc-list{max-height:260px;overflow:auto;padding:8px 12px;margin:0;list-style:none}
  .shc-item{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #ffe0e1;color:#864f02;font-size:14px}
  .shc-item img{width:40px;height:40px;object-fit:cover;border-radius:8px}
  .shc-info{flex:1}.shc-info b{display:block}
  .shc-qty{display:flex;align-items:center;gap:4px}
  .shc-qty button{width:24px;height:24px;border-radius:50%;border:0;background:#ff9195;color:#fff;cursor:pointer;font-weight:800}
  .shc-vacio{padding:24px;text-align:center;color:#c0607a}
  .shc-foot{padding:12px 16px;display:flex;flex-direction:column;gap:8px}
  .shc-total{display:flex;justify-content:space-between;font-weight:800;color:#864f02}
  .shc-pagar{background:#ffab00;color:#fff;border:0;border-radius:999px;padding:12px;font-weight:800;font-size:16px;cursor:pointer}
  .shc-pagar:disabled{opacity:.5;cursor:not-allowed}
  .shc-link{background:none;border:0;color:#c0607a;font-size:12px;cursor:pointer;text-decoration:underline}
  .sh-badge{position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;border-radius:10px;background:#ffab00;color:#fff;
    font-size:12px;font-weight:800;display:none;align-items:center;justify-content:center;padding:0 5px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  const panel = el('div', 'shc-panel');
  document.body.appendChild(panel);

  function render() {
    const d = leer();
    const total = d.productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
    const cant = d.productos.reduce((s, p) => s + p.cantidad, 0);

    document.querySelectorAll('.sh-badge').forEach(b => {
      b.textContent = cant;
      b.style.display = cant ? 'flex' : 'none';
    });

    const listaVieja = panel.querySelector('.shc-list');
    const scrollPrevio = listaVieja ? listaVieja.scrollTop : 0;
    panel.textContent = '';
    const head = el('div', 'shc-head');
    head.appendChild(el('span', '', 'Tu carrito'));
    const x = el('button', '', '✕'); x.onclick = cerrar; head.appendChild(x);
    panel.appendChild(head);

    if (!d.productos.length) {
      panel.appendChild(el('div', 'shc-vacio', 'Aún no has elegido productos 🍰'));
    } else {
      const ul = el('ul', 'shc-list');
      d.productos.forEach(p => {
        const li = el('li', 'shc-item');
        if (p.img) { const im = el('img'); im.src = p.img; im.alt = p.nombre; li.appendChild(im); }
        const info = el('div', 'shc-info');
        info.appendChild(el('b', '', p.nombre));
        info.appendChild(el('span', '', fmt(p.precio * p.cantidad)));
        li.appendChild(info);
        const q = el('div', 'shc-qty');
        const m = el('button', '', '−'); m.onclick = () => cambiar(p.id, -1);
        const n = el('span', '', String(p.cantidad));
        const M = el('button', '', '+'); M.onclick = () => cambiar(p.id, 1);
        q.append(m, n, M); li.appendChild(q);
        ul.appendChild(li);
      });
      panel.appendChild(ul);
      ul.scrollTop = scrollPrevio;
    }

    const foot = el('div', 'shc-foot');
    const t = el('div', 'shc-total'); t.append(el('span', '', 'Total'), el('span', '', fmt(total)));
    const pay = el('button', 'shc-pagar', 'Pagar ahora');
    pay.disabled = !d.productos.length;
    pay.onclick = () => { sonar('pagar'); setTimeout(() => { location.href = PAGO_URL; }, 220); };
    foot.append(t, pay);
    if (d.productos.length) {
      const vc = el('button', 'shc-link', 'Vaciar carrito'); vc.onclick = vaciar;
      foot.append(vc);
    }
    panel.appendChild(foot);
  }

  function abrir() { render(); panel.classList.add('open'); sonar('abrir'); }
  function cerrar() {
    if (!panel.classList.contains('open')) return;
    panel.classList.remove('open');
    sonar('cerrar');
  }

  document.addEventListener('click', e => {
    const add = e.target.closest('[data-agregar]');
    if (add) {
      // Solo agrega (y actualiza el contador); el carrito se abre únicamente al tocar el icono
      agregar({ id: add.dataset.id, nombre: add.dataset.nombre, precio: add.dataset.precio, img: add.dataset.img });
      sonar('agregar');
      return;
    }
    if (e.target.closest('#shCartBtn')) { panel.classList.contains('open') ? cerrar() : abrir(); return; }
    // OJO: al tocar − / + / vaciar, render() reconstruye el panel y el botón tocado ya no está en la página
    // cuando este código corre, así que closest('.shc-panel') fallaba y cerraba el carrito.
    // composedPath() guarda el recorrido original del clic y sí incluye al panel.
    if (e.composedPath().includes(panel)) return;
    cerrar();
  });

  // Sincroniza el carrito entre pestañas
  window.addEventListener('storage', e => { if (e.key === KEY) render(); });

  window.SweetHelpCarrito = { agregar, cambiar, vaciar, obtener: leer };
  render();
})();
