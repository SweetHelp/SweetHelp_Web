/* =====================================================================
   perfil.js  -  Perfil de Sweet Help (foto de perfil + Salir)
   ---------------------------------------------------------------------
   - "Editar" en el menú del perfil abre una ventana (tipo ventana retro) para subir una foto.
   - La foto se guarda en este navegador y aparece en TODAS las páginas.
   - "Salir" cierra la sesión (y entonces vuelve a salir el registro/login).

   Ponlo antes de </body> en: index5, productos, tienda-postres, informacion
       <script src="perfil.js"></script>
   ===================================================================== */
(function () {
    var K_SESION = 'sh_sesion';
    var K_USUARIO = 'sh_usuario';
    var TAM = 320;   // la foto se guarda de TAM x TAM px (ligera)

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
                var r = img.getBoundingClientRect();
                img.dataset.shTam = Math.round(Math.min(r.width, r.height)) || 84;
            }
            if (foto) {
                img.src = foto;
                img.style.width = img.style.height = img.dataset.shTam + 'px';
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                img.style.border = '3px solid #ff9195';
                img.style.background = '#fff';
                img.style.boxSizing = 'border-box';
            } else {
                img.src = img.dataset.shOrig;
                ['width', 'height', 'borderRadius', 'objectFit', 'border', 'background', 'boxSizing']
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
    '#shEdit .pildora{position:absolute;top:46%;height:18%;width:10.7%;border:0;padding:0;border-radius:999px;background:#843a49;cursor:default}' +
    '#shEdit .p1{left:59%;cursor:pointer}' +
    '#shEdit .p2{left:72.8%}' +
    '#shEdit .p3{left:86.6%;background:#f8f3dc;cursor:pointer}' +
    '#shEdit .circulo{position:absolute;left:22.4%;top:22.5%;width:55.6%;aspect-ratio:1;border-radius:50%;border:1cqw dashed #000;' +
        'box-sizing:border-box;overflow:hidden;cursor:pointer;background:transparent;padding:0}' +
    '#shEdit .circulo img{width:100%;height:100%;object-fit:cover;display:none}' +
    '#shEdit .circulo img.hay{display:block}' +
    '#shEdit .subir{position:absolute;left:34.8%;top:88.2%;width:32.3%;height:8.5%;border:0;border-radius:999px;background:#f39196;color:#fff;' +
        'font-family:inherit;font-size:4.6cqw;cursor:pointer;line-height:1;padding:0}' +
    '#shEdit .guardar{position:absolute;left:83.7%;top:87.4%;width:10.6%;height:9.3%;border:0;border-radius:18%;background:#f39196;cursor:pointer;padding:0;' +
        'display:flex;align-items:center;justify-content:center}' +
    '#shEdit .guardar svg{width:62%;height:62%}' +
    '#shEdit .guardar:disabled{opacity:.5;cursor:default}' +
    '#shEdit .aviso{position:absolute;left:4%;right:4%;top:80.5%;margin:0;text-align:center;color:#c0392b;font-size:3.6cqw;min-height:1em}';

    var estilo = document.createElement('style');
    estilo.textContent = css;
    document.head.appendChild(estilo);

    var modal = document.createElement('div');
    modal.id = 'shEdit';
    modal.innerHTML =
        '<div class="ventana">' +
          '<div class="barra">' +
            '<button type="button" class="pildora p1 quitar" title="Quitar foto" aria-label="Quitar foto"></button>' +
            '<span class="pildora p2"></span>' +
            '<button type="button" class="pildora p3 cerrar" title="Cerrar" aria-label="Cerrar"></button>' +
          '</div>' +
          '<button type="button" class="circulo" aria-label="Elegir imagen"><img alt="Vista previa"></button>' +
          '<input type="file" accept="image/*" hidden>' +
          '<p class="aviso"></p>' +
          '<button type="button" class="subir">subir imagen</button>' +
          '<button type="button" class="guardar" disabled aria-label="Guardar">' +
            '<svg viewBox="0 0 40 40"><path d="M5 22 L13 17 L17 24 L32 4 L38 8 L18 36 L12 36 Z" fill="#f8f3dc"/></svg>' +
          '</button>' +
        '</div>';
    document.body.appendChild(modal);

    var vista = modal.querySelector('.circulo img');
    var archivo = modal.querySelector('input[type=file]');
    var aviso = modal.querySelector('.aviso');
    var btnGuardar = modal.querySelector('.guardar');
    var pendiente = null;      // foto nueva sin guardar (data URL)
    var quitar = false;

    function mostrar(src) {
        if (src) { vista.src = src; vista.classList.add('hay'); }
        else { vista.removeAttribute('src'); vista.classList.remove('hay'); }
    }

    function abrir() {
        pendiente = null; quitar = false; aviso.textContent = '';
        btnGuardar.disabled = true;
        mostrar(leer(claveFoto()));
        modal.classList.add('open');
    }
    function cerrar() { modal.classList.remove('open'); archivo.value = ''; }

    modal.querySelector('.subir').onclick = function () { archivo.click(); };
    modal.querySelector('.circulo').onclick = function () { archivo.click(); };
    modal.querySelector('.cerrar').onclick = cerrar;
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
    modal.querySelector('.quitar').onclick = function () {
        pendiente = null; quitar = true; mostrar(null);
        aviso.textContent = ''; btnGuardar.disabled = false;
    };

    archivo.onchange = function () {
        var f = archivo.files && archivo.files[0];
        if (!f) return;
        if (!/^image\//.test(f.type)) { aviso.textContent = 'Elige un archivo de imagen.'; return; }
        var lector = new FileReader();
        lector.onload = function () {
            var im = new Image();
            im.onload = function () {
                /* recorte cuadrado centrado y reducido */
                var c = document.createElement('canvas');
                c.width = c.height = TAM;
                var lado = Math.min(im.width, im.height);
                c.getContext('2d').drawImage(im, (im.width - lado) / 2, (im.height - lado) / 2, lado, lado, 0, 0, TAM, TAM);
                pendiente = c.toDataURL('image/jpeg', 0.85);
                quitar = false;
                mostrar(pendiente);
                aviso.textContent = '';
                btnGuardar.disabled = false;
            };
            im.onerror = function () { aviso.textContent = 'No se pudo leer esa imagen.'; };
            im.src = lector.result;
        };
        lector.readAsDataURL(f);
    };

    btnGuardar.onclick = function () {
        if (quitar) borrar(claveFoto());
        else if (pendiente && !guardar(claveFoto(), pendiente)) { aviso.textContent = 'No se pudo guardar la foto en este navegador.'; return; }
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
