const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const p1_questions = [
  {
    qno: 41,
    type: 'MCQ',
    class: 11,
    chapter_code: '11M7',
    chapter: 'Permutations and Combinations',
    topic_code: 'JM-11M7.6',
    topic: 'Division and Distribution',
    difficulty: 'L2',
    question: 'The total number of ways in which 5 balls of different colours can be distributed among 3 persons so that each person gets at least one ball is',
    options: ['\\(75\\)', '\\(150\\)', '\\(210\\)', '\\(243\\)'],
    answer: 'B'
  },
  {
    qno: 42,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M17',
    chapter: 'Continuity and Differentiability',
    topic_code: 'JM-12M17.6',
    topic: 'Differentiability',
    difficulty: 'L2',
    question: 'Let \\(f(x) = \\begin{cases} x^2 \\left| \\cos \\frac{\\pi}{x} \\right|, & x \\neq 0 \\\\ 0, & x = 0 \\end{cases}, x \\in \\mathbb{R}\\), then \\(f\\) is',
    options: [
      'differentiable both at \\(x = 0\\) and at \\(x = 2\\)',
      'differentiable at \\(x = 0\\) but not differentiable at \\(x = 2\\)',
      'not differentiable at \\(x = 0\\) but differentiable at \\(x = 2\\)',
      'differentiable neither at \\(x = 0\\) nor at \\(x = 2\\)'
    ],
    answer: 'B'
  },
  {
    qno: 43,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M13',
    chapter: 'Functions',
    topic_code: 'JM-12M13.9',
    topic: 'Different Types of Mappings',
    difficulty: 'L2',
    question: 'The function \\(f : [0, 3] \\to [1, 29]\\), defined by \\(f(x) = 2x^3 - 15x^2 + 36x + 1\\), is',
    options: [
      'one-one and onto.',
      'onto but not one-one.',
      'one-one but not onto.',
      'neither one-one nor onto.'
    ],
    answer: 'B'
  },
  {
    qno: 44,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M16',
    chapter: 'Limits',
    topic_code: 'JM-12M16.4',
    topic: 'Evaluation of Algebraic Limits',
    difficulty: 'L2',
    question: 'If \\(\\lim\\limits_{x \\to \\infty} \\left( \\frac{x^2 + x + 1}{x + 1} - ax - b \\right) = 4\\), then',
    options: [
      '\\(a = 1, b = 4\\)',
      '\\(a = 1, b = -4\\)',
      '\\(a = 2, b = -3\\)',
      '\\(a = 2, b = 3\\)'
    ],
    answer: 'B'
  },
  {
    qno: 45,
    type: 'MCQ',
    class: 11,
    chapter_code: '11M5',
    chapter: 'Complex Numbers',
    topic_code: 'JM-11M5.8',
    topic: 'Solving Complex Equations',
    difficulty: 'L2',
    question: 'Let \\(z\\) be a complex number such that the imaginary part of \\(z\\) is nonzero and \\(a = z^2 + z + 1\\) is real. Then \\(a\\) cannot take the value',
    options: [
      '\\(1\\)',
      '\\(\\frac{1}{3}\\)',
      '\\(\\frac{1}{2}\\)',
      '\\(\\frac{3}{4}\\)'
    ],
    answer: 'D'
  },
  {
    qno: 46,
    type: 'MCQ',
    class: 11,
    chapter_code: '11M11',
    chapter: 'Conic Sections',
    topic_code: 'JM-11M11.9',
    topic: 'Standard Equation of Ellipse',
    difficulty: 'L2',
    question: 'The ellipse \\(E_1 : \\frac{x^2}{9} + \\frac{y^2}{4} = 1\\) is inscribed in a rectangle \\(R\\) whose sides are parallel to the coordinate axes. Another ellipse \\(E_2\\) passing through the point \\((0, 4)\\) circumscribes the rectangle \\(R\\). The eccentricity of the ellipse \\(E_2\\) is',
    options: [
      '\\(\\frac{\\sqrt{2}}{2}\\)',
      '\\(\\frac{\\sqrt{3}}{2}\\)',
      '\\(\\frac{1}{2}\\)',
      '\\(\\frac{3}{4}\\)'
    ],
    answer: 'C'
  },
  {
    qno: 47,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M15',
    chapter: 'Matrices and Determinants',
    topic_code: 'JM-12M15.11',
    topic: 'Properties of Determinants',
    difficulty: 'L2',
    question: 'Let \\(P = [a_{ij}]\\) be a \\(3 \\times 3\\) matrix and let \\(Q = [b_{ij}]\\), where \\(b_{ij} = 2^{i+j} a_{ij}\\) for \\(1 \\le i, j \\le 3\\). If the determinant of \\(P\\) is \\(2\\), then the determinant of the matrix \\(Q\\) is',
    options: [
      '\\(2^{10}\\)',
      '\\(2^{11}\\)',
      '\\(2^{12}\\)',
      '\\(2^{13}\\)'
    ],
    answer: 'D'
  },
  {
    qno: 48,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M19',
    chapter: 'Indefinite Integration',
    topic_code: 'JM-12M19.3',
    topic: 'Integration by Substitution',
    difficulty: 'L2',
    question: 'The integral \\(\\int \\frac{\\sec^2 x}{(\\sec x + \\tan x)^{9/2}} \\, dx\\) equals (for some arbitrary constant \\(K\\))',
    options: [
      '\\(-\\frac{1}{(\\sec x + \\tan x)^{11/2}} \\left\\{ \\frac{1}{11} - \\frac{1}{7} (\\sec x + \\tan x)^2 \\right\\} + K\\)',
      '\\(\\frac{1}{(\\sec x + \\tan x)^{11/2}} \\left\\{ \\frac{1}{11} - \\frac{1}{7} (\\sec x + \\tan x)^2 \\right\\} + K\\)',
      '\\(-\\frac{1}{(\\sec x + \\tan x)^{11/2}} \\left\\{ \\frac{1}{11} + \\frac{1}{7} (\\sec x + \\tan x)^2 \\right\\} + K\\)',
      '\\(\\frac{1}{(\\sec x + \\tan x)^{11/2}} \\left\\{ \\frac{1}{11} + \\frac{1}{7} (\\sec x + \\tan x)^2 \\right\\} + K\\)'
    ],
    answer: 'C'
  },
  {
    qno: 49,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M23',
    chapter: 'Three Dimensional Geometry',
    topic_code: 'JM-12M23.5',
    topic: 'Equation of Straight Line',
    difficulty: 'L2',
    question: 'The point \\(P\\) is the intersection of the straight line joining the points \\(Q(2, 3, 5)\\) and \\(R(1, -1, 4)\\) with the plane \\(5x - 4y - z = 1\\). If \\(S\\) is the foot of the perpendicular drawn from the point \\(T(2, 1, 4)\\) to \\(QR\\), then the length of the line segment \\(PS\\) is',
    options: [
      '\\(\\frac{1}{\\sqrt{2}}\\)',
      '\\(\\sqrt{2}\\)',
      '\\(2\\)',
      '\\(2\\sqrt{2}\\)'
    ],
    answer: 'A'
  },
  {
    qno: 50,
    type: 'MCQ',
    class: 11,
    chapter_code: '11M10',
    chapter: 'Circle',
    topic_code: 'JM-11M10.11',
    topic: 'Chord of Contact',
    difficulty: 'L2',
    question: 'The locus of the mid-point of the chord of contact of tangents drawn from points lying on the straight line \\(4x - 5y = 20\\) to the circle \\(x^2 + y^2 = 9\\) is',
    options: [
      '\\(20(x^2 + y^2) - 36x + 45y = 0\\)',
      '\\(20(x^2 + y^2) + 36x - 45y = 0\\)',
      '\\(36(x^2 + y^2) - 20x + 45y = 0\\)',
      '\\(36(x^2 + y^2) + 20x - 45y = 0\\)'
    ],
    answer: 'A'
  },
  {
    qno: 51,
    type: 'MSQ',
    class: 11,
    chapter_code: '11M3',
    chapter: 'Trigonometry',
    topic_code: 'JM-11M3.16',
    topic: 'Solution or Root of a Trigonometric Equation',
    difficulty: 'L3',
    question: 'Let \\(\\theta, \\varphi \\in [0, 2\\pi]\\) be such that \\(2\\cos\\theta (1 - \\sin\\varphi) = \\sin^2\\theta \\left( \\tan\\frac{\\theta}{2} + \\cot\\frac{\\theta}{2} \\right) \\cos\\varphi - 1\\), \\(\\tan(2\\pi - \\theta) > 0\\) and \\(-1 < \\sin\\theta < -\\frac{\\sqrt{3}}{2}\\). Then \\(\\varphi\\) cannot satisfy',
    options: [
      '\\(0 < \\varphi < \\frac{\\pi}{2}\\)',
      '\\(\\frac{\\pi}{2} < \\varphi < \\frac{4\\pi}{3}\\)',
      '\\(\\frac{4\\pi}{3} < \\varphi < \\frac{3\\pi}{2}\\)',
      '\\(\\frac{3\\pi}{2} < \\varphi < 2\\pi\\)'
    ],
    answer: 'A,C,D'
  },
  {
    qno: 52,
    type: 'MSQ',
    class: 12,
    chapter_code: '12M20',
    chapter: 'Definite Integration and Area Under the Curve',
    topic_code: 'JM-12M20.6',
    topic: 'Inequalities',
    difficulty: 'L3',
    question: 'Let \\(S\\) be the area of the region enclosed by \\(y = e^{-x^2}\\), \\(y = 0\\), \\(x = 0\\), and \\(x = 1\\). Then',
    options: [
      '\\(S \\ge \\frac{1}{e}\\)',
      '\\(S \\ge 1 - \\frac{1}{e}\\)',
      '\\(S \\le \\frac{1}{4}\\left(1 + \\frac{1}{\\sqrt{e}}\\right)\\)',
      '\\(S \\le \\frac{1}{\\sqrt{2}} + \\frac{1}{\\sqrt{e}}\\left(1 - \\frac{1}{\\sqrt{2}}\\right)\\)'
    ],
    answer: 'A,B,D'
  },
  {
    qno: 53,
    type: 'MSQ',
    class: 12,
    chapter_code: '12M24',
    chapter: 'Probability',
    topic_code: 'JM-12M24.8',
    topic: 'Conditional Probability',
    difficulty: 'L3',
    question: 'A ship is fitted with three engines \\(E_1, E_2\\) and \\(E_3\\). The engines function independently of each other with respective probabilities \\(\\frac{1}{2}\\), \\(\\frac{1}{4}\\) and \\(\\frac{1}{4}\\). For the ship to be operational at least two of its engines must function. Let \\(X\\) denote the event that the ship is operational and let \\(X_1, X_2\\) and \\(X_3\\) denote respectively the events that the engines \\(E_1, E_2\\) and \\(E_3\\) are functioning. Which of the following is (are) true ?',
    options: [
      '\\(P[X_1^c \\mid X] = \\frac{3}{16}\\)',
      '\\(P[\\text{Exactly two engines of the ship are functioning} \\mid X] = \\frac{7}{8}\\)',
      '\\(P[X \\mid X_2] = \\frac{5}{16}\\)',
      '\\(P[X \\mid X_1] = \\frac{7}{16}\\)'
    ],
    answer: 'B,D'
  },
  {
    qno: 54,
    type: 'MSQ',
    class: 11,
    chapter_code: '11M11',
    chapter: 'Conic Sections',
    topic_code: 'JM-11M11.14',
    topic: 'Intersection of a Line and a Hyperbola',
    difficulty: 'L3',
    question: 'Tangents are drawn to the hyperbola \\(\\frac{x^2}{9} - \\frac{y^2}{4} = 1\\), parallel to the straight line \\(2x - y = 1\\). The points of contact of the tangents on the hyperbola are',
    options: [
      '\\(\\left( \\frac{9}{2\\sqrt{2}}, \\frac{1}{\\sqrt{2}} \\right)\\)',
      '\\(\\left( -\\frac{9}{2\\sqrt{2}}, -\\frac{1}{\\sqrt{2}} \\right)\\)',
      '\\((3\\sqrt{3}, -2\\sqrt{2})\\)',
      '\\((-3\\sqrt{3}, 2\\sqrt{2})\\)'
    ],
    answer: 'A,B'
  },
  {
    qno: 55,
    type: 'MSQ',
    class: 12,
    chapter_code: '12M21',
    chapter: 'Differential Equations',
    topic_code: 'JM-12M21.4',
    topic: 'Solution of Linear Differential Equations',
    difficulty: 'L3',
    question: 'If \\(y(x)\\) satisfies the differential equation \\(y\' - y\\tan x = 2x\\sec x\\) and \\(y(0) = 0\\), then',
    options: [
      '\\(y\\left(\\frac{\\pi}{4}\\right) = \\frac{\\pi^2}{8\\sqrt{2}}\\)',
      '\\(y\'\\left(\\frac{\\pi}{4}\\right) = \\frac{\\pi^2}{18}\\)',
      '\\(y\\left(\\frac{\\pi}{3}\\right) = \\frac{\\pi^2}{9}\\)',
      '\\(y\'\\left(\\frac{\\pi}{3}\\right) = \\frac{4\\pi}{3} + \\frac{2\\pi^2}{3\\sqrt{3}}\\)'
    ],
    answer: 'A,D'
  },
  {
    qno: 56,
    type: 'Numerical',
    class: 12,
    chapter_code: '12M18',
    chapter: 'Application of Derivative',
    topic_code: 'JM-12M18.5',
    topic: 'Extremum',
    difficulty: 'L3',
    question: 'Let \\(f : \\mathbb{R} \\to \\mathbb{R}\\) be defined as \\(f(x) = |x| + |x^2 - 1|\\). The total number of points at which \\(f\\) attains either a local maximum or a local minimum is',
    options: [],
    answer: '5'
  },
  {
    qno: 57,
    type: 'Numerical',
    class: 11,
    chapter_code: '11M1',
    chapter: 'Fundamental of Mathematics',
    topic_code: 'JM-11M1.8',
    topic: 'Logarithmic Function',
    difficulty: 'L2',
    question: 'The value of \\(6 + \\log_{\\frac{3}{2}} \\left( \\frac{1}{3\\sqrt{2}} \\sqrt{4 - \\frac{1}{3\\sqrt{2}} \\sqrt{4 - \\frac{1}{3\\sqrt{2}} \\sqrt{4 - \\frac{1}{3\\sqrt{2}}\\cdots}}} \\right)\\) is',
    options: [],
    answer: '4'
  },
  {
    qno: 58,
    type: 'Numerical',
    class: 12,
    chapter_code: '12M18',
    chapter: 'Application of Derivative',
    topic_code: 'JM-12M18.6',
    topic: 'Tests for Local Maximum and Minimum',
    difficulty: 'L3',
    question: 'Let \\(p(x)\\) be a real polynomial of least degree which has a local maximum at \\(x = 1\\) and a local minimum at \\(x = 3\\). If \\(p(1) = 6\\) and \\(p(3) = 2\\), then \\(p\'(0)\\) is',
    options: [],
    answer: '9'
  },
  {
    qno: 59,
    type: 'Numerical',
    class: 12,
    chapter_code: '12M22',
    chapter: 'Vectors',
    topic_code: 'JM-12M22.13',
    topic: 'Dot (Scalar) Product',
    difficulty: 'L3',
    question: 'If \\(\\vec{a}, \\vec{b}\\) and \\(\\vec{c}\\) are unit vectors satisfying \\(|\\vec{a} - \\vec{b}|^2 + |\\vec{b} - \\vec{c}|^2 + |\\vec{c} - \\vec{a}|^2 = 9\\), then \\(|2\\vec{a} + 5\\vec{b} + 5\\vec{c}|\\) is',
    options: [],
    answer: '3'
  },
  {
    qno: 60,
    type: 'Numerical',
    class: 11,
    chapter_code: '11M11',
    chapter: 'Conic Sections',
    topic_code: 'JM-11M11.6',
    topic: 'Intersection of a Line and a Parabola',
    difficulty: 'L3',
    question: 'Let \\(S\\) be the focus of the parabola \\(y^2 = 8x\\) and let \\(PQ\\) be the common chord of the circle \\(x^2 + y^2 - 2x - 4y = 0\\) and the given parabola. The area of the triangle \\(PQS\\) is',
    options: [],
    answer: '4'
  }
];

const p2_questions = [
  {
    qno: 41,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M23',
    chapter: 'Three Dimensional Geometry',
    topic_code: 'JM-12M23.5',
    topic: 'Equation of Straight Line',
    difficulty: 'L2',
    question: 'The equation of a plane passing through the line of intersection of the planes \\(x + 2y + 3z = 2\\) and \\(x - y + z = 3\\) and at a distance \\(\\frac{2}{\\sqrt{3}}\\) from the point \\((3, 1, -1)\\) is',
    options: [
      '\\(5x - 11y + z = 17\\)',
      '\\(\\sqrt{2}x + y = 3\\sqrt{2} - 1\\)',
      '\\(x + y + z = \\sqrt{3}\\)',
      '\\(x - \\sqrt{2}y = 1 - \\sqrt{2}\\)'
    ],
    answer: 'A'
  },
  {
    qno: 42,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M27',
    chapter: 'Solution of Triangle',
    topic_code: 'JM-12M27.1',
    topic: 'Basic Relations of a Triangle (Sine, Cosine, Projection Rules)',
    difficulty: 'L2',
    question: 'Let \\(PQR\\) be a triangle of area \\(\\Delta\\) with \\(a = 2, b = \\frac{7}{2}\\) and \\(c = \\frac{5}{2}\\), where \\(a, b\\) and \\(c\\) are the lengths of the sides of the triangle opposite to the angles at \\(P, Q\\) and \\(R\\) respectively. Then \\(\\frac{2\\sin P - \\sin 2P}{2\\sin P + \\sin 2P}\\) equals',
    options: [
      '\\(\\frac{3}{4\\Delta}\\)',
      '\\(\\frac{45}{4\\Delta}\\)',
      '\\(\\left(\\frac{3}{4\\Delta}\\right)^2\\)',
      '\\(\\left(\\frac{45}{4\\Delta}\\right)^2\\)'
    ],
    answer: 'C'
  },
  {
    qno: 43,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M22',
    chapter: 'Vectors',
    topic_code: 'JM-12M22.15',
    topic: 'Vector (or Cross) Product of Two Vectors',
    difficulty: 'L2',
    question: 'If \\(\\vec{a}\\) and \\(\\vec{b}\\) are vectors such that \\(|\\vec{a} + \\vec{b}| = \\sqrt{29}\\) and \\(\\vec{a} \\times (2\\hat{i} + 3\\hat{j} + 4\\hat{k}) = (2\\hat{i} + 3\\hat{j} + 4\\hat{k}) \\times \\vec{b}\\), then a possible value of \\((\\vec{a} + \\vec{b}) \\cdot (-7\\hat{i} + 2\\hat{j} + 3\\hat{k})\\) is',
    options: [
      '\\(0\\)',
      '\\(3\\)',
      '\\(4\\)',
      '\\(8\\)'
    ],
    answer: 'C'
  },
  {
    qno: 44,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M15',
    chapter: 'Matrices and Determinants',
    topic_code: 'JM-12M15.4',
    topic: 'Algebra of Matrices',
    difficulty: 'L2',
    question: 'If \\(P\\) is a \\(3 \\times 3\\) matrix such that \\(P^T = 2P + I\\), where \\(P^T\\) is the transpose of \\(P\\) and \\(I\\) is the \\(3 \\times 3\\) identity matrix, then there exists a column matrix \\(X = \\begin{bmatrix} x \\\\ y \\\\ z \\end{bmatrix} \\ne \\begin{bmatrix} 0 \\\\ 0 \\\\ 0 \\end{bmatrix}\\) such that',
    options: [
      '\\(PX = \\begin{bmatrix} 0 \\\\ 0 \\\\ 0 \\end{bmatrix}\\)',
      '\\(PX = X\\)',
      '\\(PX = 2X\\)',
      '\\(PX = -X\\)'
    ],
    answer: 'D'
  },
  {
    qno: 45,
    type: 'MCQ',
    class: 11,
    chapter_code: '11M4',
    chapter: 'Quadratic Equations',
    topic_code: 'JM-11M4.6',
    topic: 'Quadratic Equation',
    difficulty: 'L2',
    question: 'Let \\(\\alpha(a)\\) and \\(\\beta(a)\\) be the roots of the equation \\((\\sqrt[3]{1+a}-1)x^2 + (\\sqrt{1+a}-1)x + (\\sqrt[6]{1+a}-1) = 0\\) where \\(a > -1\\). Then \\(\\lim\\limits_{a \\to 0^+} \\alpha(a)\\) and \\(\\lim\\limits_{a \\to 0^+} \\beta(a)\\) are',
    options: [
      '\\(-\\frac{5}{2}\\) and \\(1\\)',
      '\\(-\\frac{1}{2}\\) and \\(-1\\)',
      '\\(-\\frac{7}{2}\\) and \\(2\\)',
      '\\(-\\frac{9}{2}\\) and \\(3\\)'
    ],
    answer: 'B'
  },
  {
    qno: 46,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M24',
    chapter: 'Probability',
    topic_code: 'JM-12M24.6',
    topic: 'Mathematical or Classical Definition of Probability',
    difficulty: 'L2',
    question: 'Four fair dice \\(D_1, D_2, D_3\\) and \\(D_4\\), each having six faces numbered 1, 2, 3, 4, 5 and 6, are rolled simultaneously. The probability that \\(D_4\\) shows a number appearing on one of \\(D_1, D_2\\) and \\(D_3\\) is',
    options: [
      '\\(\\frac{91}{216}\\)',
      '\\(\\frac{108}{216}\\)',
      '\\(\\frac{125}{216}\\)',
      '\\(\\frac{127}{216}\\)'
    ],
    answer: 'A'
  },
  {
    qno: 47,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M20',
    chapter: 'Definite Integration and Area Under the Curve',
    topic_code: 'JM-12M20.3',
    topic: 'Definite Integration of Odd and Even Functions',
    difficulty: 'L2',
    question: 'The value of the integral \\(\\int_{-\\pi/2}^{\\pi/2} \\left( x^2 + \\ln\\frac{\\pi+x}{\\pi-x} \\right) \\cos x \\, dx\\) is',
    options: [
      '\\(0\\)',
      '\\(\\frac{\\pi^2}{2} - 4\\)',
      '\\(\\frac{\\pi^2}{2} + 4\\)',
      '\\(\\frac{\\pi^2}{2}\\)'
    ],
    answer: 'B'
  },
  {
    qno: 48,
    type: 'MCQ',
    class: 11,
    chapter_code: '11M6',
    chapter: 'Sequences and Series',
    topic_code: 'JM-11M6.5',
    topic: 'Harmonic Progression (H.P.)',
    difficulty: 'L2',
    question: 'Let \\(a_1, a_2, a_3, \\ldots\\) be in harmonic progression with \\(a_1 = 5\\) and \\(a_{20} = 25\\). The least positive integer \\(n\\) for which \\(a_n < 0\\) is',
    options: [
      '\\(22\\)',
      '\\(23\\)',
      '\\(24\\)',
      '\\(25\\)'
    ],
    answer: 'D'
  },
  {
    qno: 49,
    type: 'MCQ',
    class: 11,
    chapter_code: '11M7',
    chapter: 'Permutations and Combinations',
    topic_code: 'JM-11M7.2',
    topic: 'Fundamental Principle of Counting',
    difficulty: 'L3',
    question: '**Paragraph for Questions 49 and 50**\n\nLet \\(a_n\\) denote the number of all \\(n\\)-digit positive integers formed by the digits 0, 1 or both such that no consecutive digits in them are 0. Let \\(b_n\\) = the number of such \\(n\\)-digit integers ending with digit 1 and \\(c_n\\) = the number of such \\(n\\)-digit integers ending with digit 0.\n\nThe value of \\(b_6\\) is',
    options: [
      '\\(7\\)',
      '\\(8\\)',
      '\\(9\\)',
      '\\(11\\)'
    ],
    answer: 'B'
  },
  {
    qno: 50,
    type: 'MCQ',
    class: 11,
    chapter_code: '11M7',
    chapter: 'Permutations and Combinations',
    topic_code: 'JM-11M7.2',
    topic: 'Fundamental Principle of Counting',
    difficulty: 'L3',
    question: '**Paragraph for Questions 49 and 50**\n\nLet \\(a_n\\) denote the number of all \\(n\\)-digit positive integers formed by the digits 0, 1 or both such that no consecutive digits in them are 0. Let \\(b_n\\) = the number of such \\(n\\)-digit integers ending with digit 1 and \\(c_n\\) = the number of such \\(n\\)-digit integers ending with digit 0.\n\nWhich of the following is correct?',
    options: [
      '\\(a_{17} = a_{16} + a_{15}\\)',
      '\\(c_{17} \\neq c_{16} + c_{15}\\)',
      '\\(b_{17} \\neq b_{16} + c_{16}\\)',
      '\\(a_{17} = c_{17} + b_{16}\\)'
    ],
    answer: 'A'
  },
  {
    qno: 51,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M18',
    chapter: 'Application of Derivative',
    topic_code: 'JM-12M18.4',
    topic: 'Monotonicity',
    difficulty: 'L3',
    question: '**Paragraph for Questions 51 and 52**\n\nLet \\(f(x) = (1-x)^2 \\sin^2 x + x^2\\) for all \\(x \\in \\mathbb{R}\\), and let \\(g(x) = \\int_1^x \\left( \\frac{2(t-1)}{t+1} - \\ln t \\right) f(t) \\, dt\\) for all \\(x \\in (1, \\infty)\\).\n\nWhich of the following is true?',
    options: [
      '\\(g\\) is increasing on \\((1, \\infty)\\)',
      '\\(g\\) is decreasing on \\((1, \\infty)\\)',
      '\\(g\\) is increasing on \\((1, 2)\\) and decreasing on \\((2, \\infty)\\)',
      '\\(g\\) is decreasing on \\((1, 2)\\) and increasing on \\((2, \\infty)\\)'
    ],
    answer: 'B'
  },
  {
    qno: 52,
    type: 'MCQ',
    class: 12,
    chapter_code: '12M18',
    chapter: 'Application of Derivative',
    topic_code: 'JM-12M18.8',
    topic: 'Applications of Maxima and Minima',
    difficulty: 'L3',
    question: '**Paragraph for Questions 51 and 52**\n\nLet \\(f(x) = (1-x)^2 \\sin^2 x + x^2\\) for all \\(x \\in \\mathbb{R}\\), and let \\(g(x) = \\int_1^x \\left( \\frac{2(t-1)}{t+1} - \\ln t \\right) f(t) \\, dt\\) for all \\(x \\in (1, \\infty)\\).\n\nConsider the statements :\n\\(P\\) : There exists some \\(x \\in \\mathbb{R}\\) such that \\(f(x) + 2x = 2(1 + x^2)\\)\n\\(Q\\) : There exists some \\(x \\in \\mathbb{R}\\) such that \\(2f(x) + 1 = 2x(1 + x)\\)\nThen',
    options: [
      'both \\(P\\) and \\(Q\\) are true',
      '\\(P\\) is true and \\(Q\\) is false',
      '\\(P\\) is false and \\(Q\\) is true',
      'both \\(P\\) and \\(Q\\) are false'
    ],
    answer: 'C'
  },
  {
    qno: 53,
    type: 'MCQ',
    class: 11,
    chapter_code: '11M10',
    chapter: 'Circle',
    topic_code: 'JM-11M10.8',
    topic: 'Intersection of a Line and a Circle',
    difficulty: 'L2',
    question: '**Paragraph for Questions 53 and 54**\n\nA tangent \\(PT\\) is drawn to the circle \\(x^2 + y^2 = 4\\) at the point \\(P(\\sqrt{3}, 1)\\). A straight line \\(L\\), perpendicular to \\(PT\\) is a tangent to the circle \\((x-3)^2 + y^2 = 1\\).\n\nA possible equation of \\(L\\) is',
    options: [
      '\\(x - \\sqrt{3}y = 1\\)',
      '\\(x + \\sqrt{3}y = 1\\)',
      '\\(x - \\sqrt{3}y = -1\\)',
      '\\(x + \\sqrt{3}y = 5\\)'
    ],
    answer: 'A'
  },
  {
    qno: 54,
    type: 'MCQ',
    class: 11,
    chapter_code: '11M10',
    chapter: 'Circle',
    topic_code: 'JM-11M10.13',
    topic: 'Different Cases of Two Circles',
    difficulty: 'L3',
    question: '**Paragraph for Questions 53 and 54**\n\nA tangent \\(PT\\) is drawn to the circle \\(x^2 + y^2 = 4\\) at the point \\(P(\\sqrt{3}, 1)\\). A straight line \\(L\\), perpendicular to \\(PT\\) is a tangent to the circle \\((x-3)^2 + y^2 = 1\\).\n\nA common tangent of the two circles is',
    options: [
      '\\(x = 4\\)',
      '\\(y = 2\\)',
      '\\(x + \\sqrt{3}y = 4\\)',
      '\\(x + 2\\sqrt{2}y = 6\\)'
    ],
    answer: 'D'
  },
  {
    qno: 55,
    type: 'MSQ',
    class: 12,
    chapter_code: '12M17',
    chapter: 'Continuity and Differentiability',
    topic_code: 'JM-12M17.2',
    topic: 'Continuity',
    difficulty: 'L3',
    question: 'For every integer \\(n\\), let \\(a_n\\) and \\(b_n\\) be real numbers. Let function \\(f : \\mathbb{R} \\to \\mathbb{R}\\) be given by\n\\(f(x) = \\begin{cases} a_n + \\sin \\pi x, & \\text{for } x \\in [2n, 2n+1] \\\\ b_n + \\cos \\pi x, & \\text{for } x \\in (2n-1, 2n) \\end{cases}\\), for all integers \\(n\\).\nIf \\(f\\) is continuous, then which of the following hold(s) for all \\(n\\)?',
    options: [
      '\\(a_{n-1} - b_{n-1} = 0\\)',
      '\\(a_n - b_n = 1\\)',
      '\\(a_n - b_{n+1} = 1\\)',
      '\\(a_{n-1} - b_n = -1\\)'
    ],
    answer: 'B,D'
  },
  {
    qno: 56,
    type: 'MSQ',
    class: 12,
    chapter_code: '12M18',
    chapter: 'Application of Derivative',
    topic_code: 'JM-12M18.5',
    topic: 'Extremum',
    difficulty: 'L3',
    question: 'If \\(f(x) = \\int_0^x e^{t^2}(t-2)(t-3) \\, dt\\) for all \\(x \\in (0, \\infty)\\), then',
    options: [
      '\\(f\\) has a local maximum at \\(x = 2\\)',
      '\\(f\\) is decreasing on \\((2, 3)\\)',
      'there exists some \\(c \\in (0, \\infty)\\) such that \\(f\'\'(c) = 0\\)',
      '\\(f\\) has a local minimum at \\(x = 3\\)'
    ],
    answer: 'A,B,C,D'
  },
  {
    qno: 57,
    type: 'MSQ',
    class: 12,
    chapter_code: '12M23',
    chapter: 'Three Dimensional Geometry',
    topic_code: 'JM-12M23.5',
    topic: 'Equation of Straight Line',
    difficulty: 'L3',
    question: 'If the straight lines \\(\\frac{x-1}{2} = \\frac{y+1}{k} = \\frac{z}{2}\\) and \\(\\frac{x+1}{5} = \\frac{y+1}{2} = \\frac{z}{k}\\) are coplanar, then the plane(s) containing these two lines is(are)',
    options: [
      '\\(y + 2z = -1\\)',
      '\\(y + z = -1\\)',
      '\\(y - z = -1\\)',
      '\\(y - 2z = -1\\)'
    ],
    answer: 'B,C'
  },
  {
    qno: 58,
    type: 'MSQ',
    class: 12,
    chapter_code: '12M24',
    chapter: 'Probability',
    topic_code: 'JM-12M24.10',
    topic: 'Independent Events',
    difficulty: 'L3',
    question: 'Let \\(X\\) and \\(Y\\) be two events such that \\(P(X \\mid Y) = \\frac{1}{2}\\), \\(P(Y \\mid X) = \\frac{1}{3}\\) and \\(P(X \\cap Y) = \\frac{1}{6}\\). Which of the following is (are) correct?',
    options: [
      '\\(P(X \\cup Y) = \\frac{2}{3}\\)',
      '\\(X\\) and \\(Y\\) are independent',
      '\\(X\\) and \\(Y\\) are not independent',
      '\\(P(X^c \\cap Y) = \\frac{1}{3}\\)'
    ],
    answer: 'A,B'
  },
  {
    qno: 59,
    type: 'MSQ',
    class: 12,
    chapter_code: '12M15',
    chapter: 'Matrices and Determinants',
    topic_code: 'JM-12M15.7',
    topic: 'Adjoint and Inverse of a Square Matrix',
    difficulty: 'L3',
    question: 'If the adjoint of a \\(3 \\times 3\\) matrix \\(P\\) is \\(\\begin{bmatrix} 1 & 4 & 4 \\\\ 2 & 1 & 7 \\\\ 1 & 1 & 3 \\end{bmatrix}\\), then the possible value(s) of the determinant of \\(P\\) is (are)',
    options: [
      '\\(-2\\)',
      '\\(-1\\)',
      '\\(1\\)',
      '\\(2\\)'
    ],
    answer: 'A,D'
  },
  {
    qno: 60,
    type: 'MSQ',
    class: 12,
    chapter_code: '12M13',
    chapter: 'Functions',
    topic_code: 'JM-12M13.2',
    topic: 'Function',
    difficulty: 'L3',
    question: 'Let \\(f : (-1, 1) \\to \\mathbb{R}\\) be such that \\(f(\\cos 4\\theta) = \\frac{2}{2 - \\sec^2 \\theta}\\) for \\(\\theta \\in \\left(0, \\frac{\\pi}{4}\\right) \\cup \\left(\\frac{\\pi}{4}, \\frac{\\pi}{2}\\right)\\). Then the value(s) of \\(f\\left(\\frac{1}{3}\\right)\\) is (are)',
    options: [
      '\\(1 - \\sqrt{\\frac{3}{2}}\\)',
      '\\(1 + \\sqrt{\\frac{3}{2}}\\)',
      '\\(1 - \\sqrt{\\frac{2}{3}}\\)',
      '\\(1 + \\sqrt{\\frac{2}{3}}\\)'
    ],
    answer: 'A,B',
    attention: 'Official key marked Zero Marks to all / Bonus'
  }
];

function buildRecord(q, paperNum) {
  const paperLabel = `IIT-JEE 2012 Paper ${paperNum}`;
  const sortDate = `2012-04-08-${paperNum}`;
  const id = `IIT20120408${paperNum}Q${q.qno}`;
  const rec = {
    id,
    exam: 'IIT',
    year: 2012,
    session: '2011-12',
    paper: paperLabel,
    qno: q.qno,
    type: q.type,
    class: q.class,
    chapter_code: q.chapter_code,
    chapter: q.chapter,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    answer: q.answer,
    topic_code: q.topic_code,
    topic: q.topic,
    sort_date: sortDate,
    source: 'PYQ'
  };
  if (q.attention) rec.attention = q.attention;
  return rec;
}

const allNewRecords = [
  ...p1_questions.map(q => buildRecord(q, 1)),
  ...p2_questions.map(q => buildRecord(q, 2))
];

console.log('Total new records to ingest:', allNewRecords.length);

// Read current vfs-data.js
const vfsPath = path.resolve(__dirname, '../public/js/vfs-data.js');
const vfsCode = fs.readFileSync(vfsPath, 'utf8');
const match = vfsCode.match(/window\.__AVANTI_VFS_GZ\s*=\s*\"([^\"]+)\"/);
if (!match) {
  console.error('Could not find window.__AVANTI_VFS_GZ in public/js/vfs-data.js');
  process.exit(1);
}

const gzBuf = Buffer.from(match[1], 'base64');
const bundle = JSON.parse(zlib.gunzipSync(gzBuf).toString('utf8'));

function unpackTable(t) {
  if (!t || !t.keys || !t.cols) return [];
  const keys = t.keys, dicts = t.dicts || {}, cols = t.cols, n = t.n || 0;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const row = {};
    for (let j = 0; j < keys.length; j++) {
      const k = keys[j];
      const v = cols[k][i];
      if (dicts[k]) {
        if (v !== -1 && v != null) row[k] = dicts[k][v];
      } else if (v !== null && v !== undefined) {
        row[k] = v;
      }
    }
    out[i] = row;
  }
  return out;
}

function packTable(rows, sampleTable) {
  const keys = sampleTable.keys;
  const dictKeySet = new Set(Object.keys(sampleTable.dicts || {}));
  const dicts = {};
  const cols = {};

  dictKeySet.forEach(k => {
    const vals = [];
    const valMap = new Map();
    rows.forEach(r => {
      const v = r[k];
      if (v !== undefined && v !== null && !valMap.has(v)) {
        valMap.set(v, vals.length);
        vals.push(v);
      }
    });
    dicts[k] = vals;
  });

  keys.forEach(k => {
    cols[k] = new Array(rows.length);
    if (dictKeySet.has(k)) {
      const valMap = new Map();
      dicts[k].forEach((v, idx) => valMap.set(v, idx));
      for (let i = 0; i < rows.length; i++) {
        const v = rows[i][k];
        cols[k][i] = (v !== undefined && v !== null && valMap.has(v)) ? valMap.get(v) : -1;
      }
    } else {
      for (let i = 0; i < rows.length; i++) {
        const v = rows[i][k];
        cols[k][i] = (v !== undefined && v !== null) ? v : null;
      }
    }
  });

  return { keys, dicts, cols, n: rows.length };
}

const origPyqs = unpackTable(bundle.pyq);
console.log('Original pyqs count:', origPyqs.length);

const deletedPyqs = origPyqs.filter(q => q.year === 2012 && (q.exam === 'IIT' || q.exam === 'JEE Advanced'));
console.log('Deleted old IIT 2012 questions count:', deletedPyqs.length);

// Save backup of deleted records
fs.writeFileSync('scripts/deleted_iit_2012_backup.json', JSON.stringify(deletedPyqs, null, 2));
console.log('Saved deleted records backup to scripts/deleted_iit_2012_backup.json');

const retainedPyqs = origPyqs.filter(q => !(q.year === 2012 && (q.exam === 'IIT' || q.exam === 'JEE Advanced')));
console.log('Retained pyqs count:', retainedPyqs.length);

const finalPyqs = [...retainedPyqs, ...allNewRecords];
console.log('Final pyqs count:', finalPyqs.length);

// Validate unique IDs
const idSet = new Set();
finalPyqs.forEach(q => {
  if (idSet.has(q.id)) {
    console.error('Duplicate ID detected:', q.id);
    process.exit(1);
  }
  idSet.add(q.id);
});
console.log('All IDs verified unique across the entire bank.');

// Update bundle.pyq
bundle.pyq = packTable(finalPyqs, bundle.pyq);

// Sync syllabus counts in bundle.syllabus
if (bundle.syllabus && Array.isArray(bundle.syllabus.chapters)) {
  const normStr = t => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  bundle.syllabus.chapters.forEach(c => {
    const chQs = finalPyqs.filter(q => q.chapter_code === c.code);
    const mainQs = chQs.filter(q => q.exam === 'JEE Main' || q.exam === 'AIEEE' || q.exam === 'KCET');
    const advQs = chQs.filter(q => q.exam === 'JEE Advanced' || q.exam === 'IIT');
    c.m = mainQs.length;
    c.a = advQs.length;
    c.yr = c.yr || {};
    for (let y = 2020; y <= 2026; y++) {
      c.yr[y] = chQs.filter(q => (q.exam === 'JEE Main' || q.exam === 'AIEEE') && q.year === y).length;
    }
    if (Array.isArray(c.subs)) {
      c.subs.forEach(s => {
        const tcClean = String(s.code || '').replace(/^JM-/, '');
        const sNorm = normStr(s.name);
        const matched = chQs.filter(q => {
          const qtc = String(q.topic_code || '').replace(/^JM-/, '');
          const qtp = normStr(q.topic);
          return (qtc && qtc === tcClean) || (qtp && qtp === sNorm);
        });
        s.m = matched.filter(q => q.exam === 'JEE Main' || q.exam === 'AIEEE' || q.exam === 'KCET').length;
        s.a = matched.filter(q => q.exam === 'JEE Advanced' || q.exam === 'IIT').length;
        s.mt = s.m >= 15 ? 'High' : s.m >= 5 ? 'Medium' : s.m > 0 ? 'Low' : 'None';
        s.at = s.a >= 10 ? 'High' : s.a >= 3 ? 'Medium' : s.a > 0 ? 'Low' : 'None';
      });
    }
  });

  bundle.syllabus.cnt = {};
  ['m', 'a'].forEach(t => {
    ['High', 'Medium', 'Low', 'None'].forEach(tier => {
      let count = 0;
      bundle.syllabus.chapters.forEach(c => {
        (c.subs || []).forEach(s => {
          if ((t === 'm' ? s.mt : s.at) === tier) count++;
        });
      });
      bundle.syllabus.cnt[t + '|' + tier] = count;
    });
  });
  console.log('Syllabus priority counts synchronized successfully.');
}

// Re-compress into gzip and base64
const newJsonBuf = Buffer.from(JSON.stringify(bundle), 'utf8');
const newGzBuf = zlib.gzipSync(newJsonBuf, { level: 9 });
const newB64 = newGzBuf.toString('base64');
console.log('New GZ base64 length:', newB64.length);

const newVfsCode = `window.__AVANTI_VFS_GZ = "${newB64}";\n`;

// Write to public/js/vfs-data.js and dist/js/vfs-data.js
fs.writeFileSync(vfsPath, newVfsCode, 'utf8');
console.log('Updated public/js/vfs-data.js');

const distVfsPath = path.resolve(__dirname, '../dist/js/vfs-data.js');
if (fs.existsSync(distVfsPath)) {
  fs.writeFileSync(distVfsPath, newVfsCode, 'utf8');
  console.log('Updated dist/js/vfs-data.js');
}

console.log('Ingestion finished cleanly and successfully.');
