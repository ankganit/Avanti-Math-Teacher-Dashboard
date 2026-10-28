---
name: "c12-pyq-pptx"
description: "Use when building the PPTX of a Class 12 JEE chapter's PYQs from the PYQ ChapterWise PDF tab or the Question Bank Export PPT button, in the black Avanti c12 style."
---

# c12 PYQ PPTX

Builds one PowerPoint per chapter from the PYQ ChapterWise PDF tab (teacher artifact), and the Question Bank tab's "Export PPT" button (selected questions). Uses the c12-ppt look (palette, fonts, card and answer rules) on a black background.

## ALWAYS APPLY (user rule: remember this always)
The question-slide rules below apply to EVERY PPTX the dashboard produces, including the Question Bank "Export PPT" button and the Must Solve PPTX export. Never let one export path drift from the other. Both go through buildCwPptx in office.js (the Question Bank button calls window.__qbCwPptx in teacher.js with flags noFront, noTopic, perQ).
- "Ques": Georgia bold 20pt white inside a rounded box with a coral #E8573E 2pt outline, no fill.
- Exam pill (JEE MAINS / JEE ADVANCED, date, shift): Arial bold 16pt, outline only, about 30pt tall, widened to fit.
- LEVEL (user rule): every question slide also shows the question's level as a second small outline pill right after the exam pill. The text is ONLY the level code: L1, L2 or L3. Never write the word "Level" (not "Level L1"). Arial bold 16pt, same height as the exam pill, 1.25pt outline, no fill, about 0.8in wide. This applies to every export path (Question Bank, PYQ ChapterWise PDF tab, Must Solve, any other Export to PPT). The level comes from the question's difficulty field (d in bank.json, difficulty in pyq.json).
- LEVEL COLOURS (user rule): the level pill outline and text are L1 green #4ADE80, L2 yellow #F4D35E, L3 red #EF4444 (white-background decks use darker shades of the same three hues). Same in every PPTX the artifact exports.
- OPTION LABELS (user rule): the labels (A), (B), (C), (D) are BLUE and bold; the option text itself stays white. Black slides use #3B9EFF; the white-background builder (buildPptx) uses #0070C0. Applies to every PPTX the artifact exports, in every layout (one option per line, row layout, matching-question options).
- Question text and options: Times New Roman 24pt (never below 20pt, reduce only if the block cannot fit between y=68 and y=460), maths as native OMML at the same size.
- Ans line: Arial 16pt gray, bottom-left.
- Integrals are real Office n-ary integrals (the integrand sits inside the sign).
- Question Bank export variant: NO contents slide, NO stats slide, NO topic name on question slides; the PYQ ChapterWise PDF tab keeps cover, contents and stats.
- After any change to office.js, check the question slide against these sizes and colours before publishing.

## Inputs
- chapter (number, class, name), bucket (JEE Main or JEE Advanced), year filter (all or one year)
- the chapter's PYQ questions (bank.json, s='P'), all syllabus topics in PYQT order (topics with no question are kept and shown as 0), session and date from qb/data/pyq.json
- the white Avanti logo (img/avanti-logo.png in the artifact), used on the cover only. Get it from the Avanti brand asset "logo_white" or from the user's file. If the file is missing the cover is built without it.

## Slide order
1. Cover: CLASS NN pill (coral outline), CHAPTER NN (teal), chapter name (Georgia bold, white), coral rule, YEAR (All years with range, or the one year), QUESTIONS (count and exam). Right navy panel with the big count. The Avanti logo sits at the top right, about 2.4in wide, 0.5in from the right edge. No "Avanti Fellows" text anywhere on the cover.
2. Contents: chapter name, CONTENTS with topic count. Every syllabus topic, in order, in navy cards: number (coral Georgia, 2pt larger than the name), topic name, question count on the right (0 when none). Lay the cards out as ONE tidy grid: every card has exactly the same width and height, rows line up across the columns, the same gap everywhere, and the topics run down the left column first and then the next column. Never stretch cards to different heights. Card height is the available height (about 5.7in from y=1.45in) divided by the number of rows, capped at 1.0in. Topic names are 20pt in two columns. Only when a name would not fit its card is a third column added and the type lowered (18pt, then 16pt, then 14pt). One very long name (over 70 characters) never lowers the type for the others: only that card's text shrinks to fit. Keep topic names exactly as in the data.
3. Stats: Questions per year. Coral bar chart from 2020 to the last year in the chapter (zeros included), data labels when 30 years or fewer, years rotated when more than 14. Ignores the year filter. If the chapter has no question from 2020 on, a message replaces the chart.
4+. One question per slide, followed by one blank black slide. The blank comes after every question, including the last one. Each question slide follows slide 6 of "Application of Derivatives JEE Main PYQs 2026":
   - Header row: "Ques" in Georgia bold 20pt white, inside a rounded box with a CORAL #E8573E 2pt outline and no fill, at x=36, y about 22. Beside it, an exam pill with outline only (no fill), about 30pt tall and widened to fit the text: green #4ADE80 for JEE MAINS, red #EF4444 for JEE ADVANCED, text in the same colour, Arial bold 16pt, centred. Format: "JEE MAINS · 24 Jan 2026 · Shift 2". Years without a date show the year only. Right after it, the small level pill showing only L1, L2 or L3 in its level colour (see ALWAYS APPLY).
   - Topic on the same row (PYQ ChapterWise PDF tab only), right-aligned to x=924: yellow #F4D35E, Arial bold 14pt, never overlapping the exam or level pill (at least 12pt gap).
   - No navy card and no question box. A coral #E8573E bar, about 6pt wide, at x=36, from the top of the question text to the bottom of the last option. The bar follows the text.
   - Question block starts at x=61, top about 68pt. Question text Times New Roman 24pt white, wording kept exactly. Maths is native OMML at 24pt; given maths lime #9BE15D.
   - Statement-wise questions: roman labels (I), (II), (III) and the function symbol in each statement are yellow #F4D35E. Other words white.
   - Options: numbered (A) to (D), one per line, Times New Roman 24pt, 6pt after each. The labels (A)–(D) are bold BLUE #3B9EFF; the option text is white. Never side by side.
   - Figure on the right when present: the block narrows; the coral bar still spans it.
   - Answer: bottom-left at x=36, about 475pt from the top. "Ans:" bold then the value (option letters in brackets for MCQ and MSQ). Arial 16pt, gray #9CA3AF. Nothing else at the bottom.
   - Fit rule: if the block cannot fit between y=68 and y=460 at 24pt, reduce only as far as needed, never below 20pt.
   - Do not simulate wrapping, use paragraph gaps, padding or minimum heights, or test options for side-by-side fit.
   - Colours: a pure-maths question is all yellow. Otherwise words white, the quantity to find yellow, given maths lime, statement labels yellow. Maths after find/evaluate/value of/determine, or followed by is/are/equal to, counts as the quantity to find. If no such phrase, the last maths piece is yellow.
Last: closing slide with a centred coral pill (CLASS NN · CHAPTER NN), a large coral "Thank you" in Georgia, a coral rule, the chapter name in white Georgia, the exam and question count in gray, and Avanti Fellows at the bottom.

## Rules
- Background black on every slide. Text colours: white, lime for given maths, yellow for the quantity to find, gray for labels and answers, coral and teal as accents, blue for the option labels (A)–(D).
- Fonts: Georgia for headings and numbers, Arial for body, Cambria Math for equations. Question text and options on question slides are Times New Roman 24pt for every run that is not maths.
- Question export rule (any format): whenever a question is exported as PPTX, PDF or DOCX, the question text and options use Times New Roman 24pt for every non-maths run. Maths stays as native equations (Cambria Math). Apply this to every export path.
- Equations are native Office equations (a14:m with OMML). Every math run must carry exactly ONE a:rPr, with sz set to the question font size in hundredths of a point (2400 for 24pt) and the colour as a solidFill that is the first child of that a:rPr. Never add a second a:rPr to a math run.
- Keep the question wording exactly; never type a worked answer.
- Check each question slide against slide 6 of "Application of Derivatives JEE Main PYQs 2026".
- Check sizes: "Ques" 20pt in the coral box, exam pill 16pt, level pill 16pt (L1/L2/L3 only, green/yellow/red), answer 16pt, question body and options 24pt, option labels blue.
- LibreOffice shows equations as plain linear text, so use its render for layout only; judge card heights from the estimate and from screenshots of the real PowerPoint file the user sends.
- Check by rendering (LibreOffice to PDF, then PNG): cover, contents, chart, a question with a long option, a figure question, the closing slide. Unzip one slide and check each math run has one a:rPr with sz="2400", and that the option labels carry the blue colour.

## Build
Done by buildCwPptx in office.js (black style) and buildPptx (white style, used by DPP and test exports). The PYQ ChapterWise tab calls exportCwPptx in teacher.js (cwPptxData supplies topics, years, questions, metadata, logo). The Question Bank button calls window.__qbCwPptx(ids) in teacher.js. Make changes in buildCwPptx, not in a separate deck file. Test in Node with bank.json and qb/data/pyq.json before publishing. Before publishing office.js always read the live copy and apply only your hunks to it, so another session's changes are not overwritten.