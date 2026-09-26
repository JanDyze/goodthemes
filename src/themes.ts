export type ThemeName =
  | "eden"
  | "exile"
  | "deluge"
  | "babel"
  | "jericho"
  | "shepherd"
  | "big-fish"
  | "furnace"
  | "cana"
  | "galilee"
  | "empty-tomb"
  | "pentecost"
  | "ekklesia"
  | "zion";
export type Mode = "light" | "dark" | "system";
export type ResolvedMode = "light" | "dark";
export type AmbientScene = "sirocco" | "stars" | "petals" | "fireflies" | "downpour" | "storm" | "tongues" | "torches" | "wine" | "lamps"
  | "shofar" | "camp" | "blaze" | "inferno" | "glints" | "lanterns" | "wind" | "tongues-of-fire" | "prism" | "radiance" | "pasture" | "fold" | "tesserae" | "many-lights" | "surf" | "depths" | "first-light" | "still-dark";

export interface ThemeInfo {
  id: ThemeName;
  name: string;
  tagline: string;
  /** What each mode is called in this theme. */
  modes: Record<ResolvedMode, string>;
  /** The ambient scene that plays in each mode. */
  ambient: Record<ResolvedMode, AmbientScene>;
  fonts: {
    display: string;
    body: string;
    serif: string;
    /** Google Fonts stylesheet with every face the theme uses. */
    href: string;
  };
  /** The scripture the theme is drawn from. */
  inspiration: Inspiration;
}

export interface Inspiration {
  /** The verse, quoted from `translation`. */
  verse: string;
  reference: string;
  translation: string;
  /** Where to read the whole story. */
  readings: { title: string; passage: string }[];
}

export const themes: Record<ThemeName, ThemeInfo> = {
  eden: {
    id: "eden",
    name: "Eden",
    tagline: "Leaf-light, fig and pomegranate. The garden in the morning, and after dark.",
    modes: { light: "Morning", dark: "Evening" },
    ambient: { light: "petals", dark: "fireflies" },
    fonts: {
      display: "Caprasimo",
      body: "Figtree",
      serif: "Gelasio",
      href: "https://fonts.googleapis.com/css2?family=Caprasimo&family=Figtree:ital,wght@0,300..900;1,300..900&family=Gelasio:ital,wght@0,400..700;1,400..700&display=swap",
    },
    inspiration: {
      verse: "And the LORD God planted a garden eastward in Eden; and there he put the man whom he had formed.",
      reference: "Genesis 2:8",
      translation: "KJV",
      readings: [
        { title: "The garden planted", passage: "Genesis 2:4-25" },
        { title: "The fall", passage: "Genesis 3:1-24" },
      ],
    },
  },
  exile: {
    id: "exile",
    name: "Exile",
    tagline: "Wind, stone and indigo. The wilderness at noon, and the long desert night.",
    modes: { light: "Noon", dark: "Night" },
    ambient: { light: "sirocco", dark: "stars" },
    fonts: {
      display: "Reem Kufi",
      body: "Alegreya Sans",
      serif: "Alegreya",
      href: "https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..800;1,400..800&family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Reem+Kufi:wght@400..700&display=swap",
    },
    inspiration: {
      verse:
        "Behold, I will do a new thing; now it shall spring forth; shall ye not know it? I will even make a way in the wilderness, and rivers in the desert.",
      reference: "Isaiah 43:19",
      translation: "KJV",
      readings: [
        { title: "Sent out of the garden", passage: "Genesis 3:22-24" },
        { title: "Forty years in the wilderness", passage: "Deuteronomy 8:1-10" },
      ],
    },
  },
  deluge: {
    id: "deluge",
    name: "Deluge",
    tagline: "Pitch, gopher wood and rising water. Forty days of rain, and the bow in the cloud.",
    modes: { light: "Forty Days", dark: "The Deep" },
    ambient: { light: "downpour", dark: "storm" },
    fonts: {
      display: "Alfa Slab One",
      body: "Karla",
      serif: "Spectral",
      href: "https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Karla:ital,wght@0,200..800;1,200..800&family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap",
    },
    inspiration: {
      verse: "I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth.",
      reference: "Genesis 9:13",
      translation: "KJV",
      readings: [
        { title: "The ark and the flood", passage: "Genesis 6:9-8:22" },
        { title: "The rainbow covenant", passage: "Genesis 9:8-17" },
      ],
    },
  },
  babel: {
    id: "babel",
    name: "Babel",
    tagline: "Brick for stone and slime for mortar. A tower on the plain of Shinar, and every tongue.",
    modes: { light: "Shinar", dark: "Torchlight" },
    ambient: { light: "tongues", dark: "torches" },
    fonts: {
      display: "Big Shoulders Display",
      body: "Hanken Grotesk",
      serif: "Cardo",
      href: "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400..900&family=Cardo:ital,wght@0,400;0,700;1,400&family=Hanken+Grotesk:ital,wght@0,300..800;1,300..800&display=swap",
    },
    inspiration: {
      verse:
        "And they said, Go to, let us build us a city and a tower, whose top may reach unto heaven; and let us make us a name, lest we be scattered abroad upon the face of the whole earth.",
      reference: "Genesis 11:4",
      translation: "KJV",
      readings: [
        { title: "The tower of Babel", passage: "Genesis 11:1-9" },
        { title: "Every tongue understood", passage: "Acts 2:1-13" },
      ],
    },
  },
  jericho: {
    id: "jericho",
    name: "Jericho",
    tagline: "The city of palm trees, its walls, and a scarlet cord in one window. Seven days around, and a shout.",
    modes: { light: "Seventh Day", dark: "Scarlet Cord" },
    ambient: { light: "shofar", dark: "camp" },
    fonts: {
      display: "Rammetto One",
      body: "Onest",
      serif: "Vollkorn",
      href: "https://fonts.googleapis.com/css2?family=Onest:wght@300..800&family=Rammetto+One&family=Vollkorn:ital,wght@0,400..900;1,400..900&display=swap",
    },
    inspiration: {
      verse: "By faith the walls of Jericho fell down, after they were compassed about seven days.",
      reference: "Hebrews 11:30",
      translation: "KJV",
      readings: [
        { title: "The walls of Jericho", passage: "Joshua 6:1-27" },
        { title: "The scarlet cord", passage: "Joshua 2:1-21" },
      ],
    },
  },
  shepherd: {
    id: "shepherd",
    name: "Shepherd",
    tagline: "Green pastures, still waters, and a crook against the sky. The fold at nightfall, and the watch-fire lit.",
    modes: { light: "Green Pastures", dark: "The Fold" },
    ambient: { light: "pasture", dark: "fold" },
    fonts: {
      display: "Bree Serif",
      body: "Nunito",
      serif: "Gentium Book Plus",
      href: "https://fonts.googleapis.com/css2?family=Bree+Serif&family=Gentium+Book+Plus:ital,wght@0,400;0,700;1,400&family=Nunito:ital,wght@0,300..900;1,300..900&display=swap",
    },
    inspiration: {
      verse:
        "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
      reference: "Psalm 23:1-2",
      translation: "KJV",
      readings: [
        { title: "The shepherd psalm", passage: "Psalm 23:1-6" },
        { title: "The good shepherd", passage: "John 10:11-16" },
      ],
    },
  },
  "big-fish": {
    id: "big-fish",
    name: "Big Fish",
    tagline: "Billows and waves overhead, weeds about the head, three days in the dark of the deep, and then dry land.",
    modes: { light: "Dry Land", dark: "The Depths" },
    ambient: { light: "surf", dark: "depths" },
    fonts: {
      display: "Fredoka",
      body: "Lexend",
      serif: "Merriweather",
      href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Lexend:wght@300..800&family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&display=swap",
    },
    inspiration: {
      verse:
        "For thou hadst cast me into the deep, in the midst of the seas; and the floods compassed me about: all thy billows and thy waves passed over me.",
      reference: "Jonah 2:3",
      translation: "KJV",
      readings: [
        { title: "Out of the belly of the fish", passage: "Jonah 1:17-2:10" },
        { title: "Three days and three nights", passage: "Matthew 12:38-41" },
      ],
    },
  },
  furnace: {
    id: "furnace",
    name: "Furnace",
    tagline: "Heated one seven times more than it was wont. Four men loose in the midst of the fire, and no hurt.",
    modes: { light: "Seven Times", dark: "The Fourth Man" },
    ambient: { light: "blaze", dark: "inferno" },
    fonts: {
      display: "Grenze Gotisch",
      body: "Onest",
      serif: "Vollkorn",
      href: "https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@400..900&family=Onest:wght@300..800&family=Vollkorn:ital,wght@0,400..900;1,400..900&display=swap",
    },
    inspiration: {
      verse:
        "He answered and said, Lo, I see four men loose, walking in the midst of the fire, and they have no hurt; and the form of the fourth is like the Son of God.",
      reference: "Daniel 3:25",
      translation: "KJV",
      readings: [
        { title: "The fiery furnace", passage: "Daniel 3:1-30" },
        { title: "When thou walkest through the fire", passage: "Isaiah 43:1-3" },
      ],
    },
  },
  cana: {
    id: "cana",
    name: "Cana",
    tagline: "Six waterpots of stone, table linen and wedding gold. The feast, and the good wine kept until now.",
    modes: { light: "The Feast", dark: "The Good Wine" },
    ambient: { light: "wine", dark: "lamps" },
    fonts: {
      display: "Bodoni Moda",
      body: "Jost",
      serif: "EB Garamond",
      href: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Jost:ital,wght@0,300..800;1,300..800&display=swap",
    },
    inspiration: {
      verse:
        "Every man at the beginning doth set forth good wine; and when men have well drunk, then that which is worse: but thou hast kept the good wine until now.",
      reference: "John 2:10",
      translation: "KJV",
      readings: [
        { title: "The wedding at Cana", passage: "John 2:1-11" },
        { title: "The marriage supper of the Lamb", passage: "Revelation 19:6-9" },
      ],
    },
  },
  galilee: {
    id: "galilee",
    name: "Galilee",
    tagline: "Nets drying on the shore, sun on the water, lanterns out all night. Follow me.",
    modes: { light: "Daybreak", dark: "Night Watch" },
    ambient: { light: "glints", dark: "lanterns" },
    fonts: {
      display: "Young Serif",
      body: "Albert Sans",
      serif: "Literata",
      href: "https://fonts.googleapis.com/css2?family=Albert+Sans:ital,wght@0,300..800;1,300..800&family=Literata:ital,opsz,wght@0,7..72,300..800;1,7..72,300..800&family=Young+Serif&display=swap",
    },
    inspiration: {
      verse: "And he saith unto them, Follow me, and I will make you fishers of men.",
      reference: "Matthew 4:19",
      translation: "KJV",
      readings: [
        { title: "The calling by the lake", passage: "Luke 5:1-11" },
        { title: "Breakfast on the shore", passage: "John 21:1-14" },
      ],
    },
  },
  "empty-tomb": {
    id: "empty-tomb",
    name: "Empty Tomb",
    tagline: "A garden at first light, the stone rolled away, the linen clothes lying. He is not here.",
    modes: { light: "First Light", dark: "Still Dark" },
    ambient: { light: "first-light", dark: "still-dark" },
    fonts: {
      display: "Gloock",
      body: "Manrope",
      serif: "Source Serif 4",
      href: "https://fonts.googleapis.com/css2?family=Gloock&family=Manrope:wght@300..800&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..800;1,8..60,300..800&display=swap",
    },
    inspiration: {
      verse: "He is not here: for he is risen, as he said. Come, see the place where the Lord lay.",
      reference: "Matthew 28:6",
      translation: "KJV",
      readings: [
        { title: "The stone rolled away", passage: "Matthew 28:1-10" },
        { title: "The linen clothes lying", passage: "John 20:1-10" },
      ],
    },
  },
  pentecost: {
    id: "pentecost",
    name: "Pentecost",
    tagline: "A sound from heaven as of a rushing mighty wind, and cloven tongues like as of fire.",
    modes: { light: "Rushing Wind", dark: "Tongues of Fire" },
    ambient: { light: "wind", dark: "tongues-of-fire" },
    fonts: {
      display: "Unbounded",
      body: "Schibsted Grotesk",
      serif: "Petrona",
      href: "https://fonts.googleapis.com/css2?family=Petrona:ital,wght@0,300..800;1,300..800&family=Schibsted+Grotesk:ital,wght@0,400..900;1,400..900&family=Unbounded:wght@300..900&display=swap",
    },
    inspiration: {
      verse: "And suddenly there came a sound from heaven as of a rushing mighty wind, and it filled all the house where they were sitting.",
      reference: "Acts 2:2",
      translation: "KJV",
      readings: [
        { title: "The day of Pentecost", passage: "Acts 2:1-21" },
        { title: "I will pour out my spirit", passage: "Joel 2:28-32" },
      ],
    },
  },
  ekklesia: {
    id: "ekklesia",
    name: "Ekklesia",
    tagline: "Bread broken from house to house, a mosaic floor, and many lights in the upper chamber.",
    modes: { light: "Breaking Bread", dark: "Many Lights" },
    ambient: { light: "tesserae", dark: "many-lights" },
    fonts: {
      display: "Marcellus",
      body: "Public Sans",
      serif: "Libre Baskerville",
      href: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Marcellus&family=Public+Sans:ital,wght@0,300..800;1,300..800&display=swap",
    },
    inspiration: {
      verse:
        "And they, continuing daily with one accord in the temple, and breaking bread from house to house, did eat their meat with gladness and singleness of heart.",
      reference: "Acts 2:46",
      translation: "KJV",
      readings: [
        { title: "The first church", passage: "Acts 2:41-47" },
        { title: "Many lights in the upper chamber", passage: "Acts 20:7-12" },
      ],
    },
  },
  zion: {
    id: "zion",
    name: "Zion",
    tagline: "Gates of pearl, a street of gold like transparent glass, twelve foundations, and no night there.",
    modes: { light: "The City", dark: "The Light Thereof" },
    ambient: { light: "prism", dark: "radiance" },
    fonts: {
      display: "Cinzel",
      body: "Mulish",
      serif: "Libre Caslon Text",
      href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Mulish:ital,wght@0,300..900;1,300..900&display=swap",
    },
    inspiration: {
      verse:
        "And the city had no need of the sun, neither of the moon, to shine in it: for the glory of God did lighten it, and the Lamb is the light thereof.",
      reference: "Revelation 21:23",
      translation: "KJV",
      readings: [
        { title: "The holy city", passage: "Revelation 21:1-27" },
        { title: "The river of life", passage: "Revelation 22:1-5" },
      ],
    },
  },
};

export const themeNames = Object.keys(themes) as ThemeName[];

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && value in themes;
}

/** A link to read a passage online, e.g. passageUrl("Genesis 6:9-8:22"). */
export function passageUrl(passage: string, translation = "KJV"): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=${encodeURIComponent(translation)}`;
}

/** What the provider and the boot script persist in localStorage. */
export interface StoredState {
  theme: ThemeName | null;
  mode: Mode;
  ambient: boolean;
  decor: boolean;
}

export const DEFAULT_STORAGE_KEY = "goodthemes";
