/* ============================================================
   PARCHE — Libro de Caja PCGE (SamuelRios08101994/PCGE-SamuelR)
   ------------------------------------------------------------
   Qué corrige:
   1) XSS en "Observación": el Libro Diario insertaba el texto
      de observación directo en innerHTML sin escapar. Si alguien
      pegaba código HTML ahí, se ejecutaba al abrir "Diario".
   2) Doble registro accidental: un doble-tap en "▶ Registrar"
      podía crear dos movimientos idénticos.
   3) Panel (Dashboard): implementación propia y autocontenida
      de los 3 gráficos (barras, dona, dispersión) y los filtros,
      que lee tus datos directo de localStorage. Se instala sola
      encima de lo que ya tengas, así que funciona sin importar
      si tu función renderDashboard original tenía o no un bug.

   CÓMO INSTALAR:
   1) En GitHub, abre index.html → ícono de lápiz (Edit).
   2) Busca la línea que dice:  </body>
   3) Pega TODO este archivo dentro de una nueva etiqueta
      <script>...</script>, justo ANTES de </body>, es decir
      DESPUÉS de tu <script> principal. Debe quedar así:

        ... tu <script> original con todo el código ...
        </script>
        <script>
          (pega aquí el contenido de este archivo)
        </script>
      </body>
      </html>

   4) Commit changes.
   5) Recarga la app en el celular (o borra caché de la PWA)
      para que tome el nuevo archivo.
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "registros_caja_pcge";

  function leerRegistros() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------------------------------------------------
     1) FIX XSS: reescribe renderDiario escapando observación
        y código de cuenta antes de insertarlos en el DOM.
        Reutiliza nombreDe() y fmt() que ya existen en tu script
        principal (son accesibles globalmente).
  --------------------------------------------------------- */
  window.renderDiario = function () {
    var cont = document.getElementById("diarioList");
    if (!cont) return;
    var registros = leerRegistros();

    if (!registros.length) {
      cont.innerHTML =
        '<div class="empty"><div class="icon">\uD83D\uDCD6</div>Aún no hay movimientos.<br>Registra el primero desde la pestaña Registrar.</div>';
      return;
    }

    var lineas = [];
    registros
      .slice()
      .reverse()
      .forEach(function (r) {
        var principal = { code: r.cuenta, side: r.tipo };
        var contra = { code: r.contra, side: r.tipo === "debe" ? "haber" : "debe" };
        [principal, contra].forEach(function (x) {
          lineas.push({
            n: r.n,
            fecha: r.fecha,
            hora: r.hora,
            code: x.code,
            side: x.side,
            monto: r.monto,
            obs: r.obs,
          });
        });
      });

    cont.innerHTML = lineas
      .map(function (l) {
        var nombre = typeof nombreDe === "function" ? nombreDe(l.code) : l.code;
        var montoFmt = typeof fmt === "function" ? fmt(l.monto) : l.monto;
        var obsHtml = l.obs ? escapeHtml(l.obs) : '<span class="muted">Sin observación</span>';
        var color = l.side === "debe" ? "var(--ledger-2)" : "var(--brick)";
        return (
          '<div class="diario-line">' +
          "<div>" +
          '<div><span class="code-pill">' +
          escapeHtml(l.code) +
          "</span> " +
          escapeHtml(nombre) +
          "</div>" +
          '<div class="glosa">' +
          obsHtml +
          "</div>" +
          '<div class="meta">N\u00b0 ' +
          l.n +
          " \u00b7 " +
          l.fecha +
          " " +
          (l.hora || "").slice(0, 5) +
          "</div>" +
          "</div>" +
          '<div class="amt" style="color:' +
          color +
          '">' +
          (l.side === "debe" ? "Debe" : "Haber") +
          "<br>" +
          montoFmt +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  };

  /* ---------------------------------------------------------
     2) FIX doble registro: bloquea clics repetidos en
        "▶ Registrar" durante 800ms usando fase de captura,
        así se adelanta al listener original y no lo deja
        ejecutarse dos veces por un doble-tap.
  --------------------------------------------------------- */
  (function () {
    var btn = document.getElementById("btnRegistrar");
    if (!btn) return;
    var bloqueado = false;
    btn.addEventListener(
      "click",
      function (e) {
        if (bloqueado) {
          e.stopImmediatePropagation();
          e.preventDefault();
          return;
        }
        bloqueado = true;
        setTimeout(function () {
          bloqueado = false;
        }, 800);
      },
      true
    );
  })();

  /* ---------------------------------------------------------
     3) PANEL (Dashboard) — implementación propia
  --------------------------------------------------------- */
  var ELEMENTOS = [
    ["1", "Activo disponible y exigible"],
    ["2", "Activo realizable"],
    ["3", "Activo inmovilizado"],
    ["4", "Pasivo"],
    ["5", "Patrimonio neto"],
    ["6", "Gastos por naturaleza"],
    ["7", "Ingresos"],
    ["8", "Saldos intermediarios de gestión"],
    ["9", "Contabilidad analítica"],
    ["0", "Cuentas de orden"],
  ];

  var _charts = { barras: null, dona: null, dispersion: null };

  function poblarSelectElemento(sel) {
    if (sel.dataset.pobl) return;
    sel.innerHTML =
      '<option value="">Todos los elementos</option>' +
      ELEMENTOS.map(function (e) {
        return '<option value="' + e[0] + '">' + e[0] + " \u00b7 " + e[1] + "</option>";
      }).join("");
    sel.dataset.pobl = "1";
  }

  function filtrarRegistros(registros) {
    var elSel = document.getElementById("dashElemento");
    var elemento = elSel ? elSel.value : "";
    var desdeEl = document.getElementById("dashDesde");
    var hastaEl = document.getElementById("dashHasta");
    var desde = desdeEl && desdeEl.value ? desdeEl.value : null;
    var hasta = hastaEl && hastaEl.value ? hastaEl.value : null;
    var cuentaEl = document.getElementById("dashCuentaInput");
    var m = cuentaEl && cuentaEl.value ? cuentaEl.value.trim().match(/^(\d+)/) : null;
    var cuentaCod = m ? m[1] : null;

    return registros.filter(function (r) {
      if (desde && r.fecha < desde) return false;
      if (hasta && r.fecha > hasta) return false;
      if (cuentaCod && r.cuenta.indexOf(cuentaCod) !== 0 && r.contra.indexOf(cuentaCod) !== 0)
        return false;
      if (elemento && r.cuenta.charAt(0) !== elemento && r.contra.charAt(0) !== elemento)
        return false;
      return true;
    });
  }

  function actualizarChecker() {
    var checkEl = document.getElementById("checkVal");
    if (
      !checkEl ||
      typeof computeBalances !== "function" ||
      typeof debitNormal !== "function" ||
      typeof creditNormal !== "function"
    )
      return;
    var map = computeBalances();
    var resultadoNeto = typeof renderResultados === "function" ? renderResultados() : 0;
    var totalActivo = debitNormal(map, "1") + debitNormal(map, "2") + debitNormal(map, "3");
    var pasivo = creditNormal(map, "4");
    var patrimonio = creditNormal(map, "5") + resultadoNeto;
    var diff = totalActivo - (pasivo + patrimonio);
    checkEl.textContent = typeof fmt === "function" ? fmt(totalActivo) : totalActivo.toFixed(2);
    checkEl.classList.remove("ok", "bad");
    checkEl.classList.add(Math.abs(diff) < 0.01 ? "ok" : "bad");
  }

  window.renderDashboard = function () {
    var registros = leerRegistros();
    var selEl = document.getElementById("dashElemento");
    if (selEl) poblarSelectElemento(selEl);

    var filtrados = filtrarRegistros(registros);

    /* --- Montos por elemento (barras) --- */
    var porElemento = {};
    filtrados.forEach(function (r) {
      [r.cuenta, r.contra].forEach(function (cod) {
        var e = cod.charAt(0);
        porElemento[e] = (porElemento[e] || 0) + r.monto;
      });
    });
    var etiquetas = Object.keys(porElemento).sort();
    var valores = etiquetas.map(function (e) {
      return porElemento[e];
    });

    var barrasCanvas = document.getElementById("chartBarras");
    var emptyBarras = document.getElementById("emptyBarras");
    if (!etiquetas.length) {
      if (barrasCanvas) barrasCanvas.style.display = "none";
      if (emptyBarras) emptyBarras.style.display = "block";
    } else {
      if (barrasCanvas) barrasCanvas.style.display = "block";
      if (emptyBarras) emptyBarras.style.display = "none";
      if (_charts.barras) _charts.barras.destroy();
      if (barrasCanvas && window.Chart) {
        _charts.barras = new Chart(barrasCanvas, {
          type: "bar",
          data: {
            labels: etiquetas.map(function (e) {
              return "Elem. " + e;
            }),
            datasets: [{ label: "S/", data: valores, backgroundColor: "#C89B3C" }],
          },
          options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
        });
      }
    }

    /* --- Composición % (dona) --- */
    var donaCanvas = document.getElementById("chartDona");
    var emptyDona = document.getElementById("emptyDona");
    var total = valores.reduce(function (a, b) {
      return a + b;
    }, 0);
    if (!total) {
      if (donaCanvas) donaCanvas.style.display = "none";
      if (emptyDona) emptyDona.style.display = "block";
    } else {
      if (donaCanvas) donaCanvas.style.display = "block";
      if (emptyDona) emptyDona.style.display = "none";
      if (_charts.dona) _charts.dona.destroy();
      if (donaCanvas && window.Chart) {
        var colores = [
          "#16302A", "#1F4238", "#C89B3C", "#A87F2C", "#A7442F",
          "#8B3626", "#6b6659", "#8a8578", "#4a463c", "#EFE9DB",
        ];
        _charts.dona = new Chart(donaCanvas, {
          type: "doughnut",
          data: {
            labels: etiquetas.map(function (e) {
              return "Elem. " + e;
            }),
            datasets: [
              {
                data: valores,
                backgroundColor: etiquetas.map(function (_, i) {
                  return colores[i % colores.length];
                }),
              },
            ],
          },
          options: { plugins: { legend: { position: "bottom" } } },
        });
      }
    }

    /* --- Dispersión fecha vs monto --- */
    var dispCanvas = document.getElementById("chartDispersion");
    var emptyDisp = document.getElementById("emptyDispersion");
    if (!filtrados.length) {
      if (dispCanvas) dispCanvas.style.display = "none";
      if (emptyDisp) emptyDisp.style.display = "block";
    } else {
      if (dispCanvas) dispCanvas.style.display = "block";
      if (emptyDisp) emptyDisp.style.display = "none";
      if (_charts.dispersion) _charts.dispersion.destroy();
      if (dispCanvas && window.Chart) {
        var puntos = filtrados.map(function (r) {
          var dias = Math.floor(new Date(r.fecha + "T00:00:00").getTime() / 86400000);
          return { x: dias, y: r.monto };
        });
        _charts.dispersion = new Chart(dispCanvas, {
          type: "scatter",
          data: { datasets: [{ label: "Movimientos", data: puntos, backgroundColor: "#A7442F" }] },
          options: {
            plugins: { legend: { display: false } },
            scales: {
              x: {
                type: "linear",
                title: { display: true, text: "Fecha" },
                ticks: {
                  callback: function (value) {
                    return new Date(value * 86400000).toISOString().slice(0, 10);
                  },
                },
              },
              y: { title: { display: true, text: "Monto (S/)" } },
            },
          },
        });
      }
    }

    actualizarChecker();
  };

  /* --- Wiring de los filtros del Panel --- */
  ["dashElemento", "dashDesde", "dashHasta"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el)
      el.addEventListener("change", function () {
        renderDashboard();
      });
  });
  var cuentaEl = document.getElementById("dashCuentaInput");
  if (cuentaEl) {
    var t;
    cuentaEl.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        renderDashboard();
      }, 300);
    });
  }
  var limpiarBtn = document.getElementById("dashLimpiar");
  if (limpiarBtn) {
    limpiarBtn.addEventListener("click", function () {
      var elS = document.getElementById("dashElemento");
      if (elS) elS.value = "";
      var d = document.getElementById("dashDesde");
      if (d) d.value = "";
      var h = document.getElementById("dashHasta");
      if (h) h.value = "";
      var c = document.getElementById("dashCuentaInput");
      if (c) c.value = "";
      renderDashboard();
    });
  }

  /* Refresca todo apenas se instala el parche */
  if (typeof renderAll === "function") {
    renderAll();
  } else if (typeof renderDashboard === "function") {
    renderDashboard();
  }
})();
