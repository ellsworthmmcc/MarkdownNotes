// src/test/bullets.test.ts
import * as assert from 'assert';
import { analyzeLine } from '../bullet-points';

suite('analyzeLine', () => {
  suite('new bullet', () => {
    test('continues a plain bullet', () => {
      assert.deepStrictEqual(analyzeLine('- hi', 4), {
        kind: 'newBullet',
        prefix: '- ',
      });
    });

    test('preserves indentation', () => {
      assert.deepStrictEqual(analyzeLine('    - nested', 12), {
        kind: 'newBullet',
        prefix: '    - ',
      });
    });

    test('preserves the marker the user typed', () => {
      assert.deepStrictEqual(analyzeLine('* hi', 4), { kind: 'newBullet', prefix: '* ' });
      assert.deepStrictEqual(analyzeLine('+ hi', 4), { kind: 'newBullet', prefix: '+ ' });
    });

    test('works when the cursor is mid-content', () => {
      assert.deepStrictEqual(analyzeLine('- foobar', 5), {
        kind: 'newBullet',
        prefix: '- ',
      });
    });
  });

  suite('remove bullet', () => {
    test('empty bullet', () => {
      assert.deepStrictEqual(analyzeLine('- ', 2), { kind: 'removeBullet' });
    });

    test('bullet containing only whitespace', () => {
      assert.deepStrictEqual(analyzeLine('-    ', 5), { kind: 'removeBullet' });
    });

    test('empty nested bullet', () => {
      assert.deepStrictEqual(analyzeLine('  - ', 4), { kind: 'removeBullet' });
    });
  });

  suite('default Enter (null)', () => {
    test('plain text', () => {
      assert.strictEqual(analyzeLine('hello', 5), null);
    });

    test('empty line', () => {
      assert.strictEqual(analyzeLine('', 0), null);
    });

    test('no space after hyphen', () => {
      assert.strictEqual(analyzeLine('-no', 3), null);
    });

    test('horizontal rule', () => {
      assert.strictEqual(analyzeLine('---', 3), null);
    });

    test('hyphen mid-line is not a bullet', () => {
      assert.strictEqual(analyzeLine('a - b', 5), null);
    });

    test('cursor in the indentation', () => {
      assert.strictEqual(analyzeLine('  - hi', 1), null);
    });

    test('cursor on the marker', () => {
      assert.strictEqual(analyzeLine('- hi', 1), null);
    });
  });
});