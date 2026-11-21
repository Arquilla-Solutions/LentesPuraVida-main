-- Lentes Pura Vida order board. One row per checkout order, its pairs, and its history.
CREATE TABLE orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  ref              TEXT    NOT NULL UNIQUE,              -- LPV-XXXXX, the code in the WhatsApp message
  created_at       TEXT    NOT NULL,                     -- ISO, server time
  updated_at       TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'no_pagado'
                   CHECK (status IN ('no_pagado','pagado','pedido_ebd','en_camino','llego','entregado','cancelado')),
  status_at        TEXT    NOT NULL,                     -- when it entered the current stage
  name             TEXT    NOT NULL,
  whatsapp         TEXT    NOT NULL,                     -- +506XXXXXXXX
  province         TEXT    NOT NULL,
  canton           TEXT    NOT NULL,
  district         TEXT    NOT NULL DEFAULT '',          -- filled by hand for the shipping address
  address_line     TEXT    NOT NULL DEFAULT '',          -- señas exactas
  postal_code      TEXT    NOT NULL DEFAULT '',
  prescription     TEXT    NOT NULL CHECK (prescription IN ('typed','whatsapp','none')),
  rx_json          TEXT,                                 -- typed prescription (JSON) or NULL
  payment_pref     TEXT    NOT NULL,
  frame_subtotal   REAL    NOT NULL,                     -- from the catalog prices, not the browser
  quoted_total     REAL,                                 -- editable
  frame_cost       REAL,                                 -- pricing helper inputs (EyeBuyDirect cost)
  lens_cost        REAL,
  notes            TEXT    NOT NULL DEFAULT '',
  ebd_order_number TEXT    NOT NULL DEFAULT '',
  tracking         TEXT    NOT NULL DEFAULT '',
  page             TEXT    NOT NULL DEFAULT '',
  utm_source       TEXT    NOT NULL DEFAULT '',
  utm_medium       TEXT    NOT NULL DEFAULT '',
  utm_campaign     TEXT    NOT NULL DEFAULT '',
  utm_content      TEXT    NOT NULL DEFAULT '',
  utm_term         TEXT    NOT NULL DEFAULT '',
  fbclid           TEXT    NOT NULL DEFAULT '',
  gclid            TEXT    NOT NULL DEFAULT '',
  landing          TEXT    NOT NULL DEFAULT ''
);
CREATE INDEX orders_status ON orders (status, created_at);

CREATE TABLE order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  slug        TEXT    NOT NULL,
  frame       TEXT    NOT NULL,
  color       TEXT    NOT NULL,
  lens        TEXT    NOT NULL,
  extras_json TEXT    NOT NULL DEFAULT '[]',
  qty         INTEGER NOT NULL CHECK (qty BETWEEN 1 AND 5),
  frame_price REAL    NOT NULL
);
CREATE INDEX order_items_order ON order_items (order_id);

CREATE TABLE order_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  at          TEXT    NOT NULL,
  kind        TEXT    NOT NULL,        -- created | status | edit
  from_status TEXT,
  to_status   TEXT,
  actor       TEXT    NOT NULL DEFAULT '',
  detail      TEXT    NOT NULL DEFAULT ''
);
CREATE INDEX order_events_order ON order_events (order_id, at);

-- Fixed-window counters for POST /api/order (keys are hashed IPs, never raw IPs).
CREATE TABLE rate_limits (
  key          TEXT    PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
);
