# CodePad Icon Generation Guide

## Current Status
CodePad currently uses the default Electron icon. A custom icon needs to be created.

## Icon Requirements

### Sizes Needed
- **Windows**: 256x256 .ico file (with multiple sizes embedded: 16, 32, 48, 64, 128, 256)
- **macOS**: 512x512 .icns file (or 1024x1024 for Retina)
- **Linux**: 512x512 .png file

### Design Concept
The icon should represent:
- **Code/Programming**: Brackets, terminal, or code symbols
- **Scratchpad/Note**: Notepad or document element
- **Speed/Rapid**: Lightning bolt or fast motion
- **Colors**: Blue/Cyan (#007acc - VS Code blue) with complementary colors

### Suggested Design Elements
1. **Primary**: Curly braces `{ }` or angle brackets `< >`
2. **Secondary**: Lightning bolt or sparkle to suggest rapid execution
3. **Background**: Dark theme (matching the app's VS Code aesthetic)
4. **Style**: Modern, flat design with subtle gradients

## Generation Tools

### Option 1: Online Icon Generators
1. Create base SVG or PNG at 1024x1024
2. Use tools like:
   - [Icon Kitchen](https://icon.kitchen/)
   - [Favicon.io](https://favicon.io/)
   - [CloudConvert](https://cloudconvert.com/) for format conversion

### Option 2: Manual Creation
Using design tools like:
- Figma (free, web-based)
- Inkscape (free, desktop)
- Adobe Illustrator (paid)

### Option 3: AI Generation
Use AI image generators:
1. Prompt: "Modern app icon for a code editor, featuring curly braces and lightning bolt, blue and cyan colors, dark background, flat design, 1024x1024"
2. Tools: DALL-E, Midjourney, Stable Diffusion
3. Refine and export at required sizes

## Implementation Steps

1. **Create base design** at 1024x1024 PNG
2. **Generate platform-specific formats**:
   ```bash
   # Windows .ico (requires ImageMagick or icon tools)
   convert icon-1024.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
   
   # macOS .icns (requires iconutil on macOS)
   # Create icon.iconset/ with various sizes, then:
   iconutil -c icns icon.iconset
   
   # Linux .png (just copy the 512x512 version)
   cp icon-512.png icon.png
   ```

3. **Place files**:
   - `assets/icons/icon.ico` (Windows)
   - `assets/icons/icon.icns` (macOS)
   - `assets/icons/icon.png` (Linux)

4. **Update electron-builder config** in package.json:
   ```json
   "build": {
     "appId": "com.codepad.app",
     "productName": "CodePad",
     "files": ["dist/**/*", "package.json"],
     "directories": {
       "buildResources": "assets"
     },
     "win": {
       "icon": "assets/icons/icon.ico"
     },
     "mac": {
       "icon": "assets/icons/icon.icns"
     },
     "linux": {
       "icon": "assets/icons/icon.png"
     }
   }
   ```

5. **Update BrowserWindow** in main process:
   ```typescript
   icon: path.join(__dirname, '../../assets/icons/icon.png')
   ```

## Temporary Solution
For development, using the default Electron icon is acceptable. The icon can be added before:
- First user testing
- Alpha/Beta release
- Final production release

## Future Improvements
- Add tray icon (16x16 or 32x32)
- Create promotional graphics (1024x500 for stores)
- Design splash screen
