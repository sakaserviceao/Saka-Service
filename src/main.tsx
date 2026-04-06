import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Saka Service: Bootstrapping application...");

window.onerror = (message, source, lineno, colno, error) => {
  console.error('CRITICAL STARTUP ERROR:', { message, source, lineno, colno, error });
  return false;
};

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find root element");

createRoot(rootElement).render(<App />);
