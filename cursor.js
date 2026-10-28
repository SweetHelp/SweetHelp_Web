/* =====================================================================
   cursor.js  —  cambia el cursor de toda la página de Sweet Help
   Se incluye igual que carrito.js:   <script src="cursor.js"></script>

   Lee la configuración de  cursor.json  (misma carpeta). Ahí defines:
     - porDefecto : cursor normal de la página
     - reglas     : cursor para ciertos elementos (selector CSS), con
                    "activo" opcional para cuando se mantiene presionado
     - estados    : cursor mientras el <body> tiene esa clase (ej. "ocupado")
   Cada cursor lleva: imagen (svg/png), x e y (punto "caliente" del clic)
   y respaldo (cursor normal del navegador si la imagen no existe).

   Si cursor.json no se puede leer (por ejemplo abriendo el HTML con doble
   clic, sin servidor), se usa la copia de CONFIG_RESPALDO de aquí abajo.

   Cambiar en vivo desde la consola o desde otro script:
     shCursor.aplicar({ ...configuración... })
     shCursor.apagar()
   ===================================================================== */
(function () {
  const RUTA_JSON = "cursor.json";

  const CONFIG_RESPALDO = {
    activado: true,
    porDefecto: { imagen: "pinkymouse.svg", x: 8, y: 4, respaldo: "auto" },
    reglas: [
      { selector: "a, button, summary, [data-agregar], .flecha, .agregar, .ic-btn, .cat-mas, .pinky-flota, .cat-filtro",
        imagen: "pinkymouse.svg", x: 8, y: 4, respaldo: "pointer" },
      { selector: ".visor", imagen: "pinkymouse.svg", x: 8, y: 4, respaldo: "grab" },
      { selector: "input[type=text], input[type=email], input[type=search], textarea", respaldo: "text" }
    ],
    estados: {
      ocupado: { imagen: "pinkymouse.svg", x: 8, y: 4, respaldo: "progress" }
    }
  };

  /* Un cursor -> valor CSS:  url("a.svg") 4 2, auto   (o solo "auto" si no hay imagen) */
  function valor(c) {
    if (!c) return "";
    const resp = c.respaldo || "auto";
    if (!c.imagen) return resp;
    const x = Number.isFinite(+c.x) ? +c.x : 0;
    const y = Number.isFinite(+c.y) ? +c.y : 0;
    const url = String(c.imagen).replace(/["\\\n\r]/g, "");
    return 'url("' + url + '") ' + x + " " + y + ", " + resp;
  }

  /* Configuración -> texto CSS */
  function css(cfg) {
    if (!cfg || cfg.activado === false) return "";
    const out = [];
    if (cfg.porDefecto) {
      const v = valor(cfg.porDefecto);
      if (v) out.push("html, body, body * { cursor: " + v + " !important; }");
    }
    (cfg.reglas || []).forEach(r => {
      if (!r || !r.selector) return;
      const v = valor(r);
      if (v) out.push(":is(" + r.selector + "), :is(" + r.selector + ") * { cursor: " + v + " !important; }");
      const va = valor(r.activo);
      if (va) out.push(":is(" + r.selector + "):active, :is(" + r.selector + "):active * { cursor: " + va + " !important; }");
    });
    const est = cfg.estados || {};
    Object.keys(est).forEach(clase => {
      const v = valor(est[clase]);
      if (v && /^[\w-]+$/.test(clase)) out.push("body." + clase + ", body." + clase + " * { cursor: " + v + " !important; }");
    });
    return out.join("\n");
  }

  function aplicar(cfg) {
    let st = document.getElementById("shCursorCss");
    if (!st) {
      st = document.createElement("style");
      st.id = "shCursorCss";
      document.head.appendChild(st);
    }
    st.textContent = css(cfg);
  }
  function apagar() { aplicar({ activado: false }); }

  window.shCursor = { aplicar, apagar, css };

  /* En pantallas táctiles no hay cursor: no se hace nada */
  if (typeof matchMedia === "function" && matchMedia("(hover: none)").matches) return;

  fetch(RUTA_JSON, { cache: "no-cache" })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
    .then(aplicar)
    .catch(() => aplicar(CONFIG_RESPALDO));
})();
