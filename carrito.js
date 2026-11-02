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
  const KEY_ALC = 'sweethelp_alcancia';   // aportes acumulados (10% de cada compra)
  const PCT = 0.10;                        // porcentaje que va a la alcancía
  const ICONO_ALC = 'chanchito.svg';
  const KEY_PEDIDO = 'sweethelp_pedido';   // pedido en curso (seguimiento en ventana emergente)
  const KEY_DOM = 'sh_domicilio';          // domicilio elegido en productos.html ({lat,lng,km,precio})
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
    else d.productos.push({ id: String(p.id), nombre: p.nombre, precio: Number(p.precio) || 0, img: p.img || '', cantidad: 1, sinCocina: !!p.sinCocina });
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

  /* ---------- Alcancía: el 10% de cada producto comprado ---------- */
  function leerAlc() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY_ALC));
      return d && Array.isArray(d.aportes) ? d : { aportes: [] };
    } catch (e) { return { aportes: [] }; }
  }
  function guardarAlc(d) {
    try { localStorage.setItem(KEY_ALC, JSON.stringify(d)); } catch (e) {}
    renderAlc();
  }
  const aporteDe = p => Math.round(p.precio * p.cantidad * PCT);
  function aportar(productos) {
    const d = leerAlc();
    // Cada compra se guarda completa (nunca se mezcla ni se borra): fecha + producto + cantidad + monto
    const compra = Date.now();
    const fecha = new Date(compra).toISOString();
    productos.forEach(p => {
      d.aportes.push({ compra: compra, fecha: fecha, id: p.id, nombre: p.nombre, img: p.img || '', cantidad: p.cantidad, monto: aporteDe(p) });
    });
    guardarAlc(d);
    animarAlc = true;
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
  .shc-don{font-size:12px;color:#c0607a;text-align:center;font-weight:700}
  .shc-alc-btn{width:56px;height:56px;border-radius:50%;background:#fff;border:3px solid #ff9195;padding:0;margin:2px auto 0;
    cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,.18);
    transition:transform .25s cubic-bezier(.3,1.8,.5,1)}
  .shc-alc-btn:hover{transform:scale(1.1)}
  .shc-alc-btn img{width:34px;height:34px;display:block}
  .shc-alc-btn.pop{animation:shcPop .6s ease}
  @keyframes shcPop{0%{transform:scale(1)}30%{transform:scale(1.3) rotate(-8deg)}60%{transform:scale(.92) rotate(6deg)}100%{transform:scale(1)}}
  .shc-alc{width:340px}
  .shc-alc-cerdo{display:block;margin:12px auto 0;width:96px;height:96px}
  .shc-alc .shc-total{font-size:20px}
  .shc-alc .shc-list{max-height:190px;overflow-y:auto}
  .shc-alc-nota{text-align:center;font-size:12px;color:#c0607a;margin:0 12px}
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

  /* Panel grande de la alcancía (mismo estilo que el del carrito) y su botón circular bajo el icono del carrito */
  const panelAlc = el('div', 'shc-panel shc-alc');
  document.body.appendChild(panelAlc);
  let animarAlc = false;   // hace saltar el botón de la alcancía justo después de pagar

  function renderAlc() {
    const d = leerAlc();
    const total = d.aportes.reduce((s, a) => s + a.monto, 0);
    const listaVieja = panelAlc.querySelector('.shc-list');
    const scrollPrevio = listaVieja ? listaVieja.scrollTop : 0;
    panelAlc.textContent = '';
    const head = el('div', 'shc-head');
    head.appendChild(el('span', '', 'Mi alcancía'));
    const x = el('button', '', '✕'); x.onclick = cerrarAlc; head.appendChild(x);
    panelAlc.appendChild(head);
    const cerdo = el('img', 'shc-alc-cerdo'); cerdo.src = ICONO_ALC; cerdo.alt = 'chanchito';
    panelAlc.appendChild(cerdo);

    if (!d.aportes.length) {
      panelAlc.appendChild(el('div', 'shc-vacio', 'Aún no hay aportes. Con cada compra guardamos el 10% para ayudar 💗'));
    } else {
      const ul = el('ul', 'shc-list');
      // Una fila por compra (las más nuevas arriba). Las anteriores a este cambio van juntas en una sola fila.
      const grupos = [], mapa = {};
      d.aportes.forEach(a => {
        const k = a.compra || 'ant';
        if (!mapa[k]) { mapa[k] = { fecha: a.fecha, monto: 0 }; grupos.push(mapa[k]); }
        mapa[k].monto += a.monto;
      });
      grupos.reverse().forEach(g => {
        // Solo la cifra del 10% (con la fecha chiquita para distinguir cada compra)
        const li = el('li', 'shc-item');
        const f = g.fecha
          ? new Date(g.fecha).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
          : 'Compras anteriores';
        li.appendChild(el('span', 'shc-info', f));
        li.appendChild(el('b', '', fmt(g.monto)));
        ul.appendChild(li);
      });
      panelAlc.appendChild(ul);
      ul.scrollTop = scrollPrevio;
    }
    const foot = el('div', 'shc-foot');
    const t = el('div', 'shc-total'); t.append(el('span', '', 'Total ahorrado'), el('span', '', fmt(total)));
    foot.append(t, el('p', 'shc-alc-nota', 'El 10% de cada producto se destina a kits alimentarios.'));
    panelAlc.appendChild(foot);
  }
  function abrirAlc() { cerrar(); renderAlc(); panelAlc.classList.add('open'); sonar('abrir'); }
  function cerrarAlc() {
    if (!panelAlc.classList.contains('open')) return;
    panelAlc.classList.remove('open');
    sonar('cerrar');
  }

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
    pay.onclick = () => abrirPago();   // abre la ventana emergente de pago (no cambia de página)
    foot.append(t);
    if (d.productos.length) foot.append(el('div', 'shc-don', '🐷 ' + fmt(Math.round(total * PCT)) + ' (10%) irán a tu alcancía'));
    const domCart = leerDom();
    if (d.productos.length && domCart) foot.append(el('div', 'shc-don', '🛵 Domicilio ' + fmt(domCart.precio) + ' (se suma al pagar)'));
    foot.append(pay);
    if (d.productos.length) {
      const vc = el('button', 'shc-link', 'Vaciar carrito'); vc.onclick = vaciar;
      foot.append(vc);
    }
    // Botón circular de la alcancía: al final de todo, debajo de "Pagar ahora"
    const alc = el('button', 'shc-alc-btn' + (animarAlc ? ' pop' : ''));
    alc.id = 'shAlcBtn'; alc.type = 'button'; alc.title = 'Mi alcancía'; alc.setAttribute('aria-label', 'Mi alcancía');
    const im = el('img'); im.src = ICONO_ALC; im.alt = 'alcancía';
    alc.appendChild(im);
    foot.append(alc);
    animarAlc = false;
    panel.appendChild(foot);
  }

  function abrir() { cerrarAlc(); render(); panel.classList.add('open'); sonar('abrir'); }
  function cerrar() {
    if (!panel.classList.contains('open')) return;
    panel.classList.remove('open');
    sonar('cerrar');
  }

  /* =====================================================================
     PAGO + SEGUIMIENTO DEL PEDIDO — todo en ventanas emergentes (no cambia de página)
     1) "Pagar ahora" -> ventana de método de pago (débito, crédito, Nequi, Bancolombia, Daviplata, PSE)
        Todos los datos son INVENTADOS y de prueba: no se cobra nada.
     2) Pago aprobado -> ventana de seguimiento: línea de tiempo de una sola fila + mapa real
        (Leaflet + OpenStreetMap, el mismo de productos.html) con el repartidor (pinkimoto.gif) moviéndose por la ruta.
     3) Al llegar sale la notificación "¡Tu pedido ha llegado!" aunque hayas cerrado la ventana.
     ===================================================================== */
  const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  const LEAFLET_JS  = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const TIENDA = { lat: 11.2408, lng: -74.1990 };        // = DOMICILIO.tienda de productos.html (cámbialo en los dos)
  const DESTINO_EJEMPLO = { lat: 11.2508, lng: -74.1870 }; // si el cliente no eligió domicilio en Productos
  const GIF_MOTO = 'pinkimoto.gif';                      // el GIF del repartidor (misma carpeta que las páginas)
  const GIF_MIRA = 'derecha';                            // hacia dónde mira el GIF original: 'derecha' o 'izquierda'
  const TAM_MOTO = 38;                                   // tamaño del GIF en el mapa (px): pequeño, justo en la punta de la ruta
  /* Duración de la SIMULACIÓN (segundos reales) */
  /* aprobSinCocina: pedidos donde TODO es de la tienda (no pasa por cocina): la aprobación dura un poco más y sigue directo al repartidor */
  const DUR = { aprob: 6, cocina: 14, recoge: 8, ruta: 45, aprobSinCocina: 14 };
  /* Si llega un pedido nuevo cuando el repartidor de otro pedido (al MISMO domicilio) va en camino pero todavía cerca del local
     (menos de COMBINAR_HASTA de la ruta, "un poquito antes de la mitad"), el repartidor se devuelve al local, recoge el nuevo
     y vuelve a salir hacia la casa con los dos. Si ya va más lejos, el pedido nuevo sale con otro repartidor (otro recorrido). */
  const COMBINAR_HASTA = 0.35;
  DUR.recoge2 = 4;                                       // segundos que tarda en recoger el pedido extra al volver al local
  function tiempos(p) {
    const sin = !!(p && p.sinCocina);
    const aprob = sin ? DUR.aprobSinCocina : DUR.aprob, cocina = sin ? 0 : DUR.cocina;
    const coc = aprob + cocina;
    let rec = coc + DUR.recoge, total;
    if (p && p.salida) rec = Math.max(rec, (p.salida - p.inicio) / 1000);          // pedido que viaja junto a otro: sale cuando regresa el repartidor
    total = rec + DUR.ruta;
    if (p && p.desvio) total = p.desvio.tSale2 + DUR.ruta;                          // pedido cuyo repartidor se devolvió: llega más tarde
    return { aprob: aprob, cocina: cocina, coc: coc, rec: rec, total: total };
  }
  const LLEGANDO_DESDE = 0.85;                           // a partir de este % de la ruta el paso es "Repartidor llegando"
  const MIN_SIM = 25;                                    // minutos "de mentira" que se muestran al inicio
  SONIDOS.llegada = [[523, .12], [659, .12], [784, .12], [1047, .3]];

  const pausa = ms => new Promise(r => setTimeout(r, ms));
  function leerDom() {
    try {
      const g = JSON.parse(localStorage.getItem(KEY_DOM));
      return g && [g.lat, g.lng, g.km, g.precio].every(v => Number.isFinite(v)) ? g : null;
    } catch (e) { return null; }
  }
  /* ----- VARIOS PEDIDOS A LA VEZ: se guardan todos en una lista; cada uno tiene su número, su referencia y su propio seguimiento ----- */
  const KEY_PEDIDOS = 'sweethelp_pedidos';
  function leerPedidos() {
    try { const a = JSON.parse(localStorage.getItem(KEY_PEDIDOS)); if (Array.isArray(a)) return a; } catch (e) {}
    try { const o = JSON.parse(localStorage.getItem(KEY_PEDIDO)); if (o && o.id) { o.num = o.num || 1; return [o]; } } catch (e) {}   // migra el pedido único de la versión anterior
    return [];
  }
  let PEDS = leerPedidos();
  let VER = null;                                      // id del pedido que se está viendo en la ventana de seguimiento
  const pedidoPorId = id => PEDS.find(p => p.id === id) || null;
  const pedVisto = () => pedidoPorId(VER);
  function guardarPedidos() { try { localStorage.setItem(KEY_PEDIDOS, JSON.stringify(PEDS)); } catch (e) {} }
  function guardarPedido(p) {
    const i = PEDS.findIndex(x => x.id === p.id);
    if (i < 0) PEDS.push(p); else PEDS[i] = p;
    guardarPedidos();
  }
  const bloquear = () => { document.body.style.overflow = document.querySelector('.shm-ov.open') ? 'hidden' : ''; };

  const cssM = `
  .shm-ov{position:fixed;inset:0;z-index:10070;background:rgba(42,20,8,.55);display:none;align-items:center;justify-content:center;padding:16px;font-family:inherit}
  .shm-ov.open{display:flex;animation:shmFade .25s ease-out}
  @keyframes shmFade{from{opacity:0}}
  @keyframes shmPop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
  .shm-box{position:relative;width:min(560px,100%);max-height:94vh;overflow:auto;background:#fff;border:5px solid #ff9195;border-radius:30px;
    padding:22px 18px 18px;color:#864f02;box-shadow:0 18px 50px rgba(0,0,0,.35);animation:shmPop .4s ease-out;overscroll-behavior:contain}
  .shm-box.ancha{width:min(720px,100%)}
  .shm-x{position:absolute;top:10px;right:12px;width:36px;height:36px;border-radius:50%;border:0;background:#ff9195;color:#fff;font-size:18px;cursor:pointer;line-height:1}
  .shm-h{margin:0 0 10px;text-align:center;font-size:26px;color:#8b5e3c;font-family:"Lilita One","Lobster",system-ui,sans-serif;font-weight:400;padding:0 30px}
  .shm-sub{margin:12px 0 8px;font-weight:800;color:#c0607a;font-size:14px;text-transform:uppercase;letter-spacing:.4px}
  .shm-res{background:#fff6f1;border:2px solid #ffe0e1;border-radius:16px;padding:8px 12px}
  .shm-fila{display:flex;justify-content:space-between;gap:10px;padding:4px 0;font-size:14px}
  .shm-fila.shm-total{border-top:2px dashed #ffc2c5;margin-top:4px;padding-top:8px;font-size:17px;font-weight:800}
  .shm-metodos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .shm-met{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;border-radius:16px;border:3px solid #ffe0e1;background:#fff;color:#864f02;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;transition:transform .2s cubic-bezier(.3,1.8,.5,1),border-color .15s}
  .shm-met span{font-size:24px;line-height:1}
  .shm-met .shm-logo{height:34px;width:34px;object-fit:contain;display:block}
  .shm-met:hover{transform:scale(1.05)}
  .shm-met.on{border-color:#ff9195;background:#fff0f1}
  .shm-form{margin-top:12px}
  .shm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .shm-campo{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:700;color:#c0607a;grid-column:1/-1}
  .shm-campo.corto{grid-column:auto}
  .shm-campo input,.shm-campo select{font:inherit;font-size:15px;font-weight:600;padding:10px 12px;border:2px solid #ffc2c5;border-radius:12px;color:#864f02;background:#fff;outline:none;width:100%}
  .shm-campo input:focus,.shm-campo select:focus{border-color:#ff9195}
  .shm-btn{width:100%;margin-top:12px;background:#ffab00;color:#fff;border:0;border-radius:999px;padding:13px;font-weight:800;font-size:16px;cursor:pointer;font-family:inherit}
  .shm-btn:disabled{opacity:.45;cursor:not-allowed}
  .shm-btn.sec{background:#fff;color:#c0607a;border:3px solid #ff9195}
  .shm-vinc{margin-top:10px;padding:12px 14px;border-radius:16px;background:#e9f8ef;border:2px solid #3cb371;color:#1f7a47;font-size:14px;line-height:1.5}
  .shm-vinc b{display:block;font-size:15px}
  .shm-nota{margin:10px 0 0;text-align:center;font-size:11px;color:#c0607a}
  .shm-proc{position:absolute;inset:0;background:#fff;border-radius:25px;display:none;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:20px;z-index:5}
  .shm-proc.on{display:flex;animation:shmFade .2s}
  .shm-proc p{margin:0}
  .shm-spin{width:54px;height:54px;border-radius:50%;border:6px solid #ffe0e1;border-top-color:#ff9195;animation:shmGira .8s linear infinite}
  @keyframes shmGira{to{transform:rotate(360deg)}}
  .shm-ok{width:72px;height:72px;border-radius:50%;background:#3cb371;color:#fff;font-size:42px;display:flex;align-items:center;justify-content:center;animation:shmPop .5s ease-out}
  .shm-ref{font-size:12px;color:#c0607a}
  /* seguimiento */
  .shm-eta{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding-right:34px}
  .shm-eta small{display:block;color:#c0607a;font-weight:700}
  .shm-eta .hora{font-size:26px;font-weight:800}
  .shm-min{background:#ffab00;color:#fff;border-radius:999px;padding:8px 14px;font-weight:800;white-space:nowrap}
  .shm-estado{margin:10px 0 14px;font-weight:800;font-size:16px}
  .shm-linea{position:relative;margin-bottom:12px}
  .shm-track{position:absolute;top:19px;left:10%;right:10%;height:6px;border-radius:99px;background:#ffe0e1;overflow:hidden}
  .shm-fill{height:100%;width:0;background:#3cb371;border-radius:99px}
  .shm-pasos{position:relative;display:flex;list-style:none;margin:0;padding:0}
  .shm-paso{flex:1;text-align:center;font-size:11px;font-weight:700;color:#d9a8b3;line-height:1.2}
  .shm-dot{display:flex;align-items:center;justify-content:center;width:44px;height:44px;margin:0 auto 4px;border-radius:50%;background:#fff;border:4px solid #ffe0e1;font-size:20px;filter:grayscale(1);transition:all .3s}
  .shm-paso.hecho{color:#864f02}.shm-paso.activo{color:#864f02}
  .shm-paso.hecho .shm-dot{border-color:#3cb371;filter:none}
  .shm-paso.activo .shm-dot{border-color:#ff9195;filter:none;animation:shmLate 1s ease-in-out infinite}
  @keyframes shmLate{50%{transform:scale(1.14)}}
  #shmMapa{height:min(44vh,360px);border-radius:18px;overflow:hidden;border:3px solid #ff9195;background:#f8f2dc;isolation:isolate}
  .shm-leyenda{display:flex;justify-content:space-between;gap:6px;font-size:12px;color:#c0607a;font-weight:700;margin:8px 0}
  .shm-pin{background:none;border:0}
  .shm-pin span{display:flex;align-items:center;justify-content:center;width:38px;height:38px;font-size:20px;background:#fff;border:3px solid #ff9195;border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,.3)}
  .shm-pin.casa span{background:#e0527a;border-color:#fff}
  .shm-moto{background:none;border:0}
  .shm-moto img{display:block;width:__TAM__px;height:auto;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
  .shm-moto .emo{font-size:26px;line-height:1;display:block;text-align:center}
  .shm-cierra{margin:6px 0 0;text-align:center;font-size:12px;color:#c0607a}
  details.shm-det{margin-top:8px;font-size:14px}
  details.shm-det summary{cursor:pointer;font-weight:800;color:#c0607a}
  .shm-llego .shm-box{text-align:center;width:min(360px,100%);padding:30px 22px}
  .shm-llego .big{font-size:64px}
  .shm-llego h3{margin:6px 0;font-size:24px;color:#8b5e3c}
  .shm-llego p{margin:0 0 14px;color:#c0607a}
  .shm-chips{position:fixed;left:14px;bottom:14px;z-index:10060;display:flex;flex-direction:column;align-items:flex-start;gap:6px;max-width:calc(100vw - 28px);pointer-events:none}
  .shm-chip{pointer-events:auto;display:flex;flex-direction:column;align-items:flex-start;gap:1px;background:#ff8a00;color:#fff;border:0;border-radius:18px;padding:6px 14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.28);font-family:inherit;text-align:left;line-height:1.2}
  .shm-chip b{font-size:13px;font-weight:800;color:#fff}
  .shm-chip small{font-size:11px;font-weight:700;color:#fff;opacity:.95}
  .shm-aviso{margin:0 0 10px;padding:8px 12px;border-radius:14px;background:#fff6f1;border:2px dashed #ff9195;color:#864f02;font-size:13px;font-weight:700;text-align:center}
  @media (max-width:600px){
    .shm-ov{padding:0;align-items:flex-end}
    .shm-box,.shm-box.ancha{width:100%;max-height:96vh;border-radius:28px 28px 0 0;border-bottom:0}
    .shm-llego{align-items:center;padding:16px}.shm-llego .shm-box{border-radius:28px;border-bottom:5px solid #ff9195}
    .shm-metodos{grid-template-columns:repeat(2,1fr)}
    .shm-paso{font-size:10px}.shm-dot{width:38px;height:38px;font-size:17px}.shm-track{top:16px}
  }`;
  const stM = document.createElement('style');
  stM.textContent = cssM.replace('__TAM__', TAM_MOTO);
  document.head.appendChild(stM);

  /* ---------- Leaflet (se descarga solo la primera vez que hace falta) ---------- */
  let leafP = null;
  function cargarLeaflet() {
    if (window.L) return Promise.resolve();
    if (leafP) return leafP;
    leafP = new Promise((ok, mal) => {
      if (!document.querySelector('link[href="' + LEAFLET_CSS + '"]')) {
        const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = LEAFLET_CSS; document.head.appendChild(c);
      }
      const s = document.createElement('script'); s.src = LEAFLET_JS; s.onload = ok;
      s.onerror = () => { leafP = null; mal(new Error('Leaflet')); };
      document.head.appendChild(s);
    });
    return leafP;
  }

  /* =====================  VENTANA DE PAGO  ===================== */
  const ovPago = el('div', 'shm-ov');
  ovPago.setAttribute('role', 'dialog'); ovPago.setAttribute('aria-modal', 'true'); ovPago.setAttribute('aria-label', 'Pagar');
  ovPago.innerHTML = '<div class="shm-box">' +
    '<button type="button" class="shm-x" aria-label="Cerrar">✕</button>' +
    '<h2 class="shm-h">Pagar tu pedido</h2>' +
    '<div class="shm-res"></div>' +
    '<p class="shm-sub">Elige tu método de pago</p>' +
    '<div class="shm-metodos"></div>' +
    '<div class="shm-form"></div>' +
    '<button type="button" class="shm-btn shm-pagar" disabled>Elige un método de pago</button>' +
    '<p class="shm-nota">Simulación: los datos son inventados y no se cobra nada.</p>' +
    '<div class="shm-proc"></div></div>';
  document.body.appendChild(ovPago);
  const $p = s => ovPago.querySelector(s);

  const grupos4 = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const vence = v => { v = v.replace(/\D/g, '').slice(0, 4); return v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; };
  const cel = v => { v = v.replace(/\D/g, '').slice(0, 10); return v.replace(/^(\d{3})(\d{0,3})(\d{0,4}).*/, (m, a, b, c) => [a, b, c].filter(Boolean).join(' ')); };

  /* Datos inventados de cada método */
  const METODOS = [
    { id: 'debito',      ico: '💳', nombre: 'Tarjeta débito',  tipo: 'tarjeta', numero: '4539 1488 0343 6467', titular: 'Valentina Gómez Ruiz', vence: '09/29', cvv: '123' },
    { id: 'credito',     ico: '💳', nombre: 'Tarjeta crédito', tipo: 'tarjeta', numero: '5425 2334 3010 9903', titular: 'Valentina Gómez Ruiz', vence: '03/28', cvv: '482', cuotas: true },
    { id: 'nequi',       ico: '💜', nombre: 'Nequi',           tipo: 'billetera', logo: 'nequi.png', corto: 'Nequi', etq: 'Celular Nequi', valor: '300 123 4567', fmt: cel, titular: 'Valentina Gómez R.', extra: 'Saldo disponible: $480.000' },
    { id: 'bancolombia', ico: '🏦', nombre: 'Bancolombia',     tipo: 'billetera', logo: 'bancolombia.png', corto: 'cuenta Bancolombia', etq: 'Cuenta de ahorros', valor: '0123 4567 4821', fmt: grupos4, titular: 'Valentina Gómez Ruiz', extra: 'Cuenta de ahorros · Saldo: $1.250.000' },
    { id: 'daviplata',   ico: '❤️', nombre: 'Daviplata',       tipo: 'billetera', logo: 'daviplata.png', corto: 'Daviplata', etq: 'Celular Daviplata', valor: '311 987 6543', fmt: cel, titular: 'Valentina Gómez R.', extra: 'Saldo disponible: $215.000' },
    { id: 'pse',         ico: '🏧', nombre: 'PSE',             tipo: 'pse', logo: 'pse.png' }
  ];
  let metodoSel = null, vinculados = {}, camposPago = {}, procesando = false, totalPago = 0;

  function campo(etq, valor, o) {
    o = o || {};
    const l = el('label', 'shm-campo' + (o.corto ? ' corto' : ''));
    l.appendChild(el('span', '', etq));
    const i = el('input'); i.type = 'text'; i.value = valor || ''; i.autocomplete = 'off';
    if (o.mode) i.inputMode = o.mode;
    if (o.max) i.maxLength = o.max;
    i.addEventListener('input', () => { if (o.fmt) i.value = o.fmt(i.value); actualizarPago(); });
    l.appendChild(i);
    return { l, i };
  }
  function selector(etq, opciones) {
    const l = el('label', 'shm-campo');
    l.appendChild(el('span', '', etq));
    const s = el('select');
    opciones.forEach(t => { const o = el('option', '', t); o.value = t; s.appendChild(o); });
    s.addEventListener('change', actualizarPago);
    l.appendChild(s);
    return { l, i: s };
  }
  const enmascarar = (m, v) => {
    const d = v.replace(/\D/g, '');
    return m.id === 'bancolombia' ? '•••• •••• ' + d.slice(-4) : d.slice(0, 3) + ' ••• ' + d.slice(-4);
  };

  function pintarForm() {
    const m = metodoSel, f = $p('.shm-form');
    f.textContent = ''; camposPago = {};
    if (!m) return;
    if (m.tipo === 'tarjeta') {
      const g = el('div', 'shm-grid');
      camposPago.titular = campo('Nombre del titular', m.titular);
      camposPago.numero = campo('Número de tarjeta', m.numero, { mode: 'numeric', fmt: grupos4, max: 19 });
      camposPago.vence = campo('Vence (MM/AA)', m.vence, { mode: 'numeric', fmt: vence, max: 5, corto: true });
      camposPago.cvv = campo('CVV', m.cvv, { mode: 'numeric', max: 4, corto: true });
      g.append(camposPago.titular.l, camposPago.numero.l, camposPago.vence.l, camposPago.cvv.l);
      if (m.cuotas) { camposPago.cuotas = selector('Cuotas', ['1 cuota', '3 cuotas', '6 cuotas', '12 cuotas']); g.append(camposPago.cuotas.l); }
      f.appendChild(g);
    } else if (m.tipo === 'billetera') {
      const g = el('div', 'shm-grid');
      camposPago.num = campo(m.etq, m.valor, { mode: 'numeric', fmt: m.fmt, max: 14 });
      g.appendChild(camposPago.num.l); f.appendChild(g);
      const btn = el('button', 'shm-btn sec', 'Vincular mi ' + m.corto); btn.type = 'button';
      const ok = el('div', 'shm-vinc');
      const pintarOk = () => {
        ok.textContent = '';
        const t = el('b', '', '✓ ' + m.nombre + ' vinculado');
        if (m.logo) { const im = new Image(); im.src = m.logo; im.alt = ''; im.style.cssText = 'height:22px;width:22px;object-fit:contain;vertical-align:middle;margin-right:6px'; im.onerror = () => im.remove(); t.prepend(im); }
        ok.appendChild(t);
        ok.append(el('span', '', m.titular), document.createElement('br'),
                  el('span', '', enmascarar(m, camposPago.num.i.value)), document.createElement('br'),
                  el('span', '', m.extra));
      };
      const mostrar = v => { btn.hidden = v; ok.hidden = !v; if (v) pintarOk(); };
      mostrar(!!vinculados[m.id]);
      btn.onclick = async () => {
        btn.disabled = true; btn.textContent = 'Vinculando…';
        await pausa(1500);
        vinculados[m.id] = true; sonar('sumar'); mostrar(true); btn.disabled = false; btn.textContent = 'Vincular mi ' + m.corto;
        actualizarPago();
      };
      camposPago.num.i.addEventListener('input', () => { if (vinculados[m.id]) { vinculados[m.id] = false; mostrar(false); actualizarPago(); } });
      f.append(btn, ok);
    } else {
      const g = el('div', 'shm-grid');
      camposPago.banco = selector('Banco', ['Bancolombia', 'Davivienda', 'BBVA', 'Banco de Bogotá', 'Banco Popular']);
      camposPago.persona = selector('Tipo de persona', ['Persona natural', 'Persona jurídica']);
      camposPago.doc = campo('Documento (CC)', '1.082.345.678', { mode: 'numeric', max: 14 });
      g.append(camposPago.banco.l, camposPago.persona.l, camposPago.doc.l);
      f.appendChild(g);
    }
  }
  function valido() {
    const m = metodoSel, c = camposPago;
    if (!m) return false;
    if (m.tipo === 'tarjeta') {
      return c.titular.i.value.trim().length > 2 && c.numero.i.value.replace(/\D/g, '').length >= 15 &&
             /^\d\d\/\d\d$/.test(c.vence.i.value) && /^\d{3,4}$/.test(c.cvv.i.value);
    }
    if (m.tipo === 'billetera') return !!vinculados[m.id];
    return c.doc.i.value.replace(/\D/g, '').length >= 6;
  }
  function actualizarPago() {
    const b = $p('.shm-pagar');
    b.disabled = !valido();
    b.textContent = !metodoSel ? 'Elige un método de pago'
      : (metodoSel.tipo === 'billetera' && !vinculados[metodoSel.id]) ? 'Vincula tu cuenta para pagar'
      : 'Pagar ' + fmt(totalPago);
  }
  function pintarMetodos() {
    const box = $p('.shm-metodos'); box.textContent = '';
    METODOS.forEach(m => {
      const b = el('button', 'shm-met'); b.type = 'button';
      const ic = el('span', '', m.ico);
      if (m.logo) {                       // logo del método; si el archivo no está, se queda el emoji
        const im = new Image(); im.src = m.logo; im.alt = m.nombre; im.className = 'shm-logo';
        im.onerror = () => im.replaceWith(ic);
        b.append(im);
      } else b.append(ic);
      b.append(document.createTextNode(m.nombre));
      b.onclick = () => {
        if (procesando) return;
        metodoSel = m; sonar('sumar');
        box.querySelectorAll('.shm-met').forEach(x => x.classList.toggle('on', x === b));
        pintarForm(); actualizarPago();
      };
      box.appendChild(b);
    });
  }
  function pintarResumen() {
    const d = leer(), dom = leerDom(), box = $p('.shm-res');
    box.textContent = '';
    let sub = 0;
    d.productos.forEach(p => {
      sub += p.precio * p.cantidad;
      const r = el('div', 'shm-fila'); r.append(el('span', '', p.cantidad + ' × ' + p.nombre), el('b', '', fmt(p.precio * p.cantidad)));
      box.appendChild(r);
    });
    if (dom) {
      const r = el('div', 'shm-fila');
      r.append(el('span', '', '🛵 Domicilio (' + dom.km.toLocaleString('es-CO') + ' km)'), el('b', '', fmt(dom.precio)));
      box.appendChild(r);
    }
    totalPago = sub + (dom ? dom.precio : 0);
    const t = el('div', 'shm-fila shm-total'); t.append(el('span', '', 'Total a pagar'), el('span', '', fmt(totalPago)));
    box.appendChild(t);
  }
  function abrirPago() {
    if (!leer().productos.length) return;
    cerrar(); cerrarAlc();
    metodoSel = null; vinculados = {}; camposPago = {}; procesando = false;
    $p('.shm-proc').className = 'shm-proc';
    pintarResumen(); pintarMetodos(); pintarForm(); actualizarPago();
    ovPago.classList.add('open'); bloquear(); sonar('abrir');
  }
  function cerrarPago() { ovPago.classList.remove('open'); bloquear(); }

  $p('.shm-x').onclick = () => { if (!procesando) { cerrarPago(); sonar('cerrar'); } };
  ovPago.addEventListener('click', e => { if (e.target === ovPago && !procesando) cerrarPago(); });
  $p('.shm-pagar').onclick = async () => {
    if (procesando || !valido()) return;
    procesando = true;
    const pr = $p('.shm-proc'); pr.className = 'shm-proc on';
    pr.innerHTML = '<div class="shm-spin"></div><p><b>Procesando tu pago con ' + metodoSel.nombre + '…</b></p>';
    await pausa(1800);
    const ref = 'SH-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    pr.innerHTML = '<div class="shm-ok">✓</div><p><b>¡Pago aprobado!</b></p><p class="shm-ref">Referencia ' + ref + '</p>';
    sonar('pagar');
    await pausa(1300);
    const metodo = metodoSel.nombre;
    procesando = false; cerrarPago();
    iniciarPedido(metodo, ref);
  };

  function iniciarPedido(metodo, ref) {
    const compra = leer().productos;
    if (!compra.length) return;
    const sub = compra.reduce((s, p) => s + p.precio * p.cantidad, 0);
    const dom = leerDom();
    PEDS = PEDS.filter(p => !p.cerrado);                 // limpia los ya entregados y vistos
    const num = PEDS.reduce((m, p) => Math.max(m, p.num || 0), 0) + 1;
    const nuevo = { id: Date.now(), num: num, inicio: Date.now(), productos: compra, subtotal: sub, domicilio: dom, total: sub + (dom ? dom.precio : 0),
                    metodo: metodo, ref: ref, notificado: false, cerrado: false,
                    sinCocina: compra.every(p => p.sinCocina) };   // solo si TODO el pedido es de la tienda (sin cocina)
    combinarConActivo(nuevo);                            // ¿hay un repartidor cerca del local que pueda llevarse también este pedido?
    guardarPedido(nuevo);
    aportar(compra);                 // el 10% de cada producto entra a la alcancía
    guardar({ productos: [] });      // lo comprado sale del carrito
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
    actualizarChips();
    abrirSeguimiento(nuevo.id);
  }
  const mismoDestino = (a, b) => (!a.domicilio && !b.domicilio) ||
    (a.domicilio && b.domicilio && a.domicilio.lat === b.domicilio.lat && a.domicilio.lng === b.domicilio.lng);
  function combinarConActivo(nuevo) {
    for (const a of PEDS) {
      if (a.cerrado || a.desvio || a.salida || !mismoDestino(a, nuevo)) continue;
      const ea = calc(a);
      if (ea.etapa !== 3 || ea.pr > COMBINAR_HASTA) continue;   // solo si va en camino y todavía está cerca del local
      const tNuevoListo = (nuevo.inicio - a.inicio) / 1000 + tiempos(nuevo).rec;   // cuándo estaría listo el pedido nuevo (en segundos del viejo)
      const tBack = ea.el + ea.pr * DUR.ruta;                                         // cuándo vuelve al local
      const tSale2 = Math.max(tBack, tNuevoListo) + DUR.recoge2;                      // cuándo sale otra vez con los dos
      a.desvio = { t0: ea.el, pr0: ea.pr, tBack: tBack, tSale2: tSale2, conNum: nuevo.num };
      nuevo.salida = a.inicio + tSale2 * 1000;
      nuevo.juntoNum = a.num;
      return;
    }
  }

  /* =====================  VENTANA DE SEGUIMIENTO  ===================== */
  const PASOS = [['✅', 'Aprobación'], ['👩‍🍳', 'En cocina'], ['📦', 'Repartidor recoge'], ['🛵', 'Repartidor en camino'], ['🏠', 'Repartidor llegando']];
  const ESTADOS = [
    'Esperando la aprobación de tu pedido…',
    'Tu pedido está en cocina 🍰',
    'El repartidor está recogiendo tu pedido 📦',
    'El repartidor va en camino 🛵',
    'El repartidor está llegando a tu casa 🏠',
    '¡Tu pedido ha llegado! 🎉'
  ];
  const ovSeg = el('div', 'shm-ov');
  ovSeg.setAttribute('role', 'dialog'); ovSeg.setAttribute('aria-modal', 'true'); ovSeg.setAttribute('aria-label', 'Seguimiento de tu pedido');
  ovSeg.innerHTML = '<div class="shm-box ancha">' +
    '<button type="button" class="shm-x" aria-label="Cerrar">✕</button>' +
    '<h2 class="shm-h">Seguimiento de tu pedido</h2>' +
    '<p class="shm-aviso" hidden></p>' +
    '<div class="shm-eta"><div><small class="shm-etatit">Llegada aproximada</small><span class="hora">--:--</span></div><div class="shm-min">-- min</div></div>' +
    '<p class="shm-estado"></p>' +
    '<div class="shm-linea"><div class="shm-track"><div class="shm-fill"></div></div><ol class="shm-pasos"></ol></div>' +
    '<div id="shmMapa"></div>' +
    '<div class="shm-leyenda"><span>🍰 Sweet Help</span><span class="shm-dist">—</span><span class="shm-casa">🏠 Tu casa</span></div>' +
    '<details class="shm-det"><summary>Ver resumen del pedido</summary><div class="shm-res" style="margin-top:8px"></div></details>' +
    '<p class="shm-cierra">Puedes cerrar esta ventana: tu pedido sigue en camino y te avisamos cuando llegue.</p></div>';
  document.body.appendChild(ovSeg);
  const $s = s => ovSeg.querySelector(s);
  const pasosEls = PASOS.map(p => {
    const li = el('li', 'shm-paso');
    li.append(el('span', 'shm-dot', p[0]), document.createTextNode(p[1]));
    $s('.shm-pasos').appendChild(li);
    return li;
  });

  /* Estado del pedido según el tiempo transcurrido (se guarda la hora de inicio, así sobrevive a recargas) */
  function calc(p) {
    const el_ = (Date.now() - p.inicio) / 1000;
    let etapa, sp, pr = 0, fase = '', back = false;
    const t = tiempos(p);
    if (el_ < t.aprob)      { etapa = 0; sp = el_ / t.aprob; }
    else if (el_ < t.coc)   { etapa = 1; sp = (el_ - t.aprob) / t.cocina; }
    else if (el_ < t.rec)   { etapa = 2; sp = (el_ - t.coc) / ((t.rec - t.coc) || 1); }
    else if (el_ < t.total) {
      const d = p.desvio, sp0 = d ? d.pr0 / LLEGANDO_DESDE : 0;
      if (d && el_ >= d.t0 && el_ < d.tBack) {            // el repartidor se devuelve al local por el pedido extra
        fase = 'vuelta'; back = true; etapa = 3; sp = sp0;
        pr = d.pr0 * (1 - (el_ - d.t0) / ((d.tBack - d.t0) || 1));
      } else if (d && el_ >= d.tBack && el_ < d.tSale2) { // en el local, recogiendo el pedido extra
        fase = 'recoge2'; etapa = 3; sp = sp0; pr = 0;
      } else {
        pr = (el_ - (d && el_ >= d.tSale2 ? d.tSale2 : t.rec)) / DUR.ruta;
        if (pr < LLEGANDO_DESDE) { etapa = 3; sp = Math.max(sp0, pr / LLEGANDO_DESDE); }
        else { etapa = 4; sp = (pr - LLEGANDO_DESDE) / (1 - LLEGANDO_DESDE); }
      }
    } else { etapa = 5; sp = 1; pr = 1; }
    return { el: el_, etapa: etapa, sp: sp, pr: pr, fase: fase, back: back };
  }

  /* ----- mapa ----- */
  let mapa = null, mapaPedido = null, mTienda = null, mDest = null, mMoto = null, lBase = null, lHecha = null;
  let ruta = null, cum = null, kmRuta = 0, rafId = 0, ultUI = 0, ultLinea = 0, ultIzq = null;
  const hav = (a, b) => {
    const R = 6371, rad = x => x * Math.PI / 180, dLa = rad(b[0] - a[0]), dLo = rad(b[1] - a[1]);
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  function prepararRuta(pts, km) {
    ruta = pts; cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + hav(pts[i - 1], pts[i]));
    kmRuta = km || cum[cum.length - 1];
  }
  async function obtenerRuta(ped) {
    if (ped.ruta && ped.ruta.length > 1) return { pts: ped.ruta, km: ped.kmRuta };
    const d = ped.domicilio ? { lat: ped.domicilio.lat, lng: ped.domicilio.lng } : DESTINO_EJEMPLO;
    const ctl = new AbortController(), corte = setTimeout(() => ctl.abort(), 7000);
    try {
      const r = await fetch('https://router.project-osrm.org/route/v1/driving/' + TIENDA.lng + ',' + TIENDA.lat + ';' + d.lng + ',' + d.lat + '?overview=full&geometries=geojson', { signal: ctl.signal });
      const j = await r.json();
      const rt = j && j.routes && j.routes[0];
      if (rt) return { pts: rt.geometry.coordinates.map(c => [+c[1].toFixed(5), +c[0].toFixed(5)]), km: rt.distance / 1000 };
    } catch (e) {} finally { clearTimeout(corte); }
    const pts = [];                                   // sin ruta por calles: línea recta con puntos intermedios
    for (let i = 0; i <= 30; i++) pts.push([TIENDA.lat + (d.lat - TIENDA.lat) * i / 30, TIENDA.lng + (d.lng - TIENDA.lng) * i / 30]);
    return { pts: pts, km: hav([TIENDA.lat, TIENDA.lng], [d.lat, d.lng]) * 1.35 };
  }
  function pin(emoji, cls) { return L.divIcon({ className: 'shm-pin ' + (cls || ''), html: '<span>' + emoji + '</span>', iconSize: [38, 38], iconAnchor: [19, 19] }); }
  function iconoMoto() {
    return L.divIcon({ className: 'shm-moto',
      html: '<img src="' + GIF_MOTO + '" alt="Repartidor" onerror="this.outerHTML=\'<span class=emo>🛵</span>\'">',
      iconSize: [TAM_MOTO, TAM_MOTO], iconAnchor: [TAM_MOTO / 2, TAM_MOTO / 2] });   // centrada en el punto: queda sobre la punta de la línea rosa
  }
  function iniciarMapa(ped) {
    if (!mapa) {
      mapa = L.map('shmMapa', { center: [TIENDA.lat, TIENDA.lng], zoom: 14 });
      L.tileLayer(TILES, { maxZoom: 19, attribution: ATRIB }).addTo(mapa);
    }
    setTimeout(() => mapa.invalidateSize(), 80);
    if (mapaPedido === ped.id) return;
    mapaPedido = ped.id; ruta = null; cum = null;
    [mTienda, mDest, mMoto, lBase, lHecha].forEach(x => { if (x) x.remove(); });
    const d = ped.domicilio ? [ped.domicilio.lat, ped.domicilio.lng] : [DESTINO_EJEMPLO.lat, DESTINO_EJEMPLO.lng];
    $s('.shm-casa').textContent = ped.domicilio ? '🏠 Tu casa' : '🏠 Tu casa (ejemplo: elige tu domicilio en Productos)';
    mTienda = L.marker([TIENDA.lat, TIENDA.lng], { icon: pin('🍰'), interactive: false, keyboard: false }).addTo(mapa);
    mDest = L.marker(d, { icon: pin('🏠', 'casa'), interactive: false, keyboard: false }).addTo(mapa);
    mMoto = L.marker([TIENDA.lat, TIENDA.lng], { icon: iconoMoto(), interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(mapa);
    mapa.fitBounds([[TIENDA.lat, TIENDA.lng], d], { padding: [50, 50], maxZoom: 16 });
    obtenerRuta(ped).then(r => {
      if (mapaPedido !== ped.id) return;
      prepararRuta(r.pts, r.km);
      const f = pedidoPorId(ped.id);
      if (f && !f.ruta) { f.ruta = r.pts; f.kmRuta = r.km; guardarPedido(f); }
      lBase = L.polyline(ruta, { color: '#e3b5bd', weight: 6, opacity: .9, dashArray: '2 10', lineCap: 'round', interactive: false }).addTo(mapa);
      lHecha = L.polyline([ruta[0]], { color: '#e0527a', weight: 6, opacity: .95, lineCap: 'round', interactive: false }).addTo(mapa);
      mapa.fitBounds(lBase.getBounds(), { padding: [50, 50], maxZoom: 16 });
    });
  }
  function posEn(p) {                                  // posición sobre la ruta para p entre 0 y 1 (por distancia)
    const total = cum[cum.length - 1], d = Math.min(1, Math.max(0, p)) * total;
    let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
    const seg = (cum[i] - cum[i - 1]) || 1, t = Math.min(1, Math.max(0, (d - cum[i - 1]) / seg));
    const a = ruta[i - 1], b = ruta[i];
    return { lat: a[0] + (b[0] - a[0]) * t, lng: a[1] + (b[1] - a[1]) * t, i: i, izq: b[1] < a[1] - 1e-7 ? true : (b[1] > a[1] + 1e-7 ? false : null) };
  }

  function pintarResumenSeg(ped) {
    $s('.shm-h').textContent = 'Pedido ' + (ped.num || 1) + (ped.ref ? ' · ' + ped.ref : '');
    const av = $s('.shm-aviso');
    av.textContent = ped.juntoNum ? '🤝 Este pedido viaja junto al pedido ' + ped.juntoNum + ': el repartidor volvió al local por él.'
                   : ped.desvio ? '🔄 Tu repartidor regresó al local por el pedido ' + ped.desvio.conNum + ' y saldrá con los dos.' : '';
    av.hidden = !av.textContent;
    const box = $s('.shm-res'); box.textContent = '';
    ped.productos.forEach(p => {
      const r = el('div', 'shm-fila'); r.append(el('span', '', p.cantidad + ' × ' + p.nombre), el('b', '', fmt(p.precio * p.cantidad)));
      box.appendChild(r);
    });
    if (ped.domicilio) { const r = el('div', 'shm-fila'); r.append(el('span', '', '🛵 Domicilio'), el('b', '', fmt(ped.domicilio.precio))); box.appendChild(r); }
    const t = el('div', 'shm-fila shm-total'); t.append(el('span', '', 'Total · ' + (ped.metodo || '')), el('span', '', fmt(ped.total))); box.appendChild(t);
  }
  const hh = d => d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });

  function actualizarSeg(ahora) {
    const PED = pedVisto();
    if (!PED) return;
    const e = calc(PED);
    // el repartidor: en el local hasta que sale, luego avanza por la ruta en tiempo real
    if (mMoto && ruta) {
      const q = posEn(e.pr);
      mMoto.setLatLng([q.lat, q.lng]);
      const izq = q.izq === null ? null : (e.back ? !q.izq : q.izq);   // de regreso al local mira para el otro lado
      if (izq !== null && izq !== ultIzq) {
        ultIzq = izq;
        const img = mMoto.getElement() && mMoto.getElement().querySelector('img');
        if (img) img.style.transform = (GIF_MIRA === 'derecha' ? izq : !izq) ? 'scaleX(-1)' : '';
      }
      if (lHecha && ahora - ultLinea > 300) { ultLinea = ahora; lHecha.setLatLngs(ruta.slice(0, q.i).concat([[q.lat, q.lng]])); }
    }
    if (ahora - ultUI < 250) return;
    ultUI = ahora;
    pasosEls.forEach((li, i) => { li.classList.toggle('hecho', e.etapa > i); li.classList.toggle('activo', e.etapa === i); });
    // Sin cocina: el paso "En cocina" se oculta y la línea se reparte entre 4 pasos en vez de 5
    const sin = !!PED.sinCocina;
    pasosEls[1].hidden = sin;
    $s('.shm-track').style.left = $s('.shm-track').style.right = sin ? '12.5%' : '10%';
    const nInt = sin ? 3 : 4, idx = sin && e.etapa >= 2 ? e.etapa - 1 : e.etapa;
    $s('.shm-fill').style.width = (e.etapa >= 5 ? 1 : Math.min(1, (idx + e.sp) / nInt)) * 100 + '%';
    $s('.shm-estado').textContent = e.fase === 'vuelta' ? 'Tu repartidor regresa al local por otro pedido 🔄'
                                  : e.fase === 'recoge2' ? 'El repartidor está recogiendo el otro pedido 📦' : ESTADOS[e.etapa];
    if (e.etapa < 5) {
      const tt = tiempos(PED).total;
      const restMin = Math.max(1, Math.ceil((tt - e.el) / tt * MIN_SIM));
      $s('.shm-min').textContent = restMin + ' min';
      $s('.hora').textContent = hh(new Date(Date.now() + restMin * 60000));
      $s('.shm-etatit').textContent = 'Llegada aproximada';
      $s('.shm-dist').textContent = e.fase ? 'Recogiendo otro pedido…' : e.etapa >= 3 && kmRuta ? (Math.round((1 - e.pr) * kmRuta * 10) / 10).toLocaleString('es-CO') + ' km restantes' : 'Preparando…';
    } else {
      $s('.shm-min').textContent = '¡Llegó!';
      $s('.hora').textContent = hh(new Date(PED.inicio + tiempos(PED).total * 1000));
      $s('.shm-etatit').textContent = 'Entregado a las';
      $s('.shm-dist').textContent = '0 km';
    }
  }
  function bucle() {
    cancelAnimationFrame(rafId);
    const paso = t => { if (!ovSeg.classList.contains('open')) return; actualizarSeg(t); rafId = requestAnimationFrame(paso); };
    rafId = requestAnimationFrame(paso);
  }
  async function abrirSeguimiento(id) {
    const ped = typeof id === 'number' ? pedidoPorId(id) : (pedVisto() || PEDS.filter(p => !p.cerrado)[0] || null);
    if (!ped) return;
    VER = ped.id;
    cerrar(); cerrarAlc();
    ovSeg.classList.add('open'); bloquear();
    pintarResumenSeg(ped);
    ultUI = 0; ultIzq = null;
    bucle();
    try { await cargarLeaflet(); iniciarMapa(ped); }
    catch (e) { $s('#shmMapa').textContent = 'No pudimos cargar el mapa. Revisa tu conexión.'; }
  }
  function cerrarSeguimiento() { ovSeg.classList.remove('open'); bloquear(); cancelAnimationFrame(rafId); }
  $s('.shm-x').onclick = () => { cerrarSeguimiento(); sonar('cerrar'); };
  ovSeg.addEventListener('click', e => { if (e.target === ovSeg) cerrarSeguimiento(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (ovSeg.classList.contains('open')) cerrarSeguimiento();
    else if (ovPago.classList.contains('open') && !procesando) cerrarPago();
  });

  /* =====================  AVISO DE LLEGADA + BOTONES "SEGUIMIENTO · PEDIDO N"  ===================== */
  const ovLlego = el('div', 'shm-ov shm-llego');
  ovLlego.setAttribute('role', 'alertdialog'); ovLlego.setAttribute('aria-modal', 'true');
  ovLlego.innerHTML = '<div class="shm-box"><div class="big">🎉</div><h3>¡Tu pedido ha llegado!</h3>' +
    '<p>Que lo disfrutes. Gracias por ayudar con cada compra 💗</p><button type="button" class="shm-btn">¡Gracias!</button></div>';
  document.body.appendChild(ovLlego);
  let llegando = null;                                   // pedido cuyo aviso de llegada se está mostrando
  const colaLlegadas = [];                               // si llegan varios a la vez, los avisos salen uno por uno
  function mostrarLlegada() {
    if (llegando || !colaLlegadas.length) return;
    llegando = colaLlegadas.shift();
    const p = pedidoPorId(llegando);
    ovLlego.querySelector('h3').textContent = p ? '¡El pedido ' + (p.num || 1) + ' ha llegado!' : '¡Tu pedido ha llegado!';
    ovLlego.classList.add('open'); bloquear();
    sonar('llegada');
    document.title = '¡Tu pedido ha llegado! · Sweet Help';
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Sweet Help', { body: '¡' + (p ? 'El pedido ' + (p.num || 1) : 'Tu pedido') + ' ha llegado! 🎉' }); } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  }
  ovLlego.querySelector('.shm-btn').onclick = () => {
    ovLlego.classList.remove('open'); bloquear();
    const p = pedidoPorId(llegando);
    if (p) { p.cerrado = true; guardarPedido(p); }
    llegando = null;
    actualizarChips();
    mostrarLlegada();
  };
  function notificarLlegada(p) {
    if (VER === p.id) cerrarSeguimiento();
    colaLlegadas.push(p.id);
    mostrarLlegada();
  }
  const cont = el('div', 'shm-chips'); document.body.appendChild(cont);
  const chipsEls = {};                                   // id del pedido -> botón
  const CORTO = ['Esperando aprobación', 'En cocina', 'Recogiendo', 'En camino', 'Llegando', '¡Llegó!'];
  function actualizarChips() {
    const activos = PEDS.filter(p => !p.cerrado).sort((a, b) => (a.num || 0) - (b.num || 0));
    Object.keys(chipsEls).forEach(id => { if (!activos.some(p => String(p.id) === id)) { chipsEls[id].remove(); delete chipsEls[id]; } });
    activos.forEach(p => {
      let b = chipsEls[p.id];
      if (!b) { b = chipsEls[p.id] = el('button', 'shm-chip'); b.type = 'button'; b.onclick = () => abrirSeguimiento(p.id); }
      const e = calc(p);
      const txt = e.fase === 'vuelta' ? 'Volviendo al local' : e.fase === 'recoge2' ? 'Recogiendo otro pedido' : CORTO[e.etapa];
      const t1 = '🛵 Seguimiento · Pedido ' + (p.num || 1), t2 = 'Ref. ' + (p.ref || '') + ' · ' + txt;
      if (b.dataset.t !== t1 + t2) { b.dataset.t = t1 + t2; b.textContent = ''; b.append(el('b', '', t1), el('small', '', t2)); }
      cont.appendChild(b);                               // mantiene el orden Pedido 1, Pedido 2…
    });
    const barra = document.querySelector('.buscar-bajo');   // en la tienda, los botones se suben para no tapar la barra de búsqueda
    cont.style.bottom = (barra ? barra.offsetHeight + 12 : 14) + 'px';
  }
  actualizarChips();
  // vigila todos los pedidos aunque la ventana de seguimiento esté cerrada
  setInterval(() => {
    PEDS.forEach(p => { if (!p.cerrado && !p.notificado && calc(p).etapa === 5) { p.notificado = true; guardarPedido(p); notificarLlegada(p); } });
    actualizarChips();
  }, 500);
  window.addEventListener('storage', e => { if (e.key === KEY_PEDIDOS) { PEDS = leerPedidos(); actualizarChips(); } });

  document.addEventListener('click', e => {
    const add = e.target.closest('[data-agregar]');
    if (add) {
      // Solo agrega (y actualiza el contador); el carrito se abre únicamente al tocar el icono
      agregar({ id: add.dataset.id, nombre: add.dataset.nombre, precio: add.dataset.precio, img: add.dataset.img,
                sinCocina: add.dataset.sinCocina === 'true' });   // data-sin-cocina="true": producto listo, no pasa por cocina
      sonar('agregar');
      return;
    }
    if (e.target.closest('#shCartBtn')) { panel.classList.contains('open') ? cerrar() : abrir(); return; }
    if (e.target.closest('#shAlcBtn')) { panelAlc.classList.contains('open') ? cerrarAlc() : abrirAlc(); return; }
    // OJO: al tocar − / + / vaciar, render() reconstruye el panel y el botón tocado ya no está en la página
    // cuando este código corre, así que closest('.shc-panel') fallaba y cerraba el carrito.
    // composedPath() guarda el recorrido original del clic y sí incluye al panel.
    const ruta = e.composedPath();
    if (ruta.includes(panel) || ruta.includes(panelAlc)) return;
    cerrar(); cerrarAlc();
  });

  // Sincroniza el carrito entre pestañas
  window.addEventListener('storage', e => { if (e.key === KEY) render(); if (e.key === KEY_ALC) renderAlc(); });

  window.SweetHelpCarrito = { agregar, cambiar, vaciar, obtener: leer, aportar, alcancia: leerAlc, pagar: abrirPago, seguimiento: abrirSeguimiento };
  render();
  renderAlc();
})();
