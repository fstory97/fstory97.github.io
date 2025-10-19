# B2B Branding Workflow - slexn-codecenter Conversion Guide

## Core Principle
The main Caret repository must remain brand-agnostic. All branding-specific logic, assets, and configurations are isolated within the `slexn-codecenter` submodule.

**Restoration**: The primary method for reverting changes is `git`. The scripted backup (`.backup-providers/`) is a secondary safety measure for provider settings.

## 1. Pre-Work Analysis
When keywords like `b2b`, `brand`, `codecenter`, or `conversion` appear, **this document must be read first**.

## 2. Brand Conversion System

### Execution Method
**Direct Node.js execution** (NOT npm scripts):
```bash
# Full conversion
node tools/brand-converter.js codecenter --all

# Dry-run (simulation)
node tools/brand-converter.js codecenter --all --dry-run

# Backend only
node tools/brand-converter.js codecenter --backend

# Frontend only
node tools/brand-converter.js codecenter --frontend
```

### Hybrid Conversion Approach

The brand converter uses a **two-stage hybrid approach**:

**Stage 1: Blacklist-based Conversion (Broad)**
- Project-wide brand text replacement
- **Protected areas**: Core scripts, protocol files (via blacklist)
- Automatic UI text and branding element conversion

**Stage 2: Whitelist-based Refinement (Precise)**
- Fine-tuned corrections for missed/mis-converted items
- Metadata adjustments: GitHub URLs, company names, versions
- VSCode command mappings

### 14-Step Conversion Process

1. **Brand Detection**: Auto-analyze `package.json` displayName
2. **Config Loading**: Load `brand-config.json` and `brand-config-front.json`
3. **CHANGELOG Auto-versioning**:
   - Extract latest version from `CHANGELOG.md`
   - Auto-generate version mapping
4. **Backup**: Provider settings → `.backup-providers/` (by language)
5. **Hybrid Conversion**:
   - **Whitelist**: GitHub URLs, company names, VSCode commands
   - **Blacklist**: Exclude protected files, convert all brand text
6. **Frontend i18n**: 4-language conversion (ko/en/ja/zh)
7. **Asset Copy**: Icons, personas, templates
8. **Metadata Replacement**: `package.json`, `CHANGELOG.md`, `announcement.json`
9. **Provider System**: LiteLLM settings and provider policies
10. **Restoration**: Restore backed-up provider settings
11. **Persona Flags**: Brand-specific persona system config
12. **Default Provider**: Set default provider
13. **Brand Settings**: Generate dynamic brand config file
14. **Auto Build**: Execute `npm run compile` and validate

## 3. Configuration Files

### brand-config.json
```json
{
  "metadata": {
    "brand": "codecenter",
    "description": "CodeCenter branding configuration",
    "changelog_file": "CHANGELOG.md"
  },
  "protected_patterns": [
    "scripts/",
    "providers.internal"
  ],
  "brand_mappings": {
    "package_json": {
      "displayName": "CodeCenter",
      "name": "codecenter",
      "publisher": "slexn"
    }
  },
  "provider_settings": {
    "litellm_provider_name": "CodeCenter",
    "default_provider": "litellm"
  },
  "brand_settings": {
    "brandName": "codecenter",
    "showPersonaSettings": false,
    "defaultPersonaEnabled": false
  }
}
```

### brand-config-front.json
Frontend i18n mapping rules for locale files

## 4. Backup/Restoration System

### Protected Provider Settings
**Backup Location**: `.backup-providers/`
- `ko-settings.json`
- `en-settings.json`
- `ja-settings.json`
- `zh-settings.json`

**Purpose**: Preserve internal key structures during brand conversion

**Process**:
1. Backup → provider settings saved by language
2. Conversion → brand conversion executed
3. Restoration → extract and restore necessary sections from backup

## 5. Key Files Reference

### Conversion Tools
- **Main Engine**: `slexn-codecenter/tools/brand-converter.js`
- **Utilities**: `slexn-codecenter/tools/converter-utils.js`
- **Validator**: `slexn-codecenter/tools/brand-config-validator.js`

### Configuration
- **Backend Config**: `slexn-codecenter/brands/brand-config.json`
- **Frontend Config**: `slexn-codecenter/brands/brand-config-front.json`
- **Package Metadata**: `slexn-codecenter/brands/package.json`

### Assets
- **Locale Files**: `slexn-codecenter/brands/files/locale/` (ko/en/ja/zh)
- **Feature Config**: `slexn-codecenter/brands/files/feature-config.json`
- **Assets**: `slexn-codecenter/brands/assets/` (icons, personas, etc.)

## 6. Quality Assurance

- **Mapping Validation**: Auto-detect nesting, circular refs, empty values, URL formats
- **Blacklist Protection**: Core scripts and files protected
- **Build Integration**: Post-conversion auto-compile for immediate error detection
- **Git Rollback**: Safe revert support
