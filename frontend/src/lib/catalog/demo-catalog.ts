import type { PublicCategory, PublicProduct, PublicProductImage } from "@/lib/catalog/types";

const updatedAt = "2026-09-06T12:00:00.000Z";

const catalogImages = {
  stillLife: { alt: "Textiles y objetos de hogar en una composición cálida.", height: 1190, url: "/images/vita/catalog-still-life-editorial.webp", width: 1190 },
  bedroom: { alt: "Dormitorio sereno con textiles naturales y luz lateral.", height: 1000, url: "/images/vita/home-bedroom-editorial.webp", width: 1400 },
  textiles: { alt: "Almohadones y manta en una composición de textiles cálidos.", height: 1200, url: "/images/vita/textiles-cushion-editorial.webp", width: 1200 },
  objects: { alt: "Cerámica, velas y fibras en una composición editorial.", height: 1200, url: "/images/vita/ceramic-basket-editorial.webp", width: 1200 },
  shop: { alt: "Comedor sereno con lino, madera, cerámica y ramas naturales.", height: 933, url: "/images/vita/shop-hero-editorial.webp", width: 1400 },
  towels: { alt: "Toallas de algodón en tonos marfil y arena.", height: 1200, url: "/images/vita/bath-towels-editorial.webp", width: 933 },
  basket: { alt: "Canasto tejido de fibras naturales con manta de lino.", height: 1200, url: "/images/vita/woven-basket-editorial.webp", width: 933 },
  vase: { alt: "Florero de cerámica mate y vela artesanal sobre madera.", height: 1200, url: "/images/vita/vase-candle-editorial.webp", width: 933 },
} as const;

type CatalogImageKey = keyof typeof catalogImages;
type DemoProductInput = Pick<PublicProduct, "category" | "categoryLabel" | "featured" | "id" | "name" | "price" | "shortDescription" | "slug"> & {
  description: string;
  images: Array<CatalogImageKey>;
  specifications: Array<{ label: string; value: string }>;
};

export const demoCatalogCategories: Array<PublicCategory> = [
  { id: "demo-textiles", name: "Textiles", slug: "textiles", description: "Textiles para todos los días." },
  { id: "demo-dormitorio", name: "Dormitorio", slug: "dormitorio", description: "Piezas para descansar mejor." },
  { id: "demo-bano", name: "Baño", slug: "bano", description: "Detalles suaves para el baño." },
  { id: "demo-living", name: "Living", slug: "living", description: "Capas cálidas para compartir." },
  { id: "demo-deco", name: "Deco", slug: "deco", description: "Objetos para habitar con calma." },
];

function demoProduct(input: DemoProductInput): PublicProduct {
  const images: Array<PublicProductImage> = input.images.map((key, index) => ({
    ...catalogImages[key],
    alt: index === 0 ? `${input.name}, fotografía editorial de VITA HOGAR.` : catalogImages[key].alt,
    id: `${input.id}-image-${index + 1}`,
    isPrimary: index === 0,
    sortOrder: index,
  }));
  const primaryImage = images[0];

  return {
    ...input,
    availabilityType: "in_stock",
    colors: [],
    condition: "new",
    images,
    includedAccessories: [],
    modelVariants: [],
    primaryImage,
    stock: 8,
    technicalDetails: {},
    updatedAt,
  };
}

export const demoCatalogProducts: Array<PublicProduct> = [
  demoProduct({ id: "demo-almohadon", slug: "almohadon-tejido", name: "Almohadón tejido", category: "living", categoryLabel: "Living", images: ["textiles", "shop", "stillLife"], price: 42900, featured: true, shortDescription: "Textura suave para sumar calidez al living.", description: "Almohadón de trama visible y tacto amable, pensado para sumar una capa de calma al sofá o la cama.", specifications: [{ label: "Material", value: "Algodón tejido" }, { label: "Medida", value: "45 × 45 cm" }, { label: "Cuidado", value: "Lavado suave" }] }),
  demoProduct({ id: "demo-manta", slug: "manta-nido", name: "Manta nido", category: "textiles", categoryLabel: "Textiles", images: ["bedroom", "textiles", "shop"], price: 68900, featured: true, shortDescription: "Una capa liviana para acompañar tardes y descansos.", description: "Manta liviana de textura nido, ideal para sumar abrigo suave y una presencia material al dormitorio o al living.", specifications: [{ label: "Material", value: "Algodón" }, { label: "Medida", value: "130 × 180 cm" }, { label: "Cuidado", value: "Lavado con agua fría" }] }),
  demoProduct({ id: "demo-toallas", slug: "set-toallas", name: "Set de toallas", category: "bano", categoryLabel: "Baño", images: ["towels", "vase", "shop"], price: 31700, featured: true, shortDescription: "Algodón absorbente para el uso cotidiano.", description: "Un set de algodón mullido y absorbente, en tonos serenos que acompañan el baño sin recargarlo.", specifications: [{ label: "Material", value: "100% algodón" }, { label: "Incluye", value: "2 toallas" }, { label: "Cuidado", value: "Lavado a máquina" }] }),
  demoProduct({ id: "demo-canasto", slug: "canasto-seagrass", name: "Canasto seagrass", category: "deco", categoryLabel: "Deco", images: ["basket", "shop", "objects"], price: 54600, featured: true, shortDescription: "Una pieza simple para ordenar los rincones de casa.", description: "Canasto tejido a mano con fibras naturales, amplio y liviano para guardar mantas, almohadones o elementos cotidianos.", specifications: [{ label: "Material", value: "Fibra natural" }, { label: "Diámetro", value: "42 cm" }, { label: "Origen", value: "Tejido artesanal" }] }),
  demoProduct({ id: "demo-vela", slug: "vela-aromatica", name: "Vela aromática", category: "deco", categoryLabel: "Velas y aromas", images: ["vase", "stillLife", "objects"], price: 28400, featured: false, shortDescription: "Notas suaves para acompañar una pausa en casa.", description: "Vela de cera vegetal con aroma sereno y recipiente de cerámica, pensada para acompañar una lectura o una mesa tranquila.", specifications: [{ label: "Cera", value: "Vegetal" }, { label: "Duración", value: "Aproximadamente 35 horas" }, { label: "Aroma", value: "Lino y madera suave" }] }),
  demoProduct({ id: "demo-florero", slug: "florero-ceramico", name: "Florero cerámico", category: "living", categoryLabel: "Living", images: ["vase", "shop", "stillLife"], price: 38600, featured: false, shortDescription: "Cerámica mate para flores, ramas o simplemente un rincón.", description: "Florero de silueta orgánica y terminación mate, preparado para sostener ramas sueltas o funcionar como objeto en sí mismo.", specifications: [{ label: "Material", value: "Cerámica mate" }, { label: "Altura", value: "28 cm" }, { label: "Cuidado", value: "Limpieza con paño húmedo" }] }),
];