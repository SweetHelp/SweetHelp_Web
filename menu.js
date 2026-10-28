/* =====================================================================
   menu.js  -  Menú de hamburguesa de Sweet Help (global)
   ---------------------------------------------------------------------
   Para usarlo en cualquier página, solo agrega esta línea antes de
   </body>:   <script src="menu.js"></script>

   Para cambiar el menú en TODAS las páginas, edita solo este archivo:
     - ENLACES : agrega, quita o cambia botones y sus links
     - ESTILOS : colores, tamaños y animaciones
   ===================================================================== */
(function () {
    if (document.getElementById('shPill')) return; // evita duplicados

    /* ---------- ENLACES DEL MENÚ (edita aquí) ---------- */
    const ENLACES = [
        { href: 'index5.html',        img: 'inicio.svg',         alt: 'Inicio' },
        { href: 'productos.html',     img: 'productosicono.svg', alt: 'Productos' },
        { img: 'infosh.svg', alt: 'Sobre Nosotros', href: '#',
          sub: [
              { href: 'informacion.html', texto: 'Informacion' },
              { href: 'equipo.html',      texto: 'Equipo' }
          ] },
        { href: 'juegos.html', img: 'play.svg',           alt: 'iconsnake' }
    ];

    /* ---------- ESTILOS (edita aquí) ---------- */
    const ESTILOS = `
.sh-menu{position:fixed;top:16px;right:24px;z-index:10000;display:flex;align-items:center}
.sh-pill{display:flex;align-items:center;gap:32px;list-style:none;margin:0 -50px 0 0;padding:0 70px 0 32px;height:60px;
    position:relative;border-radius:999px;pointer-events:none;opacity:0;
    clip-path:inset(-300px -60px -300px 100%);
    transition:clip-path .55s cubic-bezier(.65,0,.35,1),opacity .35s ease}
.sh-pill.open{pointer-events:auto;opacity:1;clip-path:inset(-300px -60px -300px -60px)}
.sh-pill::before{content:'';position:absolute;inset:0;z-index:-1;background:#fff;border-radius:999px;
    -webkit-mask:radial-gradient(circle 49px at calc(100% - 5px) 50%,transparent 48px,#000 49px);
    mask:radial-gradient(circle 49px at calc(100% - 5px) 50%,transparent 48px,#000 49px)}
.sh-pill>li{opacity:0;transform:translateX(70px);transition:transform .25s ease,opacity .2s ease}
.sh-pill.open>li{opacity:1;transform:none;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .35s ease}
.sh-pill.open>li:nth-child(7){transition-delay:.10s}
.sh-pill.open>li:nth-child(6){transition-delay:.16s}
.sh-pill.open>li:nth-child(5){transition-delay:.22s}
.sh-pill.open>li:nth-child(4){transition-delay:.28s}
.sh-pill.open>li:nth-child(3){transition-delay:.34s}
.sh-pill.open>li:nth-child(2){transition-delay:.40s}
.sh-pill.open>li:nth-child(1){transition-delay:.46s}
.sh-pill a{display:flex;align-items:center}
.sh-pill img{height:40px;width:auto;transition:transform .2s ease}
.sh-pill a:hover img{transform:scale(1.15)}
.sh-sep{width:3px;height:42px;background:#bd5c73;border-radius:2px}
.sh-dd{position:relative}
.sh-sub{display:none;position:absolute;top:52px;left:-40px;list-style:none;margin:0;padding:6px;background:#fff;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.2);white-space:nowrap}
.sh-dd:hover .sh-sub{display:block}
.sh-sub a{padding:8px 16px;color:#bd5c73;font-weight:700;text-decoration:none;border-radius:10px}
.sh-sub a:hover{background:#ffe0e1}
.sh-hamb{position:relative;z-index:2;width:90px;height:90px;border-radius:50%;border:0;padding:0;background:#fff;cursor:pointer;
    line-height:0;transition:transform .2s ease}
.sh-hamb:hover{transform:scale(1.06)}
.sh-hamb img{width:100%;height:100%;display:block}
`;

    /* ---------- Construcción (no hace falta tocar) ----------
       Se escribe en el momento en que carga el script, así el menú ya existe
       (#shMenuBtn, #shPill, .sh-menu) cuando responsive.js y carrito.js lo buscan. */
    const items = [];
    ENLACES.forEach((e, i) => {
        if (i > 0) items.push('<li class="sh-sep"></li>');
        if (e.sub) {
            items.push(
                '<li class="sh-dd"><a href="' + e.href + '"><img src="' + e.img + '" alt="' + e.alt + '"></a>' +
                '<ul class="sh-sub">' +
                e.sub.map(s => '<li><a href="' + s.href + '">' + s.texto + '</a></li>').join('') +
                '</ul></li>'
            );
        } else {
            items.push('<li><a href="' + e.href + '"><img src="' + e.img + '" alt="' + e.alt + '"></a></li>');
        }
    });

    const HTML =
        '<style id="shMenuStyles">' + ESTILOS + '</style>' +
        '<div class="sh-menu">' +
        '<ul class="sh-pill open" id="shPill">' + items.join('') + '</ul>' +
        '<button class="sh-hamb" id="shMenuBtn" aria-label="Menú"><img src="menuicon.svg" alt="menu"></button>' +
        '</div>';

    function activar() {
        const btn = document.getElementById('shMenuBtn');
        if (btn) btn.onclick = () => document.getElementById('shPill').classList.toggle('open');
    }

    if (document.readyState === 'loading') {
        document.write(HTML);   // la página aún se está leyendo: queda listo al instante
        activar();
    } else {
        document.body.insertAdjacentHTML('beforeend', HTML);
        activar();
    }
})();
