console.log('[TEST_BUTTON] Test button script loading...');

// Simple test without require
function testCloseWindow(): void {
  console.log('[TEST_BUTTON] Close button clicked - test version');
  window.close();
}

// Export to global scope
;(window as any).testCloseWindow = testCloseWindow

console.log('[TEST_BUTTON] Test button script loaded successfully');