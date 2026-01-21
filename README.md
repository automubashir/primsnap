# PrimSnap

**Pixel-Perfect DOM Screenshot Library**

The most accurate client-side screenshot library that perfectly captures complex CSS including gradients, transforms, filters, clip-paths, pseudo-elements, and Shadow DOM.

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://automubashir.github.io/primsnap)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-purple.svg)]()

## Features

- **Pixel-Perfect Accuracy** - SVG foreignObject rendering ensures screenshots match exactly what you see
- **Full CSS Support** - Gradients, transforms, filters, clip-paths, pseudo-elements, CSS variables
- **@media Print Styles** - Respects print CSS rules like the browser's native print function
- **Header & Footer** - Custom headers/footers with template variables ({page}, {date}, etc.)
- **Page Break Controls** - Control breaks with `break-inside: avoid`
- **CSS/JS Injection** - Inject custom styles or run JavaScript before capture
- **Shadow DOM Support** - Full Web Components traversal
- **Web Fonts** - Waits for fonts to load and inlines them as data URIs
- **Zero Dependencies** - Single file, no build tools required

## Installation

### CDN
```html
<script src="https://cdn.jsdelivr.net/gh/automubashir/primsnap/primsnap.js"></script>
```

### Download
Download `primsnap.js` and include it in your project:
```html
<script src="primsnap.js"></script>
```

### npm (coming soon)
```bash
npm install primsnap
```

## Quick Start

```javascript
// Simple capture
const dataUrl = await PrimSnap.capture('#element');

// Download as PNG
await PrimSnap.download('#element', 'screenshot.png');

// Preview in modal
await PrimSnap.preview('#element');
```

## API

### PrimSnap.capture(selector, options)
Captures an element and returns a data URL.

```javascript
const dataUrl = await PrimSnap.capture('#element', {
  format: 'png',           // 'png' | 'jpeg' | 'webp' | 'svg'
  quality: 0.95,           // JPEG/WebP quality (0-1)
  scale: 2,                // Device pixel ratio
  backgroundColor: '#fff', // Background color (null = transparent)
});
```

### PrimSnap.download(selector, filename, options)
Captures and downloads the image.

```javascript
await PrimSnap.download('#element', 'report.png', {
  scale: 2,
  format: 'png'
});
```

### PrimSnap.preview(selector, options)
Shows a preview modal with download option.

```javascript
await PrimSnap.preview('#element', {
  title: 'Preview',
  filename: 'capture.png'
});
```

## Advanced Options

```javascript
await PrimSnap.capture('#element', {
  // Output
  format: 'png',
  quality: 0.95,
  scale: 2,
  backgroundColor: '#ffffff',

  // Print styles
  usePrintStyles: true,    // Apply @media print CSS

  // Header/Footer
  showHeader: true,
  header: '<span>Report</span><span>{date}</span>',
  showFooter: true,
  footer: '<span>Confidential</span><span>Page {page} of {pages}</span>',

  // Page breaks
  avoidBreakInside: ['.section', '.card'],

  // CSS/JS Injection
  injectCSS: '.no-print { display: none; }',
  injectJS: (el) => {
    el.querySelector('.date').textContent = new Date().toLocaleDateString();
  },

  // Callbacks
  onProgress: (progress, message) => {
    console.log(`${progress * 100}% - ${message}`);
  },
  onClone: (clone) => {
    // Modify cloned DOM before render
  },

  // Advanced
  useCORS: true,
  skipFonts: false,
  skipImages: false,
  timeout: 30000,
  debug: false
});
```

## Template Variables

Use these variables in header/footer templates:

| Variable | Description |
|----------|-------------|
| `{page}` | Current page number |
| `{pages}` | Total pages |
| `{date}` | Current date |
| `{time}` | Current time |
| `{datetime}` | Date and time |
| `{year}` | Current year |
| `{title}` | Document title |

## Methods

| Method | Description |
|--------|-------------|
| `capture(selector, options)` | Capture element as data URL |
| `download(selector, filename, options)` | Capture and download |
| `preview(selector, options)` | Show preview modal |
| `hidePreview()` | Hide preview modal |
| `toBlob(selector, options)` | Capture as Blob |
| `toCanvas(selector, options)` | Capture as Canvas |
| `captureForPrint(selector, options)` | Capture with print styles |
| `toDataUri(url)` | Convert URL to data URI |
| `getPageSizes()` | Get available page sizes |

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Why PrimSnap?

| Feature | html2canvas | PrimSnap |
|---------|-------------|----------|
| CSS Gradients | Partial | Full support |
| CSS Variables | Often broken | Properly resolved |
| Pseudo-elements | Not captured | Reconstructed |
| Shadow DOM | No support | Full traversal |
| Web Fonts | Unreliable | Waits & inlines |
| CSS Transforms | Partial | Full support |
| CSS Filters | Limited | Full support |
| @media print | None | Built-in |
| Custom injection | No | CSS & JS |
| Zero dependencies | Yes | Yes |

## How It Works

PrimSnap uses SVG foreignObject rendering instead of canvas-based approaches:

1. Deep clone the target element
2. Inline all computed styles
3. Resolve CSS variables
4. Reconstruct pseudo-elements (::before, ::after)
5. Traverse Shadow DOM
6. Inline images as data URIs
7. Inline fonts as data URIs
8. Serialize to XML
9. Wrap in SVG foreignObject
10. Render to Canvas
11. Export as PNG/JPEG/WebP

This approach ensures the browser's native rendering engine handles all CSS, resulting in pixel-perfect accuracy.

## License

MIT License - feel free to use in personal and commercial projects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Created with care for developers who need accurate, reliable screenshots.
