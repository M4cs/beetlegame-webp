# 🎴 Trading Card Generator

Welcome! This is a powerful tool for generating beautiful trading cards from CSV data. Whether you're updating graphics, adjusting layouts, or adding new features, this guide will help you get comfortable with the codebase.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Understanding the Project](#understanding-the-project)
- [Editing Card Layout & Positioning](#editing-card-layout--positioning)
- [Adding & Using Fonts](#adding--using-fonts)
- [Updating Assets](#updating-assets)
- [Resizing Components](#resizing-components)
- [Debug Mode](#debug-mode)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

You'll need Node.js installed. If you don't have it, download it from [nodejs.org](https://nodejs.org/).

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```
   (If you don't have `pnpm`, you can use `npm install` instead)

2. **Run the generator:**
   ```bash
   pnpm dev
   ```
   This generates all cards from your CSV file.

3. **Generate a single card (great for testing!):**
   ```bash
   pnpm single
   ```
   This creates one card with debug boxes visible, perfect for seeing where everything is positioned.

### Your First Test

1. Run `pnpm single` to generate a test card
2. Open `generated_cards/1.webp` to see your card
3. If you see colored boxes, that's debug mode showing you the layout areas!

---

## 🎯 Understanding the Project

### How It Works

1. **CSV Data** (`data/cards.csv`) - Contains all your card information (name, cost, lore, etc.)
2. **Element Templates** (`assets/`) - Background images for each element (Earth, Fire, Water, Wind, Energy)
3. **Card Art** - Downloaded from a URL based on the card's address
4. **Layout Configuration** - Defines where text and images appear on the card
5. **Output** - Generated WebP images in the `generated_cards/` folder

### Project Structure

```
beetlegame-webp/
├── assets/              # Element template images (Earth_1.png, Fire_1.png, etc.)
├── data/
│   └── cards.csv        # Your card data
├── fonts/               # Custom fonts (Stone Serif Semibold.ttf)
├── src/
│   └── card-generator.ts # Main generator code
└── generated_cards/     # Output folder (created automatically)
```

---

## ✏️ Editing Card Layout & Positioning

### Where to Edit

Open `src/card-generator.ts` and scroll down to the `main()` function (around line 802). You'll see a configuration object that looks like this:

```typescript
const generator = new CardGenerator({
  // ... configuration here
  layout: {
    name: { x: 100, y: 85, width: 1350, height: 155, ... },
    cost: { x: 110, y: 270, ... },
    // ... more elements
  }
});
```

### Understanding Coordinates

The card uses a coordinate system where:
- **x** = horizontal position (left to right)
- **y** = vertical position (top to bottom)
- **width** = how wide the text area is
- **height** = how tall the text area is

**Important:** The card size is **1742 x 2539 pixels** (defined by `cardWidth` and `cardHeight`).

### Positioning Elements

Each text element has these properties:

```typescript
name: {
  x: 100,              // Distance from left edge
  y: 85,               // Distance from top edge
  width: 1350,         // Width of the text area
  height: 155,         // Height of the text area
  fontSize: 120,       // Size of the text
  fontFamily: "CardNumbers",  // Which font to use
  color: "white",      // Text color (CSS colors work!)
  align: "left",       // Text alignment
  maxWidth: 1400,      // Maximum width before text wraps
}
```

### Text Alignment Options

You can use these alignment values:
- `"top-left"`, `"top-center"`, `"top-right"`
- `"left"`, `"center"`, `"right"`
- `"bottom-left"`, `"bottom-center"`, `"bottom-right"`

### Quick Positioning Tips

1. **Move text left/right:** Change the `x` value
   - Smaller = more left
   - Larger = more right

2. **Move text up/down:** Change the `y` value
   - Smaller = higher up
   - Larger = lower down

3. **Make text bigger:** Increase `fontSize`

4. **Change text color:** Use CSS color names or hex codes
   - `"white"`, `"black"`, `"#ff0000"` (red), `"rgba(255, 255, 255, 0.7)"` (semi-transparent)

### Example: Moving the Name

Let's say you want to move the card name down and make it bigger:

```typescript
name: {
  x: 100,
  y: 150,        // Changed from 85 to 150 (moves it down)
  width: 1350,
  height: 155,
  fontSize: 140,  // Changed from 120 to 140 (makes it bigger)
  // ... rest stays the same
}
```

### Card Art Positioning

The card art (the main image) is positioned separately:

```typescript
cardArtX: 220,        // Horizontal position
cardArtY: 451,        // Vertical position
cardArtWidth: 1300,   // How wide the image is
cardArtHeight: 1300,  // How tall the image is
```

---

## 🔤 Adding & Using Fonts

### Step 1: Add Your Font File

1. Place your `.ttf` or `.otf` font file in the `fonts/` folder
2. For example: `fonts/MyCustomFont.ttf`

### Step 2: Register the Font

In `src/card-generator.ts`, find the `fonts` configuration (around line 814):

```typescript
fonts: {
  CardNumbers: "./fonts/Stone Serif Semibold.ttf",
  // Add your font here:
  MyCustomFont: "./fonts/MyCustomFont.ttf",
},
```

The format is: `"FontName": "./fonts/YourFontFile.ttf"`

**Important:** The `FontName` is what you'll use in your layouts - it doesn't have to match the filename!

### Step 3: Use the Font in Your Layout

Now you can use it in any text element:

```typescript
layout: {
  name: {
    // ... other properties
    fontFamily: "MyCustomFont",  // Use the name you defined above
  },
  lore: {
    // ... other properties
    fontFamily: "MyCustomFont",  // Same font, different element
  },
}
```

### Font Tips

- **Font names are case-sensitive:** `"CardNumbers"` ≠ `"cardnumbers"`
- **Use the exact name** you defined in the `fonts` object
- **Test your font** by running `pnpm single` and checking the console for font loading messages
- If a font fails to load, the system will fall back to Arial and show a warning

---

## 🖼️ Updating Assets

### Element Templates

The element templates are the background images for each card type. They're located in the `assets/` folder.

**Current naming convention:**
- `Earth_1.png`, `Earth_2.png`
- `Fire_1.png`, `Fire_2.png`
- `Water_1.png`, `Water_2.png`
- `Wind_1.png`, `Wind_2.png`
- `Energy_1.png`, `Energy_2.png`

### How Templates Are Loaded

The generator looks for templates based on the element name in your CSV. Currently, the code looks for `{Element}.png` (e.g., `Earth.png`), but you have files named `{Element}_1.png` and `{Element}_2.png`.

**You have two options:**

1. **Rename your files** to match what the code expects:
   - Keep one version of each: `Earth.png`, `Fire.png`, `Water.png`, `Wind.png`, `Energy.png`
   - Or update the code (see below)

2. **Update the code** to handle your naming convention:
   - Open `src/card-generator.ts`
   - Find the `getTemplatePathForElement` function (around line 187)
   - Modify it to use `_1` or randomly select between `_1` and `_2`:

   ```typescript
   // Example: Always use _1 variant
   return path.join(this.config.templatesPath, `${capitalizedElement}_1.png`);
   
   // Or randomly select between _1 and _2:
   const variant = Math.random() < 0.5 ? "_1" : "_2";
   return path.join(this.config.templatesPath, `${capitalizedElement}${variant}.png`);
   ```

### Updating Template Images

1. **Replace the image file** in the `assets/` folder
2. **Keep the same filename** (or update the code to match your naming)
3. **Recommended size:** Match the card dimensions (1742 x 2539 pixels) for best quality
4. **Format:** PNG with transparency works great

### Adding New Elements

If you want to add a new element type (e.g., "Light"):

1. Add `Light_1.png` and `Light_2.png` to the `assets/` folder
2. Update your CSV to include cards with `Element: Light`
3. The generator will automatically find and use the template!

---

## 📏 Resizing Components

### Resizing the Entire Card

Change the card dimensions in the configuration:

```typescript
cardWidth: 1742,   // Width of the card
cardHeight: 2539,  // Height of the card
```

**Important:** If you change card size, you'll need to adjust all your layout coordinates proportionally!

### Resizing Text Elements

Each text element can be resized independently:

```typescript
name: {
  fontSize: 120,    // Make text bigger or smaller
  width: 1350,      // Make the text area wider or narrower
  height: 155,      // Make the text area taller or shorter
}
```

### Resizing Card Art

Adjust the card art size:

```typescript
cardArtX: 220,        // Starting X position
cardArtY: 451,        // Starting Y position
cardArtWidth: 1300,   // Make wider/narrower
cardArtHeight: 1300,  // Make taller/shorter
```

### Proportional Resizing Tips

If you're scaling everything up or down:

1. **Calculate the scale factor:**
   - New card width ÷ Old card width = scale factor
   - Example: 2000 ÷ 1742 = 1.148

2. **Multiply all coordinates by the scale factor:**
   - Old x: 100 → New x: 100 × 1.148 = 115
   - Old y: 85 → New y: 85 × 1.148 = 98

3. **Or use a calculator/spreadsheet** to do the math for you!

---

## 🐛 Debug Mode

Debug mode is your best friend when positioning elements! It shows colored boxes around each text area so you can see exactly where everything is.

### How to Use Debug Mode

Run:
```bash
pnpm single
```

This generates a card with debug boxes visible. You'll see:
- 🔴 **Red box** = Name area
- 🟢 **Green box** = Cost area
- 🔵 **Blue box** = Lore area
- 🟡 **Yellow box** = Attack area
- 🟣 **Magenta box** = Armor area
- 🟠 **Orange box** = Skills area
- 🟢 **Green border** = Card art area

### Reading Debug Information

The console will also show:
- Font loading status
- Text rendering details
- Position coordinates
- Any warnings or errors

### Disabling Debug Mode

Debug mode is automatically enabled in single card mode. To disable it, you'd need to modify the code (change `true` to `false` in the `generateSingleCard` call).

---

## 🎨 Advanced Features

### Text Backgrounds

You can add backgrounds behind text for better readability:

```typescript
lore: {
  // ... other properties
  padding: 20,                              // Space around text
  backgroundColor: "rgba(0, 0, 0, 0.2)",    // Semi-transparent black
  backgroundBlur: 8,                        // Blur effect (optional)
}
```

### Line Height

Control spacing between lines of text:

```typescript
lore: {
  // ... other properties
  lineHeight: 48,  // Space between lines (usually 1.2-1.5 × fontSize)
}
```

### WebP Quality

Adjust output image quality:

```typescript
webpQuality: 95,  // 0-100 (higher = better quality, larger file)
```

---

## 🔧 Troubleshooting

### "Font not found" Error

**Problem:** Font file can't be loaded

**Solutions:**
1. Check the file path in the `fonts` configuration
2. Make sure the file exists in the `fonts/` folder
3. Verify the filename matches exactly (case-sensitive!)
4. Check the console output for detailed error messages

### Text Not Appearing

**Problem:** Text element is empty or missing

**Solutions:**
1. Check your CSV data - make sure the column has values
2. Verify the layout coordinates are within the card bounds
3. Check the text color - it might be the same as the background!
4. Use debug mode to see if the text area is positioned correctly

### Images Not Loading

**Problem:** Card art or templates don't appear

**Solutions:**
1. For templates: Check the element name matches the filename
2. For card art: Verify the URL is accessible (check network connection)
3. Check the console for specific error messages
4. Make sure image paths are correct

### Positioning Looks Wrong

**Problem:** Elements are in the wrong place

**Solutions:**
1. Use debug mode (`pnpm single`) to see bounding boxes
2. Remember: y increases as you go down (top is 0)
3. Check that coordinates are within card bounds (0 to cardWidth/Height)
4. Verify alignment settings match your expectations

### Card Looks Blurry

**Problem:** Output images are low quality

**Solutions:**
1. Increase `webpQuality` (try 95-100)
2. Make sure your source images are high resolution
3. Check that card dimensions match your template images

---

## 💡 Tips for Success

1. **Start small:** Make one change at a time and test it
2. **Use debug mode:** It's incredibly helpful for positioning
3. **Keep backups:** Save your working configuration before making big changes
4. **Test frequently:** Run `pnpm single` after each change
5. **Read the console:** It provides helpful information about what's happening
6. **Experiment:** Don't be afraid to try different values - you can always change them back!

---

## 📚 Next Steps

Now that you understand the basics, here are some ideas for customization:

- **Add new text elements** (like a rarity indicator or special badge)
- **Create element-specific layouts** (different positioning for different elements)
- **Add visual effects** (shadows, borders, gradients)
- **Customize cost display** (currently shows stars, but you could change the format)
- **Batch processing** (process specific cards or filter by element)

---

## 🎉 You've Got This!

Remember: every expert was once a beginner. Take your time, experiment, and don't hesitate to check the code comments or console output for clues. The debug mode is there to help you visualize what's happening, so use it liberally!

Happy card generating! 🎴✨

