#!/usr/bin/env node
/* Seed the Calculus I (MAT 1475) class: writes 14 lesson JSONs (content only —
 * diagrams are added by tools/build-math-diagrams.js), and registers the class in
 * data/index.json + data/classes.json. Content mirrors PHYS 1442's structure:
 * summary, glossary, 5 concept_sections (heading/explanation/math_steps), 3
 * real_world_examples, videos, and syllabus-mapped problems. Source: CityTech
 * MAT 1475 outline + OpenStax Calculus Volume 1. Run: node tools/seed-calc1.js
 */
"use strict";
const fs = require("fs"), path = require("path");
const LDIR = path.resolve(__dirname, "..", "data", "lessons");
const g = (plain, in_class) => ({ plain, in_class });
const cn = (level, heading, explanation, math_steps) => ({ level, heading, explanation, math_steps });
const ex = (title, scenario, how_the_math_applies) => ({ title, scenario, how_the_math_applies });
const pr = (id, difficulty, prompt, correct_answer, solution_steps, hint) => ({ id, difficulty, prompt, correct_answer, solution_steps, hint });
const vids = (a, b, c) => ({ concept_query: a, math_query: b, combined_query: c });

const LESSONS = [
{ id: "calc1-01-limits", title: "Limits & Limit Laws", chapter: "Vol. 1, Ch. 2.2–2.3", problems: [30,33,35,38,83,89,95,101],
  summary: "A limit describes the value a function approaches as $x$ nears a point, even where the function is undefined. Limits can be read from tables and graphs, and computed with the limit laws — sums, products, quotients, and direct substitution for continuous pieces.",
  glossary: {
    "limit": g("The value a function heads toward as the input approaches some number.", "Written $\\lim_{x\\to a}f(x)=L$; the cornerstone of calculus."),
    "one-sided limit": g("The value approached from just the left or just the right of a point.", "$\\lim_{x\\to a^-}$ (left) and $\\lim_{x\\to a^+}$ (right); the two-sided limit exists only if they agree."),
    "limit laws": g("Rules that let you split a limit across sums, products, and quotients.", "e.g. $\\lim(f+g)=\\lim f+\\lim g$; they reduce hard limits to simple pieces."),
    "direct substitution": g("Plugging the number straight into the function to get the limit.", "Works whenever the function is continuous there: $\\lim_{x\\to a}f(x)=f(a)$."),
    "indeterminate form": g("An expression like $0/0$ that doesn't settle the limit on its own.", "Signals you must simplify (factor, rationalize) before the limit appears."),
    "does not exist": g("When a function approaches no single value (e.g. left ≠ right).", "Abbreviated DNE; common at jumps and vertical asymptotes."),
    "squeeze theorem": g("If a function is trapped between two others with equal limits, it shares that limit.", "Used for limits like $\\lim_{x\\to0}x^2\\sin(1/x)=0$."),
    "continuous": g("A function with no breaks — you can draw it without lifting your pen.", "For continuous functions the limit equals the function value.")
  },
  concepts: [
    cn(1, "What a limit is", "A limit asks: as $x$ gets arbitrarily close to $a$, what value does $f(x)$ approach? It does not care what happens right at $a$ — only nearby. You can estimate a limit numerically from a table of $x$-values closing in on $a$, or read it off a graph.", ["Pick $x$-values approaching $a$ from both sides.", "Track the outputs $f(x)$ — do they settle on one number $L$?", "If so, $\\lim_{x\\to a}f(x)=L$, regardless of $f(a)$."]),
    cn(2, "One-sided limits", "Approaching from the left ($x\\to a^-$) and the right ($x\\to a^+$) can give different answers. The two-sided limit exists only when both one-sided limits exist and are equal. At a jump, they disagree and the limit does not exist.", ["Find $\\lim_{x\\to a^-}f(x)$ (from below).", "Find $\\lim_{x\\to a^+}f(x)$ (from above).", "If they match, that common value is $\\lim_{x\\to a}f(x)$; if not, the limit DNE."]),
    cn(3, "The limit laws", "When the pieces have limits, the limit of a sum, difference, product, or quotient is the sum, difference, product, or quotient of the limits (quotient only if the denominator's limit is nonzero). Constants pull out and powers/roots pass through.", ["Break the function into simple parts.", "Apply the matching law: $\\lim(f\\pm g)=\\lim f\\pm\\lim g$, $\\lim(fg)=\\lim f\\cdot\\lim g$.", "For a quotient, use $\\lim(f/g)=\\lim f/\\lim g$ when $\\lim g\\neq0$."]),
    cn(4, "Direct substitution", "For polynomials, and any function continuous at $a$, the limit is just $f(a)$ — plug in. Substitution is always the first thing to try; if it gives a real number, you're done.", ["Substitute $x=a$ into $f$.", "If you get a finite number, that's the limit.", "If you get $0/0$, the form is indeterminate — simplify first."]),
    cn(5, "Indeterminate forms $0/0$", "When substitution yields $0/0$, the limit still may exist — you just have to reveal it. Factor and cancel the common term, or rationalize a radical, then substitute again.", ["Substitute; if you get $0/0$, do not stop.", "Factor numerator and denominator and cancel the shared factor (or multiply by a conjugate).", "Substitute into the simplified expression to read off the limit."])
  ],
  examples: [
    ex("A car's instantaneous speed", "The speedometer shows speed at an instant, not over an interval.", "Average speed over a shrinking time interval approaches a limit — the instantaneous speed. That limiting process is exactly $\\lim_{\\Delta t\\to0}\\Delta x/\\Delta t$."),
    ex("Zooming a digital image", "Zoom in on a smooth curve and it looks straight.", "As the viewing window shrinks toward a point, the curve approaches its tangent line — a geometric limit underlying the derivative."),
    ex("Dosage approaching a steady level", "Repeated medication doses build toward a stable concentration.", "The blood concentration approaches a limiting value as the number of doses grows — a real-world limit of a sequence of values.")
  ],
  videos: vids("what is a limit calculus intuition one sided limits", "limit laws examples direct substitution factoring 0/0", "calculus 1 limits worked examples limit laws"),
  problems: [
    pr("p01","easy","Evaluate $\\lim_{x\\to3}(2x+1)$.","$7$",["The function is a polynomial, so substitute directly.","$2(3)+1$","$=7$."],"Polynomials are continuous — just plug in."),
    pr("p02","easy","Evaluate $\\lim_{x\\to2}(x^2-4x+5)$.","$1$",["Substitute $x=2$.","$4-8+5$","$=1$."],"Direct substitution works for polynomials."),
    pr("p03","easy","Evaluate $\\lim_{x\\to0}\\dfrac{\\sin x}{x}$.","$1$",["This is a standard special limit.","As $x\\to0$, $\\dfrac{\\sin x}{x}\\to1$.","$=1$."],"Memorize this fundamental trig limit."),
    pr("p04","medium","Evaluate $\\lim_{x\\to2}\\dfrac{x^2-4}{x-2}$.","$4$",["Substitution gives $0/0$ — factor.","$\\dfrac{(x-2)(x+2)}{x-2}=x+2$.","Substitute: $2+2=4$."],"Factor the difference of squares and cancel."),
    pr("p05","medium","Evaluate $\\lim_{x\\to0}\\dfrac{\\sqrt{x+9}-3}{x}$.","$\\tfrac16$",["$0/0$: multiply by the conjugate $\\sqrt{x+9}+3$.","$\\dfrac{(x+9)-9}{x(\\sqrt{x+9}+3)}=\\dfrac{1}{\\sqrt{x+9}+3}$.","Substitute: $\\dfrac{1}{3+3}=\\tfrac16$."],"Rationalize the numerator."),
    pr("p06","medium","If $\\lim_{x\\to1}f(x)=4$ and $\\lim_{x\\to1}g(x)=2$, find $\\lim_{x\\to1}\\dfrac{f(x)}{g(x)}$.","$2$",["Denominator limit is nonzero, so use the quotient law.","$\\dfrac{\\lim f}{\\lim g}=\\dfrac{4}{2}$.","$=2$."],"Quotient law needs the bottom limit $\\neq0$."),
    pr("p07","medium","Evaluate $\\lim_{x\\to3}\\dfrac{x^2-9}{x^2-x-6}$.","$\\tfrac65$",["$0/0$: factor both.","$\\dfrac{(x-3)(x+3)}{(x-3)(x+2)}=\\dfrac{x+3}{x+2}$.","Substitute: $\\dfrac{6}{5}$."],"Factor top and bottom, cancel $(x-3)$."),
    pr("p08","hard","For $f(x)=\\begin{cases}x+1,&x<2\\\\ 3x-3,&x\\ge2\\end{cases}$, find $\\lim_{x\\to2}f(x)$.","$3$",["Left limit: $x+1\\to3$.","Right limit: $3x-3\\to3$.","Both sides give $3$, so the limit is $3$."],"Check both one-sided limits at the split."),
    pr("p09","stretch","Evaluate $\\lim_{x\\to0}x^2\\cos\\dfrac1x$.","$0$",["$-1\\le\\cos(1/x)\\le1$, so $-x^2\\le x^2\\cos(1/x)\\le x^2$.","Both bounds $\\to0$ as $x\\to0$.","By the squeeze theorem the limit is $0$."],"Trap it between $\\pm x^2$ and squeeze.")
  ] },

{ id: "calc1-02-continuity", title: "Continuity", chapter: "Vol. 1, Ch. 2.4", problems: [131,133,139,143,145,147],
  summary: "A function is continuous at $a$ when $\\lim_{x\\to a}f(x)=f(a)$ — no holes, jumps, or blowups. Continuity on an interval lets you substitute to find limits and guarantees the Intermediate Value Theorem, which locates roots.",
  glossary: {
    "continuity at a point": g("No break at $a$: the graph connects through $(a,f(a))$.", "Requires $f(a)$ defined, $\\lim_{x\\to a}f(x)$ exists, and the two are equal."),
    "removable discontinuity": g("A single missing point — a hole you could 'plug'.", "The limit exists but $f(a)$ is missing or wrong; redefining $f(a)$ fixes it."),
    "jump discontinuity": g("The graph leaps from one value to another.", "Left and right limits exist but disagree; common in piecewise functions."),
    "infinite discontinuity": g("The function shoots to $\\pm\\infty$ at the point.", "Occurs at vertical asymptotes, e.g. $1/x$ at $x=0$."),
    "continuous on an interval": g("No breaks anywhere across a stretch of $x$-values.", "Polynomials are continuous everywhere; rationals except where the denominator is zero."),
    "Intermediate Value Theorem": g("A continuous function hits every value between its endpoints.", "If $f$ is continuous on $[a,b]$ and $N$ lies between $f(a)$ and $f(b)$, some $c$ gives $f(c)=N$ — proves roots exist."),
    "one-sided continuity": g("Continuous approaching from just one side.", "Needed at the endpoints of a closed interval."),
    "piecewise function": g("A function defined by different rules on different intervals.", "Check continuity where the rules meet.")
  },
  concepts: [
    cn(1, "The three-part test", "$f$ is continuous at $a$ exactly when three things hold: $f(a)$ is defined, $\\lim_{x\\to a}f(x)$ exists, and they are equal. If any part fails, there is a discontinuity there.", ["Check $f(a)$ is defined.", "Check $\\lim_{x\\to a}f(x)$ exists (left = right).", "Check the two are equal; all three ⇒ continuous."]),
    cn(2, "Types of discontinuity", "Discontinuities come in three flavors: removable (a hole where the limit exists but the value is missing/wrong), jump (left and right limits differ), and infinite (the function blows up to $\\pm\\infty$).", ["Removable: limit exists, value doesn't match — a plug-able hole.", "Jump: one-sided limits disagree.", "Infinite: a vertical asymptote."]),
    cn(3, "Continuity on intervals", "Polynomials are continuous for all $x$. Rational, root, trig, exponential, and log functions are continuous everywhere they are defined. Sums, products, quotients, and compositions of continuous functions stay continuous.", ["Identify the function's family.", "Exclude points where it's undefined (division by zero, negative under an even root).", "Everywhere else it is continuous."]),
    cn(4, "Making a piecewise function continuous", "At a boundary between pieces, continuity requires the two pieces to meet: the left value equals the right value. Choose the unknown constant so the one-sided limits agree with the function value.", ["Compute the left-hand limit at the boundary.", "Compute the right-hand limit.", "Set them equal (and equal to $f$ there) and solve for the constant."]),
    cn(5, "The Intermediate Value Theorem", "If $f$ is continuous on $[a,b]$ and a target value $N$ lies between $f(a)$ and $f(b)$, then $f(c)=N$ for some $c$ in between. In particular, a sign change guarantees a root.", ["Confirm $f$ is continuous on $[a,b]$.", "Show $f(a)$ and $f(b)$ straddle $N$ (opposite sides).", "Conclude some $c$ in $(a,b)$ satisfies $f(c)=N$."])
  ],
  examples: [
    ex("A thermostat's temperature record", "Room temperature changes smoothly over the day.", "Temperature is a continuous function of time, so between a morning low and afternoon high it must pass through every value in between — the Intermediate Value Theorem."),
    ex("A jump in a parking fee", "A garage charges a flat rate that jumps at each hour.", "The cost is a step (piecewise) function with jump discontinuities exactly at each hour mark."),
    ex("Finding a root by bisection", "A calculator hunts for where an equation equals zero.", "Because the function is continuous and changes sign, the IVT guarantees a root, and bisection zeroes in on it.")
  ],
  videos: vids("continuity at a point three conditions types of discontinuity", "continuity piecewise function solve for constant IVT", "calculus continuity intermediate value theorem examples"),
  problems: [
    pr("p01","easy","Is $f(x)=x^2-3x$ continuous at $x=4$?","Yes",["Polynomials are continuous everywhere.","$f(4)=16-12=4$ and $\\lim_{x\\to4}f=4$.","They match — continuous."],"Polynomials never break."),
    pr("p02","easy","Where is $f(x)=\\dfrac{1}{x-5}$ discontinuous?","$x=5$",["A rational function breaks where the denominator is zero.","$x-5=0\\Rightarrow x=5$.","Infinite discontinuity there."],"Set the denominator to zero."),
    pr("p03","easy","What kind of discontinuity does $f(x)=\\dfrac{x^2-1}{x-1}$ have at $x=1$?","Removable",["Factor: $\\dfrac{(x-1)(x+1)}{x-1}=x+1$.","The limit is $2$ but $f(1)$ is undefined.","A hole — removable."],"Limit exists but the point is missing."),
    pr("p04","medium","Find $k$ so that $f(x)=\\begin{cases}x+3,&x\\le1\\\\ kx,&x>1\\end{cases}$ is continuous.","$k=4$",["Left value at $1$: $1+3=4$.","Right limit: $k(1)=k$.","Set $k=4$."],"Make the pieces meet at $x=1$."),
    pr("p05","medium","Is $f(x)=\\dfrac{x^2-4}{x-2}$ continuous at $x=2$?","No (removable)",["Substitution gives $0/0$; $f(2)$ is undefined.","The limit is $4$ but the value doesn't exist.","Discontinuous — a removable hole."],"Undefined value ⇒ not continuous, even if the limit exists."),
    pr("p06","medium","On what interval is $f(x)=\\sqrt{x-2}$ continuous?","$[2,\\infty)$",["Need $x-2\\ge0$.","$x\\ge2$.","Continuous on $[2,\\infty)$ (one-sided at $2$)."],"Even roots need a nonnegative inside."),
    pr("p07","hard","Show $f(x)=x^3+x-1$ has a root in $[0,1]$.","Root exists",["$f$ is continuous (polynomial).","$f(0)=-1<0$ and $f(1)=1>0$.","By the IVT a root lies in $(0,1)$."],"Look for a sign change and cite the IVT."),
    pr("p08","hard","Find $a,b$ so $f(x)=\\begin{cases}x^2,&x\\le1\\\\ ax+b,&x>1\\end{cases}$ is continuous with $f(2)=5$.","$a=2,\\ b=1$",["Continuity at $1$: $1=a+b$.","$f(2)=5$: $2a+b=5$.","Solve: $a=2,\\ b=-1$... check: $a+b=1$ ✓, so $b=-1$."],"Two conditions, two unknowns."),
    pr("p09","stretch","The function $f(x)=\\lfloor x\\rfloor$ (floor) is discontinuous at which $x$?","every integer",["Floor jumps by 1 at each whole number.","Left and right limits differ there.","Jump discontinuity at every integer."],"Think about where the step function leaps.")
  ] },

{ id: "calc1-03-derivative-definition", title: "Defining the Derivative", chapter: "Vol. 1, Ch. 3.1–3.2", problems: [1,3,11,15,17,54,57,59],
  summary: "The derivative $f'(a)$ is the slope of the tangent line — the limit of secant slopes as the second point closes in: $f'(a)=\\lim_{h\\to0}\\dfrac{f(a+h)-f(a)}{h}$. As a function, $f'(x)$ gives the instantaneous rate of change everywhere.",
  glossary: {
    "derivative": g("The instantaneous rate of change of a function — the slope of its tangent line.", "$f'(a)=\\lim_{h\\to0}\\dfrac{f(a+h)-f(a)}{h}$."),
    "secant line": g("A line through two points on a curve; its slope is an average rate.", "As the points merge, its slope approaches the tangent slope."),
    "tangent line": g("The line touching a curve at one point with the same slope.", "Its slope is $f'(a)$; equation $y-f(a)=f'(a)(x-a)$."),
    "difference quotient": g("The average-rate expression $\\dfrac{f(a+h)-f(a)}{h}$.", "Its limit as $h\\to0$ is the derivative."),
    "differentiable": g("Having a derivative — smooth, with a well-defined tangent.", "Differentiable ⇒ continuous, but not vice versa (corners fail)."),
    "instantaneous rate": g("How fast something changes at a single instant.", "The derivative; e.g. velocity is the derivative of position."),
    "notation": g("Ways to write the derivative.", "$f'(x)$, $\\dfrac{dy}{dx}$, $\\dfrac{d}{dx}f$ all mean the same thing."),
    "non-differentiable": g("Points with no single tangent slope.", "Corners, cusps, vertical tangents, and discontinuities.")
  },
  concepts: [
    cn(1, "Slope of a secant", "The average rate of change of $f$ between $a$ and $a+h$ is the secant slope $\\dfrac{f(a+h)-f(a)}{h}$. It measures how much $f$ changed per unit of $x$ over that interval.", ["Take two points $(a,f(a))$ and $(a+h,f(a+h))$.", "Rise over run: $\\dfrac{f(a+h)-f(a)}{h}$.", "This is the average rate of change on $[a,a+h]$."]),
    cn(2, "The limit definition", "Shrink $h$ toward $0$: the secant pivots into the tangent, and its slope becomes the derivative $f'(a)=\\lim_{h\\to0}\\dfrac{f(a+h)-f(a)}{h}$. This limit is the instantaneous rate of change at $a$.", ["Form the difference quotient.", "Simplify until $h$ cancels from the denominator.", "Let $h\\to0$ to get $f'(a)$."]),
    cn(3, "The tangent line", "Once you have $f'(a)$, the tangent at $x=a$ is $y-f(a)=f'(a)(x-a)$. It is the best straight-line approximation of the curve near that point.", ["Compute the point $(a,f(a))$.", "Compute the slope $m=f'(a)$.", "Write $y-f(a)=m(x-a)$."]),
    cn(4, "The derivative as a function", "Leaving $a$ general as $x$ turns the derivative into a new function $f'(x)$ that reports the slope at every point. You can then evaluate it anywhere.", ["Apply the limit definition with $x$ in place of $a$.", "Simplify to a formula in $x$.", "Plug in any value to get that point's slope."]),
    cn(5, "Differentiability vs continuity", "If $f$ is differentiable at $a$ it must be continuous there — but continuity is not enough. Corners (like $|x|$ at $0$), cusps, and vertical tangents are continuous yet not differentiable.", ["Differentiable ⇒ continuous.", "Continuous ⇏ differentiable.", "Watch for corners, cusps, and vertical tangents."])
  ],
  examples: [
    ex("Speedometer from odometer", "A car's position is recorded over time.", "The derivative of position with respect to time is velocity — the speedometer reading at each instant."),
    ex("Marginal cost", "A factory tracks total cost versus units produced.", "The derivative of cost is the marginal cost — the extra cost of one more unit."),
    ex("A ball's peak height", "A tossed ball rises, stops, and falls.", "At the top its velocity (the derivative of height) is momentarily zero — where the tangent is horizontal.")
  ],
  videos: vids("derivative definition slope of tangent secant limit", "derivative limit definition examples tangent line equation", "calculus derivative from definition worked problems"),
  problems: [
    pr("p01","easy","Find $f'(x)$ for $f(x)=3x+2$ from the definition.","$3$",["$\\dfrac{3(x+h)+2-(3x+2)}{h}=\\dfrac{3h}{h}=3$.","Limit as $h\\to0$ is $3$.","$f'(x)=3$."],"A line's derivative is its slope."),
    pr("p02","easy","Find the slope of the tangent to $f(x)=x^2$ at $x=2$.","$4$",["$f'(x)=2x$ (from the definition).","At $x=2$: $2(2)=4$.","Slope $=4$."],"Use $f'(x)=2x$."),
    pr("p03","medium","Use the definition to find $f'(x)$ for $f(x)=x^2$.","$2x$",["$\\dfrac{(x+h)^2-x^2}{h}=\\dfrac{2xh+h^2}{h}=2x+h$.","Let $h\\to0$.","$f'(x)=2x$."],"Expand $(x+h)^2$ and cancel $h$."),
    pr("p04","medium","Find the tangent line to $f(x)=x^2$ at $x=3$.","$y=6x-9$",["Point: $(3,9)$. Slope: $f'(3)=6$.","$y-9=6(x-3)$.","$y=6x-9$."],"Point-slope with $m=f'(3)$."),
    pr("p05","medium","Use the definition to find $f'(x)$ for $f(x)=1/x$.","$-1/x^2$",["$\\dfrac{1/(x+h)-1/x}{h}=\\dfrac{-h}{h\\,x(x+h)}=\\dfrac{-1}{x(x+h)}$.","Let $h\\to0$.","$f'(x)=-1/x^2$."],"Combine the fractions over a common denominator."),
    pr("p06","hard","Find $f'(x)$ for $f(x)=\\sqrt{x}$ from the definition.","$\\dfrac{1}{2\\sqrt{x}}$",["Rationalize: $\\dfrac{\\sqrt{x+h}-\\sqrt{x}}{h}\\cdot\\dfrac{\\sqrt{x+h}+\\sqrt{x}}{\\sqrt{x+h}+\\sqrt{x}}=\\dfrac{1}{\\sqrt{x+h}+\\sqrt{x}}$.","Let $h\\to0$.","$\\dfrac{1}{2\\sqrt{x}}$."],"Multiply by the conjugate."),
    pr("p07","hard","At what $x$ is the tangent to $f(x)=x^2-6x$ horizontal?","$x=3$",["$f'(x)=2x-6$.","Set $=0$: $2x-6=0$.","$x=3$."],"Horizontal tangent ⇒ $f'(x)=0$.")
  ] },

{ id: "calc1-04-differentiation-rules", title: "Differentiation Rules", chapter: "Vol. 1, Ch. 3.3", problems: [107,110,112,115,116,117],
  summary: "Instead of limits every time, use rules: the power rule $\\frac{d}{dx}x^n=nx^{n-1}$, constant-multiple and sum rules, the product rule, and the quotient rule. Together they differentiate any polynomial or rational function quickly.",
  glossary: {
    "power rule": g("Differentiate a power by dropping the exponent out front and lowering it by one.", "$\\frac{d}{dx}x^n=nx^{n-1}$."),
    "constant multiple rule": g("A constant factor stays put through differentiation.", "$\\frac{d}{dx}[c\\,f]=c\\,f'$."),
    "sum rule": g("Differentiate a sum term by term.", "$(f+g)'=f'+g'$."),
    "product rule": g("Differentiating a product mixes each factor with the other's derivative.", "$(fg)'=f'g+fg'$."),
    "quotient rule": g("A rule for the derivative of a fraction of functions.", "$\\left(\\dfrac{f}{g}\\right)'=\\dfrac{f'g-fg'}{g^2}$."),
    "polynomial": g("A sum of power terms like $3x^2-5x+1$.", "Differentiate term by term with the power rule."),
    "higher-order derivative": g("The derivative of a derivative.", "$f''$ (second), $f'''$ (third), … ; $f''$ gives concavity."),
    "constant rule": g("The derivative of a constant is zero.", "$\\frac{d}{dx}c=0$ — flat lines have slope 0.")
  },
  concepts: [
    cn(1, "Power, constant, and sum rules", "The workhorses: $\\frac{d}{dx}x^n=nx^{n-1}$, constants pull out, and sums differentiate term by term. A constant alone has derivative $0$.", ["Bring the exponent down and subtract one: $x^n\\to nx^{n-1}$.", "Keep constant multipliers: $c\\,x^n\\to c\\,nx^{n-1}$.", "Differentiate each term and add."]),
    cn(2, "Negative and fractional powers", "The power rule works for any real exponent. Rewrite roots and reciprocals as powers first: $\\sqrt{x}=x^{1/2}$, $1/x^3=x^{-3}$.", ["Rewrite as $x^n$ with $n$ possibly negative or fractional.", "Apply $nx^{n-1}$.", "Rewrite back with roots/fractions if desired."]),
    cn(3, "The product rule", "The derivative of a product is not the product of derivatives. Use $(fg)'=f'g+fg'$ — differentiate one factor at a time and keep the other.", ["Identify $f$ and $g$.", "Compute $f'$ and $g'$.", "Combine: $f'g+fg'$."]),
    cn(4, "The quotient rule", "For a ratio, $\\left(\\dfrac{f}{g}\\right)'=\\dfrac{f'g-fg'}{g^2}$ — 'low d-high minus high d-low, over low squared'. Order matters because of the subtraction.", ["Set top $=f$, bottom $=g$.", "Compute $f'g-fg'$.", "Divide by $g^2$."]),
    cn(5, "Higher-order derivatives", "Differentiate again to get $f''$, and again for $f'''$. The second derivative measures how the slope itself changes — concavity and acceleration.", ["Differentiate $f$ to get $f'$.", "Differentiate $f'$ to get $f''$.", "Repeat as needed."])
  ],
  examples: [
    ex("Acceleration from position", "A drone's height is a function of time.", "The first derivative is velocity, the second is acceleration — higher-order derivatives with physical meaning."),
    ex("Revenue = price × quantity", "A shop's revenue depends on two changing quantities.", "The product rule differentiates $R=p\\cdot q$ when both price and quantity vary with time."),
    ex("Fuel efficiency", "Distance per gallon changes with speed.", "Rates that are ratios (miles per gallon) differentiate with the quotient rule when both parts vary.")
  ],
  videos: vids("power rule constant multiple sum rule derivatives", "product rule quotient rule examples derivatives", "calculus differentiation rules worked problems"),
  problems: [
    pr("p01","easy","Differentiate $f(x)=x^5$.","$5x^4$",["Power rule.","$5x^{5-1}$.","$5x^4$."],"Drop the exponent, subtract one."),
    pr("p02","easy","Differentiate $f(x)=3x^4-2x+7$.","$12x^3-2$",["Term by term.","$12x^3-2+0$.","$12x^3-2$."],"Constant's derivative is 0."),
    pr("p03","easy","Differentiate $f(x)=\\sqrt{x}$.","$\\dfrac{1}{2\\sqrt{x}}$",["$x^{1/2}$.","$\\tfrac12 x^{-1/2}$.","$\\dfrac{1}{2\\sqrt{x}}$."],"Write the root as a power."),
    pr("p04","medium","Differentiate $f(x)=x^2(x^3+1)$ with the product rule.","$5x^4+2x$",["$f'=2x(x^3+1)+x^2(3x^2)$.","$=2x^4+2x+3x^4$.","$=5x^4+2x$."],"$f'g+fg'$."),
    pr("p05","medium","Differentiate $f(x)=\\dfrac{x}{x+1}$.","$\\dfrac{1}{(x+1)^2}$",["Quotient rule: $\\dfrac{(1)(x+1)-x(1)}{(x+1)^2}$.","$=\\dfrac{1}{(x+1)^2}$.","Done."],"Low d-high minus high d-low, over low squared."),
    pr("p06","medium","Find $f''(x)$ for $f(x)=x^4$.","$12x^2$",["$f'=4x^3$.","$f''=12x^2$.","Done."],"Differentiate twice."),
    pr("p07","hard","Find the slope of $f(x)=\\dfrac{x^2+1}{x}$ at $x=2$.","$\\tfrac34$",["Rewrite: $x+x^{-1}$; $f'=1-x^{-2}$.","At $x=2$: $1-\\tfrac14$.","$\\tfrac34$."],"Simplify before differentiating if you can.")
  ] },

{ id: "calc1-05-rates-trig", title: "Rates of Change & Trig Derivatives", chapter: "Vol. 1, Ch. 3.4–3.5", problems: [153,155,177,179,185,191],
  summary: "The derivative is a rate of change: velocity from position, and marginal quantities in economics. The trig derivatives $\\frac{d}{dx}\\sin x=\\cos x$ and $\\frac{d}{dx}\\cos x=-\\sin x$ (and the rest) extend differentiation to oscillating functions.",
  glossary: {
    "rate of change": g("How fast one quantity changes per unit of another.", "The derivative; average over an interval, instantaneous at a point."),
    "velocity": g("The rate of change of position — signed speed.", "$v(t)=s'(t)$; negative means moving backward."),
    "acceleration": g("The rate of change of velocity.", "$a(t)=v'(t)=s''(t)$."),
    "marginal": g("The change from one more unit (cost, revenue, profit).", "Approximated by the derivative of the total."),
    "sine derivative": g("How the sine curve's slope behaves.", "$\\frac{d}{dx}\\sin x=\\cos x$."),
    "cosine derivative": g("The slope of cosine.", "$\\frac{d}{dx}\\cos x=-\\sin x$ (note the minus)."),
    "tangent derivative": g("Derivative of $\\tan x$.", "$\\frac{d}{dx}\\tan x=\\sec^2 x$."),
    "speed": g("The magnitude of velocity — always nonnegative.", "$\\text{speed}=|v(t)|$.")
  },
  concepts: [
    cn(1, "Derivative as velocity", "If $s(t)$ is position, then $s'(t)$ is velocity and $s''(t)$ is acceleration. The sign of velocity tells direction; speed is its absolute value.", ["Differentiate position to get velocity.", "Differentiate velocity to get acceleration.", "Read direction from the sign, speed from $|v|$."]),
    cn(2, "Marginal quantities", "In economics the derivative of a total (cost, revenue, profit) is the marginal quantity — roughly the effect of one more unit. Marginal cost is $C'(x)$.", ["Model the total as a function of quantity.", "Differentiate to get the marginal function.", "Evaluate to estimate the next-unit effect."]),
    cn(3, "Derivatives of sine and cosine", "The sine and cosine trade places under differentiation: $\\frac{d}{dx}\\sin x=\\cos x$ and $\\frac{d}{dx}\\cos x=-\\sin x$. The minus sign on cosine is essential.", ["Memorize $\\sin\\to\\cos$, $\\cos\\to-\\sin$.", "Differentiate term by term with the other rules.", "Keep the negative sign on the cosine derivative."]),
    cn(4, "Other trig derivatives", "From the quotient rule: $\\frac{d}{dx}\\tan x=\\sec^2 x$, $\\frac{d}{dx}\\sec x=\\sec x\\tan x$, and the co-functions carry minus signs.", ["Write $\\tan=\\sin/\\cos$ and apply the quotient rule if you forget.", "$\\tan\\to\\sec^2$, $\\sec\\to\\sec\\tan$.", "Cofunctions ($\\cot,\\csc$) get negative signs."]),
    cn(5, "Combining rules", "Real problems mix trig with products and quotients. Differentiate $x\\sin x$ with the product rule, and $\\dfrac{\\sin x}{x}$ with the quotient rule.", ["Spot the outer structure (product or quotient).", "Apply that rule, using the trig derivatives inside.", "Simplify."])
  ],
  examples: [
    ex("A pendulum's motion", "A pendulum swings back and forth like $\\sin(t)$.", "Its velocity is the derivative $\\cos(t)$ — fastest at the bottom, zero at the ends of the swing."),
    ex("Tides through the day", "Water height rises and falls sinusoidally.", "The rate the tide comes in is the derivative of a sinusoid — a cosine giving the flow speed."),
    ex("Marginal profit", "A company's profit depends on units sold.", "The derivative of profit tells whether selling one more unit still helps — marginal analysis.")
  ],
  videos: vids("derivative rate of change velocity acceleration position", "derivatives of sine cosine tangent examples", "calculus trig derivatives rates of change problems"),
  problems: [
    pr("p01","easy","A particle's position is $s(t)=t^2-4t$. Find its velocity at $t=3$.","$2$",["$v=s'=2t-4$.","At $t=3$: $6-4$.","$v=2$."],"Velocity is the derivative of position."),
    pr("p02","easy","Differentiate $f(x)=\\sin x+\\cos x$.","$\\cos x-\\sin x$",["$\\sin\\to\\cos$, $\\cos\\to-\\sin$.","Add.","$\\cos x-\\sin x$."],"Mind the minus on cosine."),
    pr("p03","easy","Differentiate $f(x)=3\\sin x$.","$3\\cos x$",["Constant multiple.","$3\\cos x$.","Done."],"Constant stays."),
    pr("p04","medium","Position $s(t)=t^3-6t^2$. Find the acceleration at $t=1$.","$-6$",["$v=3t^2-12t$; $a=6t-12$.","At $t=1$: $6-12$.","$a=-6$."],"Differentiate twice."),
    pr("p05","medium","Differentiate $f(x)=x\\sin x$.","$\\sin x+x\\cos x$",["Product rule: $(1)\\sin x+x\\cos x$.","Combine.","$\\sin x+x\\cos x$."],"$f'g+fg'$."),
    pr("p06","medium","Differentiate $f(x)=\\tan x$.","$\\sec^2 x$",["Standard trig derivative.","$\\frac{d}{dx}\\tan x=\\sec^2 x$.","Done."],"Memorize or use the quotient rule."),
    pr("p07","hard","When is the particle $s(t)=t^3-3t$ momentarily at rest?","$t=1$",["$v=3t^2-3=0$.","$t^2=1$, $t=1$ (for $t\\ge0$).","At rest at $t=1$."],"At rest ⇒ velocity zero.")
  ] },

{ id: "calc1-06-chain-rule", title: "The Chain Rule", chapter: "Vol. 1, Ch. 3.6", problems: [215,221,222,229,231,235],
  summary: "The chain rule differentiates a composition: $\\frac{d}{dx}f(g(x))=f'(g(x))\\cdot g'(x)$ — outer derivative times inner derivative. It is the key to handling anything 'inside' another function, from $\\sin(x^2)$ to $(3x+1)^{10}$.",
  glossary: {
    "composition": g("A function inside another, like $f(g(x))$.", "Evaluate inner first, then outer; differentiate outer-times-inner."),
    "chain rule": g("Differentiate a composition by multiplying outer and inner derivatives.", "$[f(g(x))]'=f'(g(x))\\,g'(x)$."),
    "outer function": g("The last operation applied.", "You differentiate it first, keeping the inside intact."),
    "inner function": g("The expression tucked inside.", "Its derivative multiplies the result."),
    "Leibniz form": g("The chain rule written with fractions.", "$\\dfrac{dy}{dx}=\\dfrac{dy}{du}\\cdot\\dfrac{du}{dx}$."),
    "general power rule": g("Chain rule applied to a power.", "$\\frac{d}{dx}[g(x)]^n=n[g(x)]^{n-1}g'(x)$."),
    "nested composition": g("Compositions inside compositions.", "Apply the chain rule repeatedly, working outside in."),
    "substitution u": g("Naming the inside $u$ to organize the work.", "Let $u=g(x)$; then $y=f(u)$ and multiply the pieces.")
  },
  concepts: [
    cn(1, "Recognizing a composition", "A composition has an 'inside': $\\sin(x^2)$ is $\\sin$ of $x^2$; $(3x+1)^5$ is (something)$^5$. Spotting the inner function is the first step.", ["Identify the last operation — that's the outer function.", "What it acts on is the inner function.", "Name the inner $u=g(x)$ if it helps."]),
    cn(2, "The rule", "Differentiate the outer function (leaving the inside alone), then multiply by the derivative of the inside: $f'(g(x))\\cdot g'(x)$.", ["Differentiate the outer at $g(x)$.", "Multiply by $g'(x)$.", "Do not forget the inner derivative — the most common mistake."]),
    cn(3, "The general power rule", "For $[g(x)]^n$, bring the power down, lower it by one, and multiply by $g'(x)$: $n[g(x)]^{n-1}g'(x)$.", ["Apply the power rule to the whole bracket.", "Multiply by the derivative of the inside.", "Simplify."]),
    cn(4, "Chain rule with trig and exponentials", "$\\frac{d}{dx}\\sin(g)=\\cos(g)\\,g'$ and $\\frac{d}{dx}e^{g}=e^{g}g'$. The inner derivative always tags along.", ["Differentiate the outer trig/exp normally.", "Keep the inside unchanged in the outer part.", "Multiply by the inner derivative."]),
    cn(5, "Nested chains", "For a composition of three or more, apply the rule repeatedly from the outside in — each layer contributes a factor of its own derivative.", ["Differentiate the outermost layer.", "Multiply by the derivative of the next layer.", "Continue inward until you reach $x$."])
  ],
  examples: [
    ex("Ripple radius and area", "A stone's ripple expands; its radius grows with time.", "The area's rate of change combines area-vs-radius and radius-vs-time by the chain rule: $\\frac{dA}{dt}=\\frac{dA}{dr}\\frac{dr}{dt}$."),
    ex("Temperature along a hike", "Temperature depends on altitude, altitude on time.", "How fast the temperature changes in time chains the two rates together."),
    ex("Compound effects", "Sales depend on price, price on a currency rate.", "The overall sensitivity multiplies the intermediate rates — the chain rule in economics.")
  ],
  videos: vids("chain rule composition outer inner derivative", "chain rule examples general power rule trig exponential", "calculus chain rule worked problems nested"),
  problems: [
    pr("p01","easy","Differentiate $f(x)=(2x+1)^3$.","$6(2x+1)^2$",["General power rule.","$3(2x+1)^2\\cdot2$.","$6(2x+1)^2$."],"Power times inner derivative."),
    pr("p02","easy","Differentiate $f(x)=\\sin(3x)$.","$3\\cos(3x)$",["Outer $\\sin\\to\\cos$.","Times inner derivative $3$.","$3\\cos(3x)$."],"Don't drop the 3."),
    pr("p03","medium","Differentiate $f(x)=\\sqrt{x^2+1}$.","$\\dfrac{x}{\\sqrt{x^2+1}}$",["$(x^2+1)^{1/2}$; power rule.","$\\tfrac12(x^2+1)^{-1/2}\\cdot2x$.","$\\dfrac{x}{\\sqrt{x^2+1}}$."],"Inner derivative is $2x$."),
    pr("p04","medium","Differentiate $f(x)=\\cos(x^2)$.","$-2x\\sin(x^2)$",["Outer $\\cos\\to-\\sin$.","Times inner $2x$.","$-2x\\sin(x^2)$."],"Keep the inside, multiply by $2x$."),
    pr("p05","medium","Differentiate $f(x)=(x^2+3x)^4$.","$4(x^2+3x)^3(2x+3)$",["General power rule.","$4(x^2+3x)^3\\cdot(2x+3)$.","Done."],"Inner derivative is $2x+3$."),
    pr("p06","hard","Differentiate $f(x)=\\sin^2 x$.","$2\\sin x\\cos x$",["$(\\sin x)^2$; power rule.","$2\\sin x\\cdot\\cos x$.","$2\\sin x\\cos x$."],"Inner derivative is $\\cos x$."),
    pr("p07","hard","Differentiate $f(x)=\\sqrt{\\sin(2x)}$.","$\\dfrac{\\cos(2x)}{\\sqrt{\\sin(2x)}}$",["Layers: root, sin, $2x$.","$\\tfrac12(\\sin 2x)^{-1/2}\\cdot\\cos(2x)\\cdot2$.","$\\dfrac{\\cos(2x)}{\\sqrt{\\sin(2x)}}$."],"Three layers — chain twice.")
  ] },

{ id: "calc1-07-inverse-implicit", title: "Inverse & Implicit Differentiation", chapter: "Vol. 1, Ch. 3.7–3.8", problems: [265,267,279,281,283,287],
  summary: "Implicit differentiation differentiates an equation in $x$ and $y$ without solving for $y$, treating $y$ as a function of $x$ and applying the chain rule. It also yields derivatives of inverse functions like $\\arcsin$ and $\\arctan$.",
  glossary: {
    "implicit function": g("A relationship where $y$ isn't isolated, like $x^2+y^2=1$.", "Differentiate both sides, treating $y$ as $y(x)$."),
    "implicit differentiation": g("Differentiating an equation term by term in $x$.", "Every $y$ term picks up a $\\dfrac{dy}{dx}$ via the chain rule."),
    "inverse function": g("A function that undoes another.", "If $y=f^{-1}(x)$ then $f(y)=x$; differentiate implicitly to find its derivative."),
    "arcsin derivative": g("Slope of the inverse sine.", "$\\frac{d}{dx}\\arcsin x=\\dfrac{1}{\\sqrt{1-x^2}}$."),
    "arctan derivative": g("Slope of the inverse tangent.", "$\\frac{d}{dx}\\arctan x=\\dfrac{1}{1+x^2}$."),
    "related variable": g("A quantity linked to another through an equation.", "Implicit differentiation relates their rates."),
    "chain rule on y": g("Differentiating a function of $y$ where $y=y(x)$.", "$\\frac{d}{dx}[y^2]=2y\\,\\dfrac{dy}{dx}$."),
    "tangent to a curve": g("A line touching an implicitly-defined curve.", "Use the implicit $dy/dx$ at the point for the slope.")
  },
  concepts: [
    cn(1, "Treating $y$ as a function of $x$", "In an implicit equation, $y$ secretly depends on $x$. Differentiating a $y$-term uses the chain rule and produces a $\\dfrac{dy}{dx}$ factor.", ["Differentiate both sides with respect to $x$.", "For any $y$-term, multiply by $\\dfrac{dy}{dx}$.", "You now have an equation containing $\\dfrac{dy}{dx}$."]),
    cn(2, "Solving for $dy/dx$", "Collect all $\\dfrac{dy}{dx}$ terms on one side, factor it out, and divide. The result usually depends on both $x$ and $y$.", ["Gather $\\dfrac{dy}{dx}$ terms together.", "Factor out $\\dfrac{dy}{dx}$.", "Divide to isolate it."]),
    cn(3, "Tangents to implicit curves", "To find a tangent to a curve like a circle, get $\\dfrac{dy}{dx}$ implicitly, plug in the point's $(x,y)$, and use point-slope form.", ["Differentiate implicitly.", "Substitute the point's coordinates for the slope.", "Write $y-y_0=m(x-x_0)$."]),
    cn(4, "Derivatives of inverse functions", "If $y=f^{-1}(x)$ then $f(y)=x$; differentiating implicitly gives $\\dfrac{dy}{dx}=\\dfrac{1}{f'(y)}$. This produces the inverse-trig derivatives.", ["Write $f(y)=x$.", "Differentiate implicitly: $f'(y)\\dfrac{dy}{dx}=1$.", "Solve: $\\dfrac{dy}{dx}=1/f'(y)$."]),
    cn(5, "Inverse trig derivatives", "The key results: $\\frac{d}{dx}\\arcsin x=\\dfrac{1}{\\sqrt{1-x^2}}$ and $\\frac{d}{dx}\\arctan x=\\dfrac{1}{1+x^2}$ — algebraic formulas from trig inverses.", ["Recall $\\arcsin\\to\\dfrac{1}{\\sqrt{1-x^2}}$.", "Recall $\\arctan\\to\\dfrac{1}{1+x^2}$.", "Combine with the chain rule for compositions."])
  ],
  examples: [
    ex("A ladder sliding down a wall", "The top slides down as the base slides out.", "The wall equation $x^2+y^2=L^2$ relates the two by implicit differentiation — the basis of related rates."),
    ex("A circle's tangent line", "Find the tangent to a round track at a point.", "Implicit differentiation of $x^2+y^2=r^2$ gives the slope without solving for $y$."),
    ex("Undoing a function", "A conversion and its reverse (Celsius↔Fahrenheit style, but curved).", "The reverse process is an inverse function; its rate is the reciprocal of the original's rate.")
  ],
  videos: vids("implicit differentiation dy dx chain rule y", "implicit differentiation examples inverse trig derivatives", "calculus implicit differentiation tangent circle problems"),
  problems: [
    pr("p01","easy","If $x^2+y^2=25$, find $\\dfrac{dy}{dx}$.","$-\\dfrac{x}{y}$",["Differentiate: $2x+2y\\,y'=0$.","$y'=-x/y$.","Done."],"Every $y$-term gets a $y'$."),
    pr("p02","medium","Find $\\dfrac{dy}{dx}$ for $xy=4$.","$-\\dfrac{y}{x}$",["Product rule: $y+x\\,y'=0$.","$y'=-y/x$.","Done."],"$xy$ needs the product rule."),
    pr("p03","medium","Find the slope of $x^2+y^2=25$ at $(3,4)$.","$-\\tfrac34$",["$y'=-x/y$.","At $(3,4)$: $-3/4$.","$-\\tfrac34$."],"Plug the point into $-x/y$."),
    pr("p04","medium","Find $\\dfrac{dy}{dx}$ for $x^2+xy+y^2=7$.","$-\\dfrac{2x+y}{x+2y}$",["$2x+y+xy'+2yy'=0$.","$(x+2y)y'=-(2x+y)$.","$y'=-\\dfrac{2x+y}{x+2y}$."],"Collect $y'$ terms and factor."),
    pr("p05","medium","Differentiate $f(x)=\\arctan x$.","$\\dfrac{1}{1+x^2}$",["Standard inverse-trig derivative.","$\\dfrac{1}{1+x^2}$.","Done."],"Memorize the arctan derivative."),
    pr("p06","hard","Differentiate $f(x)=\\arcsin(2x)$.","$\\dfrac{2}{\\sqrt{1-4x^2}}$",["Chain: $\\dfrac{1}{\\sqrt{1-(2x)^2}}\\cdot2$.","$\\dfrac{2}{\\sqrt{1-4x^2}}$.","Done."],"Arcsin derivative times inner derivative $2$."),
    pr("p07","hard","Find $\\dfrac{dy}{dx}$ for $\\sin y=x$.","$\\dfrac{1}{\\cos y}$",["Differentiate: $\\cos y\\,y'=1$.","$y'=1/\\cos y$.","Done."],"Implicit derivative of $\\arcsin$.")
  ] },

{ id: "calc1-08-exp-log-derivatives", title: "Derivatives of Exponential & Log Functions", chapter: "Vol. 1, Ch. 3.9", problems: [300,301,309,311,315,319],
  summary: "$e^x$ is its own derivative; $\\ln x$ differentiates to $1/x$. With the chain rule these give $\\frac{d}{dx}e^{g}=e^{g}g'$ and $\\frac{d}{dx}\\ln g=g'/g$. Logarithmic differentiation tames products, quotients, and variable exponents.",
  glossary: {
    "natural exponential": g("The function $e^x$ with base $e\\approx2.718$.", "Uniquely, $\\frac{d}{dx}e^x=e^x$ — its own derivative."),
    "natural log": g("The inverse of $e^x$, written $\\ln x$.", "$\\frac{d}{dx}\\ln x=\\dfrac1x$ for $x>0$."),
    "base-a exponential": g("An exponential with base other than $e$.", "$\\frac{d}{dx}a^x=a^x\\ln a$."),
    "base-a log": g("Logarithm to base $a$.", "$\\frac{d}{dx}\\log_a x=\\dfrac{1}{x\\ln a}$."),
    "logarithmic differentiation": g("Taking $\\ln$ of both sides before differentiating.", "Turns products/powers into sums — handy for messy functions."),
    "exponential growth": g("Growth proportional to current size.", "Solutions of $y'=ky$ are $y=Ce^{kt}$."),
    "e": g("Euler's number, $\\approx2.71828$.", "The base that makes the exponential its own derivative."),
    "chain with exp/log": g("Differentiating $e^{g}$ or $\\ln g$.", "$e^{g}g'$ and $g'/g$ respectively.")
  },
  concepts: [
    cn(1, "Derivative of $e^x$ and $\\ln x$", "The two headline facts: $\\frac{d}{dx}e^x=e^x$ and $\\frac{d}{dx}\\ln x=\\dfrac1x$. Everything else builds on these.", ["$e^x$ is unchanged by differentiation.", "$\\ln x$ becomes $1/x$.", "Combine with sum/product/quotient rules."]),
    cn(2, "Chain rule versions", "With an inside function: $\\frac{d}{dx}e^{g(x)}=e^{g(x)}g'(x)$ and $\\frac{d}{dx}\\ln g(x)=\\dfrac{g'(x)}{g(x)}$.", ["Differentiate the outer $e$ or $\\ln$.", "Multiply by the inner derivative $g'$.", "For $\\ln$, that means $g'/g$."]),
    cn(3, "Other bases", "For base $a$: $\\frac{d}{dx}a^x=a^x\\ln a$ and $\\frac{d}{dx}\\log_a x=\\dfrac{1}{x\\ln a}$. The extra $\\ln a$ comes from converting to base $e$.", ["Write $a^x=e^{x\\ln a}$ if you forget.", "$a^x\\to a^x\\ln a$.", "$\\log_a x\\to\\dfrac{1}{x\\ln a}$."]),
    cn(4, "Logarithmic differentiation", "For products, quotients, and variable exponents (like $x^x$), take $\\ln$ of both sides first: it turns products into sums and exponents into factors, which are easy to differentiate.", ["Take $\\ln$ of both sides.", "Use log laws to expand, then differentiate implicitly.", "Multiply back by $y$ to isolate $y'$."]),
    cn(5, "Exponential growth models", "Anything growing at a rate proportional to its size satisfies $y'=ky$, whose solution is $y=Ce^{kt}$. The derivative link makes exponentials the natural model.", ["Recognize 'rate proportional to amount'.", "Write $y=Ce^{kt}$.", "Differentiate to confirm $y'=ky$."])
  ],
  examples: [
    ex("Radioactive decay", "A sample loses a fixed fraction each period.", "Its amount follows $N=N_0e^{-kt}$; the decay rate is the derivative $-kN$, proportional to the amount left."),
    ex("Compound interest", "Money grows continuously in an account.", "Balance $A=Pe^{rt}$; the growth rate is $rA$, the derivative — interest on interest."),
    ex("Sound level in decibels", "Perceived loudness scales logarithmically.", "Rates of change of a log quantity use $\\frac{d}{dx}\\ln x=1/x$.")
  ],
  videos: vids("derivative e^x natural log 1/x rules", "derivatives exponential logarithmic chain rule logarithmic differentiation", "calculus exponential log derivatives worked problems"),
  problems: [
    pr("p01","easy","Differentiate $f(x)=e^x+\\ln x$.","$e^x+\\dfrac1x$",["$e^x\\to e^x$, $\\ln x\\to1/x$.","Add.","$e^x+\\dfrac1x$."],"Two headline derivatives."),
    pr("p02","easy","Differentiate $f(x)=e^{3x}$.","$3e^{3x}$",["Chain: $e^{3x}\\cdot3$.","$3e^{3x}$.","Done."],"Multiply by the inner derivative."),
    pr("p03","medium","Differentiate $f(x)=\\ln(x^2+1)$.","$\\dfrac{2x}{x^2+1}$",["$g'/g$ with $g=x^2+1$.","$\\dfrac{2x}{x^2+1}$.","Done."],"$\\ln g\\to g'/g$."),
    pr("p04","medium","Differentiate $f(x)=x e^x$.","$e^x(1+x)$",["Product rule: $e^x+xe^x$.","Factor.","$e^x(1+x)$."],"$f'g+fg'$."),
    pr("p05","medium","Differentiate $f(x)=2^x$.","$2^x\\ln 2$",["Base-$a$ rule.","$2^x\\ln2$.","Done."],"Extra $\\ln a$ factor."),
    pr("p06","hard","Differentiate $f(x)=x^x$ (logarithmic differentiation).","$x^x(\\ln x+1)$",["$\\ln y=x\\ln x$.","$y'/y=\\ln x+1$.","$y'=x^x(\\ln x+1)$."],"Take $\\ln$ of both sides first."),
    pr("p07","hard","A culture grows as $N=100e^{0.2t}$. Find $N'(0)$.","$20$",["$N'=100(0.2)e^{0.2t}=20e^{0.2t}$.","At $t=0$: $20$.","$N'(0)=20$."],"$\\frac{d}{dt}Ce^{kt}=kCe^{kt}$.")
  ] },

{ id: "calc1-09-related-rates", title: "Related Rates", chapter: "Vol. 1, Ch. 4.1", problems: [1,5,10,17,20,25,29],
  summary: "Related-rates problems link the rates of two quantities through an equation. Differentiate the relating equation with respect to time (chain rule), then substitute known values to solve for the unknown rate.",
  glossary: {
    "related rates": g("Two changing quantities tied by an equation.", "Differentiate the equation in time to relate $dx/dt$ and $dy/dt$."),
    "rate with respect to time": g("How fast a quantity changes per second.", "Written $\\dfrac{dQ}{dt}$."),
    "relating equation": g("A formula connecting the quantities (area, Pythagorean, volume).", "Differentiate it implicitly in $t$."),
    "geometric model": g("The shape/relationship behind the problem.", "Circle area, cone volume, right triangle, etc."),
    "substitute last": g("Plug in numbers only after differentiating.", "Keeps variables that are still changing from being frozen too early."),
    "Pythagorean relation": g("$x^2+y^2=z^2$ for right-triangle setups.", "Differentiates to $x\\dot x+y\\dot y=z\\dot z$."),
    "cone volume": g("$V=\\tfrac13\\pi r^2 h$ for tanks and piles.", "Often reduce to one variable before differentiating."),
    "sign of a rate": g("Positive = increasing, negative = decreasing.", "Match the sign to the described motion.")
  },
  concepts: [
    cn(1, "The strategy", "Draw the situation, name the quantities, and write an equation connecting them. Differentiate with respect to time, then substitute the instant's values to solve for the unknown rate.", ["Sketch and label variables.", "Write the relating equation.", "Differentiate in $t$, then substitute and solve."]),
    cn(2, "Differentiating in time", "Every variable is a function of $t$, so differentiating brings a $\\dfrac{d}{dt}$ factor by the chain rule: $\\frac{d}{dt}x^2=2x\\dfrac{dx}{dt}$.", ["Treat each variable as depending on $t$.", "Apply the chain rule to every term.", "Attach the matching rate to each."]),
    cn(3, "Reducing variables", "If the geometry links variables (a cone with fixed shape has $r$ proportional to $h$), substitute to write the equation in a single variable before differentiating.", ["Find a constraint between variables.", "Substitute to eliminate one.", "Differentiate the simpler relation."]),
    cn(4, "Substitute values last", "Keep variables symbolic while differentiating; only after you have the rate equation do you plug in the given instantaneous values. Substituting early freezes a changing quantity.", ["Differentiate fully first.", "Then insert the given numbers.", "Solve for the unknown rate."]),
    cn(5, "Interpreting the answer", "The sign shows increase or decrease and the units come from the setup. Check that the magnitude and sign make physical sense.", ["Read the sign: + increasing, − decreasing.", "Attach correct units.", "Sanity-check against the scenario."])
  ],
  examples: [
    ex("Sliding ladder", "A ladder's base is pulled away from a wall.", "$x^2+y^2=L^2$ differentiates to relate how fast the top drops to how fast the base moves."),
    ex("Filling a conical tank", "Water pours into a cone-shaped tank.", "$V=\\tfrac13\\pi r^2h$ links the rising water level to the constant inflow rate."),
    ex("Expanding oil spill", "A circular spill's radius grows steadily.", "$A=\\pi r^2$ relates the area's growth to the radius's growth: $\\dot A=2\\pi r\\dot r$.")
  ],
  videos: vids("related rates strategy differentiate with respect to time", "related rates ladder cone spill examples", "calculus related rates worked problems"),
  problems: [
    pr("p01","easy","A circle's radius grows at $3$ cm/s. How fast is the area growing when $r=5$?","$30\\pi$ cm²/s",["$A=\\pi r^2$; $\\dot A=2\\pi r\\dot r$.","$=2\\pi(5)(3)$.","$30\\pi$ cm²/s."],"Differentiate $A=\\pi r^2$ in time."),
    pr("p02","medium","A $10$-ft ladder's base moves out at $2$ ft/s. How fast does the top drop when the base is $6$ ft out?","$-1.5$ ft/s",["$x^2+y^2=100$; $x\\dot x+y\\dot y=0$.","At $x=6$, $y=8$: $6(2)+8\\dot y=0$.","$\\dot y=-1.5$ ft/s."],"Use $x\\dot x+y\\dot y=0$."),
    pr("p03","medium","A balloon's volume grows at $100$ cm³/s. How fast is the radius growing when $r=5$? ($V=\\tfrac43\\pi r^3$)","$\\dfrac{1}{\\pi}$ cm/s",["$\\dot V=4\\pi r^2\\dot r$.","$100=4\\pi(25)\\dot r=100\\pi\\dot r$.","$\\dot r=1/\\pi$ cm/s."],"Differentiate the sphere volume."),
    pr("p04","medium","A square's side grows at $2$ cm/s. How fast is its area growing when the side is $10$?","$40$ cm²/s",["$A=s^2$; $\\dot A=2s\\dot s$.","$=2(10)(2)$.","$40$ cm²/s."],"$\\dot A=2s\\dot s$."),
    pr("p05","hard","Sand forms a cone with $h=r$. If volume grows at $12$ ft³/min, how fast is the height rising when $h=2$? ($V=\\tfrac13\\pi r^2h$)","$\\dfrac{3}{\\pi}$ ft/min",["With $r=h$: $V=\\tfrac13\\pi h^3$; $\\dot V=\\pi h^2\\dot h$.","$12=\\pi(4)\\dot h$.","$\\dot h=3/\\pi$ ft/min."],"Use $r=h$ to reduce to one variable."),
    pr("p06","hard","Two cars leave a point, one north at $30$, one east at $40$ mph. How fast are they separating after 1 h?","$50$ mph",["$z^2=x^2+y^2$; $z\\dot z=x\\dot x+y\\dot y$.","At $x=40,y=30,z=50$: $50\\dot z=40(40)+30(30)=2500$.","$\\dot z=50$ mph."],"Pythagorean related rate."),
    pr("p07","stretch","A streetlight is $12$ ft tall; a $6$-ft person walks away at $3$ ft/s. How fast does the shadow tip move?","$6$ ft/s",["Similar triangles: tip distance $=2x$ where $x$ is the person's distance.","$\\frac{d}{dt}(2x)=2(3)$.","$6$ ft/s."],"Set up similar triangles first.")
  ] },

{ id: "calc1-10-linearization", title: "Linear Approximation & Differentials", chapter: "Vol. 1, Ch. 4.2", problems: [62,63,67,68,69,70],
  summary: "Near a point, a curve looks like its tangent line, so $f(x)\\approx f(a)+f'(a)(x-a)$ gives a quick estimate. The differential $dy=f'(x)\\,dx$ turns this into an estimate of how much $f$ changes for a small change in $x$.",
  glossary: {
    "linearization": g("The tangent-line approximation of a function near a point.", "$L(x)=f(a)+f'(a)(x-a)\\approx f(x)$ for $x$ near $a$."),
    "differential": g("A small change estimate: $dy=f'(x)\\,dx$.", "Approximates the true change $\\Delta y$ for small $dx$."),
    "tangent approximation": g("Using the tangent line in place of the curve.", "Accurate for small distances from the point."),
    "delta y": g("The actual change in $f$.", "$\\Delta y=f(x+\\Delta x)-f(x)$; $dy$ approximates it."),
    "percent error": g("Relative size of an approximation's error.", "$\\dfrac{|dy|}{|y|}\\times100\\%$."),
    "base point": g("The nearby value $a$ where the function is easy to evaluate.", "Choose $a$ close to the target with a known $f(a)$."),
    "propagated error": g("How input error spreads to the output.", "Estimated by $dy=f'(x)\\,dx$."),
    "small change": g("A tiny $dx$ where the linear estimate is reliable.", "The smaller $dx$, the better the approximation.")
  },
  concepts: [
    cn(1, "The tangent-line estimate", "Because the tangent hugs the curve near the point, $f(x)\\approx f(a)+f'(a)(x-a)$. Pick $a$ where $f(a)$ and $f'(a)$ are easy, close to your target.", ["Choose a convenient base point $a$.", "Compute $f(a)$ and $f'(a)$.", "Evaluate $L(x)=f(a)+f'(a)(x-a)$."]),
    cn(2, "Differentials", "Write $dy=f'(x)\\,dx$: a small input change $dx$ produces an estimated output change $dy$. It's the linearization rephrased in terms of changes.", ["Differentiate to get $f'(x)$.", "Multiply by the small change $dx$.", "$dy$ estimates the actual $\\Delta y$."]),
    cn(3, "Estimating values", "To estimate something like $\\sqrt{4.1}$, linearize $\\sqrt{x}$ at $a=4$: $L(x)=2+\\tfrac14(x-4)$, giving $\\approx2.025$.", ["Rewrite the target as $f$ at a nearby nice $a$.", "Build $L(x)$.", "Plug in the target $x$."]),
    cn(4, "Error propagation", "If a measured $x$ has a small error $dx$, the resulting error in $f$ is about $dy=f'(x)\\,dx$. Divide by $y$ for percent error.", ["Identify the measurement error $dx$.", "Compute $dy=f'(x)\\,dx$.", "Relative error $=dy/y$."]),
    cn(5, "Why it works and its limits", "The estimate is exact at $a$ and degrades as you move away, because the curve bends away from the tangent. Smaller $|x-a|$ means better accuracy.", ["Best right at the base point.", "Worse as $|x-a|$ grows.", "Concavity controls the error direction."])
  ],
  examples: [
    ex("Estimating a square root by hand", "You need $\\sqrt{101}$ without a calculator.", "Linearize $\\sqrt{x}$ at $100$: $\\approx10+\\tfrac{1}{20}(1)=10.05$."),
    ex("Measurement tolerance", "A machined rod's radius is known to ±0.01 mm.", "The differential $dV=\\ldots\\,dr$ estimates how much the volume could be off."),
    ex("Quick mental math for scientists", "Rapidly approximate a function change in the field.", "The tangent-line rule gives a fast, good-enough estimate near a known value.")
  ],
  videos: vids("linear approximation tangent line estimate", "differentials dy dx error estimation examples", "calculus linearization differentials worked problems"),
  problems: [
    pr("p01","easy","Linearize $f(x)=\\sqrt{x}$ at $a=9$.","$L(x)=3+\\tfrac16(x-9)$",["$f(9)=3$, $f'(x)=\\tfrac{1}{2\\sqrt x}$, $f'(9)=\\tfrac16$.","$L(x)=3+\\tfrac16(x-9)$.","Done."],"$L=f(a)+f'(a)(x-a)$."),
    pr("p02","easy","Use it to estimate $\\sqrt{9.1}$.","$\\approx3.0167$",["$L(9.1)=3+\\tfrac16(0.1)$.","$=3+0.0167$.","$\\approx3.0167$."],"Plug $9.1$ into the linearization."),
    pr("p03","medium","Estimate $(2.01)^3$ using differentials.","$\\approx8.12$",["$f=x^3$, $f'=3x^2$; at $x=2$, $dy=12(0.01)=0.12$.","$8+0.12$.","$\\approx8.12$."],"$dy=f'(x)\\,dx$."),
    pr("p04","medium","A cube's side is $5\\pm0.1$ cm. Estimate the error in volume.","$\\pm7.5$ cm³",["$V=s^3$, $dV=3s^2\\,ds$.","$=3(25)(0.1)$.","$\\pm7.5$ cm³."],"Differentiate $V=s^3$."),
    pr("p05","medium","Estimate $\\ln(1.05)$.","$\\approx0.05$",["Linearize $\\ln x$ at $1$: $L=0+1\\cdot(x-1)$.","$L(1.05)=0.05$.","$\\approx0.05$."],"$f'(1)=1$ for $\\ln x$."),
    pr("p06","hard","A circle's radius is measured as $10\\pm0.05$ cm. Estimate the percent error in area.","$1\\%$",["$A=\\pi r^2$, $dA=2\\pi r\\,dr$; $dA/A=2\\,dr/r$.","$=2(0.05/10)=0.01$.","$1\\%$."],"Relative area error is twice the relative radius error.")
  ] },

{ id: "calc1-11-extrema-mvt", title: "Extrema & the Mean Value Theorem", chapter: "Vol. 1, Ch. 4.3–4.4", problems: [108,110,113,119,161,164,168],
  summary: "Maxima and minima occur at critical points (where $f'=0$ or is undefined) or endpoints. The Extreme Value Theorem guarantees them on a closed interval, and the Mean Value Theorem guarantees a point where the instantaneous rate equals the average rate.",
  glossary: {
    "critical point": g("Where $f'(x)=0$ or $f'$ doesn't exist.", "The only interior candidates for a max or min."),
    "absolute extremum": g("The overall highest or lowest value on an interval.", "Found among critical points and endpoints."),
    "local extremum": g("A peak or valley relative to nearby points.", "Occurs at a critical point where $f'$ changes sign."),
    "Extreme Value Theorem": g("A continuous function on $[a,b]$ attains a max and a min.", "Guarantees extrema exist to search for."),
    "closed interval method": g("Compare $f$ at all critical points and both endpoints.", "The largest is the max, the smallest the min."),
    "Rolle's Theorem": g("Equal endpoints ⇒ a flat spot in between.", "If $f(a)=f(b)$, some $c$ has $f'(c)=0$."),
    "Mean Value Theorem": g("Some instant matches the average rate.", "$f'(c)=\\dfrac{f(b)-f(a)}{b-a}$ for some $c$."),
    "average rate": g("Total change over total interval.", "$\\dfrac{f(b)-f(a)}{b-a}$; the MVT says a tangent matches it.")
  },
  concepts: [
    cn(1, "Critical points", "Interior extrema can only happen where the slope is zero or undefined — the critical points. Find them by solving $f'(x)=0$ and noting where $f'$ fails to exist.", ["Compute $f'(x)$.", "Solve $f'(x)=0$.", "Add any $x$ where $f'$ is undefined (but $f$ is defined)."]),
    cn(2, "Absolute extrema on $[a,b]$", "By the Extreme Value Theorem a continuous function on a closed interval has an absolute max and min. Evaluate $f$ at every critical point and both endpoints and compare.", ["List critical points in $[a,b]$ and the endpoints.", "Evaluate $f$ at each.", "Largest value = max, smallest = min."]),
    cn(3, "Classifying with the first derivative", "At a critical point, if $f'$ switches $+\\to-$ it's a local max; $-\\to+$ a local min; no sign change means neither.", ["Test the sign of $f'$ on each side.", "$+\\to-$: local max; $-\\to+$: local min.", "No change: not an extremum."]),
    cn(4, "Rolle's Theorem", "If $f$ is continuous on $[a,b]$, differentiable inside, and $f(a)=f(b)$, then somewhere the tangent is horizontal: $f'(c)=0$.", ["Check continuity and differentiability.", "Check $f(a)=f(b)$.", "Conclude some $c$ has $f'(c)=0$."]),
    cn(5, "The Mean Value Theorem", "Under the same smoothness, some interior point's slope equals the average slope: $f'(c)=\\dfrac{f(b)-f(a)}{b-a}$. It links average and instantaneous rates.", ["Compute the average rate over $[a,b]$.", "Set $f'(c)$ equal to it.", "Solve for $c$ in $(a,b)$."])
  ],
  examples: [
    ex("Maximum height of a projectile", "A ball's height peaks then falls.", "The maximum is a critical point where velocity (the derivative) is zero."),
    ex("Speed-camera average", "Two cameras time a car over a stretch.", "The MVT guarantees the car actually hit its average speed at some instant — the basis of average-speed enforcement."),
    ex("Best and worst of a season", "A stock's price over a fixed window.", "Absolute extrema on the interval identify the peak and trough values.")
  ],
  videos: vids("critical points absolute extrema closed interval method", "mean value theorem rolles theorem examples", "calculus extrema MVT worked problems"),
  problems: [
    pr("p01","easy","Find the critical points of $f(x)=x^2-6x+5$.","$x=3$",["$f'=2x-6=0$.","$x=3$.","One critical point."],"Solve $f'(x)=0$."),
    pr("p02","easy","Find the critical points of $f(x)=x^3-3x$.","$x=\\pm1$",["$f'=3x^2-3=0$.","$x^2=1$.","$x=\\pm1$."],"Set the derivative to zero."),
    pr("p03","medium","Find the absolute max of $f(x)=x^2-4x$ on $[0,3]$.","$0$ (at $x=0$)",["$f'=2x-4=0\\Rightarrow x=2$; $f(2)=-4$.","Endpoints: $f(0)=0$, $f(3)=-3$.","Max is $0$ at $x=0$."],"Compare critical points and endpoints."),
    pr("p04","medium","Find the absolute min of $f(x)=x^3-3x$ on $[0,2]$.","$-2$ (at $x=1$)",["Critical: $x=1$ (in $[0,2]$); $f(1)=-2$.","Endpoints: $f(0)=0$, $f(2)=2$.","Min is $-2$ at $x=1$."],"Evaluate at critical points and endpoints."),
    pr("p05","medium","Does $f(x)=x^2-4$ satisfy Rolle's Theorem on $[-2,2]$? Find $c$.","$c=0$",["$f(-2)=f(2)=0$, $f$ smooth.","$f'(c)=2c=0$.","$c=0$."],"Rolle needs equal endpoints."),
    pr("p06","hard","For $f(x)=x^2$ on $[1,3]$, find the MVT point $c$.","$c=2$",["Average rate $=\\dfrac{9-1}{2}=4$.","$f'(c)=2c=4$.","$c=2$."],"Set $f'(c)$ = average rate."),
    pr("p07","hard","Classify the critical point of $f(x)=x^3-3x^2$ at $x=2$.","local min",["$f'=3x^2-6x=3x(x-2)$; sign $-\\to+$ across $2$.","So $f$ falls then rises.","Local min at $x=2$."],"First-derivative sign test.")
  ] },

{ id: "calc1-12-curve-sketching", title: "Curve Sketching: Shape & Asymptotes", chapter: "Vol. 1, Ch. 4.5–4.6", problems: [223,224,225,229,271,273,279],
  summary: "The first derivative gives increasing/decreasing behavior and local extrema; the second derivative gives concavity and inflection points. Limits at infinity reveal horizontal asymptotes. Together they let you sketch a function's full graph.",
  glossary: {
    "increasing/decreasing": g("Going up or down as $x$ grows.", "$f'>0$ increasing, $f'<0$ decreasing."),
    "concavity": g("Whether a curve bends up (cup) or down (cap).", "$f''>0$ concave up, $f''<0$ concave down."),
    "inflection point": g("Where concavity switches.", "$f''=0$ and changes sign."),
    "second derivative test": g("Classify a critical point by concavity.", "$f''>0$ ⇒ local min, $f''<0$ ⇒ local max."),
    "horizontal asymptote": g("A level the graph approaches far out.", "$\\lim_{x\\to\\pm\\infty}f(x)=L$ gives $y=L$."),
    "vertical asymptote": g("A line the graph shoots up/down along.", "Where the function → ±∞, often a zero denominator."),
    "limit at infinity": g("End behavior as $x\\to\\pm\\infty$.", "Compare leading terms of top and bottom for rationals."),
    "monotonic": g("Always increasing or always decreasing.", "No sign changes in $f'$.")
  },
  concepts: [
    cn(1, "Increasing and decreasing", "Where $f'>0$ the function rises; where $f'<0$ it falls. Critical points split the line into intervals to test.", ["Find critical points from $f'=0$.", "Test the sign of $f'$ on each interval.", "$+$ rising, $-$ falling."]),
    cn(2, "Concavity and inflection", "$f''>0$ means concave up (holds water), $f''<0$ concave down. Where $f''$ changes sign you get an inflection point.", ["Compute $f''$.", "Find where $f''=0$ or is undefined.", "A sign change there is an inflection point."]),
    cn(3, "The second derivative test", "At a critical point, positive concavity makes a valley (local min) and negative concavity a peak (local max). If $f''=0$, the test is inconclusive.", ["Find critical points.", "Evaluate $f''$ there.", "$+$ ⇒ min, $-$ ⇒ max, $0$ ⇒ inconclusive."]),
    cn(4, "Limits at infinity", "For end behavior, examine $\\lim_{x\\to\\pm\\infty}f(x)$. For a rational function compare the degrees of numerator and denominator to find horizontal asymptotes.", ["Look at the highest-degree terms.", "Equal degrees ⇒ ratio of leading coefficients.", "Top smaller ⇒ $y=0$; top bigger ⇒ no horizontal asymptote."]),
    cn(5, "Assembling the sketch", "Combine intercepts, asymptotes, increasing/decreasing, and concavity to draw the graph — the derivatives tell you every feature.", ["Mark intercepts and asymptotes.", "Add rise/fall and extrema from $f'$.", "Add concavity and inflections from $f''$."])
  ],
  examples: [
    ex("A drug's concentration curve", "Concentration rises, peaks, then tapers to zero.", "The peak is where $f'=0$; the long-run zero is a horizontal asymptote as $t\\to\\infty$."),
    ex("Population S-curve", "Growth accelerates then levels off (logistic).", "The inflection point marks fastest growth ($f''=0$); the ceiling is a horizontal asymptote."),
    ex("Cost per unit at scale", "Average cost falls then flattens.", "End behavior (a horizontal asymptote) shows the minimum achievable average cost.")
  ],
  videos: vids("first derivative increasing decreasing concavity second derivative", "curve sketching asymptotes inflection points examples", "calculus graphing derivatives shape of graph problems"),
  problems: [
    pr("p01","easy","On what interval is $f(x)=x^2-4x$ increasing?","$x>2$",["$f'=2x-4>0$.","$x>2$.","Increasing there."],"Solve $f'>0$."),
    pr("p02","easy","Find the concavity of $f(x)=x^3$ at $x=1$.","concave up",["$f''=6x$; $f''(1)=6>0$.","Concave up.","Done."],"Sign of $f''$."),
    pr("p03","medium","Find the inflection point of $f(x)=x^3-3x^2$.","$x=1$",["$f''=6x-6=0$.","$x=1$; sign changes.","Inflection at $x=1$."],"$f''=0$ and changes sign."),
    pr("p04","medium","Use the second derivative test on $f(x)=x^2-6x$ at its critical point.","local min",["$f'=2x-6=0\\Rightarrow x=3$; $f''=2>0$.","Concave up.","Local min."],"$f''>0$ ⇒ min."),
    pr("p05","medium","Find the horizontal asymptote of $f(x)=\\dfrac{2x+1}{x-3}$.","$y=2$",["Equal degrees; ratio of leading coefficients.","$2/1$.","$y=2$."],"Compare leading terms."),
    pr("p06","hard","Find the horizontal asymptote of $f(x)=\\dfrac{3x^2}{x^2+1}$.","$y=3$",["Equal degrees.","Leading ratio $3/1$.","$y=3$."],"Degrees equal ⇒ coefficient ratio."),
    pr("p07","hard","Where is $f(x)=x^4-4x^3$ concave down?","$0<x<2$",["$f''=12x^2-24x=12x(x-2)<0$.","Between the roots.","$0<x<2$."],"Solve $f''<0$.")
  ] },

{ id: "calc1-13-optimization-lhopital", title: "Optimization & L'Hôpital's Rule", chapter: "Vol. 1, Ch. 4.7–4.8", problems: [315,316,318,335,356,362,370],
  summary: "Optimization finds the biggest or smallest value: model the quantity, reduce to one variable, and use critical points. L'Hôpital's Rule evaluates $0/0$ and $\\infty/\\infty$ limits by differentiating top and bottom separately.",
  glossary: {
    "optimization": g("Finding a maximum or minimum in a real problem.", "Model, reduce to one variable, find critical points."),
    "objective function": g("The quantity you want to maximize or minimize.", "Express it in terms of one variable using a constraint."),
    "constraint": g("A relationship that ties the variables together.", "Use it to eliminate a variable from the objective."),
    "closed vs open domain": g("Whether endpoints are included.", "On a closed interval, check endpoints too."),
    "L'Hopital's Rule": g("Differentiate top and bottom to resolve $0/0$ or $\\infty/\\infty$.", "$\\lim\\dfrac{f}{g}=\\lim\\dfrac{f'}{g'}$ when the form is indeterminate."),
    "indeterminate quotient": g("A limit form like $0/0$ or $\\infty/\\infty$.", "Required before applying L'Hôpital."),
    "other indeterminates": g("Forms like $0\\cdot\\infty$, $\\infty-\\infty$, $1^\\infty$.", "Rewrite as a quotient, then use L'Hôpital."),
    "feasible region": g("The set of allowed inputs.", "Optimum lies at a critical point or a boundary of it.")
  },
  concepts: [
    cn(1, "Setting up optimization", "Write the quantity to optimize (the objective), then use the constraint to express it in a single variable. State the domain from the context.", ["Name variables and the objective.", "Use the constraint to eliminate variables.", "Determine the valid domain."]),
    cn(2, "Solving the optimization", "Differentiate the one-variable objective, find critical points, and test them (and any endpoints) to identify the max or min.", ["Differentiate the objective.", "Solve $=0$ for critical points.", "Compare values (and endpoints) to pick the optimum."]),
    cn(3, "Common shapes", "Boxes, cans, fences, and distances recur. Typical constraints are fixed perimeter, area, or volume; typical objectives are area, volume, cost, or distance.", ["Recognize the geometric template.", "Write area/volume/cost formulas.", "Reduce and optimize."]),
    cn(4, "L'Hôpital for $0/0$ and $\\infty/\\infty$", "If a limit is $0/0$ or $\\infty/\\infty$, then $\\lim\\dfrac{f}{g}=\\lim\\dfrac{f'}{g'}$. Differentiate numerator and denominator separately (not the quotient) and re-evaluate.", ["Confirm the form is $0/0$ or $\\infty/\\infty$.", "Differentiate top and bottom separately.", "Take the limit again; repeat if still indeterminate."]),
    cn(5, "Other indeterminate forms", "Forms like $0\\cdot\\infty$, $\\infty-\\infty$, and $1^\\infty$ must be rewritten as a quotient (or via logarithms) before L'Hôpital applies.", ["Rearrange into $\\dfrac{0}{0}$ or $\\dfrac{\\infty}{\\infty}$.", "For $1^\\infty$ type, take $\\ln$ first.", "Then apply L'Hôpital."])
  ],
  examples: [
    ex("Least-material can", "Design a soda can holding a fixed volume with minimum metal.", "Minimize surface area subject to the volume constraint — a classic optimization."),
    ex("Fastest route to shore", "A lifeguard runs then swims to a drowning swimmer.", "Minimize total time as a function of the entry point — optimization with a distance objective."),
    ex("Growth vs decay race", "Which wins as $x\\to\\infty$: $x^{100}$ or $e^x$?", "L'Hôpital shows $e^x$ dominates any power — $\\lim x^n/e^x=0$.")
  ],
  videos: vids("optimization setup objective constraint one variable", "lhopitals rule 0/0 infinity examples", "calculus optimization lhopital worked problems"),
  problems: [
    pr("p01","easy","Two numbers sum to $10$. Maximize their product.","$25$ (at $5,5$)",["$P=x(10-x)=10x-x^2$.","$P'=10-2x=0\\Rightarrow x=5$.","$P=25$."],"Objective in one variable, then $P'=0$."),
    pr("p02","easy","Evaluate $\\lim_{x\\to0}\\dfrac{\\sin x}{x}$ by L'Hôpital.","$1$",["$0/0$; differentiate: $\\dfrac{\\cos x}{1}$.","At $0$: $1$.","$=1$."],"Differentiate top and bottom."),
    pr("p03","medium","A rectangle with perimeter $20$ has maximum area when?","$5\\times5$, area $25$",["$A=x(10-x)$.","$A'=10-2x=0\\Rightarrow x=5$.","Square, area $25$."],"Fixed perimeter ⇒ square maximizes area."),
    pr("p04","medium","Evaluate $\\lim_{x\\to\\infty}\\dfrac{\\ln x}{x}$.","$0$",["$\\infty/\\infty$; L'Hôpital: $\\dfrac{1/x}{1}=\\dfrac1x$.","As $x\\to\\infty$, $\\to0$.","$=0$."],"$\\ln$ grows slower than $x$."),
    pr("p05","medium","Evaluate $\\lim_{x\\to0}\\dfrac{e^x-1}{x}$.","$1$",["$0/0$; L'Hôpital: $\\dfrac{e^x}{1}$.","At $0$: $1$.","$=1$."],"Differentiate numerator and denominator."),
    pr("p06","hard","Maximize the area of a rectangle inscribed under $y=4-x^2$ (base on the $x$-axis).","area $=\\dfrac{32}{3\\sqrt3}$",["$A=2x(4-x^2)=8x-2x^3$.","$A'=8-6x^2=0\\Rightarrow x=2/\\sqrt3$.","$A=\\dfrac{32}{3\\sqrt3}$."],"Width $2x$, height $4-x^2$."),
    pr("p07","hard","Evaluate $\\lim_{x\\to\\infty}\\dfrac{x^2}{e^x}$.","$0$",["$\\infty/\\infty$; apply L'Hôpital twice: $\\dfrac{2x}{e^x}\\to\\dfrac{2}{e^x}$.","$\\to0$.","$=0$."],"Exponentials beat powers.")
  ] },

{ id: "calc1-14-integral", title: "Antiderivatives & the Definite Integral", chapter: "Vol. 1, Ch. 4.10, 5.1–5.3", problems: [465,468,469,2,12,14,72,73,170,171],
  summary: "An antiderivative reverses differentiation; the indefinite integral $\\int f\\,dx$ collects them all (plus $+C$). The definite integral $\\int_a^b f\\,dx$ is a limit of Riemann sums measuring net area, and the Fundamental Theorem ties the two together.",
  glossary: {
    "antiderivative": g("A function whose derivative is the given one.", "$F'=f$; they differ by a constant."),
    "indefinite integral": g("The family of all antiderivatives.", "$\\int f\\,dx=F(x)+C$."),
    "constant of integration": g("The $+C$ that captures every antiderivative.", "Undetermined without an initial condition."),
    "Riemann sum": g("Adding up rectangle areas to approximate area under a curve.", "$\\sum f(x_i)\\Delta x$; the integral is its limit."),
    "definite integral": g("Net signed area between the curve and the axis on $[a,b]$.", "$\\int_a^b f\\,dx=\\lim\\sum f(x_i)\\Delta x$."),
    "Fundamental Theorem": g("Links derivatives and integrals.", "$\\int_a^b f\\,dx=F(b)-F(a)$ where $F'=f$."),
    "net area": g("Area above the axis minus area below.", "Regions under the axis count negative."),
    "power rule for integrals": g("Reverse of the power rule.", "$\\int x^n\\,dx=\\dfrac{x^{n+1}}{n+1}+C$ ($n\\neq-1$).")
  },
  concepts: [
    cn(1, "Antiderivatives", "To undo a derivative, raise the power and divide: $\\int x^n\\,dx=\\dfrac{x^{n+1}}{n+1}+C$. Every antiderivative differs by a constant, hence the $+C$.", ["Add one to the exponent.", "Divide by the new exponent.", "Add $+C$."]),
    cn(2, "Basic integral formulas", "Reverse the standard derivatives: $\\int\\cos x\\,dx=\\sin x+C$, $\\int e^x\\,dx=e^x+C$, $\\int\\frac1x\\,dx=\\ln|x|+C$.", ["Recall the derivative that produces the integrand.", "Reverse it.", "Attach $+C$."]),
    cn(3, "Riemann sums and area", "Slice $[a,b]$ into rectangles of width $\\Delta x$, sum their areas $\\sum f(x_i)\\Delta x$, and let $\\Delta x\\to0$. The limit is the definite integral — the (net) area under the curve.", ["Partition $[a,b]$ into $n$ pieces.", "Add rectangle areas $f(x_i)\\Delta x$.", "Take the limit as $n\\to\\infty$."]),
    cn(4, "The Fundamental Theorem", "To evaluate $\\int_a^b f\\,dx$, find any antiderivative $F$ and compute $F(b)-F(a)$. This converts area (a limit of sums) into a single subtraction.", ["Find an antiderivative $F$.", "Evaluate $F(b)-F(a)$.", "That number is the definite integral."]),
    cn(5, "Net vs total area", "The definite integral counts area below the axis as negative. For total (unsigned) area, split at the roots and integrate the absolute value piecewise.", ["Find where $f=0$.", "Integrate over each sign region.", "Add magnitudes for total area, or keep signs for net area."])
  ],
  examples: [
    ex("Distance from velocity", "A car's velocity is recorded over time.", "The definite integral of velocity is the net displacement — the Fundamental Theorem in action."),
    ex("Total rainfall", "A gauge reports rainfall rate through a storm.", "Integrating the rate over the storm's duration gives total accumulated rainfall."),
    ex("Area of an odd region", "Land bounded by a curved river.", "A definite integral computes the area under the boundary curve.")
  ],
  videos: vids("antiderivative indefinite integral power rule +C", "riemann sums definite integral fundamental theorem examples", "calculus integrals FTC worked problems"),
  problems: [
    pr("p01","easy","Find $\\int x^3\\,dx$.","$\\dfrac{x^4}{4}+C$",["Add one to the power, divide.","$\\dfrac{x^4}{4}$.","$+C$."],"Reverse the power rule."),
    pr("p02","easy","Find $\\int (2x+3)\\,dx$.","$x^2+3x+C$",["Term by term.","$x^2+3x$.","$+C$."],"Integrate each term."),
    pr("p03","easy","Find $\\int\\cos x\\,dx$.","$\\sin x+C$",["Reverse $\\frac{d}{dx}\\sin x=\\cos x$.","$\\sin x$.","$+C$."],"What differentiates to $\\cos x$?"),
    pr("p04","medium","Evaluate $\\int_0^2 x\\,dx$.","$2$",["$F=\\tfrac12 x^2$.","$F(2)-F(0)=2-0$.","$=2$."],"FTC: $F(b)-F(a)$."),
    pr("p05","medium","Evaluate $\\int_1^3 (2x)\\,dx$.","$8$",["$F=x^2$.","$9-1$.","$=8$."],"Antiderivative then subtract."),
    pr("p06","medium","Evaluate $\\int_0^{\\pi}\\sin x\\,dx$.","$2$",["$F=-\\cos x$.","$-\\cos\\pi-(-\\cos0)=1+1$.","$=2$."],"$\\int\\sin=-\\cos$."),
    pr("p07","hard","Evaluate $\\int_1^2\\dfrac1x\\,dx$.","$\\ln 2$",["$F=\\ln|x|$.","$\\ln2-\\ln1$.","$=\\ln2$."],"$\\int 1/x=\\ln|x|$."),
    pr("p08","hard","Find the area under $f(x)=x^2$ from $0$ to $3$.","$9$",["$\\int_0^3 x^2\\,dx=\\big[\\tfrac{x^3}{3}\\big]_0^3$.","$=9-0$.","$=9$."],"Definite integral of $x^2$.")
  ] }
];

// ---- write lessons + register ---------------------------------------------
function writeLessons(list) {
  for (const L of list) {
    const doc = {
      title: L.title,
      summary: L.summary,
      glossary: L.glossary,
      concept_sections: L.concepts,
      real_world_examples: L.examples,
      videos: L.videos,
      problems: L.problems
    };
    fs.writeFileSync(path.join(LDIR, L.id + ".json"), JSON.stringify(doc, null, 2) + "\n");
  }
}
module.exports = { LESSONS, writeLessons };
if (require.main === module) { writeLessons(LESSONS); console.log("wrote " + LESSONS.length + " calc1 lessons (partial seed)"); }
