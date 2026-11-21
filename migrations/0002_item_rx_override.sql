-- A pair can have its own receta (reading glasses, a pair for someone else).
-- NULL = the pair uses the order's receta (orders.prescription / rx_json). Existing rows stay NULL.
-- JSON: {"prescription":"typed"|"whatsapp"|"none","rx":{...}|null,"for":"Mamá"}
ALTER TABLE order_items ADD COLUMN rx_override_json TEXT;
