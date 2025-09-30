# SOP: Frontend Architecture Standard Operating Procedure

## PURPOSE
This SOP enforces the template-react-ts approach across the entire MCP Pointer project to ensure clean, unified, and maintainable frontend architecture.

## SCOPE
All frontend development, UI components, and user interface work must follow this standard.

## MANDATORY STANDARD

### PRIMARY REFERENCE
**Template Repository:** https://github.com/YousifAbozid/template-react-ts
**Documentation:** https://github.com/YousifAbozid/template-react-ts/blob/source/README.md

### REQUIRED TECH STACK
- **React 19** with TypeScript
- **Vite** for development and building
- **Tailwind CSS v4** with theming system
- **Dark mode support** with semantic colors
- **ESLint/Prettier** for code quality
- **Husky pre-commit hooks** for automation

## ARCHITECTURE REQUIREMENTS

### MANDATORY PROJECT STRUCTURE
```
/
├── src/                           # Main React app (template-react-ts)
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Page components
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # State management (Zustand)
│   ├── utils/                    # Utility functions
│   ├── types/                    # TypeScript type definitions
│   ├── styles/                   # Global styles and themes
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # App entry point
│   └── globals.css               # Global CSS with Tailwind
├── packages/
│   ├── server/                   # MCP Server (Bun + TypeScript)
│   ├── chrome-extension/         # Browser extension (Plasmo)
│   └── shared/                   # Shared types and utilities
├── public/                       # Static assets
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Root package.json
└── README.md                    # Project documentation
```

### FORBIDDEN PATTERNS
❌ **DO NOT CREATE:**
- Multiple frontend packages (`packages/frontend/`, `packages/web/`)
- Simple Node.js servers for UI (`packages/web/server.js`)
- Redundant extension packages (`packages/extension/`)
- Fragmented frontend architecture
- Separate UI frameworks or build systems

## IMPLEMENTATION RULES

### RULE 1: SINGLE FRONTEND APP
- **ALL UI development** must be in the root `src/` directory
- **NO frontend packages** in `packages/` directory
- **ONE unified React app** for all user interfaces

### RULE 2: TEMPLATE COMPLIANCE
- **MUST use** template-react-ts structure and configuration
- **MUST include** all template files (ESLint, Prettier, Husky, etc.)
- **MUST follow** template's theming and styling approach

### RULE 3: PACKAGE SEPARATION
- **`packages/server/`** - MCP Server only (Bun + TypeScript)
- **`packages/chrome-extension/`** - Browser extension only (Plasmo)
- **`packages/shared/`** - Shared types and utilities only
- **NO UI packages** in packages directory

### RULE 4: DEVELOPMENT WORKFLOW
- **Main app development:** `npm run dev` (root level)
- **Server development:** `cd packages/server && bun run dev`
- **Extension development:** Use pre-built packages (Plasmo issues)

## ENFORCEMENT CHECKLIST

### BEFORE ANY FRONTEND WORK
- [ ] Verify using template-react-ts structure
- [ ] Confirm single `src/` directory for all UI
- [ ] Check no redundant frontend packages exist
- [ ] Validate Tailwind CSS v4 theming system
- [ ] Ensure dark mode support is implemented

### DURING DEVELOPMENT
- [ ] All components go in `src/components/`
- [ ] All pages go in `src/pages/`
- [ ] All styles use Tailwind CSS classes
- [ ] All TypeScript types are properly defined
- [ ] ESLint and Prettier rules are followed

### BEFORE COMMITS
- [ ] Run `npm run lint` and fix all issues
- [ ] Run `npm run format` to format code
- [ ] Verify no frontend packages in `packages/`
- [ ] Test dark mode functionality
- [ ] Ensure responsive design works

## MIGRATION REQUIREMENTS

### CURRENT STATE (PROBLEMATIC)
```
packages/
├── frontend/         # ❌ Should be moved to root src/
├── web/             # ❌ Should be removed
├── extension/       # ❌ Should be removed
├── server/          # ✅ Keep
├── chrome-extension/ # ✅ Keep
└── shared/          # ✅ Keep
```

### TARGET STATE (REQUIRED)
```
/
├── src/             # ✅ Main React app (from packages/frontend/)
├── packages/
│   ├── server/      # ✅ MCP Server
│   ├── chrome-extension/ # ✅ Extension
│   └── shared/      # ✅ Shared types
└── [template files] # ✅ All template-react-ts configs
```

## VIOLATION CONSEQUENCES

### IMMEDIATE ACTIONS
1. **Stop development** if forbidden patterns are detected
2. **Restructure** to follow template-react-ts approach
3. **Remove** redundant packages and files
4. **Update** documentation to reflect correct architecture

### PREVENTION MEASURES
1. **Code reviews** must check architecture compliance
2. **Pre-commit hooks** must validate structure
3. **Documentation** must reference this SOP
4. **AI assistants** must enforce this standard

## TEMPLATE INTEGRATION STEPS

### STEP 1: CLONE TEMPLATE
```bash
git clone https://github.com/YousifAbozid/template-react-ts.git temp-template
```

### STEP 2: COPY TEMPLATE FILES
```bash
# Copy template configuration files
cp temp-template/.eslintrc.json .
cp temp-template/.prettierrc .
cp temp-template/tailwind.config.js .
cp temp-template/vite.config.ts .
cp temp-template/tsconfig.json .
cp temp-template/package.json ./package-template.json
```

### STEP 3: RESTRUCTURE PROJECT
```bash
# Move frontend to root src/
mv packages/frontend/src/* src/
mv packages/frontend/package.json ./package-frontend.json

# Remove redundant packages
rm -rf packages/web/
rm -rf packages/extension/
```

### STEP 4: UPDATE CONFIGURATIONS
- Merge package.json files
- Update import paths
- Configure Tailwind theming
- Set up Husky hooks

## SUCCESS CRITERIA

### ARCHITECTURE VALIDATION
- [ ] Single `src/` directory contains all UI code
- [ ] No frontend packages in `packages/` directory
- [ ] Template-react-ts configuration files present
- [ ] Tailwind CSS v4 theming system working
- [ ] Dark mode support functional
- [ ] ESLint/Prettier integration working
- [ ] Husky pre-commit hooks active

### FUNCTIONAL VALIDATION
- [ ] Main app runs with `npm run dev`
- [ ] All UI components render correctly
- [ ] Dark/light mode switching works
- [ ] Responsive design functions properly
- [ ] TypeScript compilation successful
- [ ] No linting errors
- [ ] Code formatting consistent

## MAINTENANCE REQUIREMENTS

### REGULAR CHECKS
- **Weekly:** Verify architecture compliance
- **Before releases:** Full architecture audit
- **After major changes:** Structure validation
- **Documentation updates:** Keep SOP current

### UPDATES
- **Template updates:** Follow template-react-ts releases
- **Dependency updates:** Maintain template compatibility
- **New features:** Follow template patterns
- **Bug fixes:** Use template best practices

## CONTACT AND SUPPORT

### TEMPLATE SOURCE
- **Repository:** https://github.com/YousifAbozid/template-react-ts
- **Documentation:** Template README.md
- **Issues:** Use template repository issues

### PROJECT ENFORCEMENT
- **AEO Document:** AEO_MASTER_CONTEXT.md
- **This SOP:** SOP_FRONTEND_ARCHITECTURE.md
- **Code Reviews:** Must reference this SOP

---

**This SOP is MANDATORY for all frontend development work. Violations will result in immediate restructuring to comply with template-react-ts standards.**
