# LC Recall 🧠

> **Spaced Repetition Flashcard System for LeetCode & Technical Coding Interviews**  
> Powered by **React 19**, **Vite**, **Mantine UI v9**, and the **FSRS (Free Spaced Repetition Scheduler) v7** algorithm (`ts-fsrs`).

---

## ✨ Features

- **⚡ FSRS v7 Spaced Repetition**: Latest dual-trace memory algorithm (`stability` + `stabilityFast`) calculating optimal short-term and long-term review intervals.
- **🎯 Review Session**:
  - Active recall flow with keyboard shortcuts:
    - `Space`: Reveal intuition, time/space complexity, and optimal solution snippet.
    - `1` / `2` / `3` / `4`: Rate recall (`Again`, `Hard`, `Good`, `Easy`) with live interval previews.
  - "Cram Mode" allows reviewing any card even when none are due.
- **📚 Problem Deck & Search**:
  - Filter problems by difficulty (`Easy`, `Medium`, `Hard`), status (`Due Now`, `New`, `Learning`, `Mastered`), and topics/tags.
  - Quick links to original problem statements on LeetCode.
  - Edit or delete custom problems.
- **➕ Card Creator**:
  - Add custom coding problems with intuition, time/space complexity, algorithm patterns, and clean code templates.
- **📊 Memory Analytics**:
  - Visual tracking of memory stability, learning vs. mastered card ratios, retention rates, and topic distributions.
- **💾 Backup & Sync**:
  - Export and import decks as JSON backups.
  - Reset to curated starter deck (Blind 75 classics: Two Sum, Valid Parentheses, 3Sum, Number of Islands, Kadane's, Best Time to Buy and Sell Stock).
- **🌓 Dark & Light Modes**:
  - Fully responsive Mantine theme with instant dark/light mode toggle.

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```

### 3. Build for production
```bash
npm run build
```

### 4. Lint
```bash
npm run lint
```
