const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/color-palette.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
const paletteModule = { exports: {} }
new Function('exports', 'module', source)(paletteModule.exports, paletteModule)
const colors = paletteModule.exports

test('known WCAG ratios and readable labels across RGB colors', () => {
  assert.equal(colors.contrastRatio('#000', '#fff'), 21)
  assert.equal(colors.contrastRatio('#123456', '#123456'), 1)
  assert.ok(Math.abs(colors.contrastRatio('#777777', '#ffffff') - 4.478) < 0.001)
  for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
    const hex = '#' + [r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('')
    assert.ok(colors.contrastRatio(hex, colors.readableText(hex)) >= 4.5)
  }
})

test('preview scales preserve source colors and get progressively darker', () => {
  for (const hex of ['#F18825', '#007EFF', '#171B2D', '#FFFFFF', '#000000']) {
    const steps = colors.deriveScale(hex)
    assert.equal(steps[4].hex, colors.normalizeHex(hex))
    assert.equal(steps.length, 9)
    for (let index = 1; index < steps.length; index++) {
      assert.ok(colors.luminance(steps[index - 1].hex) >= colors.luminance(steps[index].hex))
    }
  }
})

test('authored scale parsing keeps valid steps and supports short HEX', () => {
  assert.equal(colors.normalizeHex(' f08 '), '#FF0088')
  assert.equal(colors.normalizeHex('red'), null)
  assert.deepEqual(colors.parsePaletteSteps('100:#abc,invalid,500:#123456'), [
    { label: '100', hex: '#AABBCC' }, { label: '500', hex: '#123456' },
  ])
  assert.equal(colors.parsePaletteSteps('invalid'), undefined)
})
