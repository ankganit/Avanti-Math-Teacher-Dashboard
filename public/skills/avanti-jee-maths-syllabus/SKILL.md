---
name: avanti-jee-maths-syllabus
description: The canonical Avanti CMS list of JEE Maths chapters and their subtopics (24 chapters, 290 subtopics, with CMS codes like JM-12M13.3). Use this skill whenever the user asks for Maths chapter names, subtopics, topic lists, or the chapter-subtopic structure, or asks to map, tag, classify, or label questions to chapters or subtopics for JEE Maths, even if they only say "subtopics", "topics under chapters", or "CMS list". This is the only allowed source for Maths chapter and subtopic names. Never answer from memory, the web, or the warehouse topic tags.
---

# Avanti JEE Maths: chapters and subtopics

The user pasted this list from the Avanti CMS. It is the single source of truth for chapter and subtopic names in Maths. The goal is that subtopics are identical everywhere, so nothing in it is ever invented, renamed, merged, or reordered.

## Where the data is

- `references/maths-chapters-subtopics.md` is the full list, readable, with a table per chapter.
- `references/maths-chapters-subtopics.csv` is the same data, one row per subtopic. Columns: `chapter_no, chapter_code, chapter_name, subtopic_no, subtopic_name, subtopic_code`. Use it when building spreadsheets or doing programmatic mapping.

Read the relevant file before answering. For one or two chapters, the markdown file is enough.

## Rules

1. **Use only this list.** Chapter names, subtopic names and codes come verbatim from the reference files. Do not use the JEE Main or Advanced syllabus, the web, memory, or the warehouse `topic` column (which holds values like "Introduction" and "Previous Year Questions 2022", not CMS subtopics).
2. **Do not create new subtopics.** If a question fits no subtopic, label it `Unmapped` and say why in one line. Never make up a subtopic to fit.
3. **Keep the codes.** Always give the CMS code (e.g. `JM-12M13.3`) alongside the name when mapping or listing, unless the user asks for names only.
4. **Names repeat across chapters.** "Introduction", "Distance Formula", "Section Formula", "Inverse Functions", "Chord of Contact", "Equation of Chord of Contact" and others appear in more than one chapter. A mapping must always carry chapter + subtopic (or the code, which is unique). Never map to a bare subtopic name.
5. **Map to the chapter first, then to a subtopic inside that chapter.** Do not pick a subtopic from a different chapter. If the question belongs to a different chapter, change the chapter.
6. **Fallback for generic content.** Use the chapter's "Introduction" subtopic only when the question is a basic definition or concept check that fits no specific subtopic. Do not use it as a dump for anything uncertain; use `Unmapped` for that.
7. **Keep CMS spelling.** Some CMS names have quirks (for example "Complete of a Set" in c2). Copy them as they appear. If you think one is a typo, mention it in a note but do not change it.
8. **Overlap between chapters.** Several topics appear in more than one chapter, such as inverse trigonometric functions in c13 and c14, trig equations in c3, and determinants in c15 and c17. Pick the chapter the question is set in (use the question's own chapter tag if it has one), not the one you find most natural.

## Output formats

- **"Give me chapter and subtopics" for a chapter:** chapter name and code as a heading, then a numbered list of subtopics with codes.
- **"Give me all chapters and subtopics":** same as above for all 24 chapters, in order c1 to c24. For this much data, produce a file (the CSV or an .xlsx) rather than pasting it all in chat, unless the user wants it inline.
- **Mapping questions:** return a table or sheet with the question id or text, chapter, subtopic, and subtopic code. Add a confidence note only for ambiguous ones. Items that fit nothing get `Unmapped`.

## When the list changes

If the user pastes an updated CMS list (new chapters, renamed or added subtopics), replace the reference files with the new data rather than merging by hand, and tell the user what changed. Chapters beyond c24 or non-Maths subjects are not covered by this skill. If asked for those, say they have not been added yet and ask the user to share them.
