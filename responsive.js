/* SweetHelp · menú hamburguesa en teléfono + nombre de página en la URL (sweethelp.shop/#nombre) */
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

  /* Si abren sweethelp.shop/#productos desde cero (recargar o enlace compartido), los llevamos a esa página */
  if (esRaiz) {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    for (var i = 0; i < ARCHIVOS.length; i++) {
      var a = ARCHIVOS[i], n = NOMBRES[a] || a;
      if (n === h && a !== 'index') { location.replace(a + '.html'); return; }
    }
  }

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

  /* Menú hamburguesa */
  function init() {
    var btn = document.getElementById('shMenuBtn');
    var pill = document.getElementById('shPill');
    if (!btn || !pill) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      pill.classList.toggle('sh-abierto');
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.sh-menu')) pill.classList.remove('sh-abierto');
    });
    pill.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      if (a.getAttribute('href') === '#') { e.preventDefault(); return; }
      pill.classList.remove('sh-abierto');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
