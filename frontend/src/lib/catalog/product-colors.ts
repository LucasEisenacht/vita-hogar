export const unknownProductColorHex = "#E7DEDA";

export const productColorSwatches: Record<string, string> = {
  arena: "#EADBD4",
  beige: "#E8D8CE",
  blanco: "#FFFFFF",
  blush: "#EAD0DA",
  celeste: "#BFD9EA",
  crema: "#FFF4EF",
  dorado: "#D8B46A",
  gris: "#B9B3B0",
  lila: "#D7C3EA",
  negro: "#2F2927",
  oro: "#D8B46A",
  pink: "#DFA5B9",
  plata: "#D8D8D8",
  plateado: "#D8D8D8",
  rosa: "#DFA5B9",
  rosado: "#DFA5B9",
  transparente: "#FFFFFF",
  verde: "#BFD8C4",
  violeta: "#BFA6D8",
};

export function normalizeProductColorName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getProductColorHex(value: string) {
  const normalizedValue = normalizeProductColorName(value);
  const directHex = productColorSwatches[normalizedValue];

  if (directHex) {
    return directHex;
  }

  const matchedEntry = Object.entries(productColorSwatches).find(([key]) =>
    normalizedValue.includes(key),
  );

  return matchedEntry?.[1] ?? unknownProductColorHex;
}

export function isKnownProductColor(value: string) {
  const normalizedValue = normalizeProductColorName(value);

  return Object.keys(productColorSwatches).some((key) =>
    normalizedValue.includes(key),
  );
}
