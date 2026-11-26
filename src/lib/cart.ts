// The cart, in the browser. Saved in localStorage so it survives page changes and visits.
// Only frame prices are added up. Lenses and extras are quoted by WhatsApp from the
// customer's prescription, so the cart never shows a lens price or a grand total.
import { EXTRAS, LENSES, extraLabel, lensLabel, signed } from "./store";

export interface CartColor { n: string; t: string; b: string } // name, thumbnail url, swatch css
export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  colors: CartColor[];
  lens: string;
  extras: string[];
  qty: number;
}

const KEY = "lpv_cart_v1";
const MAX_QTY = 5;
export const CHANGE = "lpv:cart";

const safeParse = <T>(raw: string | null, fallback: T): T => {
  try { return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};

export function getItems(): CartItem[] {
  const list = safeParse<CartItem[]>(localStorage.getItem(KEY), []);
  return Array.isArray(list) ? list.filter((i) => i && i.slug && i.name && typeof i.price === "number") : [];
}

function save(items: CartItem[], detail: Record<string, unknown> = {}) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  window.dispatchEvent(new CustomEvent(CHANGE, { detail }));
}

const sameConfig = (a: Omit<CartItem, "id" | "qty" | "colors">, b: Omit<CartItem, "id" | "qty" | "colors">) =>
  a.slug === b.slug && a.color === b.color && a.lens === b.lens && [...a.extras].sort().join() === [...b.extras].sort().join();

const uid = () => Math.random().toString(36).slice(2, 9);

export function addItem(item: Omit<CartItem, "id" | "qty">): string {
  const items = getItems();
  const hit = items.find((i) => sameConfig(i, item));
  if (hit) hit.qty = Math.min(MAX_QTY, hit.qty + 1);
  const id = hit ? hit.id : uid();
  if (!hit) items.push({ ...item, id, qty: 1 });
  save(items, { added: id });
  return id;
}

export function updateItem(id: string, patch: Partial<CartItem>) {
  let items = getItems();
  const it = items.find((i) => i.id === id);
  if (!it) return;
  Object.assign(it, patch);
  it.qty = Math.max(1, Math.min(MAX_QTY, it.qty));
  // Editing can make two lines identical: fold them into one.
  const twin = items.find((i) => i.id !== id && sameConfig(i, it));
  if (twin) {
    twin.qty = Math.min(MAX_QTY, twin.qty + it.qty);
    items = items.filter((i) => i.id !== id);
  }
  save(items);
}

export function removeItem(id: string) {
  save(getItems().filter((i) => i.id !== id), { removed: id });
}

export function clearCart() { save([]); }

export const countItems = (items = getItems()) => items.reduce((n, i) => n + i.qty, 0);
export const frameSubtotal = (items = getItems()) => items.reduce((n, i) => n + i.price * i.qty, 0);
export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export const thumbOf = (i: CartItem) => i.colors.find((c) => c.n === i.color)?.t ?? i.colors[0]?.t ?? "";

export const describeLens = (i: CartItem) => {
  const lens = lensLabel(i.lens) || "Tipo de lente por definir";
  return i.lens === "nose" ? "No estoy seguro del tipo de lente" : lens;
};
export const describeExtras = (i: CartItem) => i.extras.map(extraLabel).filter(Boolean).join(", ");

// ---------- Order code, ad source, WhatsApp message ----------

const ABC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function makeCode(len = 5) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return "LPV-" + Array.from(b, (x) => ABC[x % ABC.length]).join("");
}

export function adSource(): Record<string, string> {
  return safeParse<Record<string, string>>(sessionStorage.getItem("lpv_src"), {});
}

export interface Order {
  code: string;
  ts: string;
  name: string;
  whatsapp: string;
  province: string;
  canton: string;
  rx: "typed" | "whatsapp" | "none";
  /** Only when rx is "typed". */
  rxValues?: RxTyped | null;
  payment: string;
  items: CartItem[];
  /** Pairs with their own receta, by cart item id. Pairs not listed use the order's receta. */
  pairRx?: Record<string, PairRx>;
  source: Record<string, string>;
}

export interface PairRx { prescription: "typed" | "whatsapp" | "none"; rx: RxTyped | null; for: string }

export interface RxEye { sph: number; cyl: number; axis: number | null; add: number | null }
export interface RxTyped {
  od: RxEye; // ojo derecho
  oi: RxEye; // ojo izquierdo
  pd: { single: number } | { right: number; left: number } | null;
}

const rxEyeLine = (label: string, e: RxEye) => {
  const parts = [`Esf ${signed(e.sph)}`];
  if (e.cyl !== 0) parts.push(`Cil ${signed(e.cyl)}`, `Eje ${e.axis ?? "?"}`);
  if (e.add != null) parts.push(`Adic ${signed(e.add)}`);
  return `${label}: ${parts.join(" · ")}`;
};

/** The typed prescription as WhatsApp lines. */
export function rxLines(rx: RxTyped): string[] {
  const pd = !rx.pd ? "no la tengo"
    : "single" in rx.pd ? String(rx.pd.single)
    : `OD ${rx.pd.right} · OI ${rx.pd.left}`;
  return [rxEyeLine("OD", rx.od), rxEyeLine("OI", rx.oi), `DP: ${pd}`];
}

export function orderMessage(o: Order): string {
  const L: string[] = [];
  const first = o.name.trim().split(/\s+/)[0];
  L.push(`Hola, soy ${first}. Quiero hacer este pedido:`);
  L.push("");
  const own = o.pairRx ?? {};
  const onDefault: number[] = [];
  o.items.forEach((i, n) => {
    L.push(`*${n + 1}. Lentes ${i.name}*${i.qty > 1 ? ` (${i.qty} pares)` : ""}`);
    L.push(`Color: ${i.color}`);
    L.push(`Lente: ${describeLens(i)}`);
    if (i.extras.length) L.push(`Extras: ${describeExtras(i)}`);
    L.push(`Montura: ${money(i.price)}${i.qty > 1 ? ` c/u` : ""}`);
    const p = own[i.id];
    if (p) {
      const head = `Receta de este par${p.for ? ` (${p.for})` : ""}`;
      if (p.prescription === "typed" && p.rx) L.push(`${head}:`, ...rxLines(p.rx));
      else L.push(`${head}: ${p.prescription === "none" ? "no tiene, ¿me ayudan?" : "se la envío por WhatsApp"}`);
    } else onDefault.push(n + 1);
    L.push("");
  });
  // With pairs on their own receta, say which pairs the main receta is for.
  const forPairs = onDefault.length < o.items.length && onDefault.length
    ? ` (${onDefault.length === 1 ? "par" : "pares"} ${onDefault.join(onDefault.length === 2 ? " y " : ", ")})` : "";
  L.push(`*Subtotal monturas: ${money(frameSubtotal(o.items))}*`);
  L.push("Los lentes y extras me los cotizan según mi receta.");
  L.push("");
  L.push(`Nombre: ${o.name.trim()}`);
  L.push(`Envío a: ${o.canton}, ${o.province}`);
  if (!onDefault.length) {
    // Every pair has its own receta, already written above.
  } else if (o.rx === "typed" && o.rxValues) {
    L.push(`*Mi receta${forPairs}:*`);
    L.push(...rxLines(o.rxValues));
  } else {
    L.push(`Receta${forPairs}: ${o.rx === "none" ? "no tengo, ¿me ayudan?" : "se la mando por aquí"}`);
  }
  L.push(`Pago: ${o.payment}`);
  L.push("");
  const src = [o.source.utm_source, o.source.utm_campaign, o.source.utm_content].filter(Boolean).join(" · ");
  L.push(`Pedido ${o.code}${src ? ` · ${src}` : ""}`);
  return L.join("\n");
}

export function orderLead(o: Order) {
  return {
    type: "order",
    ref: o.code,
    ts: o.ts,
    name: o.name.trim(),
    whatsapp: o.whatsapp,
    province: o.province,
    canton: o.canton,
    prescription: o.rx,
    rx: o.rx === "typed" && o.rxValues ? o.rxValues : null,
    payment: o.payment,
    frame_subtotal: frameSubtotal(o.items),
    items: o.items.map((i) => {
      const p = o.pairRx?.[i.id];
      return {
        frame: i.name, slug: i.slug, color: i.color, lens: i.lens, extras: i.extras, qty: i.qty, frame_price: i.price,
        ...(p ? { rx_override: { prescription: p.prescription, rx: p.prescription === "typed" ? p.rx : null, ...(p.for ? { for: p.for } : {}) } } : {}),
      };
    }),
    page: location.pathname,
    ...o.source,
  };
}

// ---------- Rendering (drawer and /carrito share this) ----------

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, any> = {}, ...kids: (Node | string | null | false)[]) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("data-") || k.startsWith("aria-") || k === "role" || k === "for" || k === "style") el.setAttribute(k, String(v));
    else (el as any)[k] = v;
  }
  for (const c of kids) if (c) el.append(c);
  return el;
};

const ICON = {
  minus: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

function editPanel(i: CartItem): HTMLElement {
  const form = h("form", { class: "ci-edit", "data-edit": i.id, "aria-label": `Editar lentes ${i.name}` });
  if (i.colors.length > 1) {
    const fs = h("fieldset", { class: "ci-fs" }, h("legend", { text: "Color" }));
    const row = h("div", { class: "ci-swatches" });
    i.colors.forEach((c) => {
      const input = h("input", { type: "radio", name: `c-${i.id}`, value: c.n, checked: c.n === i.color, class: "sr-only" });
      row.append(h("label", { class: "ci-sw", title: c.n }, input, h("span", { style: `--sw:${c.b}`, "aria-hidden": "true" }), h("span", { class: "sr-only", text: c.n })));
    });
    fs.append(row);
    form.append(fs);
  }
  const lf = h("fieldset", { class: "ci-fs" }, h("legend", { text: "Tipo de lente" }));
  LENSES.forEach((l) => {
    lf.append(h("label", { class: "ci-opt" }, h("input", { type: "radio", name: `l-${i.id}`, value: l.id, checked: l.id === i.lens }), h("span", { text: l.label })));
  });
  form.append(lf);
  const ef = h("fieldset", { class: "ci-fs" }, h("legend", { text: "Extras (opcional)" }));
  EXTRAS.forEach((e) => {
    ef.append(h("label", { class: "ci-opt" }, h("input", { type: "checkbox", name: `e-${i.id}`, value: e.id, checked: i.extras.includes(e.id) }), h("span", { text: e.label })));
  });
  form.append(ef);
  form.append(
    h("div", { class: "ci-edit-actions" },
      h("button", { type: "submit", class: "btn-primary btn-sm", text: "Guardar cambios", "data-focus": `${i.id}:save` }),
      h("button", { type: "button", class: "ci-link", text: "Cancelar", "data-act": "cancel", "data-id": i.id }),
    ),
  );
  return form;
}

function itemRow(i: CartItem, opts: { open?: boolean; fresh?: boolean }): HTMLElement {
  const href = `/lentes/${i.slug}`;
  const thumb = thumbOf(i);
  const extras = describeExtras(i);
  const qty = h("div", { class: "qty", role: "group", "aria-label": `Cantidad de lentes ${i.name}` },
    h("button", { type: "button", class: "qty-btn", "aria-label": "Uno menos", disabled: i.qty <= 1, "data-act": "dec", "data-id": i.id, "data-focus": `${i.id}:dec`, innerHTML: ICON.minus }),
    h("output", { class: "qty-n", "aria-live": "polite", text: String(i.qty) }),
    h("button", { type: "button", class: "qty-btn", "aria-label": "Uno más", disabled: i.qty >= MAX_QTY, "data-act": "inc", "data-id": i.id, "data-focus": `${i.id}:inc`, innerHTML: ICON.plus }),
  );
  const li = h("li", { class: `ci${opts.fresh ? " is-fresh" : ""}`, "data-id": i.id },
    h("a", { class: "ci-img", href, tabIndex: -1, "aria-hidden": "true" }, thumb ? h("img", { src: thumb, alt: "", width: 160, height: 80, loading: "lazy", decoding: "async" }) : null),
    h("div", { class: "ci-body" },
      h("div", { class: "ci-top" },
        h("a", { class: "ci-name", href, text: `Lentes ${i.name}` }),
        h("span", { class: "ci-price", text: money(i.price * i.qty) }),
      ),
      h("p", { class: "ci-meta", text: `${i.color} · ${describeLens(i)}` }),
      extras ? h("p", { class: "ci-meta", text: `Extras: ${extras}` }) : null,
      h("p", { class: "ci-quote", text: i.qty > 1 ? `${money(i.price)} c/u, solo montura. Lentes: se cotizan según su receta` : "Solo montura. Lentes: se cotizan según su receta" }),
      h("div", { class: "ci-actions" },
        qty,
        h("button", { type: "button", class: "ci-link", text: "Editar", "aria-expanded": opts.open ? "true" : "false", "data-act": "edit", "data-id": i.id, "data-focus": `${i.id}:edit` }),
        h("button", { type: "button", class: "ci-link", text: "Quitar", "aria-label": `Quitar lentes ${i.name}`, "data-act": "remove", "data-id": i.id }),
      ),
    ),
    opts.open ? editPanel(i) : null,
  );
  return li;
}

/** Renders the item list into `list` and keeps it in sync with the store. */
export function mountCartList(list: HTMLElement, onChange?: (items: CartItem[]) => void) {
  const open = new Set<string>();
  let fresh = "";
  const announce = document.querySelector<HTMLElement>("[data-cart-live]");
  const say = (t: string) => { if (announce) { announce.textContent = ""; setTimeout(() => (announce.textContent = t), 30); } };

  const render = (focusKey?: string) => {
    const items = getItems();
    list.replaceChildren(...items.map((i) => itemRow(i, { open: open.has(i.id), fresh: i.id === fresh })));
    fresh = "";
    if (focusKey) list.querySelector<HTMLElement>(`[data-focus="${focusKey}"]`)?.focus();
    onChange?.(items);
  };

  list.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
    if (!btn) return;
    const id = btn.dataset.id!;
    const it = getItems().find((i) => i.id === id);
    if (!it) return;
    const act = btn.dataset.act;
    if (act === "inc" || act === "dec") {
      updateItem(id, { qty: it.qty + (act === "inc" ? 1 : -1) });
      render(`${id}:${act}`);
    } else if (act === "edit" || act === "cancel") {
      if (open.has(id)) open.delete(id); else open.add(id);
      render(act === "edit" && open.has(id) ? undefined : `${id}:edit`);
      if (open.has(id)) list.querySelector<HTMLElement>(`[data-edit="${id}"] input`)?.focus();
    } else if (act === "remove") {
      const row = btn.closest<HTMLElement>(".ci")!;
      const done = () => { removeItem(id); open.delete(id); say(`Se quitaron los lentes ${it.name} del carrito.`); render(); list.closest<HTMLElement>("[data-cart-scope]")?.querySelector<HTMLElement>("[data-cart-focus-after-remove]")?.focus(); };
      if (matchMedia("(prefers-reduced-motion: reduce)").matches || !row.animate) return done();
      row.style.overflow = "hidden";
      row.animate(
        [{ opacity: 1, transform: "none", height: `${row.offsetHeight}px` }, { opacity: 0, transform: "translateX(24px)", height: `${row.offsetHeight}px`, offset: 0.5 }, { opacity: 0, height: "0px", paddingTop: "0px", paddingBottom: "0px", marginTop: "0px" }],
        { duration: 380, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" },
      ).finished.then(done);
    }
  });

  list.addEventListener("submit", (e) => {
    const form = (e.target as HTMLElement).closest<HTMLFormElement>("[data-edit]");
    if (!form) return;
    e.preventDefault();
    const id = form.dataset.edit!;
    const fd = new FormData(form);
    const patch: Partial<CartItem> = {
      lens: String(fd.get(`l-${id}`) ?? ""),
      extras: fd.getAll(`e-${id}`).map(String),
    };
    const c = fd.get(`c-${id}`);
    if (c) patch.color = String(c);
    open.delete(id);
    updateItem(id, patch);
    say("Cambios guardados.");
    render(getItems().some((i) => i.id === id) ? `${id}:edit` : undefined);
  });

  window.addEventListener(CHANGE, (e) => {
    const d = (e as CustomEvent).detail || {};
    if (d.added) fresh = d.added;
    if (!list.contains(document.activeElement)) render();
  });
  window.addEventListener("storage", (e) => { if (e.key === KEY) render(); });
  render();
  return render;
}

/** Keeps every [data-cart-count] badge in sync, with a small bump when it grows. */
export function mountBadges() {
  let last = countItems();
  const paint = (bump: boolean) => {
    const n = countItems();
    document.documentElement.classList.toggle("has-cart", n > 0);
    document.querySelectorAll<HTMLElement>("[data-cart-count]").forEach((b) => {
      b.textContent = String(n);
      b.hidden = n === 0;
      if (bump && n > last) { b.classList.remove("is-bump"); void b.offsetWidth; b.classList.add("is-bump"); }
    });
    document.querySelectorAll<HTMLElement>("[data-cart-label]").forEach((el) => {
      el.setAttribute("aria-label", n ? `Carrito, ${n} ${n === 1 ? "par" : "pares"}` : "Carrito, vacío");
    });
    last = n;
  };
  window.addEventListener(CHANGE, () => paint(true));
  window.addEventListener("storage", () => paint(false));
  paint(false);
}

/** Compact read-only rows for the checkout summary and the confirmation page. */
export function summaryRows(items: CartItem[]): HTMLElement[] {
  return items.map((i) => {
    const extras = describeExtras(i);
    return h("li", { class: "co-item" },
      h("img", { src: thumbOf(i), alt: "", width: 96, height: 48 }),
      h("div", {},
        h("p", { class: "co-item-top" }, h("strong", { text: `${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""}` }), h("span", { text: money(i.price * i.qty) })),
        h("p", { class: "co-item-meta", text: `${i.color} · ${describeLens(i)}${extras ? ` · ${extras}` : ""}` }),
      ),
    );
  });
}
