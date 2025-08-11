
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("🚀 main.tsx: Starting application bootstrap...");

// Add global error handler
window.addEventListener('error', (event) => {
  console.error("🚨 Global error:", event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error("🚨 Unhandled promise rejection:", event.reason);
});

console.log("🚀 main.tsx: Error handlers added");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("🚨 main.tsx: Root element not found!");
  throw new Error("Root element not found");
}

console.log("🚀 main.tsx: Root element found, creating React root...");

try {
  const root = createRoot(rootElement);
  console.log("🚀 main.tsx: React root created, rendering App...");
  root.render(<App />);
  console.log("🚀 main.tsx: App rendered successfully");
} catch (error) {
  console.error("🚨 main.tsx: Failed to render app:", error);
  
  // Fallback rendering
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; direction: rtl;">
      <div style="background: white; border: 1px solid #ccc; border-radius: 8px; padding: 24px; max-width: 400px; text-align: center;">
        <h1 style="color: #333; margin-bottom: 16px;">حدث خطأ في التحميل</h1>
        <p style="color: #666; margin-bottom: 16px;">عذراً، لم يتمكن التطبيق من التحميل بشكل صحيح.</p>
        <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          إعادة تحميل
        </button>
      </div>
    </div>
  `;
}
