---
name: "pyq-exam-dates"
description: "Use when adding or fixing JEE Main, AIEEE, IIT-JEE or JEE Advanced PYQs whose date, shift or paper is not printed, so they get the right paper label, exam date and id."
---

# Paper labels, exam dates and ids for PYQs

## Rules by period
- **Before 2003 (any exam):** the label is only `IIT-JEE <yyyy>` (exam 'IIT', paper 'IIT-JEE <yyyy>'). No date, no shift. Anything before 2002 labelled AIEEE becomes IIT.
- **2003 onward, JEE Main / AIEEE:** full date. If a shift is printed, write it (`'<d> <Mon> <yyyy> Shift <n>'`). If no shift is printed, write Offline or Online instead: `'<d> <Mon> <yyyy> (Offline)'` (or `(Online)`), example `4 Apr 2015 (Offline)`. Never leave the paper as the bare year. `sort_date` is `yyyy-mm-dd-0` (shift digit 0 when no shift); session is `<y-1>-<yy>`. AIEEE 2002 also gets its full date (19 May 2002 Offline) and has no shift.
- **2003 onward, IIT-JEE / JEE Advanced:** there is no shift. Use the Paper 1 / Paper 2 idea: `'<d> <Mon> <yyyy> Paper <1|2>'` when the paper is known, otherwise just the date. Never write a shift for Advanced.
- Papers that already have a real date and shift keep their own label.

## Dates (offline papers)
- JEE Main: 2013 7 Apr; 2014 6 Apr; 2015 4 Apr; 2016 3 Apr; 2017 2 Apr; 2018 8 Apr.
- AIEEE: 2002 19 May; 2003 11 May; 2004 23 May; 2005 8 May; 2006 30 Apr; 2007 29 Apr; 2008 27 Apr; 2009 26 Apr; 2010 25 Apr; 2011 1 May (planned 24 Apr, held 1 May; a re-exam also took place on 11 May); 2012 29 Apr (offline; the online paper ran 7 to 26 May).
- IIT-JEE / JEE Advanced dates supplied by the user (Screening / Main): 2002 21 Apr / 19 May; 2003 20 Apr / 25 May; 2004 11 Apr / 23 May; 2005 10 Apr / 22 May; 2006 9 Apr; 2007 8 Apr; 2008 13 Apr; 2009 12 Apr; 2010 11 Apr; 2011 10 Apr; 2012 8 Apr. JEE Advanced: 2013 2 Jun; 2014 25 May; 2015 24 May; 2016 22 May; 2017 21 May; 2018 20 May; 2019 27 May; 2020 27 Sep; 2021 3 Oct; 2022 28 Aug; 2023 4 Jun; 2024 26 May; 2025 18 May; 2026 17 May. Use these only when the paper's own date is not printed, and never override a printed date.
- Context: AIEEE started 2002; JEE Main replaced it in 2013 (NTA from 2019); IIT-JEE became JEE Advanced in 2013.

## Ids and records
- When a record gets a real date, rename its id to the dated form:
  - JEE Main offline: `JM{yyyymmdd}0P{n}` (shift digit 0, next free number for that date).
  - AIEEE: `AIEEE{yyyy}{MMdd}0{rest}` (example `AIEEE2012P71` becomes `AIEEE201204290P71`). Archive records (`PYQARC-...`) with a newly known date become `AIEEE{yyyy}{MMdd}0P{n}` with the next free n over all AIEEE ids, `qno` left empty unless the official number is known.
  - IIT before 2003: `IIT{yyyy}...` form (ids carry a two-letter chapter code: II, AR, DI, FA).
- Update the id in `qb/data/pyq.json`, `bank.json` (`i`, and `p` for the paper) and `must.json` (`r` and `m`), check the `flags` and `explanations` collections for the old id, and check ids stay unique.
- Clear any note that says 'Shift not given in the source sheet.' once the date is applied.
- When a question moves to another chapter, rename the chapter letters in its id too (II = Indefinite Integration, AR = area under the curve, DI = definite integration).
- The dashboard then shows one paper per year with the date, for example `19 May 2002 (Offline)`.