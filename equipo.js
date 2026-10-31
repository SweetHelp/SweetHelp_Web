/* =====================================================================
   equipo.js  -  Página "Nuestro equipo" interactiva
   ---------------------------------------------------------------------
   - Las tarjetas entran una por una (rebotando) al verse en pantalla.
   - Se inclinan en 3D siguiendo el dedo o el mouse, con un brillo.
   - Al tocarlas hacen "boing" y salen corazones y postres.
   - Cada tarjeta cuenta los toques de cariño (se guardan en el navegador).
   - Si quieres que Pinky diga algo al tocar una tarjeta, escribe una frase
     en FRASES (en el mismo orden de las tarjetas).
   ===================================================================== */
(function () {
  var FRASES = [
    // "Frase para la 1ª tarjeta",
    // "Frase para la 2ª tarjeta"
  ];
  var EMOJIS = ['💗', '🍰', '✨', '💖', '🧁'];
  var INCLINACION = 12;   // grados máximos de inclinación

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = '' +
  '.produtitemul .product-item{perspective:900px;position:relative}' +
  '.produtitemul .product-item>a{display:block;position:relative;border-radius:24px;outline-offset:6px;' +
    'transform-style:preserve-3d;will-change:transform;-webkit-tap-highlight-color:transparent;' +
    'transition:transform .18s ease-out, box-shadow .25s}' +
  '.produtitemul .product-item>a::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;' +
    'background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.45),transparent 55%);' +
    'opacity:0;transition:opacity .25s}' +
  '.produtitemul .product-item>a.eq-activa::after{opacity:1}' +
  '.produtitemul .product-item>a.eq-activa{box-shadow:0 14px 28px rgba(189,92,115,.35)}' +
  '.produtitemul .product-item.eq-oculto{opacity:0;transform:translateY(50px) scale(.88)}' +
  '.produtitemul .product-item.eq-entra{animation:eqEntra .7s cubic-bezier(.3,1.5,.5,1) both}' +
  '.produtitemul .product-item.eq-flota>a{animation:eqFlota 4.5s ease-in-out infinite}' +
  '.produtitemul .product-item.eq-boing>a{animation:eqBoing .6s cubic-bezier(.36,.07,.19,.97)}' +
  '.eq-contador{display:block;margin:10px auto 0;width:max-content;font-family:"Lilita One",system-ui,sans-serif;' +
    'font-size:1rem;color:#bc5d75;background:#fff;border:2px solid #ff9195;border-radius:999px;padding:4px 14px;' +
    'user-select:none;transition:transform .25s cubic-bezier(.3,1.8,.5,1)}' +
  '.eq-contador.sube{transform:scale(1.25)}' +
  '.eq-globo{position:absolute;left:50%;top:-6px;transform:translate(-50%,-100%);z-index:5;max-width:90%;' +
    'background:#fff;border:3px solid #ff9195;color:#8a3f55;font-family:"Lilita One",system-ui,sans-serif;' +
    'font-size:.95rem;line-height:1.2;text-align:center;padding:8px 14px;border-radius:18px;pointer-events:none;' +
    'animation:eqGlobo 2.6s ease both}' +
  '.eq-fx{position:fixed;z-index:10060;pointer-events:none;font-size:22px;line-height:1;user-select:none}' +
  '@keyframes eqEntra{0%{opacity:0;transform:translateY(50px) scale(.88)}60%{opacity:1;transform:translateY(-8px) scale(1.03)}100%{opacity:1;transform:none}}' +
  '@keyframes eqFlota{0%,100%{translate:0 0}50%{translate:0 -6px}}' +
  '@keyframes eqBoing{0%{scale:1 1}25%{scale:1.12 .82}45%{scale:.9 1.14}65%{scale:1.06 .96}85%{scale:.98 1.02}100%{scale:1 1}}' +
  '@keyframes eqGlobo{0%{opacity:0;transform:translate(-50%,-70%) scale(.6)}12%{opacity:1;transform:translate(-50%,-100%) scale(1.05)}' +
    '20%{transform:translate(-50%,-100%) scale(1)}85%{opacity:1}100%{opacity:0}}' +
  '@media (prefers-reduced-motion:reduce){.produtitemul .product-item.eq-flota>a,.produtitemul .product-item.eq-boing>a{animation:none}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function leer(k) { try { return parseInt(localStorage.getItem(k), 10) || 0; } catch (e) { return 0; } }
  function guardar(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }

  /* corazones y postres que salen volando desde el punto tocado */
  function explosion(x, y) {
    if (reducido || !document.body.animate) return;
    for (var i = 0; i < 9; i++) {
      var s = document.createElement('span');
      s.className = 'eq-fx';
      s.textContent = EMOJIS[(Math.random() * EMOJIS.length) | 0];
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      document.body.appendChild(s);
      var ang = Math.random() * Math.PI * 2;
      var dist = 50 + Math.random() * 90;
      var dx = Math.cos(ang) * dist;
      var dy = Math.sin(ang) * dist - 70;
      var anim = s.animate([
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx + 'px),calc(-50% + ' + dy + 'px)) scale(1.2) rotate(' + ((Math.random() - 0.5) * 80) + 'deg)', opacity: 1, offset: 0.6 },
        { transform: 'translate(calc(-50% + ' + dx + 'px),calc(-50% + ' + (dy + 60) + 'px)) scale(.8)', opacity: 0 }
      ], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.4,1)' });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(s);
    }
  }

  function iniciar() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.produtitemul .product-item'));
    if (!items.length) return;

    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var li = e.target;
        io.unobserve(li);
        var retraso = (parseInt(li.dataset.eqI, 10) || 0) * 180;
        setTimeout(function () {
          li.classList.remove('eq-oculto');
          li.classList.add('eq-entra');
          setTimeout(function () { if (!reducido) li.classList.add('eq-flota'); }, 800);
        }, retraso);
      });
    }, { threshold: 0.15 }) : null;

    items.forEach(function (li, i) {
      var a = li.querySelector('a');
      if (!a) return;
      var clave = 'sh_equipo_' + i;
      var total = leer(clave);
      li.dataset.eqI = String(i);

      a.setAttribute('role', 'button');
      a.setAttribute('aria-label', 'Miembro del equipo ' + (i + 1) + ': toca para dar cariño');

      var cont = document.createElement('span');
      cont.className = 'eq-contador';
      cont.setAttribute('aria-live', 'polite');
      function pintar() { cont.textContent = '💗 ' + total; }
      pintar();
      li.appendChild(cont);

      /* entrada */
      if (io && !reducido) { li.classList.add('eq-oculto'); io.observe(li); }

      /* inclinación 3D con dedo / mouse */
      function inclinar(e) {
        var r = a.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        px = Math.max(0, Math.min(1, px)); py = Math.max(0, Math.min(1, py));
        a.style.transform = 'rotateY(' + ((px - 0.5) * 2 * INCLINACION) + 'deg) rotateX(' + ((0.5 - py) * 2 * INCLINACION) + 'deg) scale(1.03)';
        a.style.setProperty('--mx', (px * 100) + '%');
        a.style.setProperty('--my', (py * 100) + '%');
        a.classList.add('eq-activa');
      }
      function soltar() {
        a.style.transform = '';
        a.classList.remove('eq-activa');
      }
      if (!reducido) {
        a.addEventListener('pointermove', inclinar);
        a.addEventListener('pointerdown', inclinar);
        a.addEventListener('pointerleave', soltar);
        a.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') soltar(); });
        a.addEventListener('pointercancel', soltar);
      }

      /* tocar: boing + corazones + contador + frase de Pinky */
      var tFrase = null;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var x = e.clientX, y = e.clientY;
        if (!x && !y) {                       // activado con teclado
          var r = a.getBoundingClientRect();
          x = r.left + r.width / 2; y = r.top + r.height / 2;
        }
        li.classList.remove('eq-boing'); void li.offsetWidth; li.classList.add('eq-boing');
        explosion(x, y);
        total++; guardar(clave, total); pintar();
        cont.classList.add('sube'); setTimeout(function () { cont.classList.remove('sube'); }, 220);

        var frase = FRASES[i];
        if (frase) {
          var viejo = li.querySelector('.eq-globo');
          if (viejo) viejo.remove();
          var g = document.createElement('div');
          g.className = 'eq-globo';
          g.textContent = frase;
          li.appendChild(g);
          clearTimeout(tFrase);
          tFrase = setTimeout(function () { g.remove(); }, 2600);
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
