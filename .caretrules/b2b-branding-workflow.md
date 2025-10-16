# B2B Branding Workflow

Enterprise branding workflow for Caret, focusing on immutability and surface-level changes with clear separation between backend and frontend configurations.

## Core Principles

### 1. Immutable Core
**NEVER directly modify core source files** like `src/`, `caret-src/`, or `proto/`. All branding is managed via scripts and configs in the `caret-b2b` submodule.

### 2. Surface-Level Changes Only
Branding does **NOT** involve changing internal logic (function names, variables). Target **ONLY** user-visible areas:

- **UI Text**: Language files in `webview-ui/src/caret/locale`
- **Assets**: Logos, icons, and images
- **Metadata**: `package.json` fields like name, description, author
- **VSCode Integrations**: Command and menu names in `package.json`'s `contributes` section

## System Design

### Separated Config Model
- **Backend (`brand-config.json`)**: Manages changes for `package.json` metadata and backend-related configurations like `feature-config.json`
- **Frontend (`brand-config-front.json`)**: Manages changes for all frontend assets, including `locale` file content modifications and `assets` folder replacements

### Blacklist Protection
Core files and directories (`*.proto`, `caret-scripts/`, etc.) are automatically excluded from any conversion process to ensure system stability.

## Config Rules

### `brand-config.json` (Backend)
- **FOCUS ON METADATA**: Target user-visible text in `package.json` (e.g., `displayName`, `description`, `contributes` titles)
- **NO INTERNAL LOGIC**: Never add function names, variable names, or any internal code identifiers

### `brand-config-front.json` (Frontend)
- **LOCALE MAPPINGS**: Define rules to modify text content within `webview-ui/src/caret/locale/` files
- **ASSET REPLACEMENT**: The script automatically replaces the root `/assets` folder with the brand-specific one. No config needed for this
- **FILE REPLACEMENTS**: Define direct file replacements for specific UI components if necessary (e.g., `announcement.json`)

## Procedure

### Step 1: Analyze
Identify all user-visible areas requiring brand changes in both backend and frontend.

### Step 2: Configure
Modify `brand-config.json` and `brand-config-front.json` according to the config rules.

### Step 3: Execute (OS-Independent)

**Run branding script from project root** (recommended):

```bash
# Check current brand
npm run brand:status

# Convert to CodeCenter
npm run brand:codecenter

# Test conversion without changes (dry-run)
npm run brand:codecenter:dry

# Revert to Caret
npm run brand:caret

# Revert to Cline
npm run brand:cline
```

**Alternative: Run from caret-b2b directory**:

```bash
cd caret-b2b
npm run brand:status
npm run brand:codecenter
```

**These npm scripts work on all operating systems** (Windows, Mac, Linux).

### Step 4: Verify
Confirm that the `npm run compile` step completes without errors.

### Step 5: Commit
Commit the changes **ONLY** within the `caret-b2b` submodule.

---

**Version 4**: This document has been updated to reflect the separated backend/frontend configuration model and OS-independent execution methods. This provides greater clarity for AI developers and prevents errors caused by incorrect assumptions about a single config file or platform-specific commands.
