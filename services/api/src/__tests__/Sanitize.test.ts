import { describe, it, expect } from 'vitest';
import { sanitize } from '../infrastructure/ai/OpenAIProvider.js';

describe('sanitize', () => {
  describe('removes control tokens and template delimiters', () => {
    it('removes curly braces { }', () => {
      const input = 'Hello {world} and {foo}';
      const result = sanitize(input);
      expect(result).toBe('Hello world and foo');
      expect(result).not.toContain('{');
      expect(result).not.toContain('}');
    });

    it('removes angle brackets < >', () => {
      const input = '<script>alert("xss")</script> and <div>';
      const result = sanitize(input);
      expect(result).toBe('scriptalert("xss")/script and div');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('removes triple backticks ```', () => {
      const input = '```javascript\nconsole.log("hello")\n``` end';
      const result = sanitize(input);
      expect(result).toBe('javascript\nconsole.log("hello")\n end');
      expect(result).not.toContain('```');
    });

    it('removes all control tokens from combined input', () => {
      const input = '{ignore} <system>```override```</system> {evil}';
      const result = sanitize(input);
      expect(result).not.toContain('{');
      expect(result).not.toContain('}');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('```');
      expect(result).toBe('ignore systemoverride/system evil');
    });
  });

  describe('caps length at 2000 characters', () => {
    it('returns input unchanged when under 2000 characters', () => {
      const input = 'a'.repeat(1999);
      const result = sanitize(input);
      expect(result.length).toBe(1999);
    });

    it('returns input unchanged when exactly 2000 characters', () => {
      const input = 'a'.repeat(2000);
      const result = sanitize(input);
      expect(result.length).toBe(2000);
    });

    it('truncates input to 2000 characters when exceeding limit', () => {
      const input = 'a'.repeat(3000);
      const result = sanitize(input);
      expect(result.length).toBe(2000);
    });

    it('length check happens after character removal', () => {
      // 2100 chars, with 100 braces that will be removed = 2000 after sanitize
      const input = 'a'.repeat(2000) + '{'.repeat(100);
      const result = sanitize(input);
      expect(result.length).toBe(2000);
      expect(result).not.toContain('{');
    });
  });

  describe('handles edge cases', () => {
    it('handles empty string', () => {
      expect(sanitize('')).toBe('');
    });

    it('handles string with only control characters', () => {
      const input = '{}{}{}<<<>>>```';
      const result = sanitize(input);
      expect(result).toBe('');
    });

    it('preserves normal text unchanged', () => {
      const input = 'Normal text with numbers 123 and symbols !@#$%^&*()';
      const result = sanitize(input);
      expect(result).toBe(input);
    });

    it('preserves single backticks', () => {
      const input = 'Use `code` for inline code';
      const result = sanitize(input);
      expect(result).toBe('Use `code` for inline code');
    });

    it('preserves double backticks', () => {
      const input = 'Use ``code`` for inline code';
      const result = sanitize(input);
      expect(result).toBe('Use ``code`` for inline code');
    });
  });
});
