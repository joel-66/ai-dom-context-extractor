***

# 🤖 AI DOM Context Extractor

**A Chrome DevTools extension built to bridge the gap between live web pages and LLMs.**

When working with AI coding assistants, copying the entire DOM usually creates more noise than signal. This tool allows you to extract precise, computed UI context—HTML and CSS—so you can provide your model with focused, high-quality information.

---

## 🚀 Installation (Development Mode)

Since this is a development extension, follow these steps to load it into Chrome:

1. **Download** or clone this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions`.
3. Toggle the **Developer mode** switch (top right).
4. Click the **Load unpacked** button.
5. Select the folder containing the extension files.
6. Open **DevTools** (`F12` or `Cmd+Option+I`) and locate the **AI Context** tab in the top navigation bar.

---

## 🛠 Features & Usage

The interface is designed to be minimal and sit directly inside your workflow. Find the extension tab in your DevTools panel (usually located to the right of `Elements`, `Console`, and `Network`).

### 1. Focused Context Extraction
**Tool:** `Copy Element CSS & HTML`

The core feature for component-driven development. Instead of raw source code, this captures the **rendered state**.

*   **How to use:** Enter a CSS selector (e.g., `#main-nav` or `.auth-modal`) and click copy.
*   **The Output:**
    *   **Live HTML:** The exact state of the DOM, including dynamic changes.
    *   **Inheritance-Aware CSS:** Captures computed styles for the root element.
    *   **Smart Descendants:** Only captures style overrides for children to keep token usage low.
*   **Best for:** Asking an AI to "Refactor this component" or "Fix the styling on this specific header."

### 2. Element Visualization
**Tool:** `Visualize Selected`

A debugging tool to verify what the AI will "see" before you export it.

*   **How to use:** Select any element in the standard DevTools `Elements` tab, then switch to this extension and click **Visualize Selected**.
*   **What happens:** 
    *   Outlines the element and its children directly on the live page.
    *   Adds numbered overlays to identify the structure.
*   **Best for:** Verifying extraction boundaries or taking screenshots to attach to your AI prompts for spatial awareness.
> [!TIP]
> This works best on small-to-medium component trees (under 20 children). For massive lists, the visualization can become crowded.

### 3. Clean Full-Page Snapshots
**Tool:** `Copy Stripped HTML`

When you need the "big picture" without the 5MB of junk that comes with modern web pages.

*   **How to use:** Click the button to instantly copy the whole page.
*   **The Optimization:** 
    *   Strips heavy SVGs and Base64 images.
    *   Removes noisy attributes and bloated metadata.
    *   Minifies the structure for LLM readability.
*   **Best for:** Analyzing page layout, SEO structure, or general site logic.

---

## 💻 Technical Stack

- **Logic:** Vanilla JavaScript (ES6+)
- **API:** Chrome Extensions API (Manifest V3)
- **Integration:** Chrome DevTools API
- **Styling:** CSS3 with a focus on DevTools UI consistency

---

## ✍️ Author

**Jonathan Kenney**  
*Full-stack developer focused on building practical, high-efficiency AI development workflows.*

---

*Found a bug or have a feature request? Feel free to open an issue or submit a pull request!*