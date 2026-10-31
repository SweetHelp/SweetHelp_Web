/* movil.js - En teléfono el menú empieza cerrado y se cierra al tocar fuera.
   Ponlo DESPUÉS de menu.js / del menú:  <script src="movil.js"></script> */
(function () {
  var mq = window.matchMedia('(max-width:700px)');

  function pill() { return document.getElementById('shPill'); }

  function iniciar() {
    var p = pill();
    if (p && mq.matches && !p.dataset.movil) {
      p.classList.remove('open');   // en computador arranca abierto; en teléfono, cerrado
      p.dataset.movil = '1';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

  /* tocar fuera del menú lo cierra (solo en teléfono) */
  document.addEventListener('click', function (e) {
    if (!mq.matches) return;
    if (e.target.closest && e.target.closest('.sh-menu')) return;
    var p = pill();
    if (p) p.classList.remove('open');
  });
})();
