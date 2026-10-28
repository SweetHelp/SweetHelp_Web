/* SweetHelp · menú hamburguesa en teléfono + nombre de página en la URL (sweethelp.shop/#nombre) (v2) */
(function () {
  /* Archivos del sitio (sin .html). Si quieres otro nombre en la URL, ponlo aquí:
     por ejemplo { index5: 'inicio', productos: 'tienda' } */
  var ARCHIVOS = ['index', 'index2', 'index3', 'index4', 'index5', 'productos', 'informacion',
                  'equipo', 'iniciaroregistrarse', 'sigueelpostre', 'ArSweetCards', 'mind'];
  var NOMBRES = {};

  var archivo = (location.pathname.split('/').pop() || 'index').replace(/\.html?$/i, '');
  var nombre = NOMBRES[archivo] || archivo;
  var esRaiz = /\/$|\/index\.html?$/i.test(location.pathname);
  var esDominio = /(^|\.)sweethelp\.shop$/i.test(location.hostname);
  var movil = window.matchMedia ? window.matchMedia('(max-width:768px)') : { matches: false };

  /* Si abren sweethelp.shop/#productos desde cero (recargar o enlace compartido), los llevamos a esa página */
  if (esRaiz) {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    for (var i = 0; i < ARCHIVOS.length; i++) {
      var a = ARCHIVOS[i], n = NOMBRES[a] || a;
      if (n === h && a !== 'index') { location.replace(a + '.html'); return; }
    }
  }

  /* Viewport correcto en teléfono (y que respete la muesca / notch) */
  (function () {
    var m = document.querySelector('meta[name="viewport"]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'viewport';
      document.head.appendChild(m);
    }
    var c = m.getAttribute('content') || '';
    if (c.indexOf('width=') === -1) c = 'width=device-width, initial-scale=1.0';
    if (c.indexOf('viewport-fit') === -1) c += ', viewport-fit=cover';
    m.setAttribute('content', c);
  })();

  /* Pone #nombre en la barra de direcciones sin tocar el archivo */
  function ponerNombre() {
    try {
      var url = (esDominio ? '/' : location.pathname + location.search) + '#' + nombre;
      history.replaceState(null, '', url);
    } catch (e) {
      try { location.hash = nombre; } catch (_) {}
    }
  }
  if (document.readyState === 'complete') ponerNombre();
  else window.addEventListener('load', ponerNombre);

  /* Menú hamburguesa (solo se ve como desplegable en teléfono; en computador lo maneja menu.js) */
  var menuListo = false;
  function initMenu() {
    if (menuListo) return;
    var btn = document.getElementById('shMenuBtn');
    var pill = document.getElementById('shPill');
    if (!btn || !pill) return;
    menuListo = true;

    function cerrar() { pill.classList.remove('sh-abierto'); btn.setAttribute('aria-expanded', 'false'); }

    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var abierto = pill.classList.toggle('sh-abierto');
      btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.sh-menu')) cerrar();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
    pill.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      if (a.getAttribute('href') === '#') { e.preventDefault(); return; }
      cerrar();
    });
    /* si giran el teléfono o pasan a pantalla grande, se limpia el estado */
    window.addEventListener('resize', function () { if (!movil.matches) cerrar(); });
  }

  /* Menú del perfil de index5 (el de .menudesplegable2): en teléfono no hay "hover", así que se abre al tocar.
     Antes el enlace <a href=""> recargaba la página al tocarlo. */
  function initPerfil() {
    document.addEventListener('click', function (e) {
      var dd = document.querySelector('.menudesplegable2 .dropdown');
      if (!dd) return;
      var enlace = e.target.closest('.menudesplegable2 .dropdown > a');
      if (enlace && movil.matches) {
        e.preventDefault();
        dd.classList.toggle('sh-abierto');
        return;
      }
      if (!e.target.closest('.menudesplegable2') || e.target.closest('.submenu a')) {
        dd.classList.remove('sh-abierto');
      }
    });
  }

  function init() { initMenu(); initPerfil(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  /* por si menu.js termina de dibujar el menú un poco después */
  window.addEventListener('load', initMenu);
})();
