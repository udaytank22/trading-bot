

export const COLORS = {
  purple: {
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#7c3aed',
    650: '#8b5cf6',
    950: '#3b0764',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    150: '#eef2f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    550: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    850: '#1f2937',
    900: '#111827',
  },
  red: {
    300: '#fca5a5',
    500: '#ef4444',
    600: '#dc2626',
    650: '#b91c1c',
  },
  blue: {
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
  },
  emerald: {
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
  },
  amber: {
    100: '#fef3c7',
    500: '#f59e0b',
  },
  darkbg: '#0c0e12',
  darkcard: '#161920',
  darkborder: '#2a2d33',
  brandPurple: '#8b5cf6',
};

const cache: Record<string, any> = {
  light: {},
  dark: {},
};

function parseToken(theme: 'light' | 'dark', token: string): any {
  if (!token) return null;
  
  // Theme check
  if (token.startsWith('dark:')) {
    if (theme === 'dark') {
      token = token.slice(5);
    } else {
      return null;
    }
  }

  // Active or hover states can be mapped directly for mobile
  if (token.startsWith('active:')) {
    token = token.slice(7);
  }

  // Simple layout & flex mapping
  if (token === 'flex-1') return { flex: 1 };
  if (token === 'flex-row') return { flexDirection: 'row' };
  if (token === 'flex-col') return { flexDirection: 'column' };
  if (token === 'flex-wrap') return { flexWrap: 'wrap' };
  
  if (token === 'items-center') return { alignItems: 'center' };
  if (token === 'items-start') return { alignItems: 'flex-start' };
  if (token === 'items-end') return { alignItems: 'flex-end' };
  if (token === 'items-stretch') return { alignItems: 'stretch' };
  
  if (token === 'justify-center') return { justifyContent: 'center' };
  if (token === 'justify-start') return { justifyContent: 'flex-start' };
  if (token === 'justify-end') return { justifyContent: 'flex-end' };
  if (token === 'justify-between') return { justifyContent: 'space-between' };
  if (token === 'justify-around') return { justifyContent: 'space-around' };
  
  if (token === 'self-center') return { alignSelf: 'center' };
  if (token === 'self-start') return { alignSelf: 'flex-start' };
  if (token === 'self-end') return { alignSelf: 'flex-end' };
  if (token === 'self-stretch') return { alignSelf: 'stretch' };

  if (token === 'relative') return { position: 'relative' };
  if (token === 'absolute') return { position: 'absolute' };

  // Spacing (margins, padding)
  // Match p-X, px-X, py-X, pt-X, pb-X, pl-X, pr-X
  const spacingMatch = token.match(/^(p|m)([xytblr]?)-([\d.]+|\[.+\])$/);
  if (spacingMatch) {
    const [_, type, dir, valStr] = spacingMatch;
    let val: number | string = 0;
    if (valStr.startsWith('[') && valStr.endsWith(']')) {
      const inner = valStr.slice(1, -1);
      if (inner.endsWith('px')) {
        val = parseFloat(inner);
      } else if (inner.endsWith('%')) {
        val = inner;
      } else {
        val = parseFloat(inner);
      }
    } else {
      val = parseFloat(valStr) * 4;
    }

    const propBase = type === 'p' ? 'padding' : 'margin';
    if (!dir) return { [propBase]: val };
    if (dir === 'x') return { [`${propBase}Horizontal`]: val };
    if (dir === 'y') return { [`${propBase}Vertical`]: val };
    if (dir === 't') return { [`${propBase}Top`]: val };
    if (dir === 'b') return { [`${propBase}Bottom`]: val };
    if (dir === 'l') return { [`${propBase}Left`]: val };
    if (dir === 'r') return { [`${propBase}Right`]: val };
  }

  // Gap (gap-X, gap-x-X, gap-y-X)
  const gapMatch = token.match(/^gap-(x-|y-)?([\d.]+|\[.+\])$/);
  if (gapMatch) {
    const [_, dir, valStr] = gapMatch;
    let val: number = 0;
    if (valStr.startsWith('[') && valStr.endsWith(']')) {
      const inner = valStr.slice(1, -1);
      val = parseFloat(inner);
    } else {
      val = parseFloat(valStr) * 4;
    }
    
    if (dir === 'x-') return { columnGap: val };
    if (dir === 'y-') return { rowGap: val };
    return { gap: val };
  }

  // Width and Height
  // Match w-X, h-X, w-[X], h-[X]
  const sizeMatch = token.match(/^(w|h)-([\d.]+|\[.+\]|full)$/);
  if (sizeMatch) {
    const [_, type, valStr] = sizeMatch;
    const prop = type === 'w' ? 'width' : 'height';
    if (valStr === 'full') return { [prop]: '100%' };
    if (valStr.startsWith('[') && valStr.endsWith(']')) {
      const inner = valStr.slice(1, -1);
      if (inner.endsWith('%')) return { [prop]: inner };
      if (inner.endsWith('px')) return { [prop]: parseFloat(inner) };
      return { [prop]: parseFloat(inner) || inner };
    }
    const numeric = parseFloat(valStr);
    if (!isNaN(numeric)) {
      return { [prop]: numeric * 4 };
    }
  }

  // Font sizes and weights
  if (token === 'text-xs') return { fontSize: 12 };
  if (token === 'text-sm') return { fontSize: 14 };
  if (token === 'text-base') return { fontSize: 16 };
  if (token === 'text-lg') return { fontSize: 18 };
  if (token === 'text-xl') return { fontSize: 20 };
  if (token === 'text-2xl') return { fontSize: 24 };
  if (token === 'text-3xl') return { fontSize: 30 };
  
  const customFontSizeMatch = token.match(/^text-\[(\d+)px\]$/);
  if (customFontSizeMatch) {
    return { fontSize: parseInt(customFontSizeMatch[1], 10) };
  }

  if (token === 'font-normal') return { fontWeight: 'normal' };
  if (token === 'font-medium') return { fontWeight: '500' };
  if (token === 'font-semibold') return { fontWeight: '600' };
  if (token === 'font-bold') return { fontWeight: 'bold' };
  if (token === 'font-extrabold') return { fontWeight: '800' };
  if (token === 'font-mono') return { fontFamily: 'monospace' };

  if (token === 'tracking-tight') return { letterSpacing: -0.5 };
  if (token === 'tracking-wider') return { letterSpacing: 0.5 };

  if (token === 'text-center') return { textAlign: 'center' };
  if (token === 'text-left') return { textAlign: 'left' };
  if (token === 'text-right') return { textAlign: 'right' };

  // Borders
  if (token === 'border') return { borderWidth: 1 };
  if (token === 'border-t') return { borderTopWidth: 1 };
  if (token === 'border-b') return { borderBottomWidth: 1 };
  if (token === 'border-l') return { borderLeftWidth: 1 };
  if (token === 'border-r') return { borderRightWidth: 1 };
  if (token === 'border-l-4') return { borderLeftWidth: 4 };
  if (token === 'border-transparent') return { borderColor: 'transparent' };

  // Border Radius
  if (token === 'rounded-none') return { borderRadius: 0 };
  if (token === 'rounded-sm') return { borderRadius: 2 };
  if (token === 'rounded') return { borderRadius: 4 };
  if (token === 'rounded-md') return { borderRadius: 6 };
  if (token === 'rounded-lg') return { borderRadius: 8 };
  if (token === 'rounded-xl') return { borderRadius: 12 };
  if (token === 'rounded-2xl') return { borderRadius: 16 };
  if (token === 'rounded-3xl') return { borderRadius: 24 };
  if (token === 'rounded-full') return { borderRadius: 9999 };
  if (token === 'rounded-t-xl') return { borderTopLeftRadius: 12, borderTopRightRadius: 12 };
  if (token === 'rounded-b-xl') return { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 };

  // Opacities
  if (token === 'opacity-50') return { opacity: 0.5 };
  if (token === 'opacity-100') return { opacity: 1 };
  if (token === 'opacity-60') return { opacity: 0.6 };
  const opacityMatch = token.match(/^opacity-(\d+)$/);
  if (opacityMatch) return { opacity: parseInt(opacityMatch[1], 10) / 100 };

  // Colors (bg-*, text-*, border-*)
  const colorMatch = token.match(/^(bg|text|border)-(.+)$/);
  if (colorMatch) {
    const [_, styleType, colorName] = colorMatch;
    const prop = styleType === 'bg' ? 'backgroundColor' : styleType === 'text' ? 'color' : 'borderColor';

    // Check custom white/black opacity, e.g., white/[0.03] or white/70
    if (colorName.startsWith('white/')) {
      const op = colorName.slice(6);
      if (op.startsWith('[') && op.endsWith(']')) {
        return { [prop]: `rgba(255, 255, 255, ${op.slice(1, -1)})` };
      }
      const numOp = parseFloat(op);
      if (!isNaN(numOp)) {
        return { [prop]: `rgba(255, 255, 255, ${numOp < 1 ? numOp : numOp / 100})` };
      }
    }

    if (colorName.startsWith('black/')) {
      const op = colorName.slice(6);
      if (op.startsWith('[') && op.endsWith(']')) {
        return { [prop]: `rgba(0, 0, 0, ${op.slice(1, -1)})` };
      }
      const numOp = parseFloat(op);
      if (!isNaN(numOp)) {
        return { [prop]: `rgba(0, 0, 0, ${numOp < 1 ? numOp : numOp / 100})` };
      }
    }

    // Check custom color with opacity like purple-950/20
    const colorOpMatch = colorName.match(/^([a-zA-Z]+)-(\d+)\/(\d+)$/);
    if (colorOpMatch) {
      const [__, name, num, opacity] = colorOpMatch;
      const pct = parseFloat(opacity) / 100;
      if (name === 'purple' && num === '950') {
        return { [prop]: `rgba(59, 7, 100, ${pct})` };
      }
      if (name === 'purple' && num === '100') {
        return { [prop]: `rgba(243, 232, 255, ${pct})` };
      }
      if (name === 'emerald' && num === '950') {
        return { [prop]: `rgba(6, 78, 59, ${pct})` };
      }
      if (name === 'blue' && num === '950') {
        return { [prop]: `rgba(23, 37, 84, ${pct})` };
      }
    }

    // Check arbitrary color values like [#4F46E5]
    if (colorName.startsWith('[') && colorName.endsWith(']')) {
      return { [prop]: colorName.slice(1, -1) };
    }

    // Direct lookup in COLORS object
    let resolvedColor: string | undefined;

    if (colorName === 'white') resolvedColor = '#ffffff';
    else if (colorName === 'black') resolvedColor = '#000000';
    else if (colorName === 'darkbg') resolvedColor = COLORS.darkbg;
    else if (colorName === 'darkcard') resolvedColor = COLORS.darkcard;
    else if (colorName === 'darkborder') resolvedColor = COLORS.darkborder;
    else if (colorName === 'brandPurple') resolvedColor = COLORS.brandPurple;
    else if (colorName === 'transparent') resolvedColor = 'transparent';
    else {
      const dashIdx = colorName.lastIndexOf('-');
      if (dashIdx !== -1) {
        const family = colorName.slice(0, dashIdx);
        const shade = colorName.slice(dashIdx + 1);
        const colorFamily = (COLORS as any)[family];
        if (colorFamily) {
          resolvedColor = colorFamily[shade];
        }
      }
    }

    if (resolvedColor) {
      return { [prop]: resolvedColor };
    }
  }

  // Position: top-N, bottom-N, left-N, right-N
  const posMatch = token.match(/^(top|bottom|left|right)-([\d.]+)$/);
  if (posMatch) {
    const [_, side, valStr] = posMatch;
    return { [side]: parseFloat(valStr) * 4 };
  }

  return null;
}

export const Stylesheet = {
  cls(theme: 'light' | 'dark', classStr: string | null | undefined): any {
    if (!classStr) return {};
    
    // Check cache
    const themeCache = cache[theme];
    if (themeCache[classStr]) {
      return themeCache[classStr];
    }

    const tokens = classStr.trim().split(/\s+/);
    const combinedStyle: any = {};

    for (const token of tokens) {
      const parsed = parseToken(theme, token);
      if (parsed) {
        Object.assign(combinedStyle, parsed);
      }
    }

    // Save to cache
    themeCache[classStr] = combinedStyle;
    return combinedStyle;
  }
};

export default Stylesheet;
