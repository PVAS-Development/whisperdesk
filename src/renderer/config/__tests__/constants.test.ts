import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_EXTENSIONS,
  LANGUAGES,
  OUTPUT_FORMATS,
  QUALITY_STARS,
  getQualityStars,
  getLanguageLabel,
  APP_CONFIG,
} from '../../config/constants';

describe('config/constants', () => {
  describe('SUPPORTED_EXTENSIONS', () => {
    it('includes audio extensions', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('mp3');
      expect(SUPPORTED_EXTENSIONS).toContain('wav');
      expect(SUPPORTED_EXTENSIONS).toContain('flac');
    });

    it('includes video extensions', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('mp4');
      expect(SUPPORTED_EXTENSIONS).toContain('mkv');
      expect(SUPPORTED_EXTENSIONS).toContain('webm');
    });
  });

  describe('LANGUAGES', () => {
    it('contains language options', () => {
      expect(LANGUAGES.length).toBeGreaterThan(0);
    });

    it('includes auto detect', () => {
      const auto = LANGUAGES.find((l) => l.value === 'auto');
      expect(auto).toBeDefined();
      expect(auto?.label).toBe('Auto Detect');
    });

    it('includes common languages', () => {
      const languageCodes = LANGUAGES.map((l) => l.value);
      expect(languageCodes).toContain('en');
      expect(languageCodes).toContain('es');
      expect(languageCodes).toContain('fr');
      expect(languageCodes).toContain('de');
    });
  });

  describe('OUTPUT_FORMATS', () => {
    it('contains output format options', () => {
      expect(OUTPUT_FORMATS.length).toBeGreaterThan(0);
    });

    it('includes vtt, srt, and txt formats', () => {
      const formats = OUTPUT_FORMATS.map((f) => f.value);
      expect(formats).toContain('vtt');
      expect(formats).toContain('srt');
      expect(formats).toContain('txt');
    });

    it('each format has correct extension', () => {
      const vtt = OUTPUT_FORMATS.find((f) => f.value === 'vtt');
      const srt = OUTPUT_FORMATS.find((f) => f.value === 'srt');
      const txt = OUTPUT_FORMATS.find((f) => f.value === 'txt');

      expect(vtt?.ext).toBe('.vtt');
      expect(srt?.ext).toBe('.srt');
      expect(txt?.ext).toBe('.txt');
    });
  });

  describe('QUALITY_STARS', () => {
    it('has 5 quality levels', () => {
      expect(QUALITY_STARS).toHaveLength(5);
    });

    it('contains star ratings', () => {
      expect(QUALITY_STARS[0]).toBe('★☆☆☆☆');
      expect(QUALITY_STARS[4]).toBe('★★★★★');
    });
  });

  describe('getQualityStars', () => {
    it('returns correct stars for quality level 1', () => {
      const result = getQualityStars(1);
      expect(result).toBe('★☆☆☆☆');
    });

    it('returns correct stars for quality level 3', () => {
      const result = getQualityStars(3);
      expect(result).toBe('★★★☆☆');
    });

    it('returns correct stars for quality level 5', () => {
      const result = getQualityStars(5);
      expect(result).toBe('★★★★★');
    });

    it('handles out of range values', () => {
      const tooLow = getQualityStars(0 as unknown as 1);
      const tooHigh = getQualityStars(10 as unknown as 1);

      expect(tooLow).toBe('★☆☆☆☆');
      expect(tooHigh).toBe('★★★★★');
    });

    it('clamps negative values', () => {
      const result = getQualityStars(-5 as unknown as 1);
      expect(result).toBe('★☆☆☆☆');
    });
  });

  describe('APP_CONFIG', () => {
    it('has required configuration', () => {
      expect(APP_CONFIG.MAX_HISTORY_ITEMS).toBeDefined();
      expect(APP_CONFIG.COPY_SUCCESS_DURATION).toBeDefined();
      expect(APP_CONFIG.SAVE_SUCCESS_MESSAGE_DURATION).toBeDefined();
    });

    it('has reasonable values', () => {
      expect(APP_CONFIG.MAX_HISTORY_ITEMS).toBeGreaterThan(0);
      expect(APP_CONFIG.COPY_SUCCESS_DURATION).toBeGreaterThan(0);
      expect(APP_CONFIG.SAVE_SUCCESS_MESSAGE_DURATION).toBeGreaterThan(0);
    });
  });

  describe('getLanguageLabel', () => {
    it('returns label for known language code', () => {
      expect(getLanguageLabel('en')).toBe('English');
      expect(getLanguageLabel('es')).toBe('Spanish');
      expect(getLanguageLabel('fr')).toBe('French');
      expect(getLanguageLabel('auto')).toBe('Auto Detect');
    });

    it('handles all language codes in LANGUAGES', () => {
      LANGUAGES.forEach((lang) => {
        const label = getLanguageLabel(lang.value);
        expect(label).toBe(lang.label);
      });
    });
  });
});
