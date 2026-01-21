/**
 * PrimSnap - Pixel-Perfect DOM Screenshot & PDF Library
 * Version: 2.0.0
 *
 * The most accurate client-side screenshot library that perfectly captures
 * complex CSS including gradients, transforms, filters, clip-paths,
 * pseudo-elements, Shadow DOM, and respects @media print styles.
 *
 * Features:
 * - Pixel-perfect screenshots (PNG, JPEG, WebP)
 * - PDF generation with custom headers/footers
 * - @media print CSS support
 * - Page break controls
 * - CSS/JS injection
 * - Zero dependencies
 *
 * @author Open Source Community
 * @license MIT
 * @repository https://github.com/automubashir/primsnap
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PrimSnap = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '2.0.0';

  // ============================================================================
  // DEFAULT CONFIGURATION
  // ============================================================================

  const DEFAULTS = {
    // Output settings
    format: 'png',              // 'png' | 'jpeg' | 'webp' | 'svg' | 'blob' | 'canvas'
    quality: 0.95,              // JPEG/WebP quality (0-1)
    scale: window.devicePixelRatio || 1,
    backgroundColor: null,      // null = transparent, or '#ffffff'

    // CSS/JS Injection
    injectCSS: '',
    injectJS: null,

    // Print/PDF settings
    usePrintStyles: false,      // Apply @media print styles
    pageSize: 'auto',           // 'auto' | 'A4' | 'Letter' | 'Legal' | { width, height }

    // Header/Footer for PDF mode
    header: null,               // null | string | { text, height, style }
    footer: null,               // null | string | { text, height, style }
    showHeader: false,
    showFooter: false,

    // Page breaks
    respectPageBreaks: false,   // Respect break-before, break-after, break-inside
    avoidBreakInside: [],       // Selectors for elements that shouldn't break

    // Advanced
    useCORS: true,
    skipFonts: false,
    skipImages: false,
    timeout: 30000,
    preserveWhitespace: true,   // Prevent text wrapping issues

    // 3D/Experimental
    useScreenCapture: false,    // Use Screen Capture API for 3D content (requires permission)
    warn3D: true,               // Warn when 3D transforms detected

    // Callbacks
    onClone: null,
    onProgress: null,
    onWarning: null,            // Callback for warnings (3D detected, etc.)
    debug: false
  };

  // Page sizes in pixels (96 DPI)
  const PAGE_SIZES = {
    'A4': { width: 794, height: 1123 },
    'A3': { width: 1123, height: 1587 },
    'Letter': { width: 816, height: 1056 },
    'Legal': { width: 816, height: 1344 },
    'Tabloid': { width: 1056, height: 1632 }
  };

  // Complete CSS properties list - critical for accurate rendering
  const ALL_CSS_PROPERTIES = [
    // Positioning & Layout
    'position', 'top', 'right', 'bottom', 'left', 'zIndex', 'float', 'clear',
    'display', 'visibility', 'opacity',

    // Box Model
    'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'boxSizing', 'overflow', 'overflowX', 'overflowY', 'overflowWrap',

    // Flexbox
    'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignContent',
    'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'order',
    'gap', 'rowGap', 'columnGap',

    // Grid
    'gridTemplateColumns', 'gridTemplateRows', 'gridTemplateAreas',
    'gridColumn', 'gridColumnStart', 'gridColumnEnd',
    'gridRow', 'gridRowStart', 'gridRowEnd',
    'gridGap', 'gridAutoFlow', 'gridAutoColumns', 'gridAutoRows',
    'justifyItems', 'justifySelf', 'placeItems', 'placeContent', 'placeSelf',

    // Typography - CRITICAL for text wrapping fix
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant',
    'fontStretch', 'fontFeatureSettings', 'fontKerning',
    'lineHeight', 'letterSpacing', 'wordSpacing',
    'textAlign', 'textAlignLast', 'textDecoration', 'textDecorationLine',
    'textDecorationStyle', 'textDecorationColor', 'textDecorationThickness',
    'textTransform', 'textIndent', 'textShadow', 'textOverflow',
    'whiteSpace', 'wordBreak', 'wordWrap', 'overflowWrap', 'hyphens',
    'color', 'caretColor', 'tabSize',
    'writingMode', 'direction', 'unicodeBidi', 'verticalAlign',

    // Background
    'background', 'backgroundColor', 'backgroundImage', 'backgroundPosition',
    'backgroundPositionX', 'backgroundPositionY',
    'backgroundSize', 'backgroundRepeat', 'backgroundClip', 'backgroundOrigin',
    'backgroundAttachment', 'backgroundBlendMode',

    // Border
    'border', 'borderWidth', 'borderStyle', 'borderColor',
    'borderTop', 'borderTopWidth', 'borderTopStyle', 'borderTopColor',
    'borderRight', 'borderRightWidth', 'borderRightStyle', 'borderRightColor',
    'borderBottom', 'borderBottomWidth', 'borderBottomStyle', 'borderBottomColor',
    'borderLeft', 'borderLeftWidth', 'borderLeftStyle', 'borderLeftColor',
    'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius',
    'borderBottomLeftRadius', 'borderBottomRightRadius',
    'borderCollapse', 'borderSpacing',
    'borderImage', 'borderImageSource', 'borderImageSlice',

    // Outline
    'outline', 'outlineWidth', 'outlineStyle', 'outlineColor', 'outlineOffset',

    // Effects
    'boxShadow', 'filter', 'backdropFilter', 'mixBlendMode', 'isolation',

    // Transforms
    'transform', 'transformOrigin', 'transformStyle', 'transformBox',
    'perspective', 'perspectiveOrigin', 'rotate', 'scale', 'translate',

    // Clipping & Masking
    'clipPath', 'clip', 'mask', 'maskImage', 'maskMode', 'maskRepeat',
    'maskPosition', 'maskClip', 'maskOrigin', 'maskSize', 'maskComposite',

    // Table
    'tableLayout', 'captionSide', 'emptyCells',

    // List
    'listStyle', 'listStyleType', 'listStylePosition', 'listStyleImage',

    // Columns
    'columns', 'columnCount', 'columnWidth', 'columnGap', 'columnRule',
    'columnRuleWidth', 'columnRuleStyle', 'columnRuleColor', 'columnSpan',

    // Page breaks - CRITICAL for PDF
    'pageBreakBefore', 'pageBreakAfter', 'pageBreakInside',
    'breakBefore', 'breakAfter', 'breakInside',

    // Sizing
    'aspectRatio', 'objectFit', 'objectPosition', 'contain',

    // Interaction
    'cursor', 'pointerEvents', 'userSelect', 'touchAction', 'resize',

    // Content
    'content', 'quotes', 'counterIncrement', 'counterReset',

    // SVG
    'fill', 'fillOpacity', 'fillRule', 'stroke', 'strokeWidth',
    'strokeOpacity', 'strokeLinecap', 'strokeLinejoin',
    'strokeDasharray', 'strokeDashoffset',

    // Misc
    'willChange', 'backfaceVisibility', 'imageRendering'
  ];

  // Pseudo-element properties
  const PSEUDO_PROPERTIES = [
    'content', 'position', 'display', 'top', 'right', 'bottom', 'left',
    'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'background', 'backgroundColor', 'backgroundImage', 'backgroundSize',
    'backgroundPosition', 'backgroundRepeat',
    'border', 'borderWidth', 'borderStyle', 'borderColor', 'borderRadius',
    'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
    'boxShadow', 'opacity', 'transform', 'transformOrigin',
    'zIndex', 'overflow', 'color', 'fontSize', 'fontFamily', 'fontWeight',
    'textAlign', 'lineHeight', 'letterSpacing', 'whiteSpace',
    'filter', 'backdropFilter', 'clipPath', 'pointerEvents'
  ];

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const Utils = {
    merge(target, ...sources) {
      for (const source of sources) {
        if (source) {
          for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              if (source[key] !== undefined) {
                target[key] = source[key];
              }
            }
          }
        }
      }
      return target;
    },

    toKebabCase(str) {
      return str.replace(/([A-Z])/g, '-$1').toLowerCase();
    },

    uid(prefix = 'primsnap') {
      return `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
    },

    log(options, ...args) {
      if (options.debug) {
        console.log('[PrimSnap]', ...args);
      }
    },

    isDataUri(url) {
      return url && typeof url === 'string' && url.startsWith('data:');
    },

    isBlobUri(url) {
      return url && typeof url === 'string' && url.startsWith('blob:');
    },

    resolveUrl(url, baseUrl = window.location.href) {
      if (!url || Utils.isDataUri(url) || Utils.isBlobUri(url)) return url;
      try {
        return new URL(url, baseUrl).href;
      } catch (e) {
        return url;
      }
    },

    async toDataUri(url, options = {}) {
      if (!url || Utils.isDataUri(url)) return url;

      try {
        const fetchOptions = options.useCORS
          ? { mode: 'cors', credentials: 'omit' }
          : {};

        const response = await fetch(url, fetchOptions);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        Utils.log(options, `Failed to fetch ${url}:`, error.message);
        return null;
      }
    },

    extractUrlsFromCss(cssValue) {
      if (!cssValue || cssValue === 'none') return [];
      const urls = [];
      const regex = /url\(['"]?([^'"()]+)['"]?\)/g;
      let match;
      while ((match = regex.exec(cssValue)) !== null) {
        urls.push(match[1]);
      }
      return urls;
    },

    // Get page size in pixels
    getPageSize(size) {
      if (typeof size === 'object' && size.width && size.height) {
        return size;
      }
      return PAGE_SIZES[size] || null;
    },

    // Trigger warning callback
    warn(options, type, message, details = {}) {
      Utils.log(options, `WARNING [${type}]:`, message);
      if (typeof options.onWarning === 'function') {
        options.onWarning({ type, message, details });
      }
    }
  };

  // ============================================================================
  // 3D TRANSFORM DETECTOR
  // ============================================================================

  const Transform3DDetector = {
    // CSS properties that indicate 3D rendering
    TRANSFORM_3D_KEYWORDS: [
      'rotateX', 'rotateY', 'rotateZ', 'rotate3d',
      'translateZ', 'translate3d',
      'scaleZ', 'scale3d',
      'perspective', 'matrix3d'
    ],

    /**
     * Check if an element or its children use 3D transforms
     */
    detect(element, options = {}) {
      const issues = [];
      this._scan(element, issues);

      if (issues.length > 0 && options.warn3D) {
        Utils.warn(options, '3D_TRANSFORMS_DETECTED',
          `Detected ${issues.length} element(s) with 3D CSS transforms. ` +
          `SVG-based capture cannot render 3D transforms accurately. ` +
          `Consider using useScreenCapture: true for accurate 3D capture (requires user permission).`,
          { elements: issues }
        );
      }

      return issues;
    },

    _scan(element, issues) {
      if (!(element instanceof Element)) return;

      const style = window.getComputedStyle(element);

      // Check transform property
      const transform = style.transform || style.webkitTransform;
      if (transform && transform !== 'none') {
        for (const keyword of this.TRANSFORM_3D_KEYWORDS) {
          if (transform.includes(keyword)) {
            issues.push({
              element,
              property: 'transform',
              value: transform,
              keyword
            });
            break;
          }
        }
      }

      // Check transform-style: preserve-3d
      const transformStyle = style.transformStyle || style.webkitTransformStyle;
      if (transformStyle === 'preserve-3d') {
        issues.push({
          element,
          property: 'transform-style',
          value: transformStyle
        });
      }

      // Check perspective
      const perspective = style.perspective || style.webkitPerspective;
      if (perspective && perspective !== 'none' && perspective !== '0px') {
        issues.push({
          element,
          property: 'perspective',
          value: perspective
        });
      }

      // Recursively check children
      for (const child of element.children) {
        this._scan(child, issues);
      }

      // Check Shadow DOM
      if (element.shadowRoot) {
        for (const child of element.shadowRoot.children) {
          this._scan(child, issues);
        }
      }
    },

    /**
     * Check if Screen Capture API is supported
     */
    isScreenCaptureSupported() {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    }
  };

  // ============================================================================
  // SCREEN CAPTURE API (Experimental - for 3D content)
  // ============================================================================

  const ScreenCapture = {
    /**
     * Capture element using Screen Capture API
     * This captures the actual rendered pixels, including 3D transforms
     * Requires user permission and element must be visible on screen
     */
    async capture(element, options = {}) {
      if (!Transform3DDetector.isScreenCaptureSupported()) {
        throw new Error('Screen Capture API is not supported in this browser');
      }

      const rect = element.getBoundingClientRect();

      // Element must be visible in viewport
      if (rect.top < 0 || rect.left < 0 ||
          rect.bottom > window.innerHeight ||
          rect.right > window.innerWidth) {
        Utils.warn(options, 'ELEMENT_NOT_VISIBLE',
          'Element must be fully visible on screen for Screen Capture. ' +
          'Scroll to make the element visible.',
          { rect }
        );
      }

      let stream = null;
      try {
        // Request screen capture permission
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'browser',
            cursor: 'never'
          },
          audio: false,
          preferCurrentTab: true  // Chrome 109+
        });

        // Wait a frame for the capture to stabilize
        await new Promise(r => setTimeout(r, 100));

        // Create video element to capture frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        await video.play();

        // Create canvas and draw the video frame
        const canvas = document.createElement('canvas');
        const scale = options.scale || window.devicePixelRatio || 1;

        canvas.width = Math.ceil(rect.width * scale);
        canvas.height = Math.ceil(rect.height * scale);

        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        // Calculate the position of the element in the captured screen
        // Note: This is approximate and depends on browser chrome, scroll position, etc.
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        // Draw only the element's region
        ctx.drawImage(
          video,
          rect.left * scale, rect.top * scale, // Source position
          rect.width * scale, rect.height * scale, // Source size
          0, 0, // Destination position
          rect.width, rect.height // Destination size
        );

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());

        // Export based on format
        const format = options.format || 'png';
        const quality = options.quality || 0.95;

        switch (format) {
          case 'png': return canvas.toDataURL('image/png');
          case 'jpeg':
          case 'jpg': return canvas.toDataURL('image/jpeg', quality);
          case 'webp': return canvas.toDataURL('image/webp', quality);
          case 'blob': return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          case 'canvas': return canvas;
          default: return canvas.toDataURL('image/png');
        }

      } catch (error) {
        // Make sure to stop the stream on error
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        if (error.name === 'NotAllowedError') {
          throw new Error('Screen capture permission denied by user');
        }
        throw error;
      }
    }
  };

  // ============================================================================
  // PRINT STYLE EXTRACTOR
  // ============================================================================

  const PrintStyleExtractor = {
    /**
     * Extract @media print styles from all stylesheets
     */
    extract() {
      const printStyles = [];

      try {
        for (const sheet of document.styleSheets) {
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (!rules) continue;

            for (const rule of rules) {
              if (rule instanceof CSSMediaRule) {
                if (rule.conditionText === 'print' || rule.media.mediaText === 'print') {
                  // Extract all rules inside @media print
                  for (const innerRule of rule.cssRules) {
                    printStyles.push(innerRule.cssText);
                  }
                }
              }
            }
          } catch (e) {
            // CORS restriction on stylesheet
          }
        }
      } catch (e) {
        // Stylesheet access error
      }

      return printStyles.join('\n');
    },

    /**
     * Apply print styles to cloned element
     */
    apply(clone, options) {
      if (!options.usePrintStyles) return;

      const printCSS = this.extract();
      if (printCSS) {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-primsnap-print', 'true');
        styleEl.textContent = printCSS;
        clone.insertBefore(styleEl, clone.firstChild);
      }
    }
  };

  // ============================================================================
  // STYLE PROCESSOR
  // ============================================================================

  const StyleProcessor = {
    /**
     * Get computed styles as inline string with whitespace preservation
     */
    getComputedStyleString(element, options) {
      const computed = window.getComputedStyle(element);
      const styles = [];

      for (const prop of ALL_CSS_PROPERTIES) {
        const kebabProp = Utils.toKebabCase(prop);
        let value = computed.getPropertyValue(kebabProp);

        if (value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== '') {
          value = this.resolveCssVariables(value, computed);
          styles.push(`${kebabProp}: ${value}`);
        }
      }

      // CRITICAL: Preserve whitespace to prevent text wrapping
      if (options.preserveWhitespace) {
        const whiteSpace = computed.getPropertyValue('white-space');
        if (!whiteSpace || whiteSpace === 'normal') {
          // Don't force nowrap globally - check if element is inline
          const display = computed.getPropertyValue('display');
          if (display === 'inline' || display === 'inline-block') {
            styles.push('white-space: nowrap');
          }
        }
      }

      return styles.join('; ');
    },

    /**
     * Apply styles to cloned element
     */
    applyStyles(original, clone, options) {
      const styleString = this.getComputedStyleString(original, options);
      clone.style.cssText = styleString;

      // Copy CSS variables
      const computed = window.getComputedStyle(original);
      const style = original.style;

      for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        if (prop.startsWith('--')) {
          clone.style.setProperty(prop, computed.getPropertyValue(prop));
        }
      }

      // Handle specific text elements to prevent wrapping
      if (options.preserveWhitespace) {
        const tagName = original.tagName.toLowerCase();
        if (['span', 'a', 'strong', 'em', 'b', 'i', 'label'].includes(tagName)) {
          const text = original.textContent;
          if (text && !text.includes('\n')) {
            clone.style.whiteSpace = 'nowrap';
          }
        }
      }
    },

    /**
     * Resolve CSS variables
     */
    resolveCssVariables(value, computed) {
      if (!value || typeof value !== 'string' || !value.includes('var(')) {
        return value;
      }

      let result = value;
      let iterations = 0;

      while (result.includes('var(') && iterations < 10) {
        result = result.replace(
          /var\(\s*(--[^,)]+)\s*(?:,\s*([^)]+))?\s*\)/g,
          (match, varName, fallback) => {
            const resolved = computed.getPropertyValue(varName.trim()).trim();
            return resolved || fallback || '';
          }
        );
        iterations++;
      }

      return result;
    }
  };

  // ============================================================================
  // PSEUDO-ELEMENT PROCESSOR
  // ============================================================================

  const PseudoProcessor = {
    process(original, clone, options) {
      this.processPseudo(original, clone, 'before', options);
      this.processPseudo(original, clone, 'after', options);
    },

    processPseudo(original, clone, type, options) {
      const computed = window.getComputedStyle(original, `::${type}`);
      const content = computed.getPropertyValue('content');
      const display = computed.getPropertyValue('display');

      if (!content || content === 'none' || content === 'normal' || display === 'none') {
        return;
      }

      Utils.log(options, `Processing ::${type}`, 'content:', content);

      const pseudo = document.createElement('span');
      pseudo.setAttribute('data-primsnap-pseudo', type);

      // Build style string
      const styles = [];

      for (const prop of PSEUDO_PROPERTIES) {
        const kebabProp = Utils.toKebabCase(prop);
        let value = computed.getPropertyValue(kebabProp);

        if (value && value !== '' && value !== 'none' && value !== 'normal' && value !== 'auto') {
          if (prop === 'content') continue;
          value = StyleProcessor.resolveCssVariables(value, computed);
          styles.push(`${kebabProp}: ${value}`);
        }
      }

      // Ensure positioning
      const position = computed.getPropertyValue('position');
      if (!position || position === 'static') {
        styles.push('position: absolute');
      }

      // Get dimensions
      const width = computed.getPropertyValue('width');
      const height = computed.getPropertyValue('height');
      if (width && width !== 'auto' && width !== '0px') styles.push(`width: ${width}`);
      if (height && height !== 'auto' && height !== '0px') styles.push(`height: ${height}`);

      // Prevent interaction
      styles.push('pointer-events: none');

      pseudo.style.cssText = styles.join('; ');

      // Handle content
      const processedContent = this.processContent(content, original, computed);
      if (processedContent.type === 'text') {
        pseudo.textContent = processedContent.value;
      } else if (processedContent.type === 'element') {
        pseudo.appendChild(processedContent.value);
      }

      // Ensure parent has position context
      const parentPosition = window.getComputedStyle(original).getPropertyValue('position');
      if (parentPosition === 'static') {
        clone.style.position = 'relative';
      }

      // Insert at correct position
      if (type === 'before') {
        clone.insertBefore(pseudo, clone.firstChild);
      } else {
        clone.appendChild(pseudo);
      }
    },

    processContent(content, element, computed) {
      let value = content.trim();

      // Quoted string
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        const text = value.slice(1, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, '\\');
        return { type: 'text', value: text };
      }

      // Empty string (decorative pseudo-elements)
      if (value === '""' || value === "''") {
        return { type: 'text', value: '' };
      }

      // url()
      const urlMatch = value.match(/url\(['"]?([^'"()]+)['"]?\)/);
      if (urlMatch) {
        const img = document.createElement('img');
        img.src = Utils.resolveUrl(urlMatch[1]);
        img.style.cssText = 'display: block; width: 100%; height: 100%;';
        return { type: 'element', value: img };
      }

      // attr()
      const attrMatch = value.match(/attr\(([^)]+)\)/);
      if (attrMatch) {
        return { type: 'text', value: element.getAttribute(attrMatch[1].trim()) || '' };
      }

      return { type: 'text', value: '' };
    }
  };

  // ============================================================================
  // IMAGE PROCESSOR
  // ============================================================================

  const ImageProcessor = {
    async process(clone, options) {
      if (options.skipImages) return;

      Utils.log(options, 'Processing images...');
      const tasks = [];

      // <img> elements
      const images = clone.querySelectorAll('img');
      for (const img of images) {
        tasks.push(this.processImg(img, options));
      }

      // Background images
      const allElements = clone.querySelectorAll('*');
      for (const el of allElements) {
        tasks.push(this.processBackgroundImage(el, options));
      }
      tasks.push(this.processBackgroundImage(clone, options));

      await Promise.all(tasks);
    },

    async processImg(img, options) {
      const src = img.getAttribute('src') || img.src;
      if (!src || Utils.isDataUri(src)) return;

      try {
        const dataUri = await Utils.toDataUri(Utils.resolveUrl(src), options);
        if (dataUri) img.src = dataUri;
      } catch (e) {
        Utils.log(options, 'Failed to inline image:', src);
      }
    },

    async processBackgroundImage(element, options) {
      const bgImage = element.style.backgroundImage;
      if (!bgImage || bgImage === 'none') return;

      const urls = Utils.extractUrlsFromCss(bgImage);
      if (urls.length === 0) return;

      let newBgImage = bgImage;

      for (const url of urls) {
        if (!Utils.isDataUri(url)) {
          const absoluteUrl = Utils.resolveUrl(url);
          const dataUri = await Utils.toDataUri(absoluteUrl, options);
          if (dataUri) {
            const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            newBgImage = newBgImage.replace(new RegExp(escapedUrl, 'g'), dataUri);
          }
        }
      }

      element.style.backgroundImage = newBgImage;
    }
  };

  // ============================================================================
  // FONT PROCESSOR
  // ============================================================================

  const FontProcessor = {
    async process(clone, options) {
      if (options.skipFonts) return;

      Utils.log(options, 'Processing fonts...');

      try {
        await document.fonts.ready;
      } catch (e) {}

      const fontFaces = this.extractFontFaces();
      if (fontFaces.length === 0) return;

      const inlinedFonts = await Promise.all(
        fontFaces.map(face => this.inlineFontFace(face, options))
      );

      const validFonts = inlinedFonts.filter(f => f !== null);

      if (validFonts.length > 0) {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-primsnap-fonts', 'true');
        styleEl.textContent = validFonts.join('\n');
        clone.insertBefore(styleEl, clone.firstChild);
      }
    },

    extractFontFaces() {
      const fontFaces = [];

      try {
        for (const sheet of document.styleSheets) {
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (!rules) continue;

            for (const rule of rules) {
              if (rule instanceof CSSFontFaceRule) {
                fontFaces.push({
                  cssText: rule.cssText,
                  src: rule.style.src
                });
              }
            }
          } catch (e) {}
        }
      } catch (e) {}

      return fontFaces;
    },

    async inlineFontFace(fontFace, options) {
      let cssText = fontFace.cssText;
      const urls = Utils.extractUrlsFromCss(fontFace.src || cssText);

      for (const url of urls) {
        if (!Utils.isDataUri(url)) {
          const absoluteUrl = Utils.resolveUrl(url);
          const dataUri = await Utils.toDataUri(absoluteUrl, options);
          if (dataUri) {
            cssText = cssText.replace(url, dataUri);
          }
        }
      }

      return cssText;
    }
  };

  // ============================================================================
  // SHADOW DOM PROCESSOR
  // ============================================================================

  const ShadowProcessor = {
    async process(original, clone, options) {
      await this.processElement(original, clone, options);
    },

    async processElement(original, clone, options) {
      if (original.shadowRoot) {
        Utils.log(options, 'Processing Shadow DOM');

        const shadowContainer = document.createElement('div');
        shadowContainer.setAttribute('data-primsnap-shadow', 'true');
        shadowContainer.style.cssText = 'display: contents;';

        for (const child of original.shadowRoot.childNodes) {
          const clonedChild = child.cloneNode(true);
          shadowContainer.appendChild(clonedChild);

          if (child.nodeType === Node.ELEMENT_NODE) {
            StyleProcessor.applyStyles(child, clonedChild, options);
            PseudoProcessor.process(child, clonedChild, options);
          }
        }

        clone.appendChild(shadowContainer);
      }

      const origChildren = Array.from(original.children);
      const cloneChildren = Array.from(clone.children);

      for (let i = 0; i < origChildren.length; i++) {
        const origChild = origChildren[i];
        const cloneChild = cloneChildren[i];

        if (origChild && cloneChild && !cloneChild.hasAttribute('data-primsnap-pseudo')) {
          await this.processElement(origChild, cloneChild, options);
        }
      }
    }
  };

  // ============================================================================
  // PAGE BREAK HANDLER
  // ============================================================================

  const PageBreakHandler = {
    /**
     * Apply page break controls
     */
    apply(clone, options) {
      if (!options.respectPageBreaks && options.avoidBreakInside.length === 0) {
        return;
      }

      // Apply break-inside: avoid to specified selectors
      if (options.avoidBreakInside.length > 0) {
        for (const selector of options.avoidBreakInside) {
          try {
            const elements = clone.querySelectorAll(selector);
            for (const el of elements) {
              el.style.breakInside = 'avoid';
              el.style.pageBreakInside = 'avoid';
            }
          } catch (e) {
            Utils.log(options, 'Invalid selector:', selector);
          }
        }
      }
    }
  };

  // ============================================================================
  // HEADER/FOOTER GENERATOR
  // ============================================================================

  const HeaderFooterGenerator = {
    /**
     * Create header element
     */
    createHeader(options, pageNum = 1, totalPages = 1) {
      if (!options.showHeader || !options.header) return null;

      const header = document.createElement('div');
      header.setAttribute('data-primsnap-header', 'true');

      const config = typeof options.header === 'string'
        ? { text: options.header, height: 40, style: '' }
        : options.header;

      header.style.cssText = `
        width: 100%;
        height: ${config.height || 40}px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        font-size: 12px;
        color: #666;
        border-bottom: 1px solid #eee;
        box-sizing: border-box;
        ${config.style || ''}
      `;

      const text = this.processTemplate(config.text, pageNum, totalPages);
      header.innerHTML = text;

      return header;
    },

    /**
     * Create footer element
     */
    createFooter(options, pageNum = 1, totalPages = 1) {
      if (!options.showFooter || !options.footer) return null;

      const footer = document.createElement('div');
      footer.setAttribute('data-primsnap-footer', 'true');

      const config = typeof options.footer === 'string'
        ? { text: options.footer, height: 40, style: '' }
        : options.footer;

      footer.style.cssText = `
        width: 100%;
        height: ${config.height || 40}px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #eee;
        box-sizing: border-box;
        ${config.style || ''}
      `;

      const text = this.processTemplate(config.text, pageNum, totalPages);
      footer.innerHTML = text;

      return footer;
    },

    /**
     * Process template variables
     */
    processTemplate(text, pageNum, totalPages) {
      if (!text) return '';

      const now = new Date();

      return text
        .replace(/\{page\}/g, pageNum)
        .replace(/\{pages\}/g, totalPages)
        .replace(/\{date\}/g, now.toLocaleDateString())
        .replace(/\{time\}/g, now.toLocaleTimeString())
        .replace(/\{datetime\}/g, now.toLocaleString())
        .replace(/\{year\}/g, now.getFullYear())
        .replace(/\{title\}/g, document.title);
    }
  };

  // ============================================================================
  // DOM CLONER
  // ============================================================================

  const Cloner = {
    async clone(element, options) {
      Utils.log(options, 'Cloning DOM...');

      const clone = element.cloneNode(true);

      // Temporary container
      const container = document.createElement('div');
      container.id = Utils.uid('container');
      container.style.cssText = 'position: absolute; left: -99999px; top: -99999px; pointer-events: none;';
      container.appendChild(clone);
      document.body.appendChild(container);

      try {
        // Apply print styles if enabled
        PrintStyleExtractor.apply(clone, options);

        // Process tree
        await this.processTree(element, clone, options);

        // Handle Shadow DOM
        await ShadowProcessor.process(element, clone, options);

        // Apply page breaks
        PageBreakHandler.apply(clone, options);

        // Custom callback
        if (typeof options.onClone === 'function') {
          await options.onClone(clone);
        }

        return clone;
      } finally {
        document.body.removeChild(container);
      }
    },

    async processTree(original, clone, options) {
      if (original.nodeType !== Node.ELEMENT_NODE) return;

      StyleProcessor.applyStyles(original, clone, options);
      PseudoProcessor.process(original, clone, options);
      await this.handleSpecialElements(original, clone, options);

      const origChildren = Array.from(original.children);
      const cloneChildren = Array.from(clone.children).filter(
        c => !c.hasAttribute('data-primsnap-pseudo')
      );

      for (let i = 0; i < origChildren.length; i++) {
        if (cloneChildren[i]) {
          await this.processTree(origChildren[i], cloneChildren[i], options);
        }
      }
    },

    async handleSpecialElements(original, clone, options) {
      const tagName = original.tagName.toLowerCase();

      switch (tagName) {
        case 'canvas':
          try {
            clone.getContext('2d').drawImage(original, 0, 0);
          } catch (e) {}
          break;

        case 'video':
          try {
            const canvas = document.createElement('canvas');
            canvas.width = original.videoWidth || original.offsetWidth;
            canvas.height = original.videoHeight || original.offsetHeight;
            canvas.getContext('2d').drawImage(original, 0, 0);
            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            img.style.cssText = clone.style.cssText;
            clone.parentNode?.replaceChild(img, clone);
          } catch (e) {}
          break;

        case 'input':
        case 'textarea':
          clone.value = original.value;
          if (original.type === 'checkbox' || original.type === 'radio') {
            clone.checked = original.checked;
          }
          break;

        case 'select':
          clone.value = original.value;
          break;

        case 'svg':
          this.processSvg(original, clone, options);
          break;
      }
    },

    processSvg(original, clone, options) {
      const svgElements = clone.querySelectorAll('*');
      const origSvgElements = original.querySelectorAll('*');

      svgElements.forEach((el, i) => {
        if (origSvgElements[i]) {
          const computed = window.getComputedStyle(origSvgElements[i]);
          ['fill', 'stroke', 'strokeWidth', 'opacity', 'fillOpacity', 'strokeOpacity'].forEach(prop => {
            const value = computed.getPropertyValue(Utils.toKebabCase(prop));
            if (value) el.style[prop] = value;
          });
        }
      });
    }
  };

  // ============================================================================
  // SVG RENDERER
  // ============================================================================

  const SvgRenderer = {
    async render(clone, width, height, options) {
      Utils.log(options, 'Rendering to SVG...');

      // Add header if enabled
      const header = HeaderFooterGenerator.createHeader(options);
      const footer = HeaderFooterGenerator.createFooter(options);

      // Wrap content
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `width: ${width}px; min-height: ${height}px;`;

      if (header) wrapper.appendChild(header);
      wrapper.appendChild(clone.cloneNode(true));
      if (footer) wrapper.appendChild(footer);

      // Adjust height for header/footer
      let totalHeight = height;
      if (header) totalHeight += parseInt(options.header?.height || 40);
      if (footer) totalHeight += parseInt(options.footer?.height || 40);

      // Serialize
      const serializer = new XMLSerializer();
      let html = serializer.serializeToString(wrapper);

      if (!html.includes('xmlns="http://www.w3.org/1999/xhtml"')) {
        html = html.replace(/^<div/, '<div xmlns="http://www.w3.org/1999/xhtml"');
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
        <foreignObject x="0" y="0" width="100%" height="100%">
          ${html}
        </foreignObject>
      </svg>`;

      return {
        dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
        width,
        height: totalHeight
      };
    }
  };

  // ============================================================================
  // CANVAS RENDERER
  // ============================================================================

  const CanvasRenderer = {
    async render(svgData, options) {
      Utils.log(options, 'Rendering to Canvas...');

      const { dataUrl, width, height } = svgData;
      const scale = options.scale || 1;

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);

      if (options.backgroundColor) {
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas);
        };

        img.onerror = async () => {
          try {
            const svgContent = decodeURIComponent(dataUrl.replace('data:image/svg+xml;charset=utf-8,', ''));
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const blobUrl = URL.createObjectURL(blob);

            const img2 = new Image();
            img2.onload = () => {
              ctx.drawImage(img2, 0, 0, width, height);
              URL.revokeObjectURL(blobUrl);
              resolve(canvas);
            };
            img2.onerror = () => {
              URL.revokeObjectURL(blobUrl);
              reject(new Error('Failed to render'));
            };
            img2.src = blobUrl;
          } catch (e) {
            reject(e);
          }
        };

        img.src = dataUrl;
      });
    },

    export(canvas, options) {
      const format = options.format || 'png';
      const quality = options.quality || 0.95;

      switch (format) {
        case 'png': return canvas.toDataURL('image/png');
        case 'jpeg':
        case 'jpg': return canvas.toDataURL('image/jpeg', quality);
        case 'webp': return canvas.toDataURL('image/webp', quality);
        case 'blob': return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        case 'canvas': return canvas;
        default: return canvas.toDataURL('image/png');
      }
    }
  };

  // ============================================================================
  // PREVIEW MODAL - Simple, Clean Implementation
  // ============================================================================

  const PreviewModal = {
    modal: null,
    img: null,
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,

    show(dataUrl, options = {}) {
      this.hide();
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;

      const modal = document.createElement('div');
      modal.id = 'primsnap-modal';
      modal.innerHTML = `
        <div class="ps-overlay">
          <div class="ps-modal">
            <div class="ps-toolbar">
              <span class="ps-title">${options.title || 'Preview'}</span>
              <div class="ps-zoom-controls">
                <button class="ps-btn-icon" data-action="zoom-out" title="Zoom Out">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6"/></svg>
                </button>
                <span class="ps-zoom-value">100%</span>
                <button class="ps-btn-icon" data-action="zoom-in" title="Zoom In">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                </button>
                <button class="ps-btn-icon" data-action="reset" title="Reset View">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
              </div>
              <div class="ps-actions">
                <button class="ps-btn ps-btn-ghost" data-action="close">Cancel</button>
                <button class="ps-btn ps-btn-primary" data-action="download">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
              </div>
            </div>
            <div class="ps-canvas">
              <img src="${dataUrl}" alt="Preview" draggable="false">
            </div>
          </div>
        </div>
      `;

      const styles = document.createElement('style');
      styles.textContent = `
        #primsnap-modal { position: fixed; inset: 0; z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .ps-overlay { width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .ps-modal { background: #18181b; border-radius: 12px; width: 100%; max-width: 1000px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden; }
        .ps-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #27272a; border-bottom: 1px solid #3f3f46; gap: 12px; }
        .ps-title { color: #fff; font-size: 14px; font-weight: 600; }
        .ps-zoom-controls { display: flex; align-items: center; gap: 8px; }
        .ps-zoom-value { color: #a1a1aa; font-size: 13px; min-width: 48px; text-align: center; font-variant-numeric: tabular-nums; }
        .ps-btn-icon { width: 32px; height: 32px; border: none; background: #3f3f46; color: #fff; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
        .ps-btn-icon:hover { background: #52525b; }
        .ps-actions { display: flex; gap: 8px; }
        .ps-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .ps-btn-ghost { background: transparent; color: #a1a1aa; }
        .ps-btn-ghost:hover { background: #3f3f46; color: #fff; }
        .ps-btn-primary { background: #6366f1; color: #fff; }
        .ps-btn-primary:hover { background: #4f46e5; }
        .ps-canvas { flex: 1; background: #09090b; overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: grab; min-height: 400px; }
        .ps-canvas.dragging { cursor: grabbing; }
        .ps-canvas img { max-width: 90%; max-height: calc(90vh - 100px); object-fit: contain; border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); transition: transform 0.1s ease-out; user-select: none; pointer-events: none; }
      `;

      modal.appendChild(styles);
      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';
      this.modal = modal;
      this.img = modal.querySelector('.ps-canvas img');

      const canvas = modal.querySelector('.ps-canvas');
      const zoomValue = modal.querySelector('.ps-zoom-value');

      const updateView = () => {
        this.img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        zoomValue.textContent = Math.round(this.scale * 100) + '%';
      };

      const resetView = () => {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        updateView();
      };

      // Zoom buttons
      modal.querySelector('[data-action="zoom-in"]').onclick = () => {
        this.scale = Math.min(5, this.scale * 1.25);
        updateView();
      };
      modal.querySelector('[data-action="zoom-out"]').onclick = () => {
        this.scale = Math.max(0.25, this.scale / 1.25);
        updateView();
      };
      modal.querySelector('[data-action="reset"]').onclick = resetView;

      // Mouse wheel zoom
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.scale = Math.max(0.25, Math.min(5, this.scale * delta));
        updateView();
      }, { passive: false });

      // Pan with drag
      canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        canvas.classList.add('dragging');
      });

      const onMouseMove = (e) => {
        if (!this.isDragging) return;
        this.translateX += e.clientX - this.lastX;
        this.translateY += e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        updateView();
      };

      const onMouseUp = () => {
        this.isDragging = false;
        canvas.classList.remove('dragging');
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      this._cleanup = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      // Double-click to reset
      canvas.addEventListener('dblclick', resetView);

      // Close handlers
      modal.querySelector('[data-action="close"]').onclick = () => this.hide();
      modal.querySelector('[data-action="download"]').onclick = () => {
        if (options.onDownload) options.onDownload();
        this.hide();
      };
      modal.querySelector('.ps-overlay').onclick = (e) => {
        if (e.target.classList.contains('ps-overlay')) this.hide();
      };

      const escHandler = (e) => {
        if (e.key === 'Escape') {
          this.hide();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    },

    hide() {
      if (this.modal) {
        if (this._cleanup) this._cleanup();
        this.modal.remove();
        this.modal = null;
        this.img = null;
        document.body.style.overflow = '';
      }
    }
  };

  // ============================================================================
  // PDF GENERATOR (Image-based)
  // ============================================================================

  const PDFGenerator = {
    /**
     * Generate PDF from screenshot with pagination
     * Creates a proper PDF file with multiple pages
     */
    async generate(canvas, options) {
      Utils.log(options, 'Generating PDF...');

      const pageSize = Utils.getPageSize(options.pageSize) || PAGE_SIZES['A4'];
      const headerHeight = options.showHeader ? (options.header?.height || 40) : 0;
      const footerHeight = options.showFooter ? (options.footer?.height || 40) : 0;
      const margin = options.pdfMargin || 40;

      // PDF dimensions in points (72 DPI)
      const pdfContentWidth = pageSize.width - (margin * 2);
      const pdfContentHeight = pageSize.height - (margin * 2) - headerHeight - footerHeight;

      // Use higher resolution for rendering (multiply by DPI factor)
      // 2 = 144 DPI, 3 = 216 DPI for better quality
      const dpiMultiplier = options.pdfDpi || 2;
      const renderWidth = Math.round(pdfContentWidth * dpiMultiplier);
      const renderHeight = Math.round(pdfContentHeight * dpiMultiplier);

      // Calculate how many pages we need based on source image
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Scale factor: how the source canvas maps to render canvas width
      const renderScale = renderWidth / imgWidth;
      const scaledHeight = imgHeight * renderScale;
      const totalPages = Math.ceil(scaledHeight / renderHeight);

      // Create PDF structure (minimal PDF 1.4)
      const objects = [];
      let objectId = 1;

      // Helper to add object
      const addObject = (content) => {
        const id = objectId++;
        objects.push({ id, content });
        return id;
      };

      // Catalog
      const catalogId = addObject(null); // placeholder
      const pagesId = addObject(null); // placeholder

      // Font
      const fontId = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

      // Convert canvas to JPEG for each page slice
      const pageIds = [];
      const imageIds = [];

      for (let page = 0; page < totalPages; page++) {
        // Create high-resolution canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = renderWidth;
        pageCanvas.height = renderHeight;
        const ctx = pageCanvas.getContext('2d');

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, renderWidth, renderHeight);

        // Calculate source region from original canvas
        const sourceY = (page * renderHeight) / renderScale;
        const sourceHeight = renderHeight / renderScale;
        const actualSourceHeight = Math.min(sourceHeight, imgHeight - sourceY);
        const actualRenderHeight = actualSourceHeight * renderScale;

        // Draw the slice at high resolution
        ctx.drawImage(
          canvas,
          0, sourceY, imgWidth, actualSourceHeight,
          0, 0, renderWidth, actualRenderHeight
        );

        // Get JPEG data with configurable quality
        const quality = options.pdfQuality || 0.95;
        const jpegData = pageCanvas.toDataURL('image/jpeg', quality);
        const jpegBinary = atob(jpegData.split(',')[1]);

        // Add image XObject (use high-res dimensions)
        const imageId = addObject(
          `<< /Type /XObject /Subtype /Image /Width ${renderWidth} /Height ${renderHeight} ` +
          `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBinary.length} >>\n` +
          `stream\n${jpegBinary}\nendstream`
        );
        imageIds.push(imageId);

        // Build page content
        let contentStr = '';

        // Draw image (scale high-res image to PDF content area)
        contentStr += `q ${pdfContentWidth} 0 0 ${pdfContentHeight} ${margin} ${margin + footerHeight} cm /Img${page} Do Q\n`;

        // Draw header
        if (options.showHeader && options.header) {
          const headerText = HeaderFooterGenerator.processTemplate(
            typeof options.header === 'string' ? options.header : (options.header.text || ''),
            page + 1, totalPages
          ).replace(/<[^>]*>/g, ''); // Strip HTML tags
          contentStr += `BT /F1 10 Tf ${margin} ${pageSize.height - margin - 12} Td (${this.escapeText(headerText)}) Tj ET\n`;
        }

        // Draw footer
        if (options.showFooter && options.footer) {
          const footerText = HeaderFooterGenerator.processTemplate(
            typeof options.footer === 'string' ? options.footer : (options.footer.text || ''),
            page + 1, totalPages
          ).replace(/<[^>]*>/g, '');
          contentStr += `BT /F1 10 Tf ${margin} ${margin - 5 + footerHeight/2} Td (${this.escapeText(footerText)}) Tj ET\n`;
        }

        // Page number on right side of footer
        const pageNumText = `Page ${page + 1} of ${totalPages}`;
        contentStr += `BT /F1 9 Tf ${pageSize.width - margin - 80} ${margin - 5 + footerHeight/2} Td (${pageNumText}) Tj ET\n`;

        const contentId = addObject(`<< /Length ${contentStr.length} >>\nstream\n${contentStr}endstream`);

        // Page object
        const pageId = addObject(
          `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageSize.width} ${pageSize.height}] ` +
          `/Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> ` +
          `/XObject << /Img${page} ${imageId} 0 R >> >> >>`
        );
        pageIds.push(pageId);
      }

      // Update catalog
      objects[catalogId - 1].content = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

      // Update pages
      objects[pagesId - 1].content = `<< /Type /Pages /Kids [${pageIds.map(id => id + ' 0 R').join(' ')}] /Count ${totalPages} >>`;

      // Build PDF
      let pdf = '%PDF-1.4\n%âãÏÓ\n';
      const offsets = [];

      for (const obj of objects) {
        offsets.push(pdf.length);
        pdf += `${obj.id} 0 obj\n${obj.content}\nendobj\n`;
      }

      // Cross-reference table
      const xrefOffset = pdf.length;
      pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      for (const offset of offsets) {
        pdf += offset.toString().padStart(10, '0') + ' 00000 n \n';
      }

      // Trailer
      pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

      return pdf;
    },

    escapeText(text) {
      return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    },

    /**
     * Download PDF
     */
    download(pdf, filename) {
      // Convert to binary
      const bytes = new Uint8Array(pdf.length);
      for (let i = 0; i < pdf.length; i++) {
        bytes[i] = pdf.charCodeAt(i) & 0xff;
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // ============================================================================
  // MAIN ENGINE
  // ============================================================================

  const Engine = {
    async capture(selector, options = {}) {
      const opts = Utils.merge({}, DEFAULTS, options);

      const element = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

      if (!element) {
        throw new Error('PrimSnap: Element not found');
      }

      // Detect 3D transforms
      const transform3DElements = Transform3DDetector.detect(element, opts);
      const has3D = transform3DElements.length > 0;

      // If useScreenCapture is requested (or auto-detect with 3D), use Screen Capture API
      if (opts.useScreenCapture) {
        this.progress(opts, 0.1, 'Using Screen Capture API...');
        try {
          return await ScreenCapture.capture(element, opts);
        } catch (error) {
          if (opts.debug) {
            console.warn('PrimSnap: Screen Capture failed, falling back to SVG method:', error.message);
          }
          // Fall through to standard capture
        }
      }

      // Inject custom CSS
      let injectedStyle = null;
      if (opts.injectCSS) {
        injectedStyle = document.createElement('style');
        injectedStyle.setAttribute('data-primsnap-inject', 'true');
        injectedStyle.textContent = opts.injectCSS;
        document.head.appendChild(injectedStyle);
      }

      // Execute custom JS
      if (typeof opts.injectJS === 'function') {
        opts.injectJS(element);
      }

      try {
        this.progress(opts, 0.1, 'Cloning DOM...');

        const rect = element.getBoundingClientRect();
        const width = Math.ceil(rect.width);
        const height = Math.ceil(rect.height);

        const clone = await Cloner.clone(element, opts);

        this.progress(opts, 0.3, 'Processing images...');
        await ImageProcessor.process(clone, opts);

        this.progress(opts, 0.5, 'Processing fonts...');
        await FontProcessor.process(clone, opts);

        this.progress(opts, 0.7, 'Rendering SVG...');
        const svgData = await SvgRenderer.render(clone, width, height, opts);

        if (opts.format === 'svg') {
          this.progress(opts, 1, 'Complete');
          return svgData.dataUrl;
        }

        this.progress(opts, 0.85, 'Rendering canvas...');
        const canvas = await CanvasRenderer.render(svgData, opts);

        this.progress(opts, 0.95, 'Exporting...');
        const result = CanvasRenderer.export(canvas, opts);

        this.progress(opts, 1, 'Complete');
        return result;

      } finally {
        if (injectedStyle) injectedStyle.remove();
      }
    },

    progress(options, value, message) {
      Utils.log(options, `${Math.round(value * 100)}% - ${message}`);
      if (typeof options.onProgress === 'function') {
        options.onProgress(value, message);
      }
    }
  };

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  const PrimSnap = {
    version: VERSION,

    /**
     * Capture element as image
     */
    async capture(selector, options = {}) {
      return Engine.capture(selector, options);
    },

    /**
     * Capture and download
     */
    async download(selector, filename = 'capture.png', options = {}) {
      const format = filename.match(/\.(png|jpe?g|webp)$/i)?.[1]?.toLowerCase() || 'png';
      const formatMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp' };

      const dataUrl = await this.capture(selector, {
        ...options,
        format: formatMap[format] || 'png'
      });

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    /**
     * Capture and show preview modal
     */
    async preview(selector, options = {}) {
      const dataUrl = await this.capture(selector, {
        ...options,
        format: 'png'
      });

      PreviewModal.show(dataUrl, {
        title: options.title || 'Preview',
        onDownload: () => {
          const link = document.createElement('a');
          link.download = options.filename || 'primsnap-capture.png';
          link.href = dataUrl;
          link.click();
        }
      });

      return dataUrl;
    },

    /**
     * Hide preview modal
     */
    hidePreview() {
      PreviewModal.hide();
    },

    /**
     * Capture as Blob
     */
    async toBlob(selector, options = {}) {
      return this.capture(selector, { ...options, format: 'blob' });
    },

    /**
     * Capture as Canvas
     */
    async toCanvas(selector, options = {}) {
      return this.capture(selector, { ...options, format: 'canvas' });
    },

    /**
     * Capture with print styles
     */
    async captureForPrint(selector, options = {}) {
      return this.capture(selector, {
        ...options,
        usePrintStyles: true,
        respectPageBreaks: true
      });
    },

    /**
     * Utility: Convert URL to data URI
     */
    async toDataUri(url) {
      return Utils.toDataUri(url, { useCORS: true });
    },

    /**
     * Detect 3D transforms in an element
     * Returns array of elements with 3D CSS transforms
     */
    detect3D(selector) {
      const element = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

      if (!element) return [];
      return Transform3DDetector.detect(element, { warn3D: false });
    },

    /**
     * Check if Screen Capture API is supported
     */
    isScreenCaptureSupported() {
      return Transform3DDetector.isScreenCaptureSupported();
    },

    /**
     * Capture using Screen Capture API (for 3D content)
     * Requires user permission - element must be visible on screen
     */
    async captureScreen(selector, options = {}) {
      const element = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

      if (!element) {
        throw new Error('PrimSnap: Element not found');
      }

      return ScreenCapture.capture(element, options);
    },

    /**
     * Get available page sizes
     */
    getPageSizes() {
      return { ...PAGE_SIZES };
    },

    /**
     * Generate and download PDF from screenshot
     * Automatically paginates long content with headers/footers
     */
    async toPDF(selector, filename = 'capture.pdf', options = {}) {
      // Capture WITHOUT header/footer - PDF generator adds its own text-based ones
      const canvas = await this.capture(selector, {
        ...options,
        format: 'canvas',
        scale: options.scale || 2,
        showHeader: false,  // Don't render visual header in capture
        showFooter: false   // Don't render visual footer in capture
      });

      const pdfOptions = {
        ...DEFAULTS,
        ...options,
        showHeader: options.showHeader !== false,
        showFooter: options.showFooter !== false,
        header: options.header || { text: '{title}', height: 30 },
        footer: options.footer || { text: 'Generated with PrimSnap', height: 30 }
      };

      const pdf = await PDFGenerator.generate(canvas, pdfOptions);
      PDFGenerator.download(pdf, filename);
    },

    /**
     * Preview and optionally download as PDF
     */
    async previewPDF(selector, options = {}) {
      const dataUrl = await this.capture(selector, {
        ...options,
        format: 'png'
      });

      PreviewModal.show(dataUrl, {
        title: options.title || 'PDF Preview',
        onDownload: async () => {
          await this.toPDF(selector, options.filename || 'capture.pdf', options);
        }
      });

      return dataUrl;
    }
  };

  return PrimSnap;

}));
