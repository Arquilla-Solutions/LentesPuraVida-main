// Lentes Pura Vida order board. Plain script, no libraries. Every piece of order data is put on
// the page with textContent (never innerHTML), so nothing typed by a customer can run as code.
"use strict";

(() => {
  const STAGES = [
    { id: "no_pagado", label: "No pagado" },
    { id: "pagado", label: "Pagado" },
    { id: "pedido_ebd", label: "Pedido a EyeBuyDirect" },
    { id: "en_camino", label: "En camino" },
    { id: "llego", label: "Llegó" },
    { id: "entregado", label: "Entregado" },
    { id: "cancelado", label: "Cancelado" },
  ];
  const STAGE = Object.fromEntries(STAGES.map((s) => [s.id, s.label]));
  const RX_MODE = { typed: "Escrita en la web", whatsapp: "La manda por WhatsApp", none: "No tiene receta" };
  const SHIPPING = 30;
  const MARKUP = 1.5;

  const $ = (sel, root = document) => root.querySelector(sel);
  const state = { orders: [], meta: null, q: "", stage: "", tab: "no_pagado", showCancel: false, open: null };

  // ---------- helpers ----------
  function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k in el && typeof v !== "string") el[k] = v;
      else el.setAttribute(k, v === true ? "" : String(v));
    }
    for (const c of kids.flat()) if (c != null && c !== false) el.append(c);
    return el;
  }
  const svg = (d, size = 16) => {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", size); s.setAttribute("height", size);
    s.setAttribute("aria-hidden", "true");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d); p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor");
    p.setAttribute("stroke-width", "2"); p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round");
    s.append(p);
    return s;
  };
  const ICON = {
    copy: "M9 9h10v10H9zM5 15V5h10",
    close: "M6 6l12 12M18 6 6 18",
    move: "M5 12h14m-5-5 5 5-5 5",
    wa: "M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6L3 21z",
    ext: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  };
  const money = (n) => (n == null || n === "" ? "" : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  const signed = (v) => (v == null ? "" : v === 0 ? "0.00" : `${v > 0 ? "+" : "-"}${Math.abs(v).toFixed(2)}`);
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short" });
  const fmtDateTime = (iso) => new Date(iso).toLocaleString("es-CR", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const daysIn = (iso) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d <= 0 ? "Hoy" : d === 1 ? "1 día" : `${d} días`;
  };
  const prettyPhone = (p) => (p && p.startsWith("+506") ? `+506 ${p.slice(4, 8)} ${p.slice(8)}` : p || "");
  const waLink = (p) => `https://wa.me/${String(p).replace(/\D/g, "")}`;
  const isPhone = () => matchMedia("(max-width: 759px)").matches;

  let toastTimer;
  function toast(msg, bad = false) {
    const t = $("[data-toast]");
    t.textContent = msg;
    t.classList.toggle("is-bad", bad);
    t.hidden = false;
    try { t.hidePopover(); t.showPopover(); } catch {}
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; try { t.hidePopover(); } catch {} }, 2600);
  }
  async function copy(text, label = "Copiado") {
    try { await navigator.clipboard.writeText(String(text)); toast(`${label} ✓`); }
    catch { toast("No se pudo copiar", true); }
  }
  const copyBtn = (value, label) =>
    h("button", { type: "button", class: "copy", title: `Copiar ${label}`, "aria-label": `Copiar ${label}`, onclick: (e) => { e.stopPropagation(); copy(value, label); } }, svg(ICON.copy, 15));

  // ---------- API ----------
  async function api(path, opts = {}) {
    const res = await fetch(`/api/admin/${path}`, {
      credentials: "same-origin",
      cache: "no-store",
      ...opts,
      headers: opts.body ? { "Content-Type": "application/json" } : {},
    });
    if (res.status === 403) {
      toast("Su sesión venció. Recargue la página para entrar de nuevo.", true);
      throw new Error("403");
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
      toast(body.error ? `No se guardó: ${body.error}` : "Algo falló. Intente de nuevo.", true);
      throw new Error(body.error || String(res.status));
    }
    return body;
  }
  const patch = (id, data) => api(`orders/${id}`, { method: "PATCH", body: JSON.stringify(data) });

  async function loadAll() {
    try {
      const [meta, list] = await Promise.all([state.meta ? { ...state.meta } : api("meta"), api("orders")]);
      state.meta = meta;
      state.orders = list.orders;
      render();
    } catch (e) {
      if (!state.orders.length) $("[data-board]").replaceChildren(h("p", { class: "loading", text: "No se pudieron cargar los pedidos." }));
    }
  }

  // ---------- board ----------
  function matches(o) {
    const q = state.q.trim().toLowerCase();
    if (!q) return true;
    const digits = q.replace(/\D/g, "");
    return o.name.toLowerCase().includes(q) || o.ref.toLowerCase().includes(q) ||
      (digits.length >= 3 && o.whatsapp.replace(/\D/g, "").includes(digits));
  }

  function card(o) {
    const c = h("article", {
      class: "card", tabindex: "0", draggable: !isPhone(), "data-id": o.id,
      "aria-label": `${o.ref}, ${o.name}`,
      onclick: () => openDetail(o.id),
      onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(o.id); } },
      ondragstart: (e) => { e.dataTransfer.setData("text/plain", String(o.id)); e.dataTransfer.effectAllowed = "move"; c.classList.add("is-drag"); },
      ondragend: () => c.classList.remove("is-drag"),
    },
      h("div", { class: "card-top" },
        h("span", { class: "ref", text: o.ref }),
        o.quoted_total != null ? h("span", { class: "total", text: money(o.quoted_total) }) : h("span", { class: "total total--none", text: "Sin cotizar" }),
      ),
      h("p", { class: "card-name", text: o.name }),
      h("p", { class: "card-meta", text: `${o.province} · ${o.pairs} ${o.pairs === 1 ? "par" : "pares"}` }),
      h("div", { class: "card-foot" },
        h("span", { text: fmtDate(o.created_at) }),
        h("span", { class: "days", text: `${daysIn(o.status_at)} aquí` }),
      ),
      isPhone() ? h("button", { type: "button", class: "card-move", onclick: (e) => { e.stopPropagation(); openMover(o); } }, svg(ICON.move, 15), "Mover a…") : null,
    );
    return c;
  }

  function column(stage, list) {
    const col = h("section", { class: `col col--${stage.id}`, "data-stage": stage.id, "aria-label": stage.label },
      h("header", { class: "col-head" }, h("h2", { text: stage.label }), h("span", { class: "count", text: String(list.length) })),
    );
    const body = h("div", { class: "col-body" }, list.length ? list.map(card) : h("p", { class: "empty", text: "Nada aquí" }));
    col.append(body);
    col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("is-over"); });
    col.addEventListener("dragleave", (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove("is-over"); });
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("is-over");
      const id = Number(e.dataTransfer.getData("text/plain"));
      if (id) moveTo(id, stage.id);
    });
    return col;
  }

  function render() {
    const visible = state.orders.filter(matches);
    const by = Object.fromEntries(STAGES.map((s) => [s.id, []]));
    for (const o of visible) by[o.status]?.push(o);

    // Phone tabs, one stage at a time.
    const tabs = $("[data-tabs]");
    tabs.replaceChildren(...STAGES.map((s) =>
      h("button", {
        type: "button", class: "tab", "aria-pressed": String(state.tab === s.id),
        onclick: () => { state.tab = s.id; $("[data-filter]").value = s.id; state.stage = s.id; render(); },
      }, s.label, h("span", { class: "tab-n", text: String(by[s.id].length) })),
    ));

    const board = $("[data-board]");
    if (isPhone()) {
      const stage = STAGES.find((s) => s.id === (state.stage || state.tab)) ?? STAGES[0];
      board.replaceChildren(column(stage, by[stage.id]));
      board.dataset.mode = "phone";
      const on = tabs.querySelector('[aria-pressed="true"]');
      if (on) on.scrollIntoView({ block: "nearest", inline: "nearest" });
      return;
    }
    board.dataset.mode = "desk";
    const stages = state.stage ? STAGES.filter((s) => s.id === state.stage) : STAGES.filter((s) => s.id !== "cancelado");
    const cols = stages.map((s) => column(s, by[s.id]));
    if (!state.stage) {
      const n = by.cancelado.length;
      if (state.showCancel) {
        const c = column(STAGES[6], by.cancelado);
        c.querySelector(".col-head").append(h("button", { type: "button", class: "link", text: "Ocultar", onclick: () => { state.showCancel = false; render(); } }));
        cols.push(c);
      } else {
        const rail = h("button", {
          type: "button", class: "col-rail", "data-stage": "cancelado", "aria-label": `Ver cancelados (${n})`,
          onclick: () => { state.showCancel = true; render(); },
        }, h("span", { text: "Cancelado" }), h("span", { class: "count", text: String(n) }));
        rail.addEventListener("dragover", (e) => { e.preventDefault(); rail.classList.add("is-over"); });
        rail.addEventListener("dragleave", () => rail.classList.remove("is-over"));
        rail.addEventListener("drop", (e) => { e.preventDefault(); rail.classList.remove("is-over"); const id = Number(e.dataTransfer.getData("text/plain")); if (id) moveTo(id, "cancelado"); });
        cols.push(rail);
      }
    }
    board.replaceChildren(...cols);
  }

  async function moveTo(id, status) {
    const o = state.orders.find((x) => x.id === id);
    if (!o || o.status === status) return;
    const prev = { status: o.status, status_at: o.status_at };
    Object.assign(o, { status, status_at: new Date().toISOString() });
    render();
    try {
      const { order } = await patch(id, { status });
      Object.assign(o, { status: order.status, status_at: order.status_at });
      toast(`${o.ref} → ${STAGE[status]}`);
      if (state.open && state.open.id === id && !(state.dirty && state.dirty.size)) fillDetail(order);
    } catch {
      Object.assign(o, prev);
      render();
    }
  }

  // ---------- "Mover a…" (phone) ----------
  function openMover(o) {
    const d = $("[data-mover]");
    d.replaceChildren(
      h("p", { class: "mover-title", text: `Mover ${o.ref} a…` }),
      ...STAGES.map((s) => h("button", {
        type: "button", class: `mover-opt${s.id === o.status ? " is-current" : ""}`, disabled: s.id === o.status,
        onclick: () => { d.close(); moveTo(o.id, s.id); },
      }, s.label, s.id === o.status ? h("span", { class: "muted", text: " (aquí)" }) : null)),
      h("button", { type: "button", class: "mover-cancel", text: "Cancelar", onclick: () => d.close() }),
    );
    d.showModal();
  }
  $("[data-mover]").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  // ---------- detail ----------
  async function openDetail(id) {
    const d = $("[data-detail]");
    d.replaceChildren(h("p", { class: "loading", text: "Abriendo…" }));
    if (!d.open) d.showModal();
    try {
      const { order } = await api(`orders/${id}`);
      fillDetail(order);
    } catch { d.close(); }
  }
  function closeDetail() {
    if (state.dirty && state.dirty.size && !confirm("Hay cambios sin guardar. ¿Cerrar igual?")) return;
    $("[data-detail]").close();
  }
  $("[data-detail]").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeDetail(); });
  $("[data-detail]").addEventListener("cancel", (e) => { e.preventDefault(); closeDetail(); });
  $("[data-detail]").addEventListener("close", () => { state.open = null; state.dirty = null; });

  const field = (label, input, extra) => h("label", { class: "f" }, h("span", { class: "f-label", text: label }), input, extra);
  const section = (title, ...kids) => h("section", { class: "d-sec" }, h("h3", { text: title }), ...kids);

  // A receta: the order's (prescription + rx) or one pair's own (rx_override). `tag` names the
  // copy buttons ("OD SPH" or "Par 2 OD SPH") so the toast says which one was copied.
  function rxBlock(prescription, rx, tag = "") {
    if (prescription !== "typed" || !rx) {
      return h("p", { class: "note", text: prescription === "whatsapp" ? "📲 La receta llega por WhatsApp. Revísela en el chat antes de pedir." : "🩺 No tiene receta todavía. Recuérdele el examen (rebaja de hasta $10 con el recibo)." });
    }
    const t = (s) => (tag ? `${tag} ${s}` : s);
    const hasAdd = rx.od.add != null || rx.oi.add != null;
    const cols = ["SPH", "CYL", "AXIS", ...(hasAdd ? ["ADD"] : [])];
    const val = (e, k) => (k === "SPH" ? signed(e.sph) : k === "CYL" ? signed(e.cyl) : k === "AXIS" ? (e.axis == null ? "" : String(e.axis)) : signed(e.add));
    const row = (label, sub, e) => h("tr", {},
      h("th", { scope: "row" }, h("span", { text: label }), h("span", { class: "muted", text: sub })),
      ...cols.map((k) => { const v = val(e, k); return h("td", {}, v ? h("span", { class: "cell" }, h("b", { text: v }), copyBtn(v, t(`${label} ${k}`))) : h("span", { class: "muted", text: "—" })); }),
    );
    const table = h("table", { class: "rx" },
      h("thead", {}, h("tr", {}, h("th", { text: "" }), ...cols.map((k) => h("th", { scope: "col", text: k })))),
      h("tbody", {}, row("OD", "derecho", rx.od), row("OS", "izquierdo (OI)", rx.oi)),
    );
    let pd;
    if (!rx.pd) pd = h("p", { class: "note", text: "PD: no la tiene. Pídala o ayúdele a medirla antes de pedir." });
    else if ("single" in rx.pd) pd = h("div", { class: "pd" }, h("span", { class: "f-label", text: "PD (un número)" }), h("span", { class: "cell" }, h("b", { text: String(rx.pd.single) }), copyBtn(rx.pd.single, t("PD"))));
    else pd = h("div", { class: "pd" }, h("span", { class: "f-label", text: "PD (dos números)" }),
      h("span", { class: "cell" }, h("span", { class: "muted", text: "Derecho " }), h("b", { text: rx.pd.right.toFixed(1) }), copyBtn(rx.pd.right.toFixed(1), t("PD derecho"))),
      h("span", { class: "cell" }, h("span", { class: "muted", text: "Izquierdo " }), h("b", { text: rx.pd.left.toFixed(1) }), copyBtn(rx.pd.left.toFixed(1), t("PD izquierdo"))));
    const eyeLine = (label, e) => `${label}: SPH ${signed(e.sph)} CYL ${signed(e.cyl)} AXIS ${e.axis ?? "-"}${hasAdd ? ` ADD ${e.add == null ? "-" : signed(e.add)}` : ""}`;
    const pdLine = !rx.pd ? "PD: falta" : "single" in rx.pd ? `PD: ${rx.pd.single}` : `PD: derecho ${rx.pd.right.toFixed(1)} / izquierdo ${rx.pd.left.toFixed(1)}`;
    const all = [eyeLine("OD", rx.od), eyeLine("OS", rx.oi), pdLine].join("\n");
    return h("div", {},
      h("div", { class: "rx-wrap" }, table),
      pd,
      h("div", { class: "copy-all" }, h("pre", { text: all }), h("button", { type: "button", class: "btn btn--soft", onclick: () => copy(all, t("Receta")) }, svg(ICON.copy, 15), "Copiar todo")),
      tag ? null : h("p", { class: "hint", text: "Mismo orden que el formulario de EyeBuyDirect: OD arriba, OS (izquierdo) abajo, luego PD." }),
    );
  }

  function fillDetail(o) {
    state.open = o;
    const m = state.meta;
    const d = $("[data-detail]");
    const dirty = new Set();
    state.dirty = dirty;
    const inputs = {};
    const markDirty = (k) => { dirty.add(k); saveBtn.disabled = false; saveBtn.textContent = "Guardar cambios"; };
    const inp = (k, props = {}) => {
      const el = h(props.tag || "input", { class: "in", name: k, oninput: () => markDirty(k), onchange: () => markDirty(k), ...props, tag: null });
      if (props.tag !== "select") el.value = o[k] == null ? "" : String(o[k]);
      inputs[k] = el;
      return el;
    };

    // Stage select saves at once.
    const stageSel = h("select", { class: "in stage-sel", "aria-label": "Etapa", onchange: (e) => moveTo(o.id, e.target.value) },
      STAGES.map((s) => h("option", { value: s.id, selected: s.id === o.status, text: s.label })));

    // Contact
    const ownN = o.items.filter((i) => i.rx_override).length;
    const phone = prettyPhone(o.whatsapp);
    const contact = section("Contacto",
      h("div", { class: "kv" },
        h("span", { class: "k", text: "Nombre" }), h("span", { class: "v" }, h("span", { text: o.name }), copyBtn(o.name, "nombre")),
        h("span", { class: "k", text: "WhatsApp" }), h("span", { class: "v" }, h("span", { text: phone }), copyBtn(o.whatsapp, "teléfono")),
        h("span", { class: "k", text: "Pago" }), h("span", { class: "v", text: o.payment_pref }),
        h("span", { class: "k", text: "Receta" }), h("span", { class: "v", text: RX_MODE[o.prescription] + (ownN ? ` · ${ownN} ${ownN === 1 ? "par" : "pares"} con otra receta` : "") }),
      ),
      h("a", { class: "btn btn--wa", href: waLink(o.whatsapp), target: "_blank", rel: "noopener noreferrer" }, svg(ICON.wa, 18), "Abrir chat de WhatsApp"),
    );

    // Pairs
    const anyOwn = o.items.some((i) => i.rx_override);
    const pairRx = (i, n) => {
      const r = i.rx_override;
      if (!r) return h("p", { class: "pair-rx pair-rx--main", text: "Receta del pedido" });
      return h("div", { class: "pair-rx" },
        h("p", { class: "pair-rx-head" }, h("b", { text: "Su propia receta" }), r.for ? h("span", { text: ` · Para: ${r.for}` }) : null),
        rxBlock(r.prescription, r.rx, `Par ${n + 1}`),
      );
    };
    const pairs = section(`Pares (${o.items.reduce((n, i) => n + i.qty, 0)})`,
      h("ul", { class: "pairs" }, o.items.map((i, n) => h("li", { class: "pair" },
        h("div", { class: "pair-top" },
          h("a", { href: `/lentes/${encodeURIComponent(i.slug)}`, target: "_blank", rel: "noopener noreferrer", class: "pair-name" }, `Lentes ${i.frame}`, svg(ICON.ext, 14)),
          h("span", { class: "pair-price", text: `${money(i.frame_price)}${i.qty > 1 ? ` × ${i.qty}` : ""}` }),
        ),
        h("p", { class: "pair-meta" }, h("span", { text: `Color: ${i.color}` }), copyBtn(i.color, "color")),
        h("p", { class: "pair-meta", text: `Lente: ${m.lenses[i.lens] || i.lens}` }),
        i.extras.length ? h("p", { class: "pair-meta", text: `Extras: ${i.extras.map((x) => m.extras[x] || x).join(", ")}` }) : null,
        pairRx(i, n),
      ))),
      h("p", { class: "sub", text: `Subtotal monturas (precio web): ${money(o.frame_subtotal)}` }),
    );

    // Address
    const provSel = h("select", { class: "in", name: "province", onchange: () => { fillCantons(); markDirty("province"); markDirty("canton"); } },
      Object.keys(m.provinces).map((p) => h("option", { value: p, selected: p === o.province, text: p })));
    const cantSel = h("select", { class: "in", name: "canton", onchange: () => { markDirty("province"); markDirty("canton"); } });
    const fillCantons = () => cantSel.replaceChildren(...(m.provinces[provSel.value] || []).map((c) => h("option", { value: c, selected: c === o.canton, text: c })));
    fillCantons();
    inputs.province = provSel; inputs.canton = cantSel;
    const addr = section("Dirección de envío",
      h("div", { class: "grid2" },
        field("Nombre", inp("name", { maxlength: 80, autocomplete: "off" })),
        field("Teléfono", inp("whatsapp", { maxlength: 20, inputmode: "tel", autocomplete: "off" })),
        field("Provincia", provSel),
        field("Cantón", cantSel),
        field("Distrito", inp("district", { maxlength: 80, autocomplete: "off" })),
        field("Código postal", inp("postal_code", { maxlength: 12, inputmode: "numeric", autocomplete: "off" })),
      ),
      field("Señas exactas", inp("address_line", { tag: "textarea", rows: 2, maxlength: 300 })),
    );
    inputs.whatsapp.value = phone;

    // Price helper
    const out = h("output", { class: "calc-out" });
    const calcVal = () => {
      const f = parseFloat(inputs.frame_cost.value), l = parseFloat(inputs.lens_cost.value);
      if (!(f >= 0) || !(l >= 0)) return null;
      return Math.round((f + l + SHIPPING) * MARKUP * 100) / 100;
    };
    const paint = () => { const v = calcVal(); out.textContent = v == null ? "Escriba los dos costos" : money(v); useBtn.disabled = v == null; };
    const useBtn = h("button", { type: "button", class: "btn btn--soft", onclick: () => { const v = calcVal(); if (v != null) { inputs.quoted_total.value = v.toFixed(2); markDirty("quoted_total"); } } }, "Usar como total");
    const price = section("Precio",
      h("p", { class: "formula" }, "(montura + lentes + ", h("b", { text: "$30 envío" }), ") × ", h("b", { text: "1.50" })),
      h("div", { class: "grid2" },
        field("Costo montura EyeBuyDirect", h("span", { class: "money" }, "$", inp("frame_cost", { type: "number", min: 0, step: "0.01", inputmode: "decimal", oninput: () => { markDirty("frame_cost"); paint(); } }))),
        field("Costo lentes EyeBuyDirect", h("span", { class: "money" }, "$", inp("lens_cost", { type: "number", min: 0, step: "0.01", inputmode: "decimal", oninput: () => { markDirty("lens_cost"); paint(); } }))),
      ),
      h("div", { class: "calc" }, h("span", { class: "f-label", text: "Cotización" }), out, useBtn),
      field("Total cotizado al cliente", h("span", { class: "money money--big" }, "$", inp("quoted_total", { type: "number", min: 0, step: "0.01", inputmode: "decimal" }))),
    );
    paint();

    const ebd = section("EyeBuyDirect y envío",
      h("div", { class: "grid2" },
        field("Número de pedido EyeBuyDirect", inp("ebd_order_number", { maxlength: 40, autocomplete: "off" })),
        field("Rastreo / guía", inp("tracking", { maxlength: 200, autocomplete: "off" })),
      ),
    );
    const notes = section("Notas", inp("notes", { tag: "textarea", rows: 3, maxlength: 4000, placeholder: "Solo para ustedes" }));

    const history = section("Historial",
      h("ol", { class: "timeline" }, o.events.slice().reverse().map((e) => h("li", {},
        h("span", { class: "t-when", text: fmtDateTime(e.at) }),
        h("span", { class: "t-what", text: e.kind === "status" ? `${STAGE[e.from_status] || e.from_status} → ${STAGE[e.to_status] || e.to_status}` : e.detail || e.kind }),
        e.actor && e.actor !== "web" ? h("span", { class: "t-who", text: e.actor }) : null,
      ))),
    );
    // Where the customer came from: ad tags, the first page they saw, the page they ordered from.
    const from = [];
    if (o.utm_source || o.utm_campaign) from.push(`Vino de: ${[o.utm_source, o.utm_medium, o.utm_campaign, o.utm_content].filter(Boolean).join(" · ")}`);
    if (o.utm_term) from.push(`Palabra del anuncio: ${o.utm_term}`);
    if (o.landing) from.push(`Entró por: ${o.landing}`);
    if (o.page) from.push(`Pidió desde: ${o.page}`);
    if (o.fbclid) from.push(`Clic de Facebook/Instagram (fbclid): ${o.fbclid}`);
    if (o.gclid) from.push(`Clic de Google (gclid): ${o.gclid}`);
    for (const line of from) history.append(h("p", { class: "hint hint--from", text: line }));

    const saveBtn = h("button", { type: "button", class: "btn btn--primary", disabled: true, text: "Sin cambios", onclick: save });
    async function save() {
      const body = {};
      const num = (v) => (v.trim() === "" ? null : Number(v));
      for (const k of dirty) {
        const el = inputs[k];
        if (!el) continue;
        body[k] = ["quoted_total", "frame_cost", "lens_cost"].includes(k) ? num(el.value) : el.value;
      }
      if (("province" in body) !== ("canton" in body)) { body.province = provSel.value; body.canton = cantSel.value; }
      for (const k of ["quoted_total", "frame_cost", "lens_cost"]) if (k in body && body[k] != null && !(body[k] >= 0)) { toast("Revise los montos", true); return; }
      saveBtn.disabled = true; saveBtn.textContent = "Guardando…";
      try {
        const { order } = await patch(o.id, body);
        const card = state.orders.find((x) => x.id === o.id);
        if (card) Object.assign(card, { name: order.name, whatsapp: order.whatsapp, province: order.province, quoted_total: order.quoted_total, ebd_order_number: order.ebd_order_number });
        render();
        fillDetail(order);
        toast("Guardado ✓");
      } catch { saveBtn.disabled = false; saveBtn.textContent = "Guardar cambios"; }
    }

    d.replaceChildren(
      h("div", { class: "d-head" },
        h("div", {},
          h("p", { class: "ref" }, o.ref, h("span", { class: "when", text: ` · ${fmtDateTime(o.created_at)}` })),
          h("h2", { id: "d-title", text: o.name }),
        ),
        h("button", { type: "button", class: "icon-btn", "aria-label": "Cerrar", onclick: closeDetail }, svg(ICON.close, 20)),
      ),
      h("div", { class: "d-stage" }, h("span", { class: "f-label", text: "Etapa" }), stageSel, h("span", { class: "days", text: `${daysIn(o.status_at)} en esta etapa` })),
      h("div", { class: "d-body" },
        contact, pairs,
        section(anyOwn ? "Receta del pedido (pares sin receta propia)" : "Receta para EyeBuyDirect", rxBlock(o.prescription, o.rx)),
        addr, price, ebd, notes, history,
      ),
      h("div", { class: "d-foot" }, h("button", { type: "button", class: "btn btn--ghost", text: "Cerrar", onclick: closeDetail }), saveBtn),
    );
  }

  // ---------- wiring ----------
  const filter = $("[data-filter]");
  STAGES.forEach((s) => filter.append(h("option", { value: s.id, text: s.label })));
  filter.addEventListener("change", () => { state.stage = filter.value; if (filter.value) state.tab = filter.value; render(); });
  let qTimer;
  $("[data-search]").addEventListener("input", (e) => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value; render(); }, 120); });
  $("[data-refresh]").addEventListener("click", () => { loadAll(); toast("Actualizado"); });
  let wasPhone = isPhone();
  addEventListener("resize", () => { if (isPhone() !== wasPhone) { wasPhone = isPhone(); render(); } });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !$("[data-detail]").open) loadAll(); });
  loadAll();
})();
