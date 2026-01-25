/**
 * Translation Check Script
 * 
 * Run with: npx tsx scripts/check-translations.ts
 * 
 * This script checks for missing translations across all language files
 * and reports coverage statistics.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = { [key: string]: TranslationValue };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.join(__dirname, '../client/src/locales');

function loadTranslations(lang: string): Translations {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function getAllKeys(obj: Translations, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...getAllKeys(value as Translations, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

function getNestedValue(obj: Translations, path: string): string | undefined {
  const keys = path.split('.');
  let current: TranslationValue = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as { [key: string]: TranslationValue })[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

function main() {
  console.log('\n🌍 Translation Coverage Report\n');
  console.log('='.repeat(60));
  
  const zhTranslations = loadTranslations('zh');
  const enTranslations = loadTranslations('en');
  const msTranslations = loadTranslations('ms');
  
  const zhKeys = getAllKeys(zhTranslations);
  const enKeys = getAllKeys(enTranslations);
  const msKeys = getAllKeys(msTranslations);
  
  const allKeys = new Set([...zhKeys, ...enKeys, ...msKeys]);
  const total = allKeys.size;
  
  console.log(`\n📊 Total unique keys: ${total}\n`);
  
  const languages = [
    { code: 'zh', name: '中文', translations: zhTranslations, keys: zhKeys },
    { code: 'en', name: 'English', translations: enTranslations, keys: enKeys },
    { code: 'ms', name: 'Bahasa Melayu', translations: msTranslations, keys: msKeys },
  ];
  
  for (const lang of languages) {
    const coverage = ((lang.keys.length / total) * 100).toFixed(1);
    const missing: string[] = [];
    
    allKeys.forEach(key => {
      if (!getNestedValue(lang.translations, key)) {
        missing.push(key);
      }
    });
    
    console.log(`\n${lang.name} (${lang.code}):`);
    console.log(`  ✅ Translated: ${lang.keys.length}/${total} (${coverage}%)`);
    
    if (missing.length > 0) {
      console.log(`  ❌ Missing: ${missing.length} keys`);
      if (missing.length <= 10) {
        missing.forEach(key => console.log(`     - ${key}`));
      } else {
        missing.slice(0, 10).forEach(key => console.log(`     - ${key}`));
        console.log(`     ... and ${missing.length - 10} more`);
      }
    } else {
      console.log(`  ✅ All keys translated!`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Tips:');
  console.log('   - Use Chinese (zh) as the master language');
  console.log('   - All new keys should be added to zh.json first');
  console.log('   - Then add translations to en.json and ms.json');
  console.log('   - Run this script after making changes\n');
}

main();
