import * as fs from "fs-extra";
import csvParser from "csv-parser";
import {
  createCanvas,
  loadImage,
  registerFont,
  Canvas,
  CanvasRenderingContext2D,
} from "canvas";
import * as path from "path";
import sharp from "sharp";

export type TextAlignment =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface CardData {
  Card: string;
  Name: string;
  Element: string;
  Cost: string;
  Lore: string;
  Attack: string;
  Armor: string;
  Skills: string;
  Address: string;
}

export interface TextLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: TextAlignment;
  maxWidth?: number;
  lineHeight?: number;
  // New properties for padding and background
  padding?: number;
  backgroundColor?: string;
  backgroundBlur?: number;
}

export interface CardLayout {
  name: TextLayout;
  cost: TextLayout;
  lore: TextLayout;
  attack: TextLayout;
  armor: TextLayout;
  skills: TextLayout;
}

export interface FontMap {
  [fontName: string]: string;
}

export interface GeneratorConfig {
  templatesPath?: string;
  csvPath?: string;
  outputDir?: string;
  cardWidth?: number;
  cardHeight?: number;
  fonts?: FontMap;
  layout?: Partial<CardLayout>;
  cardArtX?: number;
  cardArtY?: number;
  cardArtWidth?: number;
  cardArtHeight?: number;
  backgroundColor?: string;
  webpQuality?: number;
}

export class CardGenerator {
  private config: Required<Omit<GeneratorConfig, "layout">> & {
    layout: CardLayout;
  };
  private loadedFonts: Set<string>;
  private cardData: CardData[] = [];

  constructor(config: GeneratorConfig = {}) {
    this.config = {
      templatesPath: config.templatesPath || "./assets",
      csvPath: config.csvPath || "./cards.csv",
      outputDir: config.outputDir || "./output",
      cardWidth: config.cardWidth || 750,
      cardHeight: config.cardHeight || 1050,
      fonts: config.fonts || {},
      layout: { ...this.getDefaultLayout(), ...config.layout },
      cardArtX: config.cardArtX || 75,
      cardArtY: config.cardArtY || 120,
      cardArtWidth: config.cardArtWidth || 600,
      cardArtHeight: config.cardArtHeight || 400,
      backgroundColor: config.backgroundColor || "#ffffff",
      webpQuality: config.webpQuality || 90,
    };

    this.loadedFonts = new Set<string>();
  }

  private getDefaultLayout(): CardLayout {
    return {
      name: {
        x: 75,
        y: 40,
        width: 600,
        height: 80,
        fontSize: 32,
        fontFamily: "Stone Serif Semibold",
        color: "#000",
        align: "center",
      },
      cost: {
        x: 650,
        y: 40,
        width: 50,
        height: 50,
        fontSize: 28,
        fontFamily: "Stone Serif Semibold",
        color: "#fff",
        align: "center",
      },
      lore: {
        x: 100,
        y: 540,
        width: 550,
        height: 100,
        fontSize: 18,
        fontFamily: "Stone Serif Semibold",
        color: "#333",
        align: "center",
        lineHeight: 22,
      },
      attack: {
        x: 100,
        y: 950,
        width: 60,
        height: 60,
        fontSize: 36,
        fontFamily: "Stone Serif Semibold",
        color: "#fff",
        align: "center",
      },
      armor: {
        x: 240,
        y: 950,
        width: 60,
        height: 60,
        fontSize: 36,
        fontFamily: "Stone Serif Semibold",
        color: "#fff",
        align: "center",
      },
      skills: {
        x: 100,
        y: 660,
        width: 550,
        height: 80,
        fontSize: 16,
        fontFamily: "Stone Serif Semibold",
        color: "#444",
        align: "center",
        lineHeight: 20,
      },
    };
  }

  private getDebugColors(): Record<keyof CardLayout, string> {
    return {
      name: "rgba(255, 0, 0, 0.3)",
      cost: "rgba(0, 255, 0, 0.3)",
      lore: "rgba(0, 0, 255, 0.3)",
      attack: "rgba(255, 255, 0, 0.3)",
      armor: "rgba(255, 0, 255, 0.3)",
      skills: "rgba(255, 128, 0, 0.3)",
    };
  }

  private getTemplatePathForElement(element: string): string {
    const capitalizedElement =
      element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
    return path.join(this.config.templatesPath, `${capitalizedElement}.png`);
  }

  private getImageUrlFromAddress(address: string): string {
    return `https://beetle-game.s3.us-east-1.amazonaws.com/images/${address}.png`;
  }

  public async clearAllCaches(): Promise<void> {
    console.log("🧹 Clearing all caches...");
    this.loadedFonts.clear();
    sharp.cache(false);
    sharp.concurrency(1);

    Object.keys(require.cache).forEach((key) => {
      if (
        key.includes("card-generator") ||
        key.includes("canvas") ||
        key.includes("sharp")
      ) {
        delete require.cache[key];
      }
    });

    if (global.gc) {
      global.gc();
    }

    sharp.cache(true);
    console.log("✅ All caches cleared");
  }

  public async loadFonts(): Promise<void> {
    console.log("🔤 Loading fonts...");

    if (Object.keys(this.config.fonts).length === 0) {
      console.log("⚠️  No fonts configured, using system defaults");
      return;
    }

    for (const [fontName, fontPath] of Object.entries(this.config.fonts)) {
      console.log(`\n📝 Processing font: ${fontName}`);
      console.log(`   Path: ${fontPath}`);

      try {
        const stats = await fs.stat(fontPath);
        if (!stats.isFile()) {
          console.error(`❌ Font path exists but is not a file: ${fontPath}`);
          continue;
        }
        console.log(
          `✅ Font file exists: ${fontPath} (${Math.round(
            stats.size / 1024
          )}KB)`
        );
      } catch (error) {
        console.error(`❌ Font file not found: ${fontPath}`);
        continue;
      }

      if (this.loadedFonts.has(fontName)) {
        console.log(`   ⏭️  Already loaded, skipping`);
        continue;
      }

      try {
        registerFont(fontPath, { family: fontName });
        this.loadedFonts.add(fontName);
        console.log(`   ✅ Registered successfully as "${fontName}"`);

        const testCanvas = createCanvas(100, 50);
        const testCtx = testCanvas.getContext("2d");
        testCtx.font = `20px ${fontName}`;
        testCtx.fillStyle = "black";
        testCtx.fillText("Test", 10, 30);
        console.log(`   ✅ Font rendering test passed`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`   ❌ Failed to register: ${errorMessage}`);
      }
    }

    console.log(
      `\n🔤 Font loading complete. Loaded fonts: [${Array.from(
        this.loadedFonts
      ).join(", ")}]`
    );

    if (this.loadedFonts.size === 0) {
      console.warn(
        "⚠️  No fonts were successfully loaded. Using system defaults."
      );
    }
  }

  public async loadCSV(): Promise<CardData[]> {
    return new Promise((resolve, reject) => {
      const results: CardData[] = [];
      fs.createReadStream(this.config.csvPath)
        .pipe(csvParser())
        .on("data", (data: CardData) => results.push(data))
        .on("end", () => {
          this.cardData = results;
          resolve(results);
        })
        .on("error", reject);
    });
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  private getTextPosition(layout: TextLayout): { x: number; y: number } {
    const { x, y, width, height, align } = layout;

    switch (align) {
      case "top-left":
        return { x, y };
      case "top-center":
        return { x: x + width / 2, y };
      case "top-right":
        return { x: x + width, y };
      case "left":
        return { x, y: y + height / 2 };
      case "center":
        return { x: x + width / 2, y: y + height / 2 };
      case "right":
        return { x: x + width, y: y + height / 2 };
      case "bottom-left":
        return { x, y: y + height };
      case "bottom-center":
        return { x: x + width / 2, y: y + height };
      case "bottom-right":
        return { x: x + width, y: y + height };
      default:
        return { x: x + width / 2, y: y + height / 2 };
    }
  }

  private getCanvasTextAlign(
    align: TextAlignment
  ): "left" | "center" | "right" | "start" | "end" {
    if (align.includes("left")) return "left";
    if (align.includes("right")) return "right";
    return "center";
  }

  private getCanvasTextBaseline(
    align: TextAlignment
  ): "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom" {
    if (align.includes("top")) return "top";
    if (align.includes("bottom")) return "bottom";
    return "middle";
  }

  private drawBoundingBox(
    ctx: CanvasRenderingContext2D,
    layout: TextLayout,
    color: string,
    label: string
  ): void {
    const { x, y, width, height } = layout;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = color.replace("0.3", "0.8");
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = color.replace("0.3", "0.9");
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const fontStatus = this.loadedFonts.has(layout.fontFamily) ? "✓" : "✗";
    const labelText = `${label} (${layout.fontFamily} ${fontStatus})`;
    ctx.fillText(labelText, x + 4, y + 16);
  }

  private drawTextBackground(
    ctx: CanvasRenderingContext2D,
    layout: TextLayout
  ): void {
    if (!layout.backgroundColor) {
      return;
    }

    ctx.save();
    ctx.fillStyle = layout.backgroundColor;

    if (layout.backgroundBlur && layout.backgroundBlur > 0) {
      ctx.filter = `blur(${layout.backgroundBlur}px)`;
    }

    ctx.fillRect(layout.x, layout.y, layout.width, layout.height);
    ctx.restore();
  }

  private drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    layout: TextLayout,
    debugMode: boolean = false,
    debugColor?: string,
    debugLabel?: string
  ): void {
    // Draw background first, so it's behind everything
    this.drawTextBackground(ctx, layout);

    if (debugMode && debugColor && debugLabel) {
      this.drawBoundingBox(ctx, layout, debugColor, debugLabel);
    }

    const fontFamily = this.loadedFonts.has(layout.fontFamily)
      ? layout.fontFamily
      : "Arial";

    if (fontFamily !== layout.fontFamily && debugMode) {
      console.warn(
        `⚠️  Font "${layout.fontFamily}" not loaded, falling back to "${fontFamily}"`
      );
    }

    const fontString = `${layout.fontSize}px ${fontFamily}`;
    ctx.font = fontString;
    ctx.fillStyle = layout.color;
    ctx.textAlign = this.getCanvasTextAlign(layout.align);
    ctx.textBaseline = this.getCanvasTextBaseline(layout.align);

    if (debugMode) {
      console.log(
        `🔤 Drawing text: "${text.substring(0, 20)}${
          text.length > 20 ? "..." : ""
        }"`
      );
      console.log(`   Font: ${fontString}`);
      console.log(
        `   Available fonts: [${Array.from(this.loadedFonts).join(", ")}]`
      );
      console.log(`   Color: ${layout.color}`);
    }

    // Apply padding for text rendering
    const padding = layout.padding || 0;
    const paddedLayout = {
      ...layout,
      x: layout.x + padding,
      y: layout.y + padding,
      width: layout.width - padding * 2,
      height: layout.height - padding * 2,
    };

    const position = this.getTextPosition(paddedLayout);
    const maxWidth = paddedLayout.maxWidth || paddedLayout.width;

    if (layout.maxWidth || text.includes(" ")) {
      const lines = this.wrapText(ctx, text, maxWidth);
      const lineHeight = layout.lineHeight || layout.fontSize * 1.2;

      let startY = position.y;
      const totalTextHeight = lines.length * lineHeight;

      if (paddedLayout.align.includes("bottom")) {
        startY = position.y - totalTextHeight + lineHeight;
      } else if (
        paddedLayout.align === "center" ||
        paddedLayout.align === "left" ||
        paddedLayout.align === "right"
      ) {
        startY = position.y - totalTextHeight / 2 + lineHeight / 2;
      }

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.fillText(line, position.x, y);
      });
    } else {
      ctx.fillText(text, position.x, position.y);
    }
  }

  private async drawCardArt(
    ctx: CanvasRenderingContext2D,
    imagePath: string,
    debugMode: boolean = false
  ): Promise<void> {
    try {
      const image = await loadImage(imagePath);
      ctx.drawImage(
        image,
        this.config.cardArtX,
        this.config.cardArtY,
        this.config.cardArtWidth,
        this.config.cardArtHeight
      );

      if (debugMode) {
        ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          this.config.cardArtX,
          this.config.cardArtY,
          this.config.cardArtWidth,
          this.config.cardArtHeight
        );

        ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(
          "Card Art",
          this.config.cardArtX + 4,
          this.config.cardArtY + 20
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.warn(`Failed to load image ${imagePath}: ${errorMessage}`);

      ctx.fillStyle = "#ccc";
      ctx.fillRect(
        this.config.cardArtX,
        this.config.cardArtY,
        this.config.cardArtWidth,
        this.config.cardArtHeight
      );
      ctx.fillStyle = "#666";
      ctx.font = "16px Stone Serif Semibold";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Image Not Found",
        this.config.cardArtX + this.config.cardArtWidth / 2,
        this.config.cardArtY + this.config.cardArtHeight / 2
      );

      if (debugMode) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          this.config.cardArtX,
          this.config.cardArtY,
          this.config.cardArtWidth,
          this.config.cardArtHeight
        );
      }
    }
  }

  private async drawElementTemplate(
    ctx: CanvasRenderingContext2D,
    element: string
  ): Promise<void> {
    const templatePath = this.getTemplatePathForElement(element);

    try {
      const template = await loadImage(templatePath);
      ctx.drawImage(
        template,
        0,
        0,
        this.config.cardWidth,
        this.config.cardHeight
      );
      console.log(`Loaded template: ${templatePath}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.warn(`Failed to load template ${templatePath}: ${errorMessage}`);
      console.warn("Using background color only");
    }
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }

  private async convertToWebP(
    pngBuffer: Buffer,
    quality: number
  ): Promise<Buffer> {
    return await sharp(pngBuffer).webp({ quality }).toBuffer();
  }

  public async generateCard(
    cardData: CardData,
    debugMode: boolean = false
  ): Promise<Canvas> {
    const canvas = createCanvas(this.config.cardWidth, this.config.cardHeight);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, 0, this.config.cardWidth, this.config.cardHeight);

    if (cardData.Element) {
      await this.drawElementTemplate(ctx, cardData.Element);
    }

    if (cardData.Address) {
      const imageUrl = this.getImageUrlFromAddress(cardData.Address);
      await this.drawCardArt(ctx, imageUrl, debugMode);
    }

    const textMappings: Array<[keyof CardData, keyof CardLayout]> = [
      ["Name", "name"],
      ["Cost", "cost"],
      ["Lore", "lore"],
      ["Attack", "attack"],
      ["Armor", "armor"],
      ["Skills", "skills"],
    ];

    const debugColors = this.getDebugColors();

    for (const [dataKey, layoutKey] of textMappings) {
      const value = cardData[dataKey];
      const layout = this.config.layout[layoutKey];

      if (value && layout) {
        this.drawText(
          ctx,
          value.toString(),
          layout,
          debugMode,
          debugColors[layoutKey],
          layoutKey
        );
      }
    }

    return canvas;
  }

  public async generateSingleCard(
    cardIndex: number = 0,
    debugMode: boolean = false
  ): Promise<void> {
    console.log("Creating output directory...");
    await fs.ensureDir(this.config.outputDir);

    if (!this.cardData.length) {
      console.log("Loading CSV data...");
      await this.loadCSV();
    }

    if (cardIndex >= this.cardData.length) {
      console.error(
        `Card index ${cardIndex} is out of range. Available cards: 0-${
          this.cardData.length - 1
        }`
      );
      return;
    }

    const card = this.cardData[cardIndex];
    const imageUrl = this.getImageUrlFromAddress(card.Address);
    const timestamp = new Date().toLocaleTimeString();

    console.log(
      `🔄 [${timestamp}] Generating card: ${card.Card} (${card.Element}) ${
        debugMode ? "🎯 DEBUG MODE" : ""
      }`
    );
    console.log(`   Image URL: ${imageUrl}`);

    try {
      const canvas = await this.generateCard(card, debugMode);
      const filename = "1.webp";
      const outputPath = path.join(this.config.outputDir, filename);

      try {
        await fs.remove(outputPath);
        console.log(`🗑️  Removed old file: ${filename}`);
      } catch (error) {
        // File might not exist, that's okay
      }

      console.log(`📸 Converting to WebP...`);
      const pngBuffer = canvas.toBuffer("image/png");
      const webpBuffer = await this.convertToWebP(
        pngBuffer,
        this.config.webpQuality
      );

      await fs.writeFile(outputPath, webpBuffer);

      const stats = await fs.stat(outputPath);
      console.log(
        `✅ Generated: ${filename} (${Math.round(
          stats.size / 1024
        )}KB) at ${timestamp} ${debugMode ? "🎯" : ""}`
      );
      console.log(`📁 File path: ${path.resolve(outputPath)}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `❌ Failed to generate card for ${card.Card}:`,
        errorMessage
      );
    }
  }

  public async generateAllCards(): Promise<void> {
    console.log("Loading fonts...");
    await this.loadFonts();

    console.log("Loading CSV data...");
    const cardData = await this.loadCSV();

    console.log("Creating output directory...");
    await fs.ensureDir(this.config.outputDir);

    console.log(`Generating ${cardData.length} cards...`);

    for (let i = 0; i < cardData.length; i++) {
      const card = cardData[i];
      const imageUrl = this.getImageUrlFromAddress(card.Address);
      console.log(
        `Generating card ${i + 1}/${cardData.length}: ${card.Card} (${
          card.Element
        })`
      );
      console.log(`  Image URL: ${imageUrl}`);

      try {
        const canvas = await this.generateCard(card);
        const filename = `${this.sanitizeFilename(card.Card)}.webp`;
        const outputPath = path.join(this.config.outputDir, filename);

        const pngBuffer = canvas.toBuffer("image/png");
        const webpBuffer = await this.convertToWebP(
          pngBuffer,
          this.config.webpQuality
        );
        await fs.writeFile(outputPath, webpBuffer);

        console.log(`✓ Generated: ${filename}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `✗ Failed to generate card for ${card.Card}:`,
          errorMessage
        );
      }
    }

    console.log("Card generation complete!");
  }
}

async function main(): Promise<void> {
  const isSingleMode = process.argv.includes("--single");
  const cardIndex = 0;

  if (isSingleMode) {
    console.clear();
    console.log(
      "🎨 Card Generator - Single Card Mode with Debug Bounding Boxes"
    );
    console.log("=".repeat(50));
  }

  const generator = new CardGenerator({
    templatesPath: "./assets",
    csvPath: "./data/cards.csv",
    outputDir: "./generated_cards",
    cardWidth: 1742,
    cardHeight: 2539,
    backgroundColor: "#ffffff",
    webpQuality: 95,
    cardArtX: 220,
    cardArtY: 445,
    cardArtWidth: 1300,
    cardArtHeight: 1300,
    fonts: {
      CardNumbers: "./fonts/Stone Serif Semibold.ttf",
    },
    layout: {
      name: {
        x: 100,
        y: 85,
        width: 1350,
        height: 155,
        fontSize: 120,
        fontFamily: "CardNumbers",
        color: "white",
        align: "left",
        maxWidth: 1400,
      },
      cost: {
        x: 1445,
        y: 85,
        width: 205,
        height: 155,
        fontSize: 70,
        fontFamily: "CardNumbers",
        color: "white",
        align: "center",
      },
      lore: {
        x: 130,
        y: 1800,
        width: 1483,
        height: 200,
        fontSize: 42,
        fontFamily: "CardNumbers",
        color: "#ffffff",
        align: "top-left",
        maxWidth: 1300,
        lineHeight: 64,
        // New properties for background and padding
        padding: 20,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        backgroundBlur: 8, // Blur radius in pixels
      },
      skills: {
        x: 130,
        y: 2000,
        width: 1483,
        height: 200,
        fontSize: 32,
        fontFamily: "CardNumbers",
        color: "white",
        align: "top-left",
        // New properties for background and padding
        padding: 20,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        backgroundBlur: 8, // Blur radius in pixels
      },
      armor: {
        x: 80,
        y: 2250,
        width: 740,
        height: 205,
        fontSize: 120,
        fontFamily: "CardNumbers",
        color: "white",
        align: "center",
      },
      attack: {
        x: 920,
        y: 2250,
        width: 740,
        height: 210,
        fontSize: 120,
        fontFamily: "CardNumbers",
        color: "white",
        align: "center",
      },
    },
  });

  try {
    if (isSingleMode) {
      await generator.loadFonts();
      await generator.generateSingleCard(cardIndex, true);
      console.log("\n🎯 Debug Legend:");
      console.log("   🔴 Name (Red)      🟢 Cost (Green)");
      console.log("   🔵 Lore (Blue)     🟡 Attack (Yellow)");
      console.log("   🟣 Armor (Magenta)");
      console.log("   🟠 Skills (Orange)");
      console.log("   🟢 Card Art (Green border)");
      console.log("\n💡 Text Alignment Options:");
      console.log("   top-left, top-center, top-right");
      console.log("   left, center, right");
      console.log("   bottom-left, bottom-center, bottom-right");
      console.log("\n🖼️  View the card: open generated_cards/1.webp");
    } else {
      await generator.generateAllCards();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating cards:", errorMessage);
  }
}

if (require.main === module) {
  main();
}

export default CardGenerator;
