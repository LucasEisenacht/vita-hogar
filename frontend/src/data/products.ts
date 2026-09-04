export type ProductCategory = "fundas" | "audio" | "carga" | "gaming" | "smart";

export type ProductColor = {
  hex: string;
  name: string;
};

export type ProductImage = {
  accent: string;
  alt: string;
  id: string;
  tone: string;
};

export type Product = {
  badge?: string;
  category: ProductCategory;
  categoryLabel: string;
  colors: ProductColor[];
  compatibility?: string[];
  description: string;
  featured: boolean;
  id: string;
  images: ProductImage[];
  name: string;
  previousPrice?: number;
  price: number;
  shortDescription: string;
  slug: string;
  specifications?: Array<{
    label: string;
    value: string;
  }>;
  stock: number;
};

export const categoryLabels: Record<ProductCategory, string> = {
  audio: "Audio",
  carga: "Carga",
  fundas: "Fundas",
  gaming: "Gaming",
  smart: "Smart",
};

export const categoryDescriptions: Record<ProductCategory, string> = {
  audio: "Sonido practico, liviano y pensado para acompanarte todos los dias.",
  carga: "Cargadores y cables para una rutina mas simple y ordenada.",
  fundas: "Fundas suaves, modernas y faciles de combinar con tu estilo.",
  gaming: "Accesorios comodos para jugar sin perder una mirada cuidada.",
  smart: "Detalles inteligentes para sumar funcionalidad a tu dia a dia.",
};

export const productCategories = Object.keys(categoryLabels) as ProductCategory[];

export const products: Product[] = [
  {
    badge: "Nuevo",
    category: "fundas",
    categoryLabel: "Fundas",
    colors: [
      { hex: "#DFA5B9", name: "Rosa soft" },
      { hex: "#F5E1E8", name: "Rosa nube" },
      { hex: "#FFF4EF", name: "Crema" },
    ],
    compatibility: ["iPhone 13", "iPhone 14", "iPhone 15"],
    description:
      "Una funda suave al tacto, con terminacion mate y una paleta facil de combinar. Pensada para proteger el celular sin perder elegancia.",
    featured: true,
    id: "prod-001",
    images: [
      {
        accent: "bg-primary/35",
        alt: "Placeholder abstracto de Funda Soft Touch Rosa",
        id: "soft-touch-1",
        tone: "bg-secondary",
      },
      {
        accent: "bg-surface/80",
        alt: "Detalle abstracto de textura soft touch",
        id: "soft-touch-2",
        tone: "bg-surface-soft",
      },
      {
        accent: "bg-muted",
        alt: "Vista abstracta de empaque premium",
        id: "soft-touch-3",
        tone: "bg-[#f1e6e9]",
      },
    ],
    name: "Funda Soft Touch Rosa",
    previousPrice: 21500,
    price: 18500,
    shortDescription: "Textura suave, color rosa empolvado y proteccion diaria.",
    slug: "funda-soft-touch-rosa",
    specifications: [
      { label: "Material", value: "Silicona soft touch" },
      { label: "Terminacion", value: "Mate suave" },
      { label: "Proteccion", value: "Bordes elevados" },
    ],
    stock: 12,
  },
  {
    category: "fundas",
    categoryLabel: "Fundas",
    colors: [
      { hex: "#FFFFFF", name: "Transparente" },
      { hex: "#EADBD4", name: "Borde blush" },
    ],
    compatibility: ["iPhone 14", "iPhone 15", "iPhone 15 Pro"],
    description:
      "Funda transparente con compatibilidad magnetica, ideal para mantener visible el color del equipo con una terminacion limpia.",
    featured: true,
    id: "prod-002",
    images: [
      {
        accent: "bg-surface/80",
        alt: "Placeholder abstracto de Funda Transparente MagSafe",
        id: "magsafe-1",
        tone: "bg-surface-soft",
      },
      {
        accent: "bg-secondary",
        alt: "Detalle abstracto de aro magnetico",
        id: "magsafe-2",
        tone: "bg-muted",
      },
    ],
    name: "Funda Transparente MagSafe",
    price: 21900,
    shortDescription: "Transparente, liviana y preparada para accesorios magneticos.",
    slug: "funda-transparente-magsafe",
    specifications: [
      { label: "Material", value: "TPU flexible" },
      { label: "Compatibilidad", value: "Sistema magnetico" },
    ],
    stock: 8,
  },
  {
    badge: "Stock",
    category: "audio",
    categoryLabel: "Audio",
    colors: [
      { hex: "#FFF4EF", name: "Crema" },
      { hex: "#2F2927", name: "Negro suave" },
    ],
    description:
      "Auriculares inalambricos compactos para uso diario, con estuche minimalista y una estetica limpia.",
    featured: true,
    id: "prod-003",
    images: [
      {
        accent: "bg-surface/70",
        alt: "Placeholder abstracto de Auriculares Inalambricos",
        id: "audio-1",
        tone: "bg-muted",
      },
      {
        accent: "bg-primary/25",
        alt: "Detalle abstracto de estuche de auriculares",
        id: "audio-2",
        tone: "bg-surface-soft",
      },
    ],
    name: "Auriculares Inalambricos",
    price: 42000,
    shortDescription: "Sonido claro en formato compacto y facil de llevar.",
    slug: "auriculares-inalambricos",
    specifications: [
      { label: "Conexion", value: "Bluetooth" },
      { label: "Estuche", value: "Carga portatil" },
    ],
    stock: 10,
  },
  {
    category: "carga",
    categoryLabel: "Carga",
    colors: [
      { hex: "#FFFFFF", name: "Blanco" },
      { hex: "#FFF4EF", name: "Crema" },
    ],
    description:
      "Cargador compacto de 20W para tener siempre a mano. Una pieza simple, funcional y de apariencia limpia.",
    featured: true,
    id: "prod-004",
    images: [
      {
        accent: "bg-surface/80",
        alt: "Placeholder abstracto de Cargador Rapido 20W",
        id: "charger-1",
        tone: "bg-[#f3ebe7]",
      },
    ],
    name: "Cargador Rapido 20W",
    price: 24500,
    shortDescription: "Carga rapida en formato compacto para todos los dias.",
    slug: "cargador-rapido-20w",
    specifications: [
      { label: "Potencia", value: "20W" },
      { label: "Puerto", value: "USB-C" },
    ],
    stock: 14,
  },
  {
    badge: "Favorito",
    category: "carga",
    categoryLabel: "Carga",
    colors: [
      { hex: "#EADBD4", name: "Blush" },
      { hex: "#F8EEE9", name: "Arena" },
    ],
    description:
      "Cable USB-C con acabado trenzado, tacto agradable y largo practico para escritorio, cartera o mesa de luz.",
    featured: true,
    id: "prod-005",
    images: [
      {
        accent: "bg-primary/30",
        alt: "Placeholder abstracto de Cable USB-C Trenzado",
        id: "cable-1",
        tone: "bg-surface-soft",
      },
      {
        accent: "bg-surface/80",
        alt: "Detalle abstracto del trenzado",
        id: "cable-2",
        tone: "bg-secondary",
      },
    ],
    name: "Cable USB-C Trenzado",
    previousPrice: 14900,
    price: 12900,
    shortDescription: "Cable resistente con terminacion suave y estetica cuidada.",
    slug: "cable-usb-c-trenzado",
    specifications: [
      { label: "Largo", value: "1 metro" },
      { label: "Conector", value: "USB-C" },
    ],
    stock: 20,
  },
  {
    category: "smart",
    categoryLabel: "Smart",
    colors: [
      { hex: "#DFA5B9", name: "Rosa" },
      { hex: "#F5E1E8", name: "Rosa claro" },
    ],
    description:
      "Soporte magnetico para escritorio o mesa de luz. Discreto, estable y pensado para mantener el celular siempre visible.",
    featured: true,
    id: "prod-006",
    images: [
      {
        accent: "bg-surface/75",
        alt: "Placeholder abstracto de Soporte Magnetico",
        id: "stand-1",
        tone: "bg-secondary",
      },
    ],
    name: "Soporte Magnetico",
    price: 19700,
    shortDescription: "Un soporte delicado para ordenar tu espacio.",
    slug: "soporte-magnetico",
    specifications: [
      { label: "Uso", value: "Escritorio" },
      { label: "Base", value: "Antideslizante" },
    ],
    stock: 7,
  },
  {
    category: "audio",
    categoryLabel: "Audio",
    colors: [
      { hex: "#FFF4EF", name: "Crema" },
      { hex: "#DFA5B9", name: "Rosa" },
    ],
    description:
      "Parlante compacto para acompanar rutinas, escritorios y momentos de relax con una presencia visual muy suave.",
    featured: false,
    id: "prod-007",
    images: [
      {
        accent: "bg-primary/30",
        alt: "Placeholder abstracto de Parlante Mini Soft",
        id: "speaker-1",
        tone: "bg-muted",
      },
    ],
    name: "Parlante Mini Soft",
    price: 36500,
    shortDescription: "Sonido portatil con presencia delicada.",
    slug: "parlante-mini-soft",
    stock: 6,
  },
  {
    badge: "Sin stock",
    category: "gaming",
    categoryLabel: "Gaming",
    colors: [
      { hex: "#2F2927", name: "Negro suave" },
      { hex: "#EAD0DA", name: "Blush" },
    ],
    description:
      "Pad de mouse amplio con superficie suave, pensado para setups prolijos sin estetica estridente.",
    featured: false,
    id: "prod-008",
    images: [
      {
        accent: "bg-secondary",
        alt: "Placeholder abstracto de Mouse Pad XL",
        id: "mouse-pad-1",
        tone: "bg-[#f1e6e9]",
      },
    ],
    name: "Mouse Pad XL Neutro",
    price: 17800,
    shortDescription: "Superficie amplia para escritorio, juego y trabajo.",
    slug: "mouse-pad-xl-neutro",
    specifications: [{ label: "Tamano", value: "XL" }],
    stock: 0,
  },
  {
    category: "gaming",
    categoryLabel: "Gaming",
    colors: [
      { hex: "#F5E1E8", name: "Rosa nube" },
      { hex: "#FFF4EF", name: "Crema" },
    ],
    description:
      "Grip para celular con mejor agarre y apoyo, ideal para jugar o mirar contenido con comodidad.",
    featured: false,
    id: "prod-009",
    images: [
      {
        accent: "bg-surface/75",
        alt: "Placeholder abstracto de Grip para Celular",
        id: "grip-1",
        tone: "bg-secondary",
      },
    ],
    name: "Grip para Celular",
    price: 9900,
    shortDescription: "Agarre comodo y discreto para el dia a dia.",
    slug: "grip-para-celular",
    stock: 15,
  },
  {
    category: "smart",
    categoryLabel: "Smart",
    colors: [
      { hex: "#EADBD4", name: "Arena" },
      { hex: "#FFFFFF", name: "Blanco" },
    ],
    description:
      "Aro soporte plegable para sumar estabilidad, apoyo y un detalle delicado a tu celular.",
    featured: false,
    id: "prod-010",
    images: [
      {
        accent: "bg-primary/25",
        alt: "Placeholder abstracto de Aro Soporte Plegable",
        id: "ring-1",
        tone: "bg-surface-soft",
      },
    ],
    name: "Aro Soporte Plegable",
    price: 8500,
    shortDescription: "Detalle funcional para sostener y apoyar el celular.",
    slug: "aro-soporte-plegable",
    stock: 18,
  },
  {
    category: "fundas",
    categoryLabel: "Fundas",
    colors: [
      { hex: "#F8EEE9", name: "Arena" },
      { hex: "#DFA5B9", name: "Rosa" },
    ],
    compatibility: ["Samsung S23", "Samsung S24"],
    description:
      "Funda con textura fina y terminacion elegante para equipos Samsung. Proteccion cotidiana con un look sobrio.",
    featured: false,
    id: "prod-011",
    images: [
      {
        accent: "bg-surface/80",
        alt: "Placeholder abstracto de Funda Textura Arena",
        id: "arena-1",
        tone: "bg-[#f5ece5]",
      },
    ],
    name: "Funda Textura Arena",
    price: 18900,
    shortDescription: "Textura delicada y tono neutro para combinar facil.",
    slug: "funda-textura-arena",
    stock: 9,
  },
  {
    category: "carga",
    categoryLabel: "Carga",
    colors: [
      { hex: "#FFF4EF", name: "Crema" },
      { hex: "#2F2927", name: "Negro suave" },
    ],
    description:
      "Base de carga inalambrica para escritorio, pensada para dejar el celular siempre listo sin sumar ruido visual.",
    featured: false,
    id: "prod-012",
    images: [
      {
        accent: "bg-secondary",
        alt: "Placeholder abstracto de Base de Carga Inalambrica",
        id: "wireless-1",
        tone: "bg-muted",
      },
    ],
    name: "Base de Carga Inalambrica",
    price: 33500,
    shortDescription: "Carga simple y ordenada para tu espacio.",
    slug: "base-de-carga-inalambrica",
    specifications: [
      { label: "Carga", value: "Inalambrica" },
      { label: "Uso", value: "Escritorio" },
    ],
    stock: 5,
  },
];

export function getAllProducts() {
  return products;
}

export function getFeaturedProducts() {
  return products.filter((product) => product.featured);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(category: ProductCategory) {
  return products.filter((product) => product.category === category);
}
