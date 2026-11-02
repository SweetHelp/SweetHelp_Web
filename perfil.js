/* =====================================================================
   perfil.js  -  Perfil de Sweet Help (foto de perfil + Salir)
   ---------------------------------------------------------------------
   - "Editar" en el menú del perfil abre una ventana (tipo ventana retro) para subir una foto.
   - Al subir una imagen se puede RECORTAR: arrastrarla para moverla y acercarla/alejarla
     (barra de zoom, rueda del mouse o pellizco con dos dedos).
   - El botón del bote de basura elimina la foto y vuelve el ícono por defecto.
   - La foto se guarda en este navegador y aparece en TODAS las páginas.
   - "Salir" cierra la sesión (y entonces vuelve a salir el registro/login).

   Ponlo antes de </body> en: index5, productos, tienda-postres, informacion
       <script src="perfil.js"></script>
   ===================================================================== */
(function () {
    var K_SESION = 'sh_sesion';
    var K_USUARIO = 'sh_usuario';
    var TAM = 320;            // la foto se guarda de TAM x TAM px (ligera)
    var AUMENTO = 1.3;        // el ícono de perfil se ve 30 % más grande (pon 1 para el tamaño de antes)
    var COLOR = '#823C4A';    // mismo color de la línea de la flecha
    var ZOOM_MAX = 4;         // hasta cuántas veces se puede acercar
    var K_TAM = 'sh_perfil_tam';   // tamaño del ícono medido en el HOME (index5): las demás páginas lo copian
    var TAM_DEFECTO = 56;          // si aún no se ha visitado el home en este navegador

    function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function guardar(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
    function borrar(k) { try { localStorage.removeItem(k); } catch (e) {} }

    /* la foto va ligada al correo del usuario (si existe) */
    function claveFoto() {
        var correo = '';
        try { correo = (JSON.parse(leer(K_USUARIO) || '{}').correo || '').toLowerCase(); } catch (e) {}
        return 'sh_foto_' + (correo || 'invitado');
    }

    /* ---------- Foto en los íconos de perfil ---------- */
    function imagenes() { return document.querySelectorAll('img[alt="iconperfil"]'); }

    function aplicarFoto() {
        var foto = leer(claveFoto());
        imagenes().forEach(function (img) {
            if (!img.dataset.shOrig) {
                img.dataset.shOrig = img.getAttribute('src');
                /* El tamaño de referencia es el del home (index5). Ahí se mide y se guarda;
                   en las demás páginas (productos, equipo, información) se usa ese mismo valor.
                   En teléfono responsive.css ya iguala el tamaño en todas las páginas. */
                var r = img.getBoundingClientRect();
                var medido = Math.round(Math.min(r.width, r.height)) || 0;
                var movil = window.matchMedia('(max-width:768px)').matches;
                var esHome = !!img.closest('.menudesplegable2');
                var tam = medido || TAM_DEFECTO;
                if (esHome) { if (medido && !movil) guardar(K_TAM, String(medido)); }
                else if (!movil) tam = parseInt(leer(K_TAM), 10) || TAM_DEFECTO;
                img.dataset.shTam = tam;
            }
            /* tamaño (más grande); con !important para ganarle al responsive.css del teléfono */
            var t = Math.round(img.dataset.shTam * AUMENTO) + 'px';
            img.style.setProperty('width', t, 'important');
            img.style.setProperty('height', t, 'important');
            img.style.objectFit = foto ? 'cover' : 'contain';
            if (foto) {
                img.src = foto;
                img.style.borderRadius = '50%';
                img.style.border = '3px solid #ff9195';
                img.style.background = '#fff';
                img.style.boxSizing = 'border-box';
            } else {
                img.src = img.dataset.shOrig;
                ['borderRadius', 'border', 'background', 'boxSizing']
                    .forEach(function (p) { img.style[p] = ''; });
            }
        });
    }

    /* ---------- Ventana "Editar perfil" (diseño tipo ventana retro) ---------- */
    var fuente = document.createElement('link');
    fuente.rel = 'stylesheet';
    fuente.href = 'https://fonts.googleapis.com/css2?family=Lobster&display=swap';
    document.head.appendChild(fuente);

    var css = '' +
    '#shEdit{position:fixed;inset:0;z-index:10050;display:none;align-items:center;justify-content:center;background:rgba(60,60,60,.65)}' +
    '#shEdit.open{display:flex}' +
    '#shEdit .ventana{position:relative;container-type:inline-size;width:min(480px,92vw);aspect-ratio:710/635;background:#f8f3dc;' +
        'border-radius:7%/7.8%;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.35);font-family:"Lobster",cursive}' +
    '#shEdit .barra{position:absolute;left:0;top:0;width:100%;height:19.7%;background:#f39196}' +
    '#shEdit .titulo{position:absolute;left:5%;top:0;width:52%;height:100%;display:flex;align-items:center;color:#fff;font-size:5.4cqw;line-height:1.05}' +
    '#shEdit .pildora{position:absolute;top:46%;height:18%;width:10.7%;border:0;padding:0;border-radius:999px;background:#843a49;cursor:default}' +
    '#shEdit .p1{left:59%;cursor:pointer}' +
    '#shEdit .p2{left:72.8%}' +
    '#shEdit .p3{left:86.6%;background:#f8f3dc;cursor:pointer}' +
    '#shEdit .circulo{position:absolute;left:22.4%;top:22.5%;width:55.6%;aspect-ratio:1;border-radius:50%;border:1cqw dashed ' + COLOR + ';' +
        'box-sizing:border-box;overflow:hidden;cursor:pointer;background:transparent;padding:0;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '#shEdit .circulo.editando{cursor:grab}' +
    '#shEdit .circulo.editando.arrastrando{cursor:grabbing}' +
    '#shEdit .circulo img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:none;max-width:none;pointer-events:none;-webkit-user-drag:none}' +
    '#shEdit .circulo img.hay{display:block}' +
    '#shEdit .circulo.editando img{object-fit:fill}' +
    '#shEdit .zoom{position:absolute;left:35%;top:74.5%;width:30%;height:5.2%;display:none;align-items:center;justify-content:center;' +
        'background:rgba(248,243,220,.9);border-radius:999px;padding:0 1.6cqw;box-sizing:border-box}' +
    '#shEdit .zoom.on{display:flex}' +
    '#shEdit .zoom input{width:100%;margin:0;accent-color:' + COLOR + ';cursor:pointer}' +
    '#shEdit .subir{position:absolute;left:34.8%;top:88.2%;width:32.3%;height:8.5%;border:0;border-radius:999px;background:#f39196;color:#fff;' +
        'font-family:inherit;font-size:4.6cqw;cursor:pointer;line-height:1;padding:0}' +
    '#shEdit .guardar,#shEdit .borrar{position:absolute;top:87.4%;width:10.6%;height:9.3%;border:0;border-radius:18%;background:#f39196;cursor:pointer;padding:0;' +
        'display:flex;align-items:center;justify-content:center}' +
    '#shEdit .guardar{left:83.7%}' +
    '#shEdit .borrar{left:5.7%}' +
    '#shEdit .guardar svg,#shEdit .borrar svg{width:62%;height:62%}' +
    '#shEdit .guardar:disabled,#shEdit .borrar:disabled{opacity:.5;cursor:default}' +
    '#shEdit .aviso{position:absolute;left:4%;right:4%;top:80.5%;margin:0;text-align:center;color:#c0392b;font-size:3.6cqw;min-height:1em;pointer-events:none}';

    var estilo = document.createElement('style');
    estilo.textContent = css;
    document.head.appendChild(estilo);

    var modal = document.createElement('div');
    modal.id = 'shEdit';
    modal.innerHTML =
        '<div class="ventana">' +
          '<div class="barra">' +
            '<span class="titulo">Editar foto</span>' +
            '<button type="button" class="pildora p1 quitar" title="Eliminar foto" aria-label="Eliminar foto"></button>' +
            '<span class="pildora p2"></span>' +
            '<button type="button" class="pildora p3 cerrar" title="Cerrar" aria-label="Cerrar"></button>' +
          '</div>' +
          '<div class="circulo" role="button" tabindex="0" aria-label="Elegir imagen"><img alt="Vista previa"></div>' +
          '<div class="zoom"><input type="range" min="1" max="' + ZOOM_MAX + '" step="0.01" value="1" aria-label="Acercar"></div>' +
          '<input type="file" accept="image/*" hidden>' +
          '<p class="aviso"></p>' +
          '<button type="button" class="borrar" aria-label="Eliminar foto" title="Eliminar foto">' +
            '<svg viewBox="0 0 40 40"><path d="M14 6 H26 L27 9 H34 V13 H6 V9 H13 Z M9 16 H31 L29 35 H11 Z" fill="#f8f3dc"/></svg>' +
          '</button>' +
          '<button type="button" class="subir">subir imagen</button>' +
          '<button type="button" class="guardar" disabled aria-label="Guardar">' +
            '<svg viewBox="0 0 40 40"><path d="M5 22 L13 17 L17 24 L32 4 L38 8 L18 36 L12 36 Z" fill="#f8f3dc"/></svg>' +
          '</button>' +
        '</div>';
    document.body.appendChild(modal);

    var circulo = modal.querySelector('.circulo');
    var vista = circulo.querySelector('img');
    var titulo = modal.querySelector('.titulo');
    var zoomBox = modal.querySelector('.zoom');
    var zoom = zoomBox.querySelector('input');
    var archivo = modal.querySelector('input[type=file]');
    var aviso = modal.querySelector('.aviso');
    var btnGuardar = modal.querySelector('.guardar');
    var btnBorrar = modal.querySelector('.borrar');

    /* ---------- Estado del recorte ---------- */
    var im = null;                 // imagen nueva que se está recortando (null = no se está editando)
    var base = 1;                  // escala mínima para cubrir el círculo
    var z = 1;                     // zoom (1 = cubre justo el círculo)
    var ox = 0, oy = 0;            // posición de la imagen dentro del círculo (px, <= 0)
    var D = 0;                     // diámetro interior del círculo (px)

    function mostrar(src) {
        if (src) { vista.src = src; vista.classList.add('hay'); }
        else { vista.removeAttribute('src'); vista.classList.remove('hay'); }
    }

    function dibujar() {
        var k = base * z, w = im.width * k, h = im.height * k;
        ox = Math.min(0, Math.max(D - w, ox));      // la imagen siempre cubre todo el círculo
        oy = Math.min(0, Math.max(D - h, oy));
        vista.style.width = w + 'px';
        vista.style.height = h + 'px';
        vista.style.left = ox + 'px';
        vista.style.top = oy + 'px';
    }

    function poner(nuevoZ, cx, cy) {              // cambia el zoom manteniendo fijo el punto (cx, cy) del círculo
        nuevoZ = Math.min(ZOOM_MAX, Math.max(1, nuevoZ));
        var k0 = base * z, k1 = base * nuevoZ;
        var px = (cx - ox) / k0, py = (cy - oy) / k0;   // punto de la imagen bajo (cx, cy)
        z = nuevoZ;
        ox = cx - px * k1; oy = cy - py * k1;
        zoom.value = z;
        dibujar();
    }

    function salirDeEdicion() {
        im = null;
        circulo.classList.remove('editando', 'arrastrando');
        zoomBox.classList.remove('on');
        titulo.textContent = 'Editar foto';
        ['width', 'height', 'left', 'top'].forEach(function (p) { vista.style.removeProperty(p); });
    }

    function empezarEdicion(imagen, src) {
        im = imagen;
        vista.onload = function () {
            vista.onload = null;
            D = circulo.clientWidth;
            base = D / Math.min(im.width, im.height);
            z = 1; zoom.value = 1;
            ox = (D - im.width * base) / 2;
            oy = (D - im.height * base) / 2;
            circulo.classList.add('editando');
            zoomBox.classList.add('on');
            titulo.textContent = 'Mueve y acerca';
            dibujar();
        };
        mostrar(src);
    }

    function abrir() {
        salirDeEdicion();
        aviso.textContent = '';
        btnGuardar.disabled = true;
        var actual = leer(claveFoto());
        mostrar(actual);
        btnBorrar.disabled = !actual;
        modal.classList.add('open');
    }
    function cerrar() { modal.classList.remove('open'); archivo.value = ''; salirDeEdicion(); }

    /* ---------- Eliminar foto: vuelve el ícono por defecto ---------- */
    function eliminar() {
        if (!leer(claveFoto()) && !im) { aviso.textContent = 'Todavía no tienes foto.'; return; }
        if (!window.confirm('¿Eliminar tu foto de perfil y volver al ícono por defecto?')) return;
        borrar(claveFoto());
        aplicarFoto();
        cerrar();
    }

    modal.querySelector('.subir').onclick = function () { archivo.click(); };
    modal.querySelector('.cerrar').onclick = cerrar;
    modal.querySelector('.quitar').onclick = eliminar;
    btnBorrar.onclick = eliminar;
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });

    /* ---------- Elegir imagen ---------- */
    archivo.onchange = function () {
        var f = archivo.files && archivo.files[0];
        if (!f) return;
        if (!/^image\//.test(f.type)) { aviso.textContent = 'Elige un archivo de imagen.'; return; }
        var lector = new FileReader();
        lector.onload = function () {
            var nueva = new Image();
            nueva.onload = function () {
                aviso.textContent = '';
                empezarEdicion(nueva, lector.result);
                btnGuardar.disabled = false;
            };
            nueva.onerror = function () { aviso.textContent = 'No se pudo leer esa imagen.'; };
            nueva.src = lector.result;
        };
        lector.readAsDataURL(f);
    };

    /* ---------- Arrastrar (1 dedo / mouse), pellizcar (2 dedos) y rueda para acercar ---------- */
    var punteros = {};            // id -> {x, y}
    var distIni = 0, zIni = 1, movio = false;

    function enCirculo(e) {
        var r = circulo.getBoundingClientRect();
        return { x: e.clientX - r.left - circulo.clientLeft, y: e.clientY - r.top - circulo.clientTop };
    }
    function cuantos() { return Object.keys(punteros).length; }
    function distancia() {
        var p = Object.keys(punteros).map(function (k) { return punteros[k]; });
        return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    }

    circulo.addEventListener('pointerdown', function (e) {
        movio = false;
        if (!im) return;
        try { circulo.setPointerCapture(e.pointerId); } catch (x) {}
        punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
        circulo.classList.add('arrastrando');
        if (cuantos() === 2) { distIni = distancia(); zIni = z; }
    });
    circulo.addEventListener('pointermove', function (e) {
        if (!im || !punteros[e.pointerId]) return;
        var p = punteros[e.pointerId];
        var dx = e.clientX - p.x, dy = e.clientY - p.y;
        p.x = e.clientX; p.y = e.clientY;
        if (cuantos() >= 2) {
            if (distIni > 0) { var c = D / 2; poner(zIni * distancia() / distIni, c, c); }
        } else {
            ox += dx; oy += dy;
            if (Math.abs(dx) + Math.abs(dy) > 0) movio = true;
            dibujar();
        }
    });
    function soltar(e) {
        delete punteros[e.pointerId];
        if (cuantos() < 2) distIni = 0;
        if (cuantos() === 0) circulo.classList.remove('arrastrando');
    }
    circulo.addEventListener('pointerup', soltar);
    circulo.addEventListener('pointercancel', soltar);
    circulo.addEventListener('wheel', function (e) {
        if (!im) return;
        e.preventDefault();
        var c = enCirculo(e);
        poner(z * (e.deltaY < 0 ? 1.08 : 1 / 1.08), c.x, c.y);
    }, { passive: false });
    zoom.addEventListener('input', function () { var c = D / 2; poner(parseFloat(zoom.value), c, c); });

    /* Clic sobre el círculo (sin estar recortando): abre el selector de archivos */
    circulo.addEventListener('click', function () { if (!im && !movio) archivo.click(); });
    circulo.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && !im) { e.preventDefault(); archivo.click(); }
    });

    /* ---------- Guardar: se guarda justo lo que se ve dentro del círculo ---------- */
    btnGuardar.onclick = function () {
        if (!im) { cerrar(); return; }
        var c = document.createElement('canvas');
        c.width = c.height = TAM;
        var k = base * z;
        c.getContext('2d').drawImage(im, -ox / k, -oy / k, D / k, D / k, 0, 0, TAM, TAM);
        var datos = c.toDataURL('image/jpeg', 0.85);
        if (!guardar(claveFoto(), datos)) { aviso.textContent = 'No se pudo guardar la foto en este navegador.'; return; }
        aplicarFoto();
        cerrar();
    };

    /* ---------- "Editar" y "Salir" del menú del perfil ---------- */
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('.sh-perfil-menu a, .menudesplegable2 a');
        if (!a) return;
        var texto = a.textContent.trim().toLowerCase();
        if (texto === 'editar') { e.preventDefault(); e.stopPropagation(); abrir(); }
        else if (texto === 'salir') { borrar(K_SESION); }   // y sigue al enlace (iniciaroregistrarse.html)
    }, true);

    if (document.readyState === 'complete') aplicarFoto();
    else window.addEventListener('load', aplicarFoto);
})();
