# Handout design rules (from the 12M20 sample style)

## Page and panel layout
- A4 landscape (297x210 mm), 8 mm outer padding, thin black rounded frame.
- Each page = TWO panels (left/right) separated by a thin vertical divider line.
- Page number: tiny, bottom right of the RIGHT panel only (hide it on left panels).
- Page 1: left = cover (boxed big title, e.g. "12M21 / Differential Equation"), right = Contents.
- Every panel is one idea: a coloured title banner, then short notes. Never spill to the next panel.

## Colour system (pastel background + saturated text of the same hue)
mint #c9f7d6/#16a06a, pink #ffd3e8/#e0197a, sky #c6efff/#0a86c2, sun #fff3b0/#d98200,
lavender #e5d8ff/#7a3fd1, peach #ffdfc6/#e8590c, lime #e2f6b2/#5a9a00.
- Title banner: pastel fill, saturated bold text (Baloo 2, 20-23pt), rounded 3 mm. Vary the colour panel to panel.
- Sub-headings: Fredoka 600, saturated colour.
- Formula boxes: pastel rounded boxes, centred display math.
- Tip = dashed green box. Warning / common mistake = dashed red box.
- Worked examples: yellow (sun) boxes with the final answer in bold.
- Tables: coloured header row with white text, pastel rows, rounded ends.

## Fonts (install from npm, do not use Google Fonts: blocked)
npm install katex @fontsource/fredoka @fontsource/patrick-hand @fontsource/baloo-2
Body = Patrick Hand 14.5pt, headings = Fredoka / Baloo 2, math = KaTeX.

## Content style: SHORT NOTES
- Definition, formula box, 1-2 tiny worked examples, one tip. No paragraphs.
- Per panel about 70-90% full; leave breathing room.
- Last page: method chooser chart + tips and common mistakes.
- Check every worked example by hand before shipping.

## Gotchas
- KaTeX inline math inside small tables looks tiny: add `table.t .katex{font-size:1.08em}`.
- Long inline equations wrap badly: wrap in `<span style="white-space:nowrap">` or put on their own display line.
- Display fractions stacked in one box look cramped: put each in its own div with margin 2.6mm.
- After editing, ALWAYS run scripts/render.py, fix any OVERFLOW, and look at PNG previews
  (pdftoppm -r 80 -png out.pdf v) of every page.
