
# Amazon Order Retrieval Script

This repository contains scripts that log into Amazon and retrieve the last 10 orders, including the name, price, and product URL. The implementation is provided in both Python and TypeScript.

## Python Implementation (`a.py`)

### How to Run:
1. Ensure you have Python installed on your system.
2. Install the necessary dependencies (e.g., `selenium`):
   ```bash
   pip install selenium
   ```
3. Run the script:
   ```bash
   python /path_to_your_code/a.py
   ```

## TypeScript Implementation (`index.ts`)

### Folder Structure:
```
typescript code/
├── src/
│   └── index.ts
├── dist/
│   └── index.js
├── node_modules/
├── package.json
└── tsconfig.json
```

### How to Run:
1. Ensure you have Node.js and TypeScript installed on your system.
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Compile the TypeScript code:
   ```bash
   npx tsc
   ```
4. Run the compiled JavaScript code:
   ```bash
   node dist/index.js
   ```

## Notes
- The Python script (`a.py`) uses Selenium for web automation.
- The TypeScript script (`index.ts`) is compiled into JavaScript (`index.js`) and uses Puppeteer for web automation.

Ensure you have the correct Amazon login credentials set up in the scripts before running.
