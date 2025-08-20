export interface CardData {
  Card: string;
  Beetle: string; // This appears to be the image URL
  Name: string;
  Cost: string;
  Lore: string;
  Attack: string;
  Armor: string;
  Rarity: string;
  Element: string;
  Address: string;
  Skills: string;
}

export interface TextLayout {
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align?: "left" | "center" | "right" | "start" | "end";
  maxWidth?: number;
  lineHeight?: number;
}

export interface CardLayout {
  name: TextLayout;
  cost: TextLayout;
  lore: TextLayout;
  attack: TextLayout;
  armor: TextLayout;
  rarity: TextLayout;
  skills: TextLayout;
  address: TextLayout;
}

export interface GeneratorConfig {
  templatesPath?: string; // Path to templates directory
  csvPath?: string;
  outputDir?: string;
  cardWidth?: number;
  cardHeight?: number;
  fonts?: Record<string, string>;
  layout?: Partial<CardLayout>;
  // Image positioning is constant
  cardArtX?: number;
  cardArtY?: number;
  cardArtWidth?: number;
  cardArtHeight?: number;
  // Background color
  backgroundColor?: string;
  // WebP quality (0-100)
  webpQuality?: number;
}

export interface FontMap {
  [fontName: string]: string;
}
