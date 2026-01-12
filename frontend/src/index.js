import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Patch to prevent "removeChild" errors from Radix UI portals
// This is a known issue with React 18 and Radix UI portals
const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function(child) {
  if (child && child.parentNode === this) {
    return originalRemoveChild.call(this, child);
  }
  console.warn('Attempted to remove a node that is not a child. Ignoring.');
  return child;
};

const originalInsertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function(newNode, referenceNode) {
  if (referenceNode && referenceNode.parentNode !== this) {
    console.warn('Reference node is not a child. Appending instead.');
    return this.appendChild(newNode);
  }
  return originalInsertBefore.call(this, newNode, referenceNode);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
