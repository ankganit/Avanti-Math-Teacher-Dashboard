---
name: "c12-ppt"
description: "Builds Class 12 maths lecture slides (cover, contents, formula, PYQ, practice, board-explanation and closing pages) in the house style: cream cover with navy panel and diagram, black board pages with coral and mint accents, real Office Math equations, and colour rules for questions and answers."
---

## When to use
Use for any Class 12 deck or slide in the Class 12 lecture style: "make the cover", "contents page", "formula page", "PYQ slide", "practice question", "board explanation", "fill on board", "thank you slide", or any slide that the teacher solves by hand. Also use when the user asks to restyle or add a Class 12 slide.

## Inputs
- `target`: the selected slides (default), or the slide numbers the user names. If the user asks to "check all slides", audit every slide in the deck, read each slide's shapes and text, render each one, and report findings grouped by slide before changing anything, unless the user asked for fixes.
- `chapter` and `part`: chapter number and title, part number and title, and the lecture topic. Read these from the existing slide text. Never invent them.
- Contents and subtopics come only from the avanti-jee-maths-syllabus skill. Use the names verbatim.

## Goal
Every targeted slide matches its page type below: correct background, palette, font sizes, positions and colours, with the original wording kept. Handwriting space is left empty.

## Deck-wide rules
- Slide size is 960×540pt (16:9, 33.87 × 19.05 cm). Every y value is within 0–540. The right edge of content is x=912 (48pt margin). Bottom margin is 36pt.
- If a deck is still 720×405, scale every shape by 4/3 and apply the font sizes below.
- Set every font size explicitly, including equations. Question boxes use no autofit.
- Slide number: bottom right, 10pt, gray #9CA3AF. Set it once in the content layout.
- Set the content layout background to black #000000 once, in the layout, not per slide. Only the cover is cream. Keep the layout logo on non-cover pages, with no yellow footer tag and no cream plate behind it.
- Every equation is a real PowerPoint equation object (Office Math, a14:m / m:oMath). Never typed text or Unicode approximations.
- Use proper integral limits, fractions, radicals, sub/superscripts, |…|, […] and d(…).
- Trig and log names (sin, cos, tan, cot, ln, log, min) are upright.
- Write equations left-aligned (m:oMathParaPr with m:jc left).
- Put words in normal text runs next to the equation, not inside it.
- Never solve a question. Keep any answer already on a PYQ slide.
- Remove emoji from slides.
- Edit one slide per tool call. Batched or parallel slide edits can fail on the server, and slide IDs change after every edit. Re-read the IDs after each edit and re-check each slide by rendering it.

## Font sizes
- Cover: CLASS 12 pill 18; CHAPTER NN 16; chapter title Georgia bold 48; part number Georgia bold 54; PART label 18; part title Arial bold 24; panel tag 18; axis labels 16; key formula Cambria Math 18.
- Contents: title Georgia bold 32; "PART N OF M" 18; card number Georgia bold 30 at 24pt names (number = name size + 6pt when names change); topic name Arial 24 by default, 20 to 28 when needed to fit more topics (bold except covered topics); TODAY pill 18.
- Formula, board and practice pages: heading Georgia bold 24; badge labels Georgia bold 24; condition sentences 24 white; card body text 24; formula equations Cambria Math 24, yellow #FFFF00.
- Practice question text: Times New Roman 24, equations Cambria Math 24. Answer line, if the slide already has one: 16, gray #9CA3AF.
- PYQ: "Ques" Georgia bold 20 white in a rounded box with a coral #E8573E 2pt outline and no fill; exam tag Arial bold 16; question and options Times New Roman 24 (equations Cambria Math 24); answer line "Ans:" Arial 16, gray #9CA3AF. Type label (only when the source has one): blue pill 38pt tall, yellow chip "TYPE N" navy bold 20, topic white bold Arial 20.
- Practice "Ques" title: Georgia bold 20 white, centred, in a 64×36pt coral 2pt outlined rounded box, no number.
- Thank you: Georgia bold 44; closing line Arial 18, gray #9CA3AF.
- Do not shrink fonts below these sizes to make content fit. Resize the container, move content, or split the slide instead. Exception: contents topic names may use 20–28pt, as set in step 2.

## Shared palette
- Navy #1B2A41 (ink, panels, cards)
- Coral #E8573E (accent, badges, rules)
- Teal #2A9D8F (chapter label)
- Mint #8FD3C7 (curves, lines on navy, upcoming numbers, and the "=" sign after the left-hand side on formula pages)
- Gray #6B7280 (small labels, dotted guides)
- Gray #9CA3AF (PYQ answer line, Thank you line, slide number)
- Cream #F7F3EA (cover background only)
- Blue #0070C0 (subpart badges on practice pages)
- Option-label blue #3B9EFF (the labels (A)–(D) on black question slides; #0070C0 on white-background decks)
- Bright yellow #FFFF00 (all equations on navy formula cards)
- Lime #9BE15D (given maths in questions)
- Warm yellow #F4D35E (quantity to find)
- Green #4ADE80 (JEE Mains tag), red #EF4444 (JEE Advanced tag)
- Level pill (L1/L2/L3): L1 green #4ADE80, L2 yellow #F4D35E, L3 red #EF4444
- Maths: Cambria Math, italic for variables. Trig names (sin, cos, tan, cosec, sec, cot) always upright.
- Headings: Georgia bold. Body: Arial.
- Keep content 48pt from the left and right edges and 36pt from the bottom, except the title and header rows at y≈16–24, which the page specs set.

## Steps

### 1. Cover slide (slide 1 of a Class 12 deck)
Background cream #F7F3EA. Left column starts at x=64, about 496pt wide, top to bottom:
1. "CLASS 12" pill: 144×37pt at y=48, rounded, coral outline, coral bold 18pt, wide letter spacing, no fill.
2. "CHAPTER NN" in teal, bold 16pt, wide spacing, at y=107. Never "MODULE".
3. Chapter title in Georgia bold 48pt navy, two lines, tight line spacing, at y=147.
4. Coral rule 75×7pt at y=304.
5. Part number "NN" in Georgia bold 54pt coral at y=328. Beside it at x=181, y=336, "PART" in gray bold 18pt. Below it at x=181, y=365, the part title in Arial bold 24pt navy.

Right side: full-height navy #1B2A41 panel from x=573 to the right edge. Keep panel content 48pt from the slide edges, so it sits within x=621–912.
- Diagram in the panel, built from shapes, redrawn for each chapter or part so it shows that part's core idea. Do not use a generic area graph. Axes light gray with 16pt labels. Curve mint 2.25pt. Highlighted region coral. Italic Cambria Math labels. Dashed gray guides for rectangle corners.
  - Definite integration: mint curve, coral area between a and b, dashed guides, and italic "a" and "b" labels under the shaded edges.
  - Properties of definite integration (even/odd and f(x)+f(−x)): even curve, coral area from 0 to a, translucent mint area from −a to 0, labels −a, 0 and a, dashed guides at a and −a.
  - Integration by parts: curve y = f(x) over a dashed rectangle. Coral region under the curve is ∫ v du, mint translucent region above it is ∫ u dv.
  - Reduction formulae: curve y = sinⁿx on [0, π/2], coral region under it labelled Iₙ, tick labels 0 and π/2 under the x-axis.
  - Substitution: draw the curve t = √(px+q) on the axes. Shade the region between the limits a and b with coral. Place the labels "a" and "b" in italic Cambria Math directly under the two shaded edges, on the x-axis. Dashed gray guides drop from each shaded edge to the axis.
- At the bottom of the panel: coral bold letter-spaced tag (e.g. "THE RULE", 18pt), then the key formula as two left-aligned equation-object lines: the rule line, then the result below it. For definite integration the rule line is ∫ from −a to a of f(x)dx, and the result line is = ∫ from 0 to a of [f(x)+f(−x)]dx. For the F(b) − F(a) rule, the result line is "= F(b) − F(a)". White, Cambria Math 18pt. Leave at least 20pt between the "THE RULE" tag, the first formula line and the second formula line. Both lines stay inside the panel's width and above the bottom margin (36pt from the slide edge).
Keep all original cover text.

**Done when:** the cover matches the layout above, the panel starts at x=573, the diagram shows the part's idea, the key formula is two left-aligned equation lines inside the panel with at least 20pt between the lines, no label box runs past the slide edge, and no text was lost.

### 2. Contents slide (usually slide 2)
- Title: original text in Georgia bold 32pt white, at x=48, y=22, no border.
- Subtitle "PART N OF M" in coral bold 18pt with wide spacing, at x=48, y=70. M is the number of subtopics for the chapter and N is the current subtopic's position. Nothing else.
- Use the CMS subtopics for the chapter, in order, from the avanti-jee-maths-syllabus skill. Keep names verbatim.
- Put as many topics on one page as fit. Use two columns at x=48 and x=488, 424pt wide, and fill the left column first, top to bottom, then the right. The grid runs from y=104 to y=504 (36pt bottom margin).
  - Topic names are Arial 24pt by default. If the names do not fit, the topic font may go down to 20pt or up to 28pt. It must never go outside 20–28pt.
  - Layout options, in order of preference:
    1. 4 rows of 90pt cards at y=104, 206, 308, 410 (8 topics per slide). Use this when the chapter has 8 or fewer topics.
    2. 5 rows of 70pt cards with a 10pt gap (10 topics per slide). Use this when there are 9 or 10 topics.
    3. 6 rows of 60pt cards with an 8pt gap (12 topics per slide). Use this when there are 11 or 12 topics.
  - Only if a layout cannot hold all topics with names at 20pt or larger, split onto a second contents slide with the same title and subtitle. Do this only in that extreme case.
  - Number: Georgia bold, at card x+16, vertically centred. Use 30pt at 24pt names. When the names change size, the number changes with them (number = name size + 6pt).
  - Topic name: at card x+80, width about 330pt, vertically centred. Names wrap to at most two lines.
  - Covered topics: fill #1C2029, number #7C8594, text #8A93A3, regular weight.
  - Current topic: coral fill, white bold number and text, plus a navy #1B2A41 "TODAY" pill (18pt white bold, letter-spaced) that is 76×26pt, placed at the top-right edge of the coral card. Keep the topic text narrower than the TODAY pill so the two do not overlap.
  - Upcoming topics: navy fill, mint number, white bold text.
- If it is not clear which subtopic is "today", ask the user before building.

**Done when:** the card for the current subtopic is coral with TODAY, the subtitle matches the subtopic position and count, every topic name fits its card at its chosen size (20–28pt), and the contents fit on one slide unless the extreme case applied.

### 3. Formula page (fill-on-board)
- Heading block (same as the board explanation page, Step 4): a coral #E8573E rounded badge 53×53pt at x=48, y=23, holding a filled white icon from the icon library at 37pt (placed at x=56, y=31). Heading at x=115, y=23, 797×53pt, vertically centred with the badge, Georgia bold 24pt white. Coral rule 75×5pt at x=115, y=83 under the heading. No subtitle, no "#" box.
- Icon choice matches the heading: calculator for theorems and calculus rules, lightbulb for "Imp – N" key results, checklist for "Properties", pencil for proofs. Filled icons only, white, one icon per slide.
- Because of the heading block, the first card starts at y=104 (not y=80). Card sizes, badges, equations and spacing stay as specified.
- Equation colour: every equation on a navy #1B2A41 card is bright yellow #FFFF00 (Cambria Math 24pt). The "=" after a left-hand side on fill-on-board pages stays mint #8FD3C7.
- Condition sentences stay white 24pt, with their inline maths in yellow #FFFF00.
- If the formula needs a condition sentence (e.g. "If f(x) is continuous in [a, b]…"), put it inside the same navy card, above the equation, as 24pt white text with inline equation objects. A card with only a condition sentence starts at y=104 and widens to fit it on one line.
- For tall equations, increase the card height and put each line in its own paragraph with a spacer so limits do not touch.

**Case A: only the left-hand side is typed (the teacher writes the answer by hand)**
- Never type the right-hand side. Each card holds only the left-hand side as a real equation, left-aligned, starting right after the badge, then a mint "=" directly after it, then empty write space.
- Card: navy rounded, at x=48, first card top y=104, about 83pt tall, 12pt gap between cards. Width fits the content, not the full slide. Four cards fit on a slide (they end at y≈472). Split onto a second slide beyond four formulas.
- Badge: coral #E8573E 59×59pt rounded, label (i, ii, iii or 1, 2, 3) in Georgia bold 24pt white, at card x+13, vertically centred on its card (badge top = card top + (card height − 59) / 2).

**Case B: both the left-hand side and right-hand side are typed in the source**
- Never delete, shorten or retype-away any part of the equation. Keep both sides, as a real equation object, all in bright yellow #FFFF00.
- One navy card, at x=48, top y=104, no badge. Equation centred in the card. If there is a condition sentence, it sits in the same card above the equation (like the Fundamental Theorem slide).
- Exception: if the source labels the items (P-1, P-2, P-3), keep those labels as coral badges and stack one card per item, left-aligned after the badge.

**Card sizing (both cases)**
- Size each navy card to its content. Never stretch it to full width unless a long condition sentence needs it. Typical widths: one-line equation with badge about 350–430pt; equation only about 430pt.
- Check card and badge sizes from shape measurements in points, not by eye.
- Everything below the last card stays empty for handwriting. An empty lower half is intended; do not enlarge the cards to fill it.
- Merged cases (e.g. "A OR B") on one slide: one card per case, or a single card holding both lines with "OR" between them. Keep the card sized to its content, and check that the stack ends above the slide number.

**Done when:** every equation on a navy card is #FFFF00, cards fit their content, nothing the user typed (LHS or RHS) was deleted, LHS-only cards show only the left side and a mint "=", badges are centred on their cards, and every formula page has the coral icon badge, heading at x=115 and coral rule, like the board explanation page.

### 4. Board explanation page (heading only)
- Coral 53×53pt rounded badge at x=48, y=23, holding a filled white icon from the icon library at 37pt, matching the heading (pencil for a proof). Filled icons only, never thin line icons.
- Heading at x=115, vertically centred with the badge. Georgia bold 24pt white.
- Coral rule 75×5pt at x=115, y=83, under the heading.
- Remove the old "#" box and table. Keep the rest empty.
- This heading block (badge, icon, heading, rule) is the standard for every formula and board page. Reuse the same positions on formula pages (Step 3).

**Done when:** the badge, heading and rule are aligned and the rest of the slide is empty.

### 5. Practice question page (not PYQ)
This replaces the old card layout. There is no navy card.
- Title "Ques", with no question number, in Georgia bold 20pt white, centred, inside a rounded box 64×36pt with a 2pt coral #E8573E outline and no fill, at x=48, y=22. Never put the question number in the title.
- Type label (only when the source has one): the same blue pill as step 6, on its own line under the Ques title. The question box and subpart badge move below it.
- When the question has subparts, each subpart gets its own slide. Each slide has a blue #0070C0 rounded badge, 59×59pt, at x=49, y=91, holding "(i)", "(ii)" and so on in Georgia bold 24pt white. For a two-line question, centre the badge on the first line of the question.
- Single-question slides (no subparts): add a coral #E8573E bar, 6pt wide, at x=48. Its left edge lines up with the left edge of the "Ques" box.
  - The question text box starts at x=73 and is about 839pt wide, Times New Roman 24pt, left-aligned, no fill, built from equation objects. No autofit.
  - Set its top and bottom padding to 0 and make the box fit its text.
  - The question top is y=80. Move it to y=92 if the integral limits crowd the "Ques" box.
  - The bar starts at the top of the question text box and is exactly as tall as the question block, so the bar and the text have the same height.
- Subparts slides (i, ii, iii…): no coral bar. The question text box is at x=120, y=80, width 792pt, Times New Roman 24pt, left-aligned, with no fill, built from equation objects. No autofit.
- A single expression is all warm yellow #F4D35E.
- Statement-style questions: words white, given maths green #9BE15D, quantity to find yellow #F4D35E.
- Keep the rest of the slide empty. Keep any answer line already on the slide (Times New Roman or Arial 16pt, gray #9CA3AF). Do not add an exam tag or answer line.
- Two-question slides: the questions sit side by side at x=48 and x=497, with a dotted gray #6B7280 divider at x=480. Only add the divider in that case. No coral bar on these slides.

**Done when:** every equation is an equation object, all question text is 24pt, the "Ques" title has no number and is Georgia bold 20pt in the 64×36pt coral outlined box, every single-question slide has a coral bar at x=48 whose top and height match the question text box, subpart slides have their badges and no bar, two-question slides have the divider and no bar, no navy question cards remain, and the rest of the slide is empty.

### 6. JEE PYQ page (reference: JEE Mains 6 Apr 2026 Shift 2)
- Header: "Ques" in Georgia bold 20pt white inside a rounded box with a coral #E8573E 2pt outline and no fill, at x=36, y=22. Keep the box about 60pt wide.
- Exam pill: outline only (no fill), at x=135, y=24, about 30pt tall, Arial bold 16pt, in the exam colour (JEE Mains green #4ADE80, JEE Advanced red #EF4444). Text format "JEE MAINS · 6 Apr 2026 · Shift 2". Widen the pill so the 16pt text fits. Years without a date show the year only, e.g. "JEE ADV · 2022".
- Level pill (when the question has a level): right after the exam pill, same height, outline only, Arial bold 16pt, text only L1, L2 or L3, in the level colour (L1 green #4ADE80, L2 yellow #F4D35E, L3 red #EF4444).
- If a PYQ has no exam tag or year, do not invent one. Ask the user for the exam and year.
- No topic or sub-topic label at the top right of the PYQ page.
- A coral #E8573E bar, 6pt wide, at x=36 so its left edge lines up with the left edge of the "Ques" box. Its top equals the question block top, and its height equals the question block height, so it spans the question text and all options. Do not leave the bar taller or shorter than the text.
- Question block at x=61, y=68 (y=116 when a type label is shown), with top and bottom padding 0 and the box fitted to its text, width about 863pt, Times New Roman 24pt white text, original wording, with no "Q.N" prefix. Built from equation objects: given maths green #9BE15D, quantity to find yellow #F4D35E, and "[t]" or a function definition green.
- Statement-wise questions: statement labels (I), (II), (III) and the function symbol in each statement are yellow #F4D35E.
- Options (A) to (D): one per line, Times New Roman 24pt, with the maths as equation objects. Not side by side. The labels (A), (B), (C), (D) are bold BLUE #3B9EFF; the option text is white.
- Answer: "Ans:" bold then the value, Arial 16pt, gray #9CA3AF, at x=36, y=475. Option letters in brackets for MCQ and MSQ. Nothing else at the bottom of the slide. Keep any answer already on the slide; never solve.
- Blank slides after each PYQ stay empty for handwriting.
- Do not add topic text, except the type label below.
- Type label (only when the source has one, e.g. "Type – 2 : Maxima and minima"): on its own second line under the header row, at x=36, y=64, a blue #0070C0 rounded pill 38pt tall. Inside it, a yellow #F4D35E chip reads "TYPE N" in navy #1B2A41 bold 20pt, and the topic sits to its right in white bold Arial 20pt. Never invent a type label.

**Done when:** the coral bar spans the question and options, the "Ques" box is coral outlined at 20pt, the exam text is Arial bold 16pt on the same row as the header, the question and options are Times New Roman 24pt, the option labels are blue, the answer is Arial 16pt gray #9CA3AF at x=36, y=475, and any type label sits on its own line in its blue pill with the question block below it.

### 7. Question colour rules (these override the colour rules above)
- Single question (one expression, e.g. an integral): the whole question in warm yellow #F4D35E.
- Statement-wise question: words in white, given maths green #9BE15D, quantity to find yellow #F4D35E.
- Statement labels (I), (II), (III) and the function symbol in each statement: yellow #F4D35E.
- Options (A) to (D): the option text is white; the labels (A), (B), (C), (D) are blue #3B9EFF (user rule).
- Answer line on PYQ pages: the whole line in gray #9CA3AF.

**Done when:** every question and option follows these colours.

### 7b. Question text font, size and numbers
- All question text and option lines (A)–(D) on practice and PYQ slides use Times New Roman, 24pt. Apply it to every normal text run in the Question and Options boxes, including words next to equations and the option labels.
- Equation objects stay Cambria Math at 24pt. Never change an equation's font, because PowerPoint draws maths in Cambria Math.
- PYQ slides: remove any written question number from the question text ("Q.5 ", "Q.6 " and so on). The question starts directly with its wording. The "Ques" header stays.
- Keep the Ques header, exam tag and answer line as they are (Georgia, Arial).

**Done when:** every word run in Question and Options is Times New Roman 24pt, no "Q.N" prefix is left, and equations are untouched.

### 8. Thank you slide (always the last slide)
- Black #000000 background.
- "Thank you" in Georgia bold 44pt white at x=64, y=195.
- Coral #E8573E rule 75×7pt at y=285.
- Gray #9CA3AF Arial 18pt closing line at y=309: "Class 12 · Chapter NN · Chapter name".
- Delete unused placeholders.

**Done when:** the slide is last, has only these three elements, and is rendered and checked.

## Hard rules
- Keep all original wording. Never type a board answer that the teacher writes by hand.
- The "Ques" title never carries a question number, on practice or PYQ slides.
- Every question slide gets a coral bar, except slides with subparts and two-question slides. The bar's left edge matches the "Ques" box, and its height matches the question block.
- Build notes: write each slide with one edit_slide_xml call. To align a bar, set the question box to fit its text, read its top and height, then set the bar to the same values. For bulk renames such as "Ques 2" to "Ques", run find_and_replace once for the whole deck.
- Leave handwriting space empty on every board page.
- Text inside the deck uses the fonts and sizes above. Body text is 24pt on formula pages, and condition sentences are 24pt too. Formula cards are not fixed at 648pt wide; they fit their content.
- Verify each slide visually after editing, and fix overlaps, crowded margins or wrong colours before reporting.
- The visual check reads pixels, but the layout is in points. Confirm every card's width, height, and position against the shape measurements in points (from the shape properties), not by estimating from the rendered image. Check these values this way: slide size 960×540pt, LHS-only formula cards about 83pt tall starting at y=104, case B cards at y=104 sized to their content, formula heading block (badge 53×53 at x=48, y=23, rule 75×5 at x=115, y=83), formula badges 59×59pt, practice subpart badges 59×59pt at x=49, y=91, the PYQ coral bar at x=36, y=68 (y=116 with a type label), the PYQ answer at y=475, the Thank you rule 75×7pt, contents cards 424×90pt, and the merged formula stack against the slide number. On PYQ pages, check that the coral bar spans the question block, from the top of the question text to the bottom of the last option, instead of a fixed card size.

## Audit checklist (for "check all slides")
1. Read every slide's shapes and text, and render each slide.
2. Report defects grouped by slide before changing anything.
3. Flag, do not invent: missing exam tags or years, and unclear page types.
4. Report contrast warnings that come from the deck palette, but do not change them.
5. Check positions from shape measurements in points, not by eye.
6. Flag as defects any PYQ page with a navy card, a font below 24pt for question text, side-by-side options, a topic label at the top right, or a yellow answer line.
7. Flag as defects any slide with typed maths instead of equation objects, emoji, a non-final Thank you slide, or a cream background on a non-cover slide.
8. Flag any PYQ or practice question text that is not Times New Roman 24pt, or that still starts with "Q.N".
9. Flag any slide that is not 960×540pt.
10. Flag any text whose font size does not match the Font sizes list.
11. Flag any PYQ page with a topic label at the top right.
12. Flag any contents topic name that does not fit its card, or that is outside 20–28pt, or any contents split onto two slides when the topics would fit on one.
13. Flag any "Ques" title (practice or PYQ) that is not Georgia bold 20pt in a coral 2pt outlined box, or that carries a question number.
14. Flag any exam tag not in Arial bold 16pt, or any answer line not Arial 16pt gray.
15. Flag any formula badge, condition sentence or card body text below 24pt.
16. Flag any type label that is not a 38pt blue pill with a yellow "TYPE N" chip, or that is missing when the source has one.
17. Flag any yellow footer tag or cream plate behind the logo.
18. Flag any practice question title with a number in it.
19. Flag any coral bar whose height does not match the question block, or whose left edge does not match the "Ques" box.
20. Flag any single-question practice slide that is missing its coral bar.
21. Flag any formula page (title plus navy cards) that has a plain title with no coral icon badge, no coral rule, or cards starting above y=104.
22. Flag any PYQ page whose option labels (A)–(D) are not blue, or whose level pill is not green (L1), yellow (L2) or red (L3).