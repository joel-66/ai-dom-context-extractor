# AI DOM Context Extractor

A Chrome DevTools extension designed to bridge the gap between complex web UIs and LLM context windows. It extracts structured, stripped HTML and inheritance-aware computed CSS, generating highly optimized context prompts for AI coding assistants.

## 🚀 Why This Matters for AI Development
When prompting Large Language Models (LLMs) to modify or replicate UI components, passing the entire raw DOM is token-heavy and full of noise. This extension solves this by isolating UI components, stripping unnecessary tags, and mapping only the computed CSS that actually affects the element.

## ✨ Features
*   **Targeted Context Extraction:** Point to any DOM element via selector to extract clean, nested HTML.
*   **Inheritance-Aware CSS:** Captures computed CSS styles applied directly to the element, filtering out redundant or overridden browser defaults.
*   **Element Visualization:** In-browser visualization overlay that highlights the selected element and its children to detect excessive DOM nesting and verify extraction boundaries.
*   **One-Click Prompt Ready:** Formats the output in Markdown, instantly ready to be pasted into Claude, GPT-4, or Gemini for UI debugging or generation workflows.

## 🛠️ Built With
*   JavaScript (Vanilla)
*   Chrome Extensions API (Manifest V3)
*   DevTools API Integration

## 👤 Author
**Jonathan Kenney**
Full-Stack Web Developer specializing in AI-assisted development workflows and deterministic debugging.
