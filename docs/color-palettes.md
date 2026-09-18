# Article color palettes

Existing `palette` fences keep working, including `name`, `hex`, `rgb`, `usage`, and `rank`. Colors are ordered by rank, then by their original order. RGB values displayed in the component are calculated from HEX so both stay consistent. Invalid HEX values are omitted rather than replaced with black.

For UI case studies, open tonal scales initially with `scales="true"`:

````markdown
```palette title="Interface colors" scales="true"
name="Blue" hex="#2563EB" usage="Primary" rank="1"
name="Paper" hex="#F5F7FA" usage="Surface" rank="2"
```
````

Each color has its own disclosure directly below its base swatch. Without that attribute, readers can open individual scales themselves. Generated scales carry a short Preview label and an accessible description; they are not documented project tokens. They contain lighter and darker variants of each base color, with the original at step 500.

To document a real project scale, provide its exact values rather than generating them:

````markdown
```palette title="Interface colors" scales="true"
name="Blue" hex="#2563EB" usage="Primary" steps="100:#DBEAFE,300:#93C5FD,500:#2563EB,700:#1D4ED8,900:#1E3A8A"
```
````

Defined scales preserve the supplied labels and order. Copy buttons work for base colors and individual steps. Contrast checks compare black and white text against the base colors; the AA labels refer only to those specific pairings for normal text, not to overall product accessibility.
