// Theme utility for light/dark mode colors

export function isLightMode(): boolean {
  return document.body.classList.contains('light-mode');
}

export function getBgColor(alpha: number = 1): string {
  if (isLightMode()) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  return `rgba(10, 10, 15, ${alpha})`;
}

export function getBgColorSolid(): string {
  return isLightMode() ? '#ffffff' : '#0a0a0f';
}

export function getTextColor(): string {
  return isLightMode() ? '#1a1a1a' : '#ffffff';
}

export function getTextColorMuted(): string {
  return isLightMode() ? '#555' : '#666';
}
