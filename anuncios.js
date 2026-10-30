/* Anuncios (cinta que se desliza suave, de izquierda a derecha, sin parar) + carta escondida aleatoria + modo debug.
   La lista de anuncios se edita en index5.html (window.ANUNCIOS). Aquí no hace falta tocar nada.
   Modo debug: ↑ ↑ ↓ ↓ ← → ← → A N Enter (lo activa index5.html). Repetir el código lo apaga. */
(function () {
    const CFG = window.ANUNCIOS || {};
    const lista = (CFG.anuncios || []).filter(a => a && a.imagen);
    const carta = CFG.carta || null;
    const TAM = CFG.tamano || { ancho: 1895, alto: 26 };
    let VEL = CFG.velocidad || 60;                       // píxeles por segundo
    if (VEL > 400) VEL = 60;                             // valor viejo (milisegundos): se ignora
    const FORZAR = /[?&]carta\b/.test(location.search);  // para probar: index5.html?carta
    const DEBUG_KEY = 'sh_debug_anuncio';

    // ---- ¿Aparece la carta en esta visita? ----
    const sale = carta && (FORZAR || Math.random() < (carta.probabilidad != null ? carta.probabilidad : 0.3));
    const normales = lista.map(a => ({ titulo: a.titulo || '', url: a.url || '#', imagen: a.imagen, carta: false }));
    if (sale) {
        const c = { titulo: carta.titulo || 'Carta escondida', imagen: carta.imagen, carta: true };
        normales.splice(Math.floor(Math.random() * (normales.length + 1)), 0, c);
    }

    // ---- Modo debug: anuncio elegido a mano (se recuerda hasta repetir el código) ----
    let debug = null;
    try { debug = JSON.parse(localStorage.getItem(DEBUG_KEY) || 'null'); } catch (e) {}
    function deDebug(d) {
        if (!d) return null;
        if (d.tipo === 'carta' && carta) return [{ titulo: carta.titulo || 'Carta escondida', imagen: carta.imagen, carta: true }];
        if (d.tipo === 'ad' && d.imagen) return [{ titulo: d.titulo || '', url: d.url || '#', imagen: d.imagen, carta: false }];
        return null;
    }
    let slides = deDebug(debug) || normales;
    if (!deDebug(debug)) debug = null;
    if (!slides.length) return;

    // ---- Estilos (colores de Sweet Help, sin blanco) ----
    const st = document.createElement('style');
    st.textContent = `
    #shAnuncios{position:relative;width:100%;margin:0;aspect-ratio:var(--an-ratio,1895/26);min-height:30px;overflow:hidden;background:#ff4646;z-index:5}
    #shAnuncios .sh-an-track{position:absolute;left:0;top:0;height:100%;display:flex;will-change:transform}
    #shAnuncios .sh-an-slide{flex:0 0 auto;height:100%;aspect-ratio:var(--an-ratio,1895/26);display:block;cursor:pointer;border:0;padding:0;background:none}
    #shAnuncios .sh-an-slide img{width:100%;height:100%;object-fit:cover;display:block;-webkit-user-drag:none;user-select:none}
    #shAnuncios .sh-an-x{position:absolute;top:50%;transform:translateY(-50%);right:8px;width:20px;height:20px;border-radius:50%;border:0;background:rgba(131,60,74,.85);color:#f8f3dd;font:700 14px/20px Arial,sans-serif;cursor:pointer;z-index:2;padding:0}
    #shAnModal,#shDbg{position:fixed;inset:0;z-index:2147483100;display:none;align-items:center;justify-content:center;background:rgba(60,25,32,.75);padding:16px}
    #shAnModal.on,#shDbg.on{display:flex}
    #shAnModal .sh-an-box,#shDbg .sh-an-box{background:#833c4a;color:#f8f3dd;border:4px solid #ff9195;border-radius:24px;padding:22px 24px;max-width:340px;width:100%;text-align:center;font-family:Arial,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.45);max-height:90vh;overflow:auto}
    #shAnModal h3,#shDbg h3{margin:0 0 12px;font-size:20px}
    #shAnModal .sh-an-carta{display:block;margin:0 auto 6px;max-height:210px;max-width:60%;border-radius:12px}
    #shAnModal .sh-an-estado{margin:0 0 10px;font:700 14px Arial,sans-serif;color:#ff9195}
    #shAnModal .sh-an-qr{display:inline-block;background:#f8f3dd;padding:12px;border-radius:14px;min-width:160px;min-height:160px}
    #shAnModal .sh-an-qr img,#shAnModal .sh-an-qr canvas{display:block}
    #shAnModal .sh-an-code{margin:14px 0 10px;padding:10px;border-radius:12px;background:#5a2833;font:700 18px monospace;word-break:break-all;user-select:all}
    #shAnModal button,#shDbg button{border:0;border-radius:999px;padding:10px 18px;font:800 14px Arial,sans-serif;cursor:pointer;margin:4px}
    #shAnModal .sh-an-copy,#shDbg .sh-dbg-ok{background:#ff9195;color:#5a2833}
    #shAnModal .sh-an-close,#shDbg .sh-dbg-no{background:#f8f3dd;color:#833c4a}
    #shDbg label{display:block;text-align:left;font:700 13px Arial,sans-serif;margin:10px 0 0}
    #shDbg input[type=text],#shDbg select{display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:8px 10px;border:0;border-radius:10px;background:#f8f3dd;color:#833c4a;font:14px Arial,sans-serif}
    #shDbg input[type=file]{display:block;margin-top:4px;font:12px Arial,sans-serif;color:#f8f3dd;max-width:100%}
    #shDbg .sh-dbg-custom{display:none}
    #shDbg .sh-dbg-custom.on{display:block}
    #shDbg .sh-dbg-estado{min-height:18px;margin:10px 0 0;font:700 13px Arial,sans-serif;color:#ff9195}
    #shDbg small{display:block;margin-top:8px;font:12px Arial,sans-serif;opacity:.85}
    #shDbgBadge{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:2147483050;display:none;padding:6px 14px;border-radius:999px;background:#833c4a;color:#f8f3dd;border:2px solid #ff9195;font:700 12px Arial,sans-serif;pointer-events:none;white-space:nowrap}
    #shDbgBadge.on{display:block}`;
    document.head.appendChild(st);

    // ---- Estructura ----
    const cont = document.createElement('div');
    cont.id = 'shAnuncios';
    cont.style.setProperty('--an-ratio', TAM.ancho + '/' + TAM.alto);
    const track = document.createElement('div');
    track.className = 'sh-an-track';
    cont.appendChild(track);

    function crear(s) {
        const el = document.createElement(s.carta ? 'button' : 'a');
        el.className = 'sh-an-slide';
        if (s.carta) { el.type = 'button'; el.addEventListener('click', abrirCarta); }
        else el.href = s.url || '#';
        if (s.titulo) el.title = s.titulo;
        const img = document.createElement('img');
        img.src = s.imagen; img.alt = s.titulo || ''; img.draggable = false;
        el.appendChild(img);
        return el;
    }

    const menuPerfil = document.querySelector('.menudesplegable2');
    let raf = 0;
    const x = document.createElement('button');
    x.className = 'sh-an-x'; x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Cerrar anuncio');
    x.onclick = () => { cancelAnimationFrame(raf); cont.remove(); if (menuPerfil) menuPerfil.style.top = '8px'; };
    cont.appendChild(x);
    document.body.insertBefore(cont, document.body.firstChild);

    // Se repiten los anuncios las veces necesarias para que nunca se vea un hueco
    function llenar() {
        const cw = cont.offsetWidth || window.innerWidth;
        const sw = cont.offsetHeight * (TAM.ancho / TAM.alto) || cw;   // ancho de un anuncio
        let n = 0;
        while (track.children.length === 0 || (track.children.length * sw < cw + 2 * sw)) {
            slides.forEach(s => track.appendChild(crear(s)));
            if (++n > 40) break;
        }
    }
    llenar();

    function ajustarMenu() { if (menuPerfil && cont.isConnected) menuPerfil.style.top = (cont.offsetHeight + 8) + 'px'; }
    ajustarMenu();
    window.addEventListener('resize', () => { ajustarMenu(); llenar(); });

    // ---- Movimiento suave: izquierda -> derecha, infinito ----
    let pos = 0, pausa = false, ultimo = performance.now();
    function paso(ahora) {
        const dt = Math.min((ahora - ultimo) / 1000, 0.05);
        ultimo = ahora;
        if (!pausa) {
            pos += VEL * dt;
            // cuando el anuncio de la izquierda ya entró entero, se pasa el último al inicio
            let guard = 0;
            while (pos >= 0 && guard++ < 20) {
                const ult = track.lastElementChild;
                track.insertBefore(ult, track.firstElementChild);
                pos -= ult.offsetWidth || 1;
            }
            track.style.transform = 'translate3d(' + pos + 'px,0,0)';
        }
        raf = requestAnimationFrame(paso);
    }
    function reiniciarPos() {
        pos = -(track.firstElementChild.offsetWidth || 0);
        track.style.transform = 'translate3d(' + pos + 'px,0,0)';
    }
    reiniciarPos();
    cont.addEventListener('mouseenter', () => { pausa = true; });
    cont.addEventListener('mouseleave', () => { if (!modalAbierto && !panelAbierto) pausa = false; });
    raf = requestAnimationFrame(paso);

    // Cambia la lista de anuncios que se ven (modo debug / normal)
    function reconstruir(nueva) {
        slides = nueva;
        track.innerHTML = '';
        llenar();
        reiniciarPos();
    }

    // ---- Desbloquear la carta en el álbum de ArSweetCards / SweetCardsBattle ----
    // Guarda en localStorage "arsweetcards_album" el índice = número de carta - 1
    function desbloquear(num) {
        try {
            const KEY = 'arsweetcards_album';
            if (localStorage.getItem('arsweetcards_orden') !== '2') {   // misma migración que usa el juego
                const VIEJO = [22,21,20,19,6,5,4,3,2,18,17,16,15,14,13,1,7,8,9,10,11,12];
                const o = JSON.parse(localStorage.getItem(KEY) || '[]');
                const n = [...new Set(o.map(i => VIEJO[i] - 1).filter(v => v >= 0))];
                localStorage.setItem(KEY, JSON.stringify(n));
                localStorage.setItem('arsweetcards_orden', '2');
            }
            const a = JSON.parse(localStorage.getItem(KEY) || '[]');
            const i = num - 1;
            if (a.includes(i)) return false;     // ya la tenía
            a.push(i);
            localStorage.setItem(KEY, JSON.stringify(a));
            return true;                          // carta nueva
        } catch (e) { return null; }
    }

    // ---- Carta: QR + código copiable ----
    let modal = null, qrListo = false, modalAbierto = false;
    function cargarQR(cb) {
        if (window.QRCode) return cb();
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        s.onload = () => cb(); s.onerror = () => cb(true);
        document.head.appendChild(s);
    }
    function abrirCarta(e) {
        if (e) e.preventDefault();
        const codigo = carta.codigo || '';
        const textoQR = carta.qr || codigo;
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'shAnModal';
            modal.innerHTML = '<div class="sh-an-box"><h3></h3><img class="sh-an-carta" alt=""><p class="sh-an-estado"></p><div class="sh-an-qr" id="shAnQr"></div><div class="sh-an-code"></div><button class="sh-an-copy" type="button">Copiar código</button><button class="sh-an-close" type="button">Cerrar</button></div>';
            modal.querySelector('h3').textContent = carta.nombre ? '¡Conseguiste a ' + carta.nombre + '!' : (carta.titulo || '¡Encontraste una carta!');
            const ci = modal.querySelector('.sh-an-carta');
            if (carta.imagenCarta) { ci.src = carta.imagenCarta; ci.alt = carta.nombre || ''; ci.onerror = () => ci.remove(); }
            else ci.remove();
            modal.querySelector('.sh-an-code').textContent = codigo;
            modal.addEventListener('click', ev => { if (ev.target === modal) cerrar(); });
            modal.querySelector('.sh-an-close').onclick = cerrar;
            modal.querySelector('.sh-an-copy').onclick = function () {
                const b = this;
                const ok = () => { b.textContent = '¡Copiado!'; setTimeout(() => { b.textContent = 'Copiar código'; }, 1500); };
                const viejo = () => {
                    const t = document.createElement('textarea');
                    t.value = codigo; document.body.appendChild(t); t.select();
                    try { document.execCommand('copy'); ok(); } catch (er) {}
                    t.remove();
                };
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(codigo).then(ok, viejo);
                else viejo();
            };
            document.body.appendChild(modal);
        }
        modal.classList.add('on');
        modalAbierto = true; pausa = true;
        const est = modal.querySelector('.sh-an-estado');
        if (carta.numero) {
            const r = desbloquear(carta.numero);
            est.textContent = r === true ? '¡Carta nueva en tu álbum!' : r === false ? 'Ya la tenías en tu álbum.' : 'No se pudo guardar en el álbum.';
        } else est.textContent = '';
        if (!qrListo) {
            cargarQR(err => {
                const q = document.getElementById('shAnQr');
                if (err || !window.QRCode) { q.textContent = 'No se pudo cargar el QR, usa el código.'; q.style.color = '#833c4a'; return; }
                q.textContent = '';
                new QRCode(q, { text: textoQR, width: 180, height: 180, colorDark: '#833c4a', colorLight: '#f8f3dd', correctLevel: QRCode.CorrectLevel.M });
                qrListo = true;
            });
        }
    }
    function cerrar() { modal.classList.remove('on'); modalAbierto = false; pausa = false; }

    // ---- Modo debug: ventana para elegir el anuncio que se ve ----
    const badge = document.createElement('div');
    badge.id = 'shDbgBadge';
    badge.textContent = '🛠 Modo debug · repite el código para salir';
    document.body.appendChild(badge);
    if (debug) badge.classList.add('on');

    let panel = null, panelAbierto = false;
    function cerrarPanel() { if (panel) panel.classList.remove('on'); panelAbierto = false; pausa = false; }

    function activarDebug(obj, aviso) {
        debug = obj;
        let guardado = true;
        try { localStorage.setItem(DEBUG_KEY, JSON.stringify(obj)); } catch (e) { guardado = false; }
        reconstruir(deDebug(obj));
        badge.classList.add('on');
        cerrarPanel();
        if (!guardado && aviso) aviso();
    }
    function desactivarDebug() {
        debug = null;
        try { localStorage.removeItem(DEBUG_KEY); } catch (e) {}
        reconstruir(normales);
        badge.classList.remove('on');
        cerrarPanel();
    }

    function abrirPanel() {
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'shDbg';
            panel.innerHTML =
                '<div class="sh-an-box"><h3>🛠 Modo debug · Anuncio</h3>' +
                '<label>Anuncio a mostrar<select class="sh-dbg-sel"></select></label>' +
                '<div class="sh-dbg-custom">' +
                '<label>Título<input type="text" class="sh-dbg-titulo" placeholder="Mi anuncio"></label>' +
                '<label>URL o página a donde lleva<input type="text" class="sh-dbg-url" placeholder="productos.html"></label>' +
                '<label>Imagen (ruta o enlace)<input type="text" class="sh-dbg-img" placeholder="anuncio2.png"></label>' +
                '<label>…o subir una imagen<input type="file" class="sh-dbg-file" accept="image/*"></label>' +
                '</div>' +
                '<p class="sh-dbg-estado"></p>' +
                '<button class="sh-dbg-ok" type="button">Mostrar</button><button class="sh-dbg-no" type="button">Cancelar</button>' +
                '<small>Para volver todo a la normalidad repite el código ↑ ↑ ↓ ↓ ← → ← → A N Enter.</small></div>';
            document.body.appendChild(panel);
            const sel = panel.querySelector('.sh-dbg-sel');
            lista.forEach((a, i) => { const o = document.createElement('option'); o.value = 'ad:' + i; o.textContent = a.titulo || ('Anuncio ' + (i + 1)); sel.appendChild(o); });
            if (carta) { const o = document.createElement('option'); o.value = 'carta'; o.textContent = 'Carta escondida (' + (carta.nombre || 'carta') + ')'; sel.appendChild(o); }
            const o = document.createElement('option'); o.value = 'custom'; o.textContent = 'Otro (personalizado)…'; sel.appendChild(o);
            const custom = panel.querySelector('.sh-dbg-custom');
            const estado = panel.querySelector('.sh-dbg-estado');
            const mostrar = () => custom.classList.toggle('on', sel.value === 'custom');
            sel.onchange = mostrar; mostrar();
            panel.addEventListener('click', ev => { if (ev.target === panel) cerrarPanel(); });
            panel.querySelector('.sh-dbg-no').onclick = cerrarPanel;
            panel.querySelector('.sh-dbg-ok').onclick = function () {
                estado.textContent = '';
                const v = sel.value;
                if (v === 'carta') return activarDebug({ tipo: 'carta' });
                if (v.indexOf('ad:') === 0) {
                    const a = lista[+v.slice(3)];
                    return activarDebug({ tipo: 'ad', titulo: a.titulo || '', url: a.url || '#', imagen: a.imagen });
                }
                const titulo = panel.querySelector('.sh-dbg-titulo').value.trim();
                const url = panel.querySelector('.sh-dbg-url').value.trim() || '#';
                const ruta = panel.querySelector('.sh-dbg-img').value.trim();
                const archivo = panel.querySelector('.sh-dbg-file').files[0];
                const aviso = () => alert('No se pudo guardar el anuncio para después de recargar; se verá hasta que recargues la página.');
                if (archivo) {
                    const fr = new FileReader();
                    fr.onload = () => activarDebug({ tipo: 'ad', titulo, url, imagen: fr.result }, aviso);
                    fr.onerror = () => { estado.textContent = 'No se pudo leer la imagen.'; };
                    fr.readAsDataURL(archivo);
                } else if (ruta) {
                    activarDebug({ tipo: 'ad', titulo, url, imagen: ruta }, aviso);
                } else {
                    estado.textContent = 'Escribe la ruta de la imagen o sube una.';
                }
            };
        }
        panel.classList.add('on');
        panelAbierto = true; pausa = true;
    }

    // index5.html llama a esto con el código ↑ ↑ ↓ ↓ ← → ← → A N Enter
    window.shAnunciosDebug = {
        alternar: function () {
            if (debug) desactivarDebug();
            else if (panelAbierto) cerrarPanel();
            else abrirPanel();
        },
        activo: () => !!debug
    };
})();