/* =====================================================================
   sesion.js  -  Registro / inicio de sesión de Sweet Help
   ---------------------------------------------------------------------
   - Al llenar el registro (index.html) o el login (index2.html) y pulsar
     el botón, se guarda la sesión en este navegador y se entra a index5.html.
   - Mientras la sesión esté activa, las páginas de registro / login /
     iniciaroregistrarse ya NO aparecen: mandan directo a index5.html.
   - "Salir" (en el menú del perfil, ver perfil.js) cierra la sesión.

   Ponlo en el <head> de: index.html, index2.html, iniciaroregistrarse.html
       <script src="sesion.js"></script>
   ===================================================================== */
(function () {
    var PAGINA_INICIO = 'index5.html';   // a dónde se entra después de registrarse / iniciar
    var K_SESION = 'sh_sesion';          // "1" = sesión activa
    var K_USUARIO = 'sh_usuario';        // datos del usuario {nombre, correo, telefono}

    function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    /* 1) Sesión ya iniciada: saltar el registro / login */
    if (leer(K_SESION) === '1') { location.replace(PAGINA_INICIO); return; }

    /* 2) Validar y entrar */
    function listo() {
        var esRegistro = !!document.getElementById('nombres');
        var form = document.querySelector('.forms-register, .form-login');
        if (!form) return;
        var boton = form.querySelector('input[type="button"][value="Registrarse"], input[type="button"][value="Iniciar Sesión"]');
        if (!boton) return;
        var enlace = boton.closest('a');

        var msg = document.createElement('p');
        msg.style.cssText = 'color:#c0392b;font-weight:700;margin:6px 0;min-height:0;height:auto';
        boton.parentNode.insertBefore(msg, enlace || boton);

        function val(sel) { var el = form.querySelector(sel); return el ? el.value.trim() : ''; }

        function intentar(e) {
            e.preventDefault();
            e.stopPropagation();
            var correo = val('input[type="email"]');
            var clave = val('input[type="password"]');
            var error = '';

            if (esRegistro) {
                var nombre = val('#nombres');
                var claves = form.querySelectorAll('input[type="password"]');
                var telefono = val('[id="número de teléfono"]');
                if (!nombre || !correo || !clave || !claves[1].value.trim() || !telefono) error = 'Por favor llena todos los campos.';
                else if (correo.indexOf('@') < 1) error = 'Escribe un correo válido.';
                else if (claves[0].value !== claves[1].value) error = 'Las contraseñas no coinciden.';
                if (!error) guardar(K_USUARIO, JSON.stringify({ nombre: nombre, correo: correo, telefono: telefono }));
            } else {
                if (!correo || !clave) error = 'Escribe tu correo y tu contraseña.';
                else if (correo.indexOf('@') < 1) error = 'Escribe un correo válido.';
                if (!error) {
                    var u = {};
                    try { u = JSON.parse(leer(K_USUARIO) || '{}'); } catch (x) {}
                    u.correo = correo;
                    guardar(K_USUARIO, JSON.stringify(u));
                }
            }

            if (error) { msg.textContent = error; return; }
            guardar(K_SESION, '1');
            location.href = PAGINA_INICIO;
        }

        /* el botón está dentro de <a href="index5.html">: lo interceptamos antes de que navegue */
        (enlace || boton).addEventListener('click', intentar, true);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', listo);
    else listo();
})();
