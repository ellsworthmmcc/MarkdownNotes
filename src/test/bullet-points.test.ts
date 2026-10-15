import * as assert from 'assert';
import {
  analyzeLine,
  shouldIndentOnTab,
  shouldRemoveBulletOnShiftTab,
  BulletOptions,
} from '../bullet-points';
import { loadManifestDefaults, manifestOptionKeys } from './helpers'

const defaults = loadManifestDefaults();

suite('analyzeLine', () => {
  suite('new bullet', () => {
    test('continues a plain bullet', () => {
      assert.deepStrictEqual(analyzeLine('- hi', 4, defaults), {
        kind: 'newBullet',
        prefix: '- ',
      });
    });

    test('preserves indentation', () => {
      assert.deepStrictEqual(analyzeLine('    - nested', 12, defaults), {
        kind: 'newBullet',
        prefix: '    - ',
      });
    });

    test('preserves the marker the user typed', () => {
      assert.deepStrictEqual(analyzeLine('* hi', 4, defaults), { kind: 'newBullet', prefix: '* ' });
      assert.deepStrictEqual(analyzeLine('+ hi', 4, defaults), { kind: 'newBullet', prefix: '+ ' });
    });

    test('works when the cursor is mid-content', () => {
      assert.deepStrictEqual(analyzeLine('- foobar', 5, defaults), {
        kind: 'newBullet',
        prefix: '- ',
      });
    });
  });

  suite('remove bullet', () => {
    test('empty bullet', () => {
      assert.deepStrictEqual(analyzeLine('- ', 2, defaults), { kind: 'removeBullet' });
    });

    test('bullet containing only whitespace', () => {
      assert.deepStrictEqual(analyzeLine('-    ', 5, defaults), { kind: 'removeBullet' });
    });

    test('empty nested bullet', () => {
      assert.deepStrictEqual(analyzeLine('  - ', 4, defaults), { kind: 'removeBullet' });
    });
  });

  suite('default Enter (null)', () => {
    test('plain text', () => {
      assert.strictEqual(analyzeLine('hello', 5, defaults), null);
    });

    test('empty line', () => {
      assert.strictEqual(analyzeLine('', 0, defaults), null);
    });

    test('no space after hyphen', () => {
      assert.strictEqual(analyzeLine('-no', 3, defaults), null);
    });

    test('horizontal rule', () => {
      assert.strictEqual(analyzeLine('---', 3, defaults), null);
    });

    test('hyphen mid-line is not a bullet', () => {
      assert.strictEqual(analyzeLine('a - b', 5, defaults), null);
    });

    test('cursor in the indentation', () => {
      assert.strictEqual(analyzeLine('  - hi', 1, defaults), null);
    });

    test('cursor on the marker', () => {
      assert.strictEqual(analyzeLine('- hi', 1, defaults), null);
    });
  });
});

suite('shouldIndentOnTab', () => {
  test('cursor anywhere in the content indents', () => {
    assert.strictEqual(shouldIndentOnTab('- hi', 2, defaults), true);
    assert.strictEqual(shouldIndentOnTab('- hi', 3, defaults), true);
    assert.strictEqual(shouldIndentOnTab('- hi', 4, defaults), true);
    assert.strictEqual(shouldIndentOnTab('  * hi', 4, defaults), true);
    assert.strictEqual(shouldIndentOnTab('- ', 2, defaults), true);
  });

  test('cursor in the indentation or on the marker does not', () => {
    assert.strictEqual(shouldIndentOnTab('  - hi', 1, defaults), false);
    assert.strictEqual(shouldIndentOnTab('- hi', 1, defaults), false);
  });

  test('non-bullet lines do not', () => {
    assert.strictEqual(shouldIndentOnTab('hello', 2, defaults), false);
    assert.strictEqual(shouldIndentOnTab('-no', 3, defaults), false);
    assert.strictEqual(shouldIndentOnTab('---', 3, defaults), false);
  });

  test('indentOnTab off', () => {
    assert.strictEqual(shouldIndentOnTab('- hi', 2, { ...defaults, indentOnTab: false }), false);
  });
});

suite('shouldRemoveBulletOnShiftTab', () => {
  test('unindented bullet, cursor in the content', () => {
    assert.strictEqual(shouldRemoveBulletOnShiftTab('- hi', 2, defaults), true);
    assert.strictEqual(shouldRemoveBulletOnShiftTab('- hi', 3, defaults), true);
    assert.strictEqual(shouldRemoveBulletOnShiftTab('- hi', 4, defaults), true);
    assert.strictEqual(shouldRemoveBulletOnShiftTab('* hi', 4, defaults), true);
    assert.strictEqual(shouldRemoveBulletOnShiftTab('+ hi', 4, defaults), true);
    assert.strictEqual(shouldRemoveBulletOnShiftTab('- ', 2, defaults), true);
  });

  test('indented bullets are outdented normally first', () => {
    assert.strictEqual(shouldRemoveBulletOnShiftTab('  - hi', 4, defaults), false);
    assert.strictEqual(shouldRemoveBulletOnShiftTab('\t- hi', 3, defaults), false);
  });

  test('cursor on the marker does not', () => {
    assert.strictEqual(shouldRemoveBulletOnShiftTab('- hi', 0, defaults), false);
    assert.strictEqual(shouldRemoveBulletOnShiftTab('- hi', 1, defaults), false);
  });

  test('non-bullet lines do not', () => {
    assert.strictEqual(shouldRemoveBulletOnShiftTab('hello', 2, defaults), false);
    assert.strictEqual(shouldRemoveBulletOnShiftTab('-no', 3, defaults), false);
    assert.strictEqual(shouldRemoveBulletOnShiftTab('---', 3, defaults), false);
  });

  test('removeOnShiftTab off', () => {
    assert.strictEqual(
      shouldRemoveBulletOnShiftTab('- hi', 2, { ...defaults, removeOnShiftTab: false }),
      false,
    );
  });
});

suite('options', () => {
  // the behavior tests above assume every feature is on, so pin that explicitly
  const allOn: BulletOptions = {
    continueOnEnter: true,
    splitOnEnter: true,
    removeEmptyOnEnter: true,
    indentOnTab: true,
    removeOnShiftTab: true,
  };

  test('continueOnEnter off: Enter at end is default', () => {
    assert.strictEqual(analyzeLine('- hi', 4, { ...allOn, continueOnEnter: false }), null);
  });

  test('continueOnEnter off: splitting still works', () => {
    assert.deepStrictEqual(analyzeLine('- foobar', 5, { ...allOn, continueOnEnter: false }), {
      kind: 'newBullet',
      prefix: '- ',
    });
  });

  test('splitOnEnter off: mid-text is default, end still continues', () => {
    const opts = { ...allOn, splitOnEnter: false };
    assert.strictEqual(analyzeLine('- foobar', 5, opts), null);
    assert.deepStrictEqual(analyzeLine('- foobar', 8, opts), { kind: 'newBullet', prefix: '- ' });
  });

  test('removeEmptyOnEnter off: empty bullet is default', () => {
    assert.strictEqual(analyzeLine('- ', 2, { ...allOn, removeEmptyOnEnter: false }), null);
  });

  test('all Enter features off: every bullet case is default', () => {
    const allOff: BulletOptions = {
      continueOnEnter: false,
      splitOnEnter: false,
      removeEmptyOnEnter: false,
      indentOnTab: false,
      removeOnShiftTab: false,
    };
    assert.strictEqual(analyzeLine('- hi', 4, allOff), null);
    assert.strictEqual(analyzeLine('- foobar', 5, allOff), null);
    assert.strictEqual(analyzeLine('- ', 2, allOff), null);
  });

  test('Tab and Shift+Tab settings do not affect Enter', () => {
    const opts = { ...allOn, indentOnTab: false, removeOnShiftTab: false };
    assert.deepStrictEqual(analyzeLine('- hi', 4, opts), {
      kind: 'newBullet',
      prefix: '- ',
    });
  });

  test('removeOnShiftTab does not affect Tab, and vice versa', () => {
    assert.strictEqual(shouldIndentOnTab('- hi', 2, { ...allOn, removeOnShiftTab: false }), true);
    assert.strictEqual(
      shouldRemoveBulletOnShiftTab('- hi', 2, { ...allOn, indentOnTab: false }),
      true,
    );
  });
});

suite('manifest', () => {
  // Record<keyof BulletOptions, true> forces this to stay exhaustive at compile time
  const expectedKeys: Record<keyof BulletOptions, true> = {
    continueOnEnter: true,
    splitOnEnter: true,
    removeEmptyOnEnter: true,
    indentOnTab: true,
    removeOnShiftTab: true,
  };

  test('package.json declares exactly the options in BulletOptions', () => {
    assert.deepStrictEqual(manifestOptionKeys().sort(), Object.keys(expectedKeys).sort());
  });
});