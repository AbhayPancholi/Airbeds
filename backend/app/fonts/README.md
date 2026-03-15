# Fonts for Police Verification PDF (Marathi/Devanagari)

The police verification PDF uses **Marathi (Devanagari script)**. To render Marathi text correctly (instead of black boxes), the application needs a font that supports Devanagari.

## Option 1: Use a bundled font (recommended)

1. Download **Noto Sans Devanagari** from Google Fonts:  
   https://fonts.google.com/noto/specimen/Noto+Sans+Devanagari

2. Extract the ZIP and copy **NotoSansDevanagari-Regular.ttf** into this folder:
   ```
   Airbeds/backend/app/fonts/NotoSansDevanagari-Regular.ttf
   ```

3. Restart the backend. The PDF will use this font and Marathi will display correctly.

## Option 2: Rely on system fonts

On **Windows**, the code will automatically try `C:\Windows\Fonts\mangal.ttf` (Mangal) or `NirmalaUI.ttf` if present. Many Indian Windows installations have Mangal, so Marathi may work without adding any file.

On **Linux**, install a Devanagari font, for example:
```bash
sudo apt-get install fonts-noto-core  # or fonts-deva
```
Then place the TTF path in the code or add Noto to this folder as above.
