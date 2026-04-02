// Unified Theme Manager
const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  STORAGE_KEY: 'theme',

  // Initialize theme on page load
  init: () => {
    const saved = localStorage.getItem(Theme.STORAGE_KEY) || Theme.LIGHT;
    Theme.set(saved);
  },

  // Set theme
  set: (theme) => {
    if (theme !== Theme.LIGHT && theme !== Theme.DARK) return;
    
    // Set via data-theme attribute (for CSS variables)
    document.documentElement.setAttribute('data-theme', theme);
    
    // Also set via body class (for inline styles)
    if (theme === Theme.DARK) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem(Theme.STORAGE_KEY, theme);
    
    // Dispatch event for any listeners
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  },

  // Get current theme
  get: () => {
    return document.documentElement.getAttribute('data-theme') || Theme.LIGHT;
  },

  // Toggle theme
  toggle: () => {
    const current = Theme.get();
    Theme.set(current === Theme.DARK ? Theme.LIGHT : Theme.DARK);
  }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Theme.init);
} else {
  Theme.init();
}

// Global function for onclick handlers
function toggleTheme() {
  Theme.toggle();
}
