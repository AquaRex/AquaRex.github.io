# AquaRex Website Color System - Simplified

This file documents the **simplified** centralized color system for the AquaRex website, designed for easy maintenance and consistency.

## File Structure

- `styles/colors.css` - Essential color definitions (only 8 colors!)
- `styles/selection.css` - Global text selection colors
- Transparencies are defined inline where needed instead of as separate variables

## Essential Colors (Only 8!)

### Core Brand Colors
- `--primary-yellow: #f0663b` - Main brand orange/red color
- `--accent-error: #ff5d5b` - Error/warning color

### Background Colors
- `--background-dark: #152d28` - Main dark background
- `--bg-top: #2d4f48` - Background gradient top
- `--bg-middle: #1f3d38` - Background gradient middle  
- `--bg-bottom: #152d28` - Background gradient bottom

### Text Colors
- `--text-white: #ffffff` - Primary white text
- `--text-contrast: #000000` - Text on yellow backgrounds

## Transparency Usage

Instead of predefined transparency variables, we use inline rgba values:

```css
/* Light yellow background */
background: rgba(240, 208, 96, 0.12);

/* Medium yellow background */  
background: rgba(240, 208, 96, 0.18);

/* Yellow border */
border: 2px solid rgba(240, 208, 96, 0.5);

/* Yellow glow effect */
box-shadow: 0 0 30px rgba(240, 208, 96, 0.4);
```

## Common Inline Values

### Primary Color (#f0663b = rgb(240, 102, 59))
- `rgba(240, 102, 59, 0.12)` - Light backgrounds
- `rgba(240, 102, 59, 0.18)` - Medium backgrounds  
- `rgba(240, 102, 59, 0.3)` - Light borders
- `rgba(240, 102, 59, 0.4)` - Glow effects
- `rgba(240, 102, 59, 0.5)` - Standard borders
- `rgba(240, 102, 59, 0.7)` - Strong borders

### Black Shadows
- `rgba(0, 0, 0, 0.2)` - Light shadows
- `rgba(0, 0, 0, 0.3)` - Standard shadows
- `rgba(0, 0, 0, 0.4)` - Strong shadows

### White Glass Effects
- `rgba(255, 255, 255, 0.05)` - Glass backgrounds
- `rgba(255, 255, 255, 0.1)` - Subtle accents
- `rgba(255, 255, 255, 0.2)` - Shine effects

## Samsung Dark Mode Resistance

The simplified system maintains color resistance features:

1. **Consistent Yellow**: Using `#f0d060` consistently across all elements
2. **Color Scheme Declaration**: `color-scheme: dark only;` prevents system modifications  
3. **Font Smoothing**: Anti-aliasing properties in colors.css
4. **Hardware Acceleration**: Transform properties for color accuracy

## Usage Examples

```css
/* Using primary yellow */
.my-element {
    background: var(--primary-yellow);
    color: var(--text-contrast);
}

/* Using transparent yellow for buttons */
.my-button {
    background: rgba(240, 208, 96, 0.12);
    border: 2px solid rgba(240, 208, 96, 0.5);
    color: var(--primary-yellow);
}

/* Using glow effects */
.my-hover-element:hover {
    box-shadow: 0 0 30px rgba(240, 208, 96, 0.4);
}
```

## Benefits of Simplified System

1. **Easier Maintenance** - Only 8 color variables to manage
2. **More Flexible** - Inline transparencies can be customized per element
3. **Less Confusing** - No need to remember dozens of variable names
4. **Better Performance** - Fewer CSS variables to process
5. **Cleaner Code** - Transparency values are visible where they're used

## Customization

To change the primary yellow across the entire site:

1. Edit `--primary-yellow` in `styles/colors.css`  
2. Update the RGB values (240, 102, 59) in inline rgba() functions throughout the site
3. Test on Samsung devices with dark mode

## Quick Color Reference

- **Primary Orange**: `#f0663b` or `rgb(240, 102, 59)`
- **Error Red**: `#ff5d5b`  
- **Dark Background**: `#152d28`
- **White Text**: `#ffffff`
- **Black Text**: `#000000`