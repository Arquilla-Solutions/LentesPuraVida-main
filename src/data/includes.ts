// "Su cotización incluye": one list for every product page, so the promise reads the same
// everywhere. Change it here only, and only with Sebastian's OK.
export const INCLUDES_TITLE = "Su cotización incluye";

export const INCLUDES: string[] = [
  "Lentes graduados hechos con su receta exacta",
  "Tratamiento anti-rayones y protección UV",
  "Estuche y paño",
  "Envío a su casa, en todo el país",
  "Ayuda por WhatsApp antes y después del pedido",
];

/** Extras are not included; this note says so under the list. Ends with a link to the lens guide. */
export const INCLUDES_EXTRAS_NOTE =
  "Los extras (antirreflejo, filtro de luz azul, fotocromáticos, polarizados) se cotizan aparte, si los quiere.";
