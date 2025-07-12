console.log('[TEST_BUTTON] Test button script loading...');

// Simple test without require
function closeWindow() {
  console.log('[TEST_BUTTON] Close button clicked - test version');
  window.close();
}

// Export to global scope
window.closeWindow = closeWindow;

console.log('[TEST_BUTTON] Test button script loaded successfully');