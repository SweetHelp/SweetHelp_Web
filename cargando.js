/* ===== PANTALLA DE CARGA COMPARTIDA (Sweet Help) =====
   Se usa en todas las páginas con una sola línea en el <head>:
   <script src="cargando.js"></script>
   Cambia aquí la configuración y se actualiza en todo el sitio. */
(function () {
    // ---------- CONFIGURACIÓN ----------
    var CONFIG = {
        gif: 'pinkimoto.gif',        // imagen de Pinky en moto
        arboles: ['arboles.svg', 'arboles2.svg', 'arboles3.svg'],      // árboles detrás de Pinky (se alternan en este orden)
        arbustos: ['arbustos.svg', 'arbustos2.svg', 'arbustos3.svg'], // arbustos delante de Pinky (se alternan en este orden)
        velocidadArboles: 1.8,       // segundos que tarda en pasar una copia de árboles (menos = más rápido)
        separacionArboles: 0,        // px entre copias de árboles (0 = pegados, negativo = se encimen)
        velocidadArbustos: 2.6,      // segundos por copia de arbustos (más alto = más lento que los árboles)
        separacionArbustos: 0,       // px entre copias de arbustos
        balanceo: 16,                // px que avanza a la derecha / retrocede a la izquierda (0 = quieta)
        giro: 0.4,                   // grados de inclinación de Pinky (0 = sin inclinación)
        velocidadBalanceo: 1.6,      // segundos que tarda en ir de un lado al otro (más alto = más suave)
        fondo: '#843d4c',            // color de fondo
        barraFondo: '#f4a07f',       // parte de la barra que falta (naranja)
        barraLlena: '#f9f1dc',       // parte de la barra que ya avanzó (crema)
        minEntrada: 1800,            // ms mínimos al entrar a una página
        duracionSalida: 1500         // ms de carga antes de ir a otro html
    };
    // -----------------------------------

    var root = document.documentElement;
    root.classList.add('sh-cargando');

    var css =
        'html.sh-cargando,html.sh-cargando body{overflow:hidden}' +
        '.sh-loader{position:fixed;inset:0;z-index:999999;background:' + CONFIG.fondo + ';' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'opacity:1;visibility:visible;transition:opacity .45s ease,visibility .45s ease}' +
        '.sh-loader.sh-loader-off{opacity:0;visibility:hidden;pointer-events:none}' +
        '.sh-escena{position:relative;width:min(520px,78vw);--tile:min(520px,78vw)}' +
        '.sh-escena img{user-select:none;-webkit-user-drag:none}' +
        /* capas que se desplazan (árboles detrás, arbustos delante) */
        '.sh-pista{position:absolute;top:0;left:50%;width:100vw;height:100%;transform:translateX(-50%);overflow:hidden;pointer-events:none;' +
        '--paso:calc((var(--tile) + var(--sep)) * var(--k));' +
        '-webkit-mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);' +
        'mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)}' +
        '.sh-cinta{display:flex;height:100%;width:max-content;animation:shPasar linear infinite}' +
        '.sh-cinta img{flex:none;width:var(--tile);height:100%;margin-right:var(--sep);object-fit:contain}' +
        '@keyframes shPasar{to{transform:translateX(calc(-1 * var(--paso)))}}' +
        /* Pinky: balanceo suave (ida y vuelta) */
        '.sh-moto{position:relative;z-index:1;width:100%;height:auto;display:block;transform-origin:50% 90%;' +
        'animation:shMoto ' + CONFIG.velocidadBalanceo + 's ease-in-out infinite alternate}' +
        '@keyframes shMoto{' +
        'from{transform:translateX(-' + CONFIG.balanceo + 'px) rotate(-' + CONFIG.giro + 'deg)}' +
        'to{transform:translateX(' + CONFIG.balanceo + 'px) rotate(' + CONFIG.giro + 'deg)}}' +
        '.sh-loader-bar{width:min(615px,80vw);height:9px;background:' + CONFIG.barraFondo + ';margin-top:14px;overflow:hidden}' +
        '.sh-loader-fill{width:0%;height:100%;background:' + CONFIG.barraLlena + ';transition:width .25s linear}';

    var style = document.createElement('style');
    style.textContent = css;
    (document.head || root).appendChild(style);

    // Crea una capa que repite en bucle una lista de imágenes (se alternan en orden) para cubrir todo el ancho
    function capa(lista, separacion, segundos, z) {
        var k = lista.length;
        var paso = Math.min(520, window.innerWidth * 0.78) + separacion;
        var n = Math.ceil(window.innerWidth / Math.max(paso, 40)) + k;
        n = Math.ceil(n / k) * k; // siempre ciclos completos, para que el bucle no dé saltos
        var imgs = '';
        for (var i = 0; i < n; i++) imgs += '<img src="' + lista[i % k] + '" alt="">';
        return '<div class="sh-pista" style="--sep:' + separacion + 'px;--k:' + k + ';z-index:' + z + '">' +
               '<div class="sh-cinta" style="animation-duration:' + (segundos * k) + 's">' + imgs + '</div></div>';
    }

    var loader = document.createElement('div');
    loader.className = 'sh-loader';
    loader.innerHTML =
        '<div class="sh-escena">' +
        capa(CONFIG.arboles, CONFIG.separacionArboles, CONFIG.velocidadArboles, 0) +
        '<img class="sh-moto" src="' + CONFIG.gif + '" alt="Cargando...">' +
        capa(CONFIG.arbustos, CONFIG.separacionArbustos, CONFIG.velocidadArbustos, 2) +
        '</div>' +
        '<div class="sh-loader-bar"><div class="sh-loader-fill"></div></div>';
    root.appendChild(loader); // se agrega ya, para que se vea antes de que cargue el resto
    var fill = loader.querySelector('.sh-loader-fill');

    var timer = null;
    function animarBarra(ms, alTerminar) {
        clearInterval(timer);
        fill.style.transition = 'none';
        fill.style.width = '0%';
        void fill.offsetWidth;
        var inicio = Date.now();
        timer = setInterval(function () {
            var p = Math.min(100, ((Date.now() - inicio) / ms) * 100);
            fill.style.transition = 'width .25s linear';
            fill.style.width = p + '%';
            if (p >= 100) { clearInterval(timer); if (alTerminar) alTerminar(); }
        }, 60);
    }
    function mostrar() {
        root.classList.add('sh-cargando');
        loader.classList.remove('sh-loader-off');
    }
    function ocultar() {
        loader.classList.add('sh-loader-off');
        root.classList.remove('sh-cargando');
    }

    // Al entrar a la página
    var t0 = Date.now();
    animarBarra(CONFIG.minEntrada);
    function terminarEntrada() {
        var resto = Math.max(0, CONFIG.minEntrada - (Date.now() - t0));
        setTimeout(function () {
            fill.style.width = '100%';
            setTimeout(ocultar, 250);
        }, resto);
    }
    if (document.readyState === 'complete') terminarEntrada();
    else window.addEventListener('load', terminarEntrada);
    setTimeout(ocultar, 8000); // seguridad por si algo tarda demasiado

    // Al volver con el botón "atrás" (la página viene de caché)
    window.addEventListener('pageshow', function (e) { if (e.persisted) ocultar(); });

    // Antes de entrar a otro html / otro link
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href || href === '#' || href.charAt(0) === '#') return;
        if (/^(javascript:|mailto:|tel:)/i.test(href)) return;
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (e.defaultPrevented) return;
        e.preventDefault();
        var destino = a.href;
        mostrar();
        animarBarra(CONFIG.duracionSalida, function () { window.location.href = destino; });
    });
})();