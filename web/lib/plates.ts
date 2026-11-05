// Botanical plates used as the site's art. Each kind of investment keeps its own plant, as a mnemonic.
// All come from Köhler's Medizinal-Pflanzen (public domain), via Wikimedia Commons.

export type Plate = { src: string; width: number; height: number; plant: string; credit: string };

const BOOK = "K%C3%B6hler%27s_Medizinal-Pflanzen_in_naturgetreuen_Abbildungen_mit_kurz_erl%C3%A4uterndem_Texte";
const COMMONS = "https://commons.wikimedia.org/wiki/File:";

export const PLATES = {
  cafe: {
    src: "/pranchas/cafe.jpg",
    width: 1572,
    height: 2168,
    plant: "café",
    credit: `${COMMONS}Coffea_arabica_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-189.jpg`,
  },
  cacau: {
    src: "/pranchas/cacau.jpg",
    width: 1661,
    height: 2398,
    plant: "cacau",
    credit: `${COMMONS}Theobroma_cacao_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-137.jpg`,
  },
  ipeca: {
    src: "/pranchas/ipeca.jpg",
    width: 1420,
    height: 1966,
    plant: "ipeca",
    credit: `${COMMONS}${BOOK}_(Plate_105)_(8231718775).jpg`,
  },
  baunilha: {
    src: "/pranchas/baunilha.jpg",
    width: 1495,
    height: 2008,
    plant: "baunilha",
    credit: `${COMMONS}${BOOK}_(Plate_114)_(8232785888).jpg`,
  },
  jaborandi: {
    src: "/pranchas/jaborandi.jpg",
    width: 1459,
    height: 1978,
    plant: "jaborandi",
    credit: `${COMMONS}${BOOK}_(Plate_75)_(6972254298).jpg`,
  },
} satisfies Record<string, Plate>;

export const CLASS_PLATES: Record<string, Plate> = {
  acao_br: PLATES.cafe,
  fii: PLATES.cacau,
  tesouro: PLATES.ipeca,
  renda_fixa: PLATES.baunilha,
};
