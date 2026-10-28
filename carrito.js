/* Sweet Help - Carrito compartido entre pestañas y páginas.
   Los productos se guardan como JSON ({productos:[...]}) en localStorage
   y todas las pestañas se sincronizan con el evento "storage".
   Incluir en CADA página:  <script src="carrito.js"></script>
   Para agregar un producto desde productos.html:
   <button data-agregar data-id="1" data-nombre="Brownie" data-precio="8000" data-img="brownie.png">Agregar</button> */
(function () {
  const KEY = 'sweethelp_carrito';
  const PAGO_URL = 'pago.html'; // <- cambia por tu página de pago
  const fmt = n => '$' + Number(n).toLocaleString('es-CO');

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
    if (x.cantidad <= 0) d.productos = d.productos.filter(i => i.id !== id);
    guardar(d);
  }
  function vaciar() { guardar({ productos: [] }); }
  function descargarJSON() {
    const blob = new Blob([JSON.stringify(leer(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'carrito.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

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
    }

    const foot = el('div', 'shc-foot');
    const t = el('div', 'shc-total'); t.append(el('span', '', 'Total'), el('span', '', fmt(total)));
    const pay = el('button', 'shc-pagar', 'Pagar ahora');
    pay.disabled = !d.productos.length;
    pay.onclick = () => { location.href = PAGO_URL; };
    foot.append(t, pay);
    if (d.productos.length) {
      const dl = el('button', 'shc-link', 'Descargar carrito.json'); dl.onclick = descargarJSON;
      const vc = el('button', 'shc-link', 'Vaciar carrito'); vc.onclick = vaciar;
      foot.append(dl, vc);
    }
    panel.appendChild(foot);
  }

  function abrir() { render(); panel.classList.add('open'); }
  function cerrar() { panel.classList.remove('open'); }

  document.addEventListener('click', e => {
    const add = e.target.closest('[data-agregar]');
    if (add) {
      agregar({ id: add.dataset.id, nombre: add.dataset.nombre, precio: add.dataset.precio, img: add.dataset.img });
      abrir(); return;
    }
    if (e.target.closest('#shCartBtn')) { panel.classList.contains('open') ? cerrar() : abrir(); return; }
    if (!e.target.closest('.shc-panel')) cerrar();
  });

  // Sincroniza el carrito entre pestañas
  window.addEventListener('storage', e => { if (e.key === KEY) render(); });

  window.SweetHelpCarrito = { agregar, cambiar, vaciar, obtener: leer, descargarJSON };
  render();
})();
