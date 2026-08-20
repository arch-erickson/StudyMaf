/* StudyMAF — question generators for the MATH classes (Calculus I/II, College
 * Algebra). Self-contained: registers into window.Generators (from generators.js)
 * with its own local helpers, so each math lesson gets endless fresh numeric/MC
 * problems for Learn checks, Practice, and Quiz — the same engine PHYS uses.
 * Loaded after js/generators.js. */
(function () {
  "use strict";
  if (!window.Generators || !window.Generators.register) return;
  var G = window.Generators.register;

  function R(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }        // int in [a,b]
  function RN(a, b) { var v = R(a, b); return v === 0 ? (b > 0 ? 1 : -1) : v; }    // nonzero int
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function sig(x) { if (x === 0) return "0"; var a = Math.abs(x); if (a >= 1e5 || a < 1e-3) return x.toExponential(2); return (+x.toPrecision(4)).toString(); }
  function num(prompt, value, tol, steps, hint, unit) { return { type: "numeric", prompt: prompt, answerValue: value, answerText: sig(value), unit: unit || "", tol: tol == null ? 0.02 : tol, steps: steps, hint: hint }; }
  function mc(prompt, choices, idx, steps, hint) { return { type: "mc", prompt: prompt, choices: choices, answerIndex: idx, steps: steps, hint: hint }; }
  function S(inst, source) { inst.source = source; return inst; }
  var SRC = "MAT syllabus";

  // ============================ CALCULUS I ============================
  G("calc1-01-limits", {
    easy: [
      function () { var a = R(1, 5), b = R(1, 6), c = R(0, 6); return num("Evaluate $\\lim_{x\\to " + a + "}(" + b + "x+" + c + ")$.", b * a + c, 0.001, ["Polynomial — substitute $x=" + a + "$.", "$" + b + "(" + a + ")+" + c + "$.", "$=" + (b * a + c) + "$."], "Direct substitution."); },
      function () { var a = R(1, 4), p = R(2, 3); return num("Evaluate $\\lim_{x\\to " + a + "}x^{" + p + "}$.", Math.pow(a, p), 0.001, ["Substitute.", "$" + a + "^{" + p + "}$.", "$=" + Math.pow(a, p) + "$."], "Plug in."); }
    ],
    medium: [
      function () { var a = R(1, 6); return num("Evaluate $\\lim_{x\\to " + a + "}\\dfrac{x^2-" + (a * a) + "}{x-" + a + "}$.", 2 * a, 0.01, ["$0/0$: factor $(x-" + a + ")(x+" + a + ")$.", "Cancel to $x+" + a + "$.", "$=" + (2 * a) + "$."], "Factor the difference of squares."); },
      function () { var a = R(1, 4), b = R(1, 5); var lim = a + b; return num("Evaluate $\\lim_{x\\to " + a + "}\\dfrac{x^2-(" + (a - b) + ")x-" + (a * b) + "}{x-" + a + "}$.", lim, 0.01, ["Factor: $(x-" + a + ")(x+" + b + ")$.", "Cancel $(x-" + a + ")$.", "$" + a + "+" + b + "=" + lim + "$."], "Factor the quadratic top."); }
    ],
    hard: [
      function () { var a = R(2, 6); return num("Evaluate $\\lim_{x\\to 0}\\dfrac{\\sqrt{x+" + (a * a) + "}-" + a + "}{x}$.", 1 / (2 * a), 0.02, ["Multiply by the conjugate $\\sqrt{x+" + (a * a) + "}+" + a + "$.", "Simplify to $\\dfrac{1}{\\sqrt{x+" + (a * a) + "}+" + a + "}$.", "At $0$: $\\dfrac{1}{2\\cdot" + a + "}$."], "Rationalize the numerator."); }
    ],
    extreme: [
      function () { return mc("$\\lim_{x\\to0}x^2\\sin(1/x)=?$", ["$0$", "$1$", "does not exist", "$\\infty$"], 0, ["$-x^2\\le x^2\\sin(1/x)\\le x^2$.", "Both bounds $\\to0$.", "Squeeze theorem gives $0$."], "Squeeze it."); }
    ]
  });
  G("calc1-02-continuity", {
    easy: [
      function () { var a = R(2, 8); return mc("Where is $f(x)=\\dfrac{1}{x-" + a + "}$ discontinuous?", ["$x=" + a + "$", "$x=0$", "$x=-" + a + "$", "nowhere"], 0, ["Denominator zero.", "$x-" + a + "=0$.", "$x=" + a + "$."], "Set the denominator to 0."); }
    ],
    medium: [
      function () { var m = R(2, 5), b = R(1, 6); var k = (m + b); return num("Find $k$ so $f(x)=\\{x+" + b + "\\ (x\\le1);\\ kx\\ (x>1)\\}$ is continuous.", m, 0.001, ["Left value at 1: $1+" + b + "=" + (1 + b) + "$.", "Right: $k(1)=k$.", "$k=" + (1 + b) + "$."], "Make the pieces meet at $x=1$."); }
    ],
    hard: [
      function () { var lo = R(-3, -1), hi = R(1, 3); return mc("Does $f(x)=x^3+x-1$ have a root in $[" + lo + "," + hi + "]$?", ["Yes, by the IVT", "No", "Cannot tell", "Only if continuous fails"], 0, ["$f$ is continuous.", "$f(" + lo + ")<0$ and $f(" + hi + ")>0$.", "IVT ⇒ a root exists."], "Look for a sign change."); }
    ],
    extreme: [
      function () { var a = R(2, 4); return num("For $f(x)=\\{x^2\\ (x\\le" + a + ");\\ 6x+c\\ (x>" + a + ")\\}$, find $c$ for continuity.", a * a - 6 * a, 0.01, ["Match at $x=" + a + "$: $" + a + "^2=6(" + a + ")+c$.", "$c=" + (a * a) + "-" + (6 * a) + "$.", "$c=" + (a * a - 6 * a) + "$."], "Set the two pieces equal at the boundary."); }
    ]
  });
  G("calc1-03-derivative-definition", {
    easy: [
      function () { var m = R(2, 6), b = R(0, 6); return num("For $f(x)=" + m + "x+" + b + "$, find $f'(x)$.", m, 0.001, ["A line's slope is constant.", "$f'(x)=" + m + "$.", "Done."], "Derivative of a line is its slope."); }
    ],
    medium: [
      function () { var a = R(1, 6); return num("For $f(x)=x^2$, find $f'(" + a + ")$.", 2 * a, 0.01, ["$f'(x)=2x$.", "At $x=" + a + "$: $2(" + a + ")$.", "$=" + (2 * a) + "$."], "$f'(x)=2x$."); }
    ],
    hard: [
      function () { var a = R(1, 6); return num("Find the slope of the tangent to $f(x)=x^2-" + (2 * a) + "x$ at its lowest point.", 0, 0.001, ["$f'(x)=2x-" + (2 * a) + "$.", "Lowest point: $f'=0$ at $x=" + a + "$.", "Slope $=0$."], "Vertex has horizontal tangent."); }
    ],
    extreme: [
      function () { var a = R(2, 5); return num("For $f(x)=\\dfrac1x$, find $f'(" + a + ")$.", -1 / (a * a), 0.02, ["$f'(x)=-1/x^2$.", "At $x=" + a + "$: $-1/" + (a * a) + "$.", "$=" + sig(-1 / (a * a)) + "$."], "$\\frac{d}{dx}(1/x)=-1/x^2$."); }
    ]
  });
  G("calc1-04-differentiation-rules", {
    easy: [
      function () { var n = R(2, 7), a = R(1, 5); return num("Differentiate $f(x)=" + a + "x^{" + n + "}$ and evaluate $f'(1)$.", a * n, 0.001, ["$f'=" + a + "\\cdot" + n + "x^{" + (n - 1) + "}$.", "At $x=1$: $" + (a * n) + "$.", "Done."], "Power rule, then plug in 1."); }
    ],
    medium: [
      function () { var a = R(2, 5), b = R(1, 5), c = R(1, 6), x = R(1, 3); var d = 2 * a * x + b; return num("For $f(x)=" + a + "x^2+" + b + "x+" + c + "$, find $f'(" + x + ")$.", d, 0.01, ["$f'=" + (2 * a) + "x+" + b + "$.", "At $x=" + x + "$: $" + (2 * a) + "(" + x + ")+" + b + "$.", "$=" + d + "$."], "Differentiate term by term."); }
    ],
    hard: [
      function () { var a = R(1, 4); return num("For $f(x)=\\dfrac{x}{x+" + a + "}$, find $f'(0)$.", 1 / (a * a), 0.02, ["Quotient rule: $\\dfrac{(x+" + a + ")-x}{(x+" + a + ")^2}=\\dfrac{" + a + "}{(x+" + a + ")^2}$.", "At $x=0$: $" + a + "/" + (a * a) + "$.", "$=" + sig(1 / a) + "$? No: $=1/" + (a * a) + "\\cdot" + a + "$."], "Quotient rule."); }
    ],
    extreme: [
      function () { var a = R(2, 5), x = R(1, 3); return num("For $f(x)=x^4$, find $f''(" + x + ")$.", 12 * x * x, 0.01, ["$f'=4x^3$, $f''=12x^2$.", "At $x=" + x + "$: $12(" + (x * x) + ")$.", "$=" + (12 * x * x) + "$."], "Differentiate twice."); }
    ]
  });
  G("calc1-05-rates-trig", {
    easy: [
      function () { var a = R(1, 5); return num("Position $s(t)=t^2-" + (2 * a) + "t$. Find velocity at $t=" + (a + 1) + "$.", 2 * (a + 1) - 2 * a, 0.01, ["$v=2t-" + (2 * a) + "$.", "At $t=" + (a + 1) + "$: $" + (2 * (a + 1)) + "-" + (2 * a) + "$.", "$=" + (2) + "$."], "Velocity is $s'$."); }
    ],
    medium: [
      function () { var a = R(2, 5); return num("Differentiate $f(x)=" + a + "\\sin x$ and evaluate $f'(0)$.", a, 0.01, ["$f'=" + a + "\\cos x$.", "At $0$: $" + a + "(1)$.", "$=" + a + "$."], "$\\cos0=1$."); }
    ],
    hard: [
      function () { var a = R(1, 4); return num("Position $s(t)=t^3-" + (3 * a) + "t$. At what $t>0$ is it at rest?", Math.sqrt(a), 0.03, ["$v=3t^2-" + (3 * a) + "=0$.", "$t^2=" + a + "$.", "$t=\\sqrt{" + a + "}=" + sig(Math.sqrt(a)) + "$."], "At rest ⇒ $v=0$."); }
    ],
    extreme: [
      function () { return mc("$\\frac{d}{dx}\\tan x=?$", ["$\\sec^2 x$", "$-\\csc^2 x$", "$\\sec x\\tan x$", "$-\\sin x$"], 0, ["Standard result.", "$\\frac{d}{dx}\\tan x=\\sec^2 x$.", "Done."], "Memorize it."); }
    ]
  });
  G("calc1-06-chain-rule", {
    easy: [
      function () { var a = R(2, 5), n = R(2, 4); return num("Differentiate $f(x)=(" + a + "x+1)^{" + n + "}$ and evaluate $f'(0)$.", n * Math.pow(1, n - 1) * a, 0.01, ["$f'=" + n + "(" + a + "x+1)^{" + (n - 1) + "}\\cdot" + a + "$.", "At $x=0$: $" + n + "(1)" + "\\cdot" + a + "$.", "$=" + (n * a) + "$."], "Power times inner derivative."); }
    ],
    medium: [
      function () { var a = R(2, 5); return num("Differentiate $f(x)=\\sin(" + a + "x)$ and evaluate $f'(0)$.", a, 0.01, ["$f'=" + a + "\\cos(" + a + "x)$.", "At $0$: $" + a + "(1)$.", "$=" + a + "$."], "Chain rule brings out the $" + a + "$."); }
    ],
    hard: [
      function () { var a = R(1, 4); return num("Differentiate $f(x)=\\sqrt{x^2+" + a + "}$ and evaluate $f'(2)$.", 2 / Math.sqrt(4 + a), 0.03, ["$f'=\\dfrac{x}{\\sqrt{x^2+" + a + "}}$.", "At $x=2$: $\\dfrac{2}{\\sqrt{" + (4 + a) + "}}$.", "$=" + sig(2 / Math.sqrt(4 + a)) + "$."], "Inner derivative is $2x$."); }
    ],
    extreme: [
      function () { return mc("$\\frac{d}{dx}\\sin^2 x=?$", ["$2\\sin x\\cos x$", "$2\\sin x$", "$\\cos^2 x$", "$2\\cos x$"], 0, ["$(\\sin x)^2$; power rule.", "$2\\sin x\\cdot\\cos x$.", "Done."], "Inner derivative $\\cos x$."); }
    ]
  });
  G("calc1-07-inverse-implicit", {
    easy: [
      function () { var a = R(2, 6), b = R(1, 5); var m = -a / b; return num("For $x^2+y^2=" + (a * a + b * b) + "$, find $\\dfrac{dy}{dx}$ at $(" + a + "," + b + ")$.", m, 0.02, ["$y'=-x/y$.", "At $(" + a + "," + b + ")$: $-" + a + "/" + b + "$.", "$=" + sig(m) + "$."], "$y'=-x/y$ for a circle."); }
    ],
    medium: [
      function () { var a = R(2, 5), b = R(1, 4); var m = -b / a; return num("For $xy=" + (a * b) + "$, find $y'$ at $(" + a + "," + b + ")$.", m, 0.02, ["$y+xy'=0$ so $y'=-y/x$.", "At $(" + a + "," + b + ")$: $-" + b + "/" + a + "$.", "$=" + sig(m) + "$."], "$y'=-y/x$."); }
    ],
    hard: [
      function () { var a = R(2, 4); return num("Differentiate $f(x)=\\arctan(" + a + "x)$ and evaluate $f'(0)$.", a, 0.01, ["$f'=\\dfrac{" + a + "}{1+(" + a + "x)^2}$.", "At $0$: $" + a + "/1$.", "$=" + a + "$."], "arctan derivative times inner."); }
    ],
    extreme: [
      function () { return mc("$\\frac{d}{dx}\\arcsin x=?$", ["$\\dfrac{1}{\\sqrt{1-x^2}}$", "$\\dfrac{1}{1+x^2}$", "$-\\dfrac{1}{\\sqrt{1-x^2}}$", "$\\cos x$"], 0, ["Inverse-sine derivative.", "$\\dfrac{1}{\\sqrt{1-x^2}}$.", "Done."], "Memorize the inverse-trig derivatives."); }
    ]
  });
  G("calc1-08-exp-log-derivatives", {
    easy: [
      function () { var a = R(2, 5); return num("Differentiate $f(x)=e^{" + a + "x}$ and evaluate $f'(0)$.", a, 0.01, ["$f'=" + a + "e^{" + a + "x}$.", "At $0$: $" + a + "(1)$.", "$=" + a + "$."], "Chain rule on $e$."); }
    ],
    medium: [
      function () { var a = R(1, 5); return num("Differentiate $f(x)=\\ln(x^2+" + a + ")$ and evaluate $f'(1)$.", 2 / (1 + a), 0.02, ["$f'=\\dfrac{2x}{x^2+" + a + "}$.", "At $x=1$: $\\dfrac{2}{" + (1 + a) + "}$.", "$=" + sig(2 / (1 + a)) + "$."], "$\\ln g\\to g'/g$."); }
    ],
    hard: [
      function () { var C = R(50, 200), k = pick([0.1, 0.2, 0.25, 0.5]); return num("A culture grows as $N=" + C + "e^{" + k + "t}$. Find $N'(0)$.", C * k, 0.02, ["$N'=" + C + "(" + k + ")e^{" + k + "t}$.", "At $t=0$: $" + C + "\\cdot" + k + "$.", "$=" + sig(C * k) + "$."], "$\\frac{d}{dt}Ce^{kt}=kCe^{kt}$."); }
    ],
    extreme: [
      function () { return mc("$\\frac{d}{dx}2^x=?$", ["$2^x\\ln 2$", "$x\\,2^{x-1}$", "$2^x$", "$\\dfrac{2^x}{\\ln 2}$"], 0, ["Base-$a$ rule.", "$a^x\\ln a$.", "$2^x\\ln2$."], "Extra $\\ln a$ factor."); }
    ]
  });
  G("calc1-09-related-rates", {
    easy: [
      function () { var r = R(3, 8), dr = R(1, 4); return num("A circle's radius grows at $" + dr + "$ cm/s. How fast is the area growing when $r=" + r + "$? (as a multiple of $\\pi$)", 2 * r * dr, 0.01, ["$\\dot A=2\\pi r\\dot r$.", "$=2\\pi(" + r + ")(" + dr + ")$.", "$=" + (2 * r * dr) + "\\pi$."], "$\\dot A=2\\pi r\\dot r$; give the number times $\\pi$."); }
    ],
    medium: [
      function () { var s = R(5, 12), ds = R(1, 4); return num("A square's side grows at $" + ds + "$ cm/s. How fast is its area growing at side $" + s + "$?", 2 * s * ds, 0.01, ["$\\dot A=2s\\dot s$.", "$=2(" + s + ")(" + ds + ")$.", "$=" + (2 * s * ds) + "$ cm²/s."], "$\\dot A=2s\\dot s$."); }
    ],
    hard: [
      function () { var x = R(3, 6), L = 10, dx = R(1, 3); var y = Math.sqrt(L * L - x * x); var dy = -x * dx / y; return num("A 10-ft ladder's base moves out at $" + dx + "$ ft/s. How fast does the top drop when the base is $" + x + "$ ft out?", dy, 0.03, ["$x\\dot x+y\\dot y=0$, $y=\\sqrt{100-" + (x * x) + "}=" + sig(y) + "$.", "$" + x + "(" + dx + ")+" + sig(y) + "\\dot y=0$.", "$\\dot y=" + sig(dy) + "$ ft/s."], "Use $x\\dot x+y\\dot y=0$."); }
    ],
    extreme: [
      function () { var vx = pick([30, 40, 60]), vy = pick([40, 30, 80]); var v = Math.sqrt(vx * vx + vy * vy); return num("Two cars leave a point, one at $" + vx + "$ mph east, one at $" + vy + "$ mph north. How fast do they separate?", v, 0.02, ["$z\\dot z=x\\dot x+y\\dot y$; after 1h, $z=\\sqrt{" + (vx * vx) + "+" + (vy * vy) + "}$.", "$\\dot z=\\sqrt{" + vx + "^2+" + vy + "^2}$.", "$=" + sig(v) + "$ mph."], "Pythagorean related rate."); }
    ]
  });
  G("calc1-10-linearization", {
    easy: [
      function () { var a = pick([4, 9, 16, 25]); var r = Math.sqrt(a), d = pick([0.1, 0.2, -0.1]); var est = r + d / (2 * r); return num("Use linearization of $\\sqrt{x}$ at $" + a + "$ to estimate $\\sqrt{" + (a + d) + "}$.", est, 0.02, ["$L(x)=" + r + "+\\tfrac{1}{2\\cdot" + r + "}(x-" + a + ")$.", "$L(" + (a + d) + ")=" + r + "+" + sig(d / (2 * r)) + "$.", "$\\approx" + sig(est) + "$."], "$L=f(a)+f'(a)(x-a)$."); }
    ],
    medium: [
      function () { var s = R(3, 8), ds = pick([0.1, 0.05, 0.2]); return num("A cube's side is $" + s + "\\pm" + ds + "$ cm. Estimate the error in volume.", 3 * s * s * ds, 0.03, ["$dV=3s^2\\,ds$.", "$=3(" + (s * s) + ")(" + ds + ")$.", "$=" + sig(3 * s * s * ds) + "$ cm³."], "$dV=3s^2\\,ds$."); }
    ],
    hard: [
      function () { var b = R(2, 3), d = pick([0.01, 0.02, 0.03]); var est = b * b * b + 3 * b * b * d; return num("Estimate $(" + b + "+" + d + ")^3$ using differentials.", est, 0.01, ["$dy=3x^2\\,dx$ at $x=" + b + "$: $" + (3 * b * b) + "(" + d + ")$.", "$" + (b * b * b) + "+" + sig(3 * b * b * d) + "$.", "$\\approx" + sig(est) + "$."], "$dy=f'(x)\\,dx$."); }
    ],
    extreme: [
      function () { var r = R(5, 20), dr = pick([0.05, 0.1]); return num("A circle's radius is $" + r + "\\pm" + dr + "$. Estimate the % error in area.", 100 * 2 * dr / r, 0.03, ["$dA/A=2\\,dr/r$.", "$=2(" + dr + "/" + r + ")$.", "$=" + sig(100 * 2 * dr / r) + "\\%$."], "Relative area error is twice the radius error."); }
    ]
  });
  G("calc1-11-extrema-mvt", {
    easy: [
      function () { var a = R(2, 8); return num("Find the critical point of $f(x)=x^2-" + (2 * a) + "x+1$.", a, 0.01, ["$f'=2x-" + (2 * a) + "=0$.", "$x=" + a + "$.", "Done."], "Solve $f'(x)=0$."); }
    ],
    medium: [
      function () { var a = R(1, 4); return num("Larger critical point of $f(x)=x^3-" + (3 * a) + "x$ (i.e. positive one).", Math.sqrt(a), 0.03, ["$f'=3x^2-" + (3 * a) + "=0$.", "$x^2=" + a + "$.", "$x=\\sqrt{" + a + "}=" + sig(Math.sqrt(a)) + "$."], "Set the derivative to zero."); }
    ],
    hard: [
      function () { var a = R(1, 4), b = R(a + 1, 6); var c = (a + b); return num("For $f(x)=x^2$ on $[" + a + "," + b + "]$, find the Mean Value Theorem point $c$.", c / 2, 0.02, ["Average rate $=\\dfrac{" + (b * b) + "-" + (a * a) + "}{" + (b - a) + "}=" + (a + b) + "$.", "$f'(c)=2c=" + (a + b) + "$.", "$c=" + sig((a + b) / 2) + "$."], "$f'(c)=$ average rate."); }
    ],
    extreme: [
      function () { var a = R(1, 4); return num("Absolute max of $f(x)=x^2-" + (2 * a) + "x$ on $[0," + (2 * a) + "]$ (the value).", 0, 0.01, ["Critical $x=" + a + "$: $f=" + (a * a - 2 * a * a) + "$; endpoints $f(0)=0$, $f(" + (2 * a) + ")=0$.", "Largest value is $0$.", "Max $=0$."], "Compare critical points and endpoints."); }
    ]
  });
  G("calc1-12-curve-sketching", {
    easy: [
      function () { var a = R(2, 8); return mc("On what interval is $f(x)=x^2-" + (2 * a) + "x$ increasing?", ["$x>" + a + "$", "$x<" + a + "$", "all $x$", "$x>0$"], 0, ["$f'=2x-" + (2 * a) + ">0$.", "$x>" + a + "$.", "Increasing there."], "Solve $f'>0$."); }
    ],
    medium: [
      function () { var a = R(1, 5); return num("Find the inflection $x$ of $f(x)=x^3-" + (3 * a) + "x^2$.", a, 0.01, ["$f''=6x-" + (6 * a) + "=0$.", "$x=" + a + "$.", "Sign changes ⇒ inflection."], "$f''=0$."); }
    ],
    hard: [
      function () { var a = R(2, 6), b = R(1, 5); return num("Horizontal asymptote of $f(x)=\\dfrac{" + a + "x+" + b + "}{x-3}$ (the $y$-value).", a, 0.01, ["Equal degrees.", "Ratio of leading coefficients $" + a + "/1$.", "$y=" + a + "$."], "Compare leading terms."); }
    ],
    extreme: [
      function () { var a = R(2, 5); return num("Horizontal asymptote of $f(x)=\\dfrac{" + a + "x^2}{x^2+1}$.", a, 0.01, ["Equal degrees.", "Leading ratio $" + a + "/1$.", "$y=" + a + "$."], "Degrees equal ⇒ coefficient ratio."); }
    ]
  });
  G("calc1-13-optimization-lhopital", {
    easy: [
      function () { var s = R(6, 20); return num("Two positive numbers sum to $" + s + "$. Maximize their product.", (s / 2) * (s / 2), 0.01, ["$P=x(" + s + "-x)$.", "$P'=" + s + "-2x=0\\Rightarrow x=" + (s / 2) + "$.", "$P=" + ((s / 2) * (s / 2)) + "$."], "Equal split maximizes product."); }
    ],
    medium: [
      function () { var p = R(20, 40); return num("A rectangle has perimeter $" + p + "$. Find its maximum area.", (p / 4) * (p / 4), 0.01, ["$A=x(" + (p / 2) + "-x)$.", "Max at $x=" + (p / 4) + "$ (a square).", "$A=" + ((p / 4) * (p / 4)) + "$."], "Fixed perimeter ⇒ square."); }
    ],
    hard: [
      function () { return num("$\\lim_{x\\to0}\\dfrac{e^x-1}{x}=?$", 1, 0.001, ["$0/0$; L'Hôpital: $\\dfrac{e^x}{1}$.", "At $0$: $1$.", "$=1$."], "Differentiate top and bottom."); }
    ],
    extreme: [
      function () { return mc("$\\lim_{x\\to\\infty}\\dfrac{\\ln x}{x}=?$", ["$0$", "$1$", "$\\infty$", "$e$"], 0, ["$\\infty/\\infty$; L'Hôpital: $\\dfrac{1/x}{1}$.", "$\\to0$.", "$=0$."], "$\\ln$ grows slower than $x$."); }
    ]
  });
  G("calc1-14-integral", {
    easy: [
      function () { var b = R(2, 5); return num("Evaluate $\\int_0^{" + b + "} x\\,dx$.", b * b / 2, 0.01, ["$F=\\tfrac12 x^2$.", "$\\tfrac12(" + b + ")^2-0$.", "$=" + (b * b / 2) + "$."], "FTC."); }
    ],
    medium: [
      function () { var a = R(1, 3), b = R(a + 1, 5); return num("Evaluate $\\int_{" + a + "}^{" + b + "} 2x\\,dx$.", b * b - a * a, 0.01, ["$F=x^2$.", "$" + (b * b) + "-" + (a * a) + "$.", "$=" + (b * b - a * a) + "$."], "Antiderivative $x^2$."); }
    ],
    hard: [
      function () { var b = R(2, 4); return num("Evaluate $\\int_0^{" + b + "} x^2\\,dx$.", b * b * b / 3, 0.01, ["$F=\\tfrac{x^3}{3}$.", "$\\tfrac{" + (b * b * b) + "}{3}$.", "$=" + sig(b * b * b / 3) + "$."], "$\\int x^2=x^3/3$."); }
    ],
    extreme: [
      function () { return num("Evaluate $\\int_0^{\\pi}\\sin x\\,dx$.", 2, 0.01, ["$F=-\\cos x$.", "$-\\cos\\pi+\\cos0=1+1$.", "$=2$."], "$\\int\\sin=-\\cos$."); }
    ]
  });

  // ============================ CALCULUS II ============================
  G("calc2-01-antiderivatives-ftc", {
    easy: [function () { var b = R(2, 5); return num("Evaluate $\\int_0^{" + b + "} x^2\\,dx$.", b * b * b / 3, 0.01, ["$F=x^3/3$.", "$" + (b * b * b) + "/3$.", "$=" + sig(b * b * b / 3) + "$."], "FTC."); }],
    medium: [function () { var b = R(2, 4); return num("Find the average value of $f(x)=x^2$ on $[0," + b + "]$.", b * b / 3, 0.01, ["$\\tfrac1{" + b + "}\\int_0^{" + b + "}x^2=\\tfrac1{" + b + "}\\cdot\\tfrac{" + (b * b * b) + "}{3}$.", "$=" + sig(b * b / 3) + "$.", "Done."], "$\\tfrac{1}{b-a}\\int f$."); }],
    hard: [function () { var a = R(1, 3); return num("Evaluate $\\int_0^{\\pi/2}" + a + "\\cos x\\,dx$.", a, 0.01, ["$F=" + a + "\\sin x$.", "$" + a + "(\\sin(\\pi/2)-0)$.", "$=" + a + "$."], "$\\int\\cos=\\sin$."); }],
    extreme: [function () { var x = R(1, 3); return num("Find $\\dfrac{d}{dx}\\int_0^{x^2}\\sin t\\,dt$ at $x=" + x + "$ (numeric, radians).", 2 * x * Math.sin(x * x), 0.03, ["FTC + chain: $2x\\sin(x^2)$.", "At $x=" + x + "$: $" + (2 * x) + "\\sin(" + (x * x) + ")$.", "$=" + sig(2 * x * Math.sin(x * x)) + "$."], "Chain rule on the upper limit."); }]
  });
  G("calc2-02-substitution", {
    easy: [function () { var a = R(2, 4); return num("Evaluate $\\int_0^1 " + (2) + "x(x^2+1)^{" + a + "}\\,dx$.", (Math.pow(2, a + 1) - 1) / (a + 1), 0.02, ["$u=x^2+1$, limits $1\\to2$.", "$\\int_1^2 u^{" + a + "}\\,du=\\tfrac{2^{" + (a + 1) + "}-1}{" + (a + 1) + "}$.", "$=" + sig((Math.pow(2, a + 1) - 1) / (a + 1)) + "$."], "Let $u=x^2+1$, change limits."); }],
    medium: [function () { var a = R(2, 5); return mc("$\\int\\dfrac{" + (2) + "x}{x^2+" + a + "}\\,dx=?$", ["$\\ln(x^2+" + a + ")+C$", "$\\dfrac{2}{x^2+" + a + "}+C$", "$2x\\ln(x^2+" + a + ")+C$", "$\\arctan x+C$"], 0, ["Top is the derivative of the bottom.", "$\\int g'/g=\\ln|g|$.", "$\\ln(x^2+" + a + ")+C$."], "Log pattern."); }],
    hard: [function () { return mc("$\\int x e^{x^2}\\,dx=?$", ["$\\tfrac12 e^{x^2}+C$", "$e^{x^2}+C$", "$2e^{x^2}+C$", "$x e^{x^2}+C$"], 0, ["$u=x^2$, $du=2x\\,dx$.", "$\\tfrac12\\int e^u\\,du$.", "$\\tfrac12 e^{x^2}+C$."], "Adjust by $\\tfrac12$."); }],
    extreme: [function () { return num("Evaluate $\\int_0^1 x(x^2+1)^2\\,dx$ (numeric).", (Math.pow(2, 3) - 1) / 6, 0.02, ["$u=x^2+1$: $\\tfrac12\\int_1^2 u^2\\,du$.", "$\\tfrac12\\cdot\\tfrac{8-1}{3}$.", "$=" + sig(7 / 6) + "$."], "$\\tfrac12$ from $du=2x\\,dx$."); }]
  });
  G("calc2-03-parts", {
    easy: [function () { return num("Evaluate $\\int_0^1 x e^x\\,dx$.", 1, 0.01, ["Antiderivative $e^x(x-1)$.", "$[e^x(x-1)]_0^1=0-(-1)$.", "$=1$."], "Parts with $u=x$."); }],
    medium: [function () { return mc("$\\int \\ln x\\,dx=?$", ["$x\\ln x-x+C$", "$\\tfrac1x+C$", "$\\ln x-x+C$", "$x\\ln x+C$"], 0, ["$u=\\ln x$, $dv=dx$.", "$x\\ln x-\\int1\\,dx$.", "$x\\ln x-x+C$."], "$u=\\ln x$, $dv=dx$."); }],
    hard: [function () { return num("Evaluate $\\int_0^{\\pi} x\\sin x\\,dx$.", Math.PI, 0.02, ["Parts: $-x\\cos x+\\sin x$.", "$[-x\\cos x+\\sin x]_0^\\pi=\\pi$.", "$=" + sig(Math.PI) + "$."], "$u=x$, $dv=\\sin x\\,dx$."); }],
    extreme: [function () { return mc("$\\int e^x\\sin x\\,dx=?$", ["$\\tfrac12 e^x(\\sin x-\\cos x)+C$", "$e^x\\sin x+C$", "$e^x\\cos x+C$", "$-e^x\\cos x+C$"], 0, ["Parts twice returns the original.", "Solve for $I$ algebraically.", "$\\tfrac12 e^x(\\sin x-\\cos x)+C$."], "Cyclic integral."); }]
  });
  G("calc2-04-trig-integrals", {
    easy: [function () { return num("Evaluate $\\int_0^{\\pi}\\sin^2 x\\,dx$.", Math.PI / 2, 0.02, ["$\\sin^2=\\tfrac{1-\\cos2x}{2}$.", "$[\\tfrac{x}{2}]_0^\\pi$.", "$=\\pi/2=" + sig(Math.PI / 2) + "$."], "Average of $\\sin^2$ is $\\tfrac12$."); }],
    medium: [function () { return mc("$\\int \\sin x\\cos^2 x\\,dx=?$", ["$-\\tfrac13\\cos^3 x+C$", "$\\tfrac13\\cos^3 x+C$", "$\\sin^2 x+C$", "$-\\cos^3 x+C$"], 0, ["$u=\\cos x$, $du=-\\sin x\\,dx$.", "$-\\int u^2\\,du$.", "$-\\tfrac13\\cos^3 x+C$."], "$u=\\cos x$."); }],
    hard: [function () { return num("Evaluate $\\int_0^{\\pi}\\cos^2 x\\,dx$.", Math.PI / 2, 0.02, ["$\\cos^2=\\tfrac{1+\\cos2x}{2}$.", "$[\\tfrac{x}{2}]_0^\\pi$.", "$=\\pi/2$."], "Power reduction."); }],
    extreme: [function () { return mc("$\\int\\sec^2 x\\tan x\\,dx=?$", ["$\\tfrac12\\tan^2 x+C$", "$\\sec x+C$", "$\\tan^2 x+C$", "$\\ln|\\sec x|+C$"], 0, ["$u=\\tan x$, $du=\\sec^2 x\\,dx$.", "$\\int u\\,du$.", "$\\tfrac12\\tan^2 x+C$."], "Save $\\sec^2$ for $du$."); }]
  });
  G("calc2-05-trig-substitution", {
    easy: [function () { var a = R(2, 6); return mc("Which substitution suits $\\int\\dfrac{dx}{\\sqrt{" + (a * a) + "-x^2}}$?", ["$x=" + a + "\\sin\\theta$", "$x=" + a + "\\tan\\theta$", "$x=" + a + "\\sec\\theta$", "$u=x^2$"], 0, ["Form $a^2-x^2$.", "Use $x=a\\sin\\theta$.", "$x=" + a + "\\sin\\theta$."], "$a^2-x^2\\Rightarrow\\sin$."); }],
    medium: [function () { return mc("$\\int\\dfrac{dx}{1+x^2}=?$", ["$\\arctan x+C$", "$\\arcsin x+C$", "$\\ln(1+x^2)+C$", "$\\dfrac{1}{x}+C$"], 0, ["$x=\\tan\\theta$.", "Reduces to $\\int d\\theta$.", "$\\arctan x+C$."], "$a^2+x^2\\Rightarrow\\tan$."); }],
    hard: [function () { var a = R(2, 5); return num("For $x=" + a + "\\sin\\theta$, evaluate $\\sqrt{" + (a * a) + "-x^2}$ when $\\theta=0$.", a, 0.01, ["$" + a + "\\cos\\theta$.", "At $\\theta=0$: $" + a + "(1)$.", "$=" + a + "$."], "$\\sqrt{a^2-x^2}=a\\cos\\theta$."); }],
    extreme: [function () { return mc("Complete the square: $x^2+2x+5=?$", ["$(x+1)^2+4$", "$(x+1)^2+5$", "$(x+2)^2+1$", "$(x-1)^2+4$"], 0, ["Half of 2 is 1.", "$(x+1)^2-1+5$.", "$(x+1)^2+4$."], "Add and subtract $(b/2)^2$."); }]
  });
  G("calc2-06-partial-fractions", {
    easy: [function () { return mc("$\\dfrac{1}{(x-1)(x+1)}$ decomposes to?", ["$\\dfrac{1/2}{x-1}-\\dfrac{1/2}{x+1}$", "$\\dfrac{1}{x-1}+\\dfrac{1}{x+1}$", "$\\dfrac{1}{x-1}-\\dfrac{1}{x+1}$", "$\\dfrac{2}{x^2-1}$"], 0, ["Cover-up at $x=1$: $A=\\tfrac12$; at $x=-1$: $B=-\\tfrac12$.", "Combine.", "$\\tfrac{1/2}{x-1}-\\tfrac{1/2}{x+1}$."], "Cover-up method."); }],
    medium: [function () { var a = R(2, 5); return num("In $\\dfrac{" + (a + 1) + "x+1}{x(x+1)}=\\dfrac{A}{x}+\\dfrac{B}{x+1}$, find $A$.", 1, 0.01, ["At $x=0$: $A=\\dfrac{1}{1}$.", "$A=1$.", "Done."], "Cover-up at $x=0$."); }],
    hard: [function () { return mc("What form fits $\\dfrac{1}{x(x^2+1)}$?", ["$\\dfrac{A}{x}+\\dfrac{Bx+C}{x^2+1}$", "$\\dfrac{A}{x}+\\dfrac{B}{x^2+1}$", "$\\dfrac{A}{x}+\\dfrac{B}{x}$", "$\\dfrac{Ax+B}{x^2+1}$"], 0, ["$x$ linear, $x^2+1$ irreducible.", "Use $Bx+C$ over the quadratic.", "$\\dfrac{A}{x}+\\dfrac{Bx+C}{x^2+1}$."], "Irreducible quadratic needs $Bx+C$."); }],
    extreme: [function () { return mc("Before decomposing $\\dfrac{x^2}{x^2-1}$, you must…", ["divide first (improper)", "factor the top", "complete the square", "nothing"], 0, ["Equal degrees ⇒ improper.", "Divide: $1+\\dfrac{1}{x^2-1}$.", "Then decompose."], "Improper ⇒ divide first."); }]
  });
  G("calc2-07-improper", {
    easy: [function () { var p = pick([2, 3, 4]); return num("Evaluate $\\int_1^\\infty x^{-" + p + "}\\,dx$.", 1 / (p - 1), 0.02, ["$[\\tfrac{x^{" + (1 - p) + "}}{" + (1 - p) + "}]_1^\\infty$.", "$=\\dfrac{1}{" + (p - 1) + "}$.", "$=" + sig(1 / (p - 1)) + "$."], "$p$-integral value is $\\tfrac{1}{p-1}$."); }],
    medium: [function () { return num("Evaluate $\\int_0^\\infty e^{-x}\\,dx$.", 1, 0.01, ["$\\lim[-e^{-x}]_0^t=1$.", "Converges.", "$=1$."], "Exponential decay."); }],
    hard: [function () { return mc("Does $\\int_1^\\infty\\dfrac{1}{x}\\,dx$ converge?", ["No (diverges)", "Yes", "Only conditionally", "To 1"], 0, ["$\\int=\\ln t\\to\\infty$.", "Diverges.", "$p=1$ borderline."], "Harmonic-type diverges."); }],
    extreme: [function () { return num("Evaluate $\\int_0^1 x^{-1/2}\\,dx$.", 2, 0.02, ["$[2\\sqrt x]_0^1$.", "$=2$.", "Converges ($p=\\tfrac12<1$)."], "$\\int_0^1 x^{-p}$ converges for $p<1$."); }]
  });
  G("calc2-08-taylor-polynomials", {
    easy: [function () { var d = pick([0.1, 0.2, -0.1]); var est = 1 + d + d * d / 2; return num("Use the degree-2 Maclaurin polynomial of $e^x$ to estimate $e^{" + d + "}$.", est, 0.01, ["$1+x+\\tfrac{x^2}{2}$ at $x=" + d + "$.", "$1+" + d + "+" + sig(d * d / 2) + "$.", "$\\approx" + sig(est) + "$."], "$P_2=1+x+x^2/2$."); }],
    medium: [function () { var d = pick([0.2, 0.3, 0.1]); var est = 1 - d * d / 2; return num("Estimate $\\cos(" + d + ")$ with the degree-2 polynomial.", est, 0.01, ["$1-\\tfrac{x^2}{2}$.", "$1-" + sig(d * d / 2) + "$.", "$\\approx" + sig(est) + "$."], "$\\cos\\approx1-x^2/2$."); }],
    hard: [function () { return mc("Degree-3 Maclaurin polynomial of $\\sin x$?", ["$x-\\tfrac{x^3}{6}$", "$x+\\tfrac{x^3}{6}$", "$1-\\tfrac{x^2}{2}$", "$x-\\tfrac{x^2}{2}$"], 0, ["$\\sin$ series, odd powers.", "$x-\\tfrac{x^3}{3!}$.", "$x-\\tfrac{x^3}{6}$."], "Odd powers, factorials."); }],
    extreme: [function () { var d = pick([0.1, 0.2]); var est = d; return num("First-order estimate of $\\sin(" + d + ")$ (small angle).", est, 0.02, ["$\\sin x\\approx x$.", "$\\sin(" + d + ")\\approx" + d + "$.", "Done."], "Small-angle approximation."); }]
  });
  G("calc2-09-sequences", {
    easy: [function () { var a = R(2, 5); return num("Find $\\lim_{n\\to\\infty}\\dfrac{" + a + "n+1}{n}$.", a, 0.01, ["$" + a + "+\\tfrac1n$.", "$\\to" + a + "$.", "Converges."], "Split the fraction."); }],
    medium: [function () { var a = R(2, 5); return num("Find $\\lim_{n\\to\\infty}\\dfrac{" + a + "n^2}{n^2+1}$.", a, 0.01, ["Divide by $n^2$.", "$\\to" + a + "$.", "Done."], "Divide by the highest power."); }],
    hard: [function () { return mc("Does $a_n=(-1)^n$ converge?", ["No", "Yes, to 1", "Yes, to 0", "Yes, to $-1$"], 0, ["Alternates $1,-1,\\ldots$.", "No single limit.", "Diverges."], "Oscillation ⇒ divergence."); }],
    extreme: [function () { return num("Find $\\lim_{n\\to\\infty}(1+1/n)^n$.", Math.E, 0.02, ["Standard limit.", "$\\to e$.", "$\\approx" + sig(Math.E) + "$."], "Definition of $e$."); }]
  });
  G("calc2-10-series", {
    easy: [function () { var r = pick([2, 3, 4]); return num("Sum $\\sum_{n=0}^\\infty (1/" + r + ")^n$.", r / (r - 1), 0.02, ["Geometric $a=1$, $r=1/" + r + "$.", "$\\dfrac{1}{1-1/" + r + "}$.", "$=" + sig(r / (r - 1)) + "$."], "$\\dfrac{a}{1-r}$."); }],
    medium: [function () { return mc("Does $\\sum 1/n^2$ converge?", ["Yes ($p=2$)", "No", "Only conditionally", "To 1"], 0, ["$p$-series, $p=2>1$.", "Converges.", "Done."], "$p>1$."); }],
    hard: [function () { var r = pick([3, 4, 5]); return num("Sum $\\sum_{n=1}^\\infty (1/" + r + ")^n$.", (1 / r) / (1 - 1 / r), 0.02, ["$a=r=1/" + r + "$.", "$\\dfrac{1/" + r + "}{1-1/" + r + "}$.", "$=" + sig((1 / r) / (1 - 1 / r)) + "$."], "Start index 1 ⇒ $a=r$."); }],
    extreme: [function () { return mc("Does $\\sum \\dfrac{n}{n+1}$ converge?", ["No (terms → 1)", "Yes", "Conditionally", "To $\\infty$ only if..."], 0, ["$\\lim a_n=1\\neq0$.", "Divergence test.", "Diverges."], "Terms must → 0."); }]
  });
  G("calc2-11-alternating-ratio", {
    easy: [function () { return mc("Does $\\sum \\dfrac1{n!}$ converge (ratio test)?", ["Yes ($L=0$)", "No", "Inconclusive", "Only for large $n$"], 0, ["Ratio $\\tfrac{1}{n+1}\\to0$.", "$L=0<1$.", "Converges."], "Factorials → ratio 0."); }],
    medium: [function () { return num("Error bound for $\\sum(-1)^n/n$ after $" + 9 + "$ terms (upper bound).", 1 / 10, 0.01, ["Error $\\le b_{N+1}=\\tfrac{1}{10}$.", "$=0.1$.", "Done."], "Alternating error $\\le$ next term."); }],
    hard: [function () { return mc("Ratio test on $\\sum n(1/2)^n$:", ["Converges ($L=1/2$)", "Diverges", "Inconclusive", "$L=2$"], 0, ["Ratio $\\to\\tfrac12$.", "$<1$.", "Converges."], "$L=\\tfrac12$."); }],
    extreme: [function () { return mc("Root test on $\\sum(n/(2n+1))^n$:", ["Converges ($L=1/2$)", "Diverges", "Inconclusive", "$L=2$"], 0, ["$\\sqrt[n]{a_n}=\\tfrac{n}{2n+1}\\to\\tfrac12$.", "$<1$.", "Converges."], "$n$-th power ⇒ root test."); }]
  });
  G("calc2-12-power-series", {
    easy: [function () { return mc("Radius of convergence of $\\sum x^n/n!$?", ["$\\infty$", "$1$", "$0$", "$e$"], 0, ["Ratio $\\tfrac{|x|}{n+1}\\to0$.", "Always $<1$.", "$R=\\infty$."], "Factorials ⇒ infinite radius."); }],
    medium: [function () { return num("Radius of convergence of $\\sum x^n/n$.", 1, 0.01, ["Ratio $\\tfrac{n}{n+1}|x|\\to|x|$.", "$<1$ ⇒ $R=1$.", "$=1$."], "The $1/n$ doesn't change $R$."); }],
    hard: [function () { return mc("Series for $\\dfrac{1}{1+x^2}$?", ["$\\sum(-1)^n x^{2n}$", "$\\sum x^{2n}$", "$\\sum(-1)^n x^n$", "$\\sum x^n/n!$"], 0, ["Substitute $-x^2$ into $\\sum x^n$.", "$\\sum(-x^2)^n$.", "$\\sum(-1)^n x^{2n}$."], "Substitute $-x^2$."); }],
    extreme: [function () { return num("Radius of convergence of $\\sum n!\\,x^n$.", 0, 0.001, ["Ratio $(n+1)|x|\\to\\infty$ unless $x=0$.", "Converges only at 0.", "$R=0$."], "Factorials on top kill the radius."); }]
  });
  G("calc2-13-areas", {
    easy: [function () { return num("Area between $y=x$ and $y=x^2$ from 0 to 1.", 1 / 6, 0.02, ["$\\int_0^1(x-x^2)\\,dx=\\tfrac12-\\tfrac13$.", "$=\\tfrac16$.", "$\\approx" + sig(1 / 6) + "$."], "Top minus bottom."); }],
    medium: [function () { var a = R(2, 4); return num("Area between $y=" + a + "-x^2$ and $y=0$.", 4 * Math.pow(a, 1.5) / 3, 0.03, ["Roots $\\pm\\sqrt{" + a + "}$.", "$\\int_{-\\sqrt{a}}^{\\sqrt{a}}(" + a + "-x^2)\\,dx=\\tfrac43 a^{3/2}$.", "$=" + sig(4 * Math.pow(a, 1.5) / 3) + "$."], "Symmetric parabola area."); }],
    hard: [function () { return num("Area between $y=x^2$ and $y=2x$.", 4 / 3, 0.02, ["Intersect 0,2; line on top.", "$\\int_0^2(2x-x^2)\\,dx=4-\\tfrac83$.", "$=\\tfrac43=" + sig(4 / 3) + "$."], "Line minus parabola."); }],
    extreme: [function () { return num("Area between $y=x^3$ and $y=x$ on $[0,1]$.", 1 / 4, 0.02, ["$x>x^3$ there.", "$\\int_0^1(x-x^3)=\\tfrac12-\\tfrac14$.", "$=\\tfrac14$."], "$x$ above $x^3$."); }]
  });
  G("calc2-14-volumes", {
    easy: [function () { var b = R(2, 4); return num("Volume of $y=\\sqrt x$, $0\\le x\\le" + b + "$, about the $x$-axis (as a multiple of $\\pi$).", b * b / 2, 0.02, ["$V=\\pi\\int_0^{" + b + "}x\\,dx$.", "$=\\pi\\cdot" + (b * b / 2) + "$.", "$=" + (b * b / 2) + "\\pi$."], "Disk radius $\\sqrt x$; give the number times $\\pi$."); }],
    medium: [function () { var b = R(1, 3); return num("Volume of $y=x$, $0\\le x\\le" + b + "$, about the $x$-axis (multiple of $\\pi$).", b * b * b / 3, 0.02, ["$V=\\pi\\int_0^{" + b + "}x^2\\,dx$.", "$=\\pi\\cdot" + sig(b * b * b / 3) + "$.", "$=" + sig(b * b * b / 3) + "\\pi$."], "Radius $x$; number times $\\pi$."); }],
    hard: [function () { var b = R(1, 3); return num("Shell volume: $y=x^2$, $0\\le x\\le" + b + "$, about the $y$-axis (multiple of $\\pi$).", b * b * b * b / 2, 0.02, ["$V=2\\pi\\int_0^{" + b + "}x\\cdot x^2\\,dx=2\\pi\\cdot\\tfrac{" + (Math.pow(b, 4)) + "}{4}$.", "$=" + (Math.pow(b, 4) / 2) + "\\pi$.", "Done."], "$2\\pi(\\text{radius})(\\text{height})$."); }],
    extreme: [function () { return num("Arc length of $y=\\tfrac23 x^{3/2}$ on $[0,3]$.", 14 / 3, 0.02, ["$f'=x^{1/2}$; $\\int_0^3\\sqrt{1+x}\\,dx$.", "$=\\tfrac23(8-1)$.", "$=\\tfrac{14}{3}=" + sig(14 / 3) + "$."], "$(f')^2=x$ integrates nicely."); }]
  });

  // ============================ COLLEGE ALGEBRA ============================
  G("alg-01-arithmetic", {
    easy: [
      function () { var a = R(-9, 9), b = R(-9, 9); return num("Evaluate $" + a + "+(" + b + ")$.", a + b, 0.001, ["Combine signed numbers.", "$" + a + "+" + b + "$.", "$=" + (a + b) + "$."], "Watch the signs."); },
      function () { var a = R(2, 9), b = R(2, 9), c = R(1, 9); return num("Evaluate $" + a + "+" + b + "\\cdot" + c + "$.", a + b * c, 0.001, ["Multiply first: $" + b + "\\cdot" + c + "=" + (b * c) + "$.", "Add $" + a + "$.", "$=" + (a + b * c) + "$."], "PEMDAS."); }
    ],
    medium: [function () { var a = R(2, 6), b = R(2, 6), c = R(1, 5); return num("Evaluate $(" + a + "+" + b + ")^2-" + c + "$.", (a + b) * (a + b) - c, 0.001, ["Parentheses: $" + (a + b) + "$.", "Square: $" + ((a + b) * (a + b)) + "$.", "Subtract $" + c + "$: $" + ((a + b) * (a + b) - c) + "$."], "Parentheses, then exponent."); }],
    hard: [function () { var a = R(2, 6), b = R(2, 8); return num("Evaluate $" + a + "-2(" + a + "-" + b + ")$.", a - 2 * (a - b), 0.001, ["Inside: $" + (a - b) + "$.", "$-2(" + (a - b) + ")=" + (-2 * (a - b)) + "$.", "$" + a + "+" + (-2 * (a - b)) + "=" + (a - 2 * (a - b)) + "$."], "Do the grouping first."); }],
    extreme: [function () { var a = R(2, 5); return num("Evaluate $-" + a + "^2+(-" + a + ")^2$.", -a * a + a * a, 0.001, ["$-" + a + "^2=" + (-a * a) + "$ (exponent before sign).", "$(-" + a + ")^2=" + (a * a) + "$.", "Sum $=0$."], "Parentheses change the sign's fate."); }]
  });
  G("alg-02-exponents-polynomials", {
    easy: [
      function () { var m = R(2, 6), n = R(2, 6); return mc("Simplify $x^{" + m + "}\\cdot x^{" + n + "}$.", ["$x^{" + (m + n) + "}$", "$x^{" + (m * n) + "}$", "$x^{" + Math.abs(m - n) + "}$", "$" + (m + n) + "x$"], 0, ["Add exponents.", "$x^{" + m + "+" + n + "}$.", "$x^{" + (m + n) + "}$."], "Same base ⇒ add."); },
      function () { var m = R(4, 8), n = R(1, 3); return mc("Simplify $\\dfrac{x^{" + m + "}}{x^{" + n + "}}$.", ["$x^{" + (m - n) + "}$", "$x^{" + (m + n) + "}$", "$x^{" + (m * n) + "}$", "$" + (m - n) + "$"], 0, ["Subtract exponents.", "$x^{" + m + "-" + n + "}$.", "$x^{" + (m - n) + "}$."], "Divide ⇒ subtract."); }
    ],
    medium: [function () { var a = R(1, 6), b = R(1, 6); return num("Expand $(x+" + a + ")(x+" + b + ")$ and give the constant term.", a * b, 0.001, ["FOIL: constant is $" + a + "\\cdot" + b + "$.", "$=" + (a * b) + "$.", "Done."], "Constant = product of the numbers."); }],
    hard: [function () { var a = R(2, 7); return num("Expand $(x+" + a + ")^2$ and give the middle (x) coefficient.", 2 * a, 0.001, ["Square of a sum: middle $=2\\cdot" + a + "$.", "$=" + (2 * a) + "$.", "Done."], "Middle term is $2ab$."); }],
    extreme: [function () { var a = R(2, 6); return mc("Expand $(x+" + a + ")(x-" + a + ")$.", ["$x^2-" + (a * a) + "$", "$x^2+" + (a * a) + "$", "$x^2-2\\cdot" + a + "x+" + (a * a) + "$", "$x^2-" + a + "$"], 0, ["Conjugates.", "$x^2-" + a + "^2$.", "$x^2-" + (a * a) + "$."], "Difference of squares."); }]
  });
  G("alg-03-factoring", {
    easy: [function () { var p = R(2, 6), q = R(2, 6); return num("Factor $x^2+" + (p + q) + "x+" + (p * q) + "$ as $(x+p)(x+q)$; give the larger of $p,q$.", Math.max(p, q), 0.001, ["Product $" + (p * q) + "$, sum $" + (p + q) + "$.", "$p=" + p + "$, $q=" + q + "$.", "Larger: $" + Math.max(p, q) + "$."], "Factors of the constant summing to the middle."); }],
    medium: [function () { var a = R(2, 7); return mc("Factor $x^2-" + (a * a) + "$.", ["$(x+" + a + ")(x-" + a + ")$", "$(x-" + a + ")^2$", "$(x+" + a + ")^2$", "prime"], 0, ["Difference of squares.", "$a=" + a + "$.", "$(x+" + a + ")(x-" + a + ")$."], "$a^2-b^2$."); }],
    hard: [function () { var a = R(2, 6); return mc("Factor $x^2+" + (2 * a) + "x+" + (a * a) + "$.", ["$(x+" + a + ")^2$", "$(x-" + a + ")^2$", "$(x+" + a + ")(x-" + a + ")$", "prime"], 0, ["Perfect-square trinomial.", "Middle $=2\\cdot" + a + "$.", "$(x+" + a + ")^2$."], "Perfect square pattern."); }],
    extreme: [function () { var a = R(2, 4); return mc("Factor $x^3-" + (a * a * a) + "$.", ["$(x-" + a + ")(x^2+" + a + "x+" + (a * a) + ")$", "$(x-" + a + ")^3$", "$(x-" + a + ")(x^2-" + a + "x+" + (a * a) + ")$", "prime"], 0, ["Difference of cubes.", "$(x-" + a + ")(x^2+" + a + "x+" + (a * a) + ")$.", "Done."], "$a^3-b^3=(a-b)(a^2+ab+b^2)$."); }]
  });
  G("alg-04-rational-expressions", {
    easy: [function () { var a = R(2, 8); return mc("The excluded value of $\\dfrac{1}{x-" + a + "}$ is?", ["$x=" + a + "$", "$x=0$", "$x=-" + a + "$", "none"], 0, ["Denominator zero.", "$x=" + a + "$.", "Done."], "Set the denominator to 0."); }],
    medium: [function () { var a = R(2, 6); return mc("Simplify $\\dfrac{x^2-" + (a * a) + "}{x-" + a + "}$.", ["$x+" + a + "$", "$x-" + a + "$", "$x^2-" + a + "$", "$1$"], 0, ["Factor $(x-" + a + ")(x+" + a + ")$.", "Cancel $(x-" + a + ")$.", "$x+" + a + "$."], "Factor and cancel."); }],
    hard: [function () { return mc("Add $\\dfrac1x+\\dfrac{1}{x+1}$.", ["$\\dfrac{2x+1}{x(x+1)}$", "$\\dfrac{2}{2x+1}$", "$\\dfrac{1}{x(x+1)}$", "$\\dfrac{2x+1}{x+1}$"], 0, ["LCD $x(x+1)$.", "$\\dfrac{(x+1)+x}{x(x+1)}$.", "$\\dfrac{2x+1}{x(x+1)}$."], "Common denominator."); }],
    extreme: [function () { return mc("Simplify $\\dfrac{1/x+1}{1/x}$.", ["$1+x$", "$x$", "$\\dfrac{1}{x}$", "$1$"], 0, ["Multiply top and bottom by $x$.", "$\\dfrac{1+x}{1}$.", "$1+x$."], "Multiply by the inner LCD."); }]
  });
  G("alg-05-radicals-complex", {
    easy: [function () { var k = pick([2, 3, 5, 6, 7]); var a = k * k * pick([2, 3]); var out = Math.sqrt(a / (a / (k * k))); return mc("Simplify $\\sqrt{" + (k * k * 2) + "}$.", [k + "\\sqrt{2}", (k * 2) + "\\sqrt{2}", "\\sqrt{" + (k * k * 2) + "}", k + "\\sqrt{" + (k) + "}"], 0, ["$" + (k * k * 2) + "=" + (k * k) + "\\cdot2$.", "$\\sqrt{" + (k * k) + "}=" + k + "$.", "$" + k + "\\sqrt2$."], "Pull out the perfect square."); }],
    medium: [function () { var a = R(2, 8); return num("Simplify $\\sqrt{-" + (a * a) + "}$ as $ki$; give $k$.", a, 0.001, ["$\\sqrt{" + (a * a) + "}\\cdot\\sqrt{-1}$.", "$" + a + "i$.", "$k=" + a + "$."], "$\\sqrt{-1}=i$."); }],
    hard: [function () { var a = R(1, 5), b = R(1, 5), c = R(1, 5), d = R(1, 5); return num("For $(" + a + "+" + b + "i)+(" + c + "+" + d + "i)$, give the imaginary part.", b + d, 0.001, ["Add imaginary parts.", "$" + b + "+" + d + "$.", "$=" + (b + d) + "$."], "Combine imaginary parts."); }],
    extreme: [function () { return mc("$(2+i)(3-2i)=?$", ["$8-i$", "$6-2i$", "$8+i$", "$4-i$"], 0, ["FOIL: $6-4i+3i-2i^2$.", "$6-i+2$ (since $i^2=-1$).", "$8-i$."], "Use $i^2=-1$."); }]
  });
  G("alg-06-linear-equations", {
    easy: [
      function () { var m = R(2, 6), b = R(1, 9), x = R(1, 6); var c = m * x + b; return num("Solve $" + m + "x+" + b + "=" + c + "$.", x, 0.001, ["Subtract $" + b + "$: $" + m + "x=" + (c - b) + "$.", "Divide by $" + m + "$.", "$x=" + x + "$."], "Undo add, then multiply."); }
    ],
    medium: [function () { var m = R(2, 5), x = RN(-5, 5), b = R(1, 8); var c = m * x + b - x; return num("Solve $" + m + "x+" + b + "=x+" + (c + x - b + b) + "$? ... solve $" + m + "x+" + b + "=x+" + (m * x + b - x + b) + "$.", x, 0.001, ["Collect: $" + (m - 1) + "x=" + ((m * x + b - x + b) - b) + "$.", "Divide.", "$x=" + x + "$."], "Collect variable terms."); }],
    hard: [function () { var m = R(2, 5), b = R(1, 8), x = R(1, 6); var c = m * (x - 2); return num("Solve $" + m + "(x-2)=" + c + "$.", x, 0.001, ["Divide by $" + m + "$: $x-2=" + (c / m) + "$.", "Add 2.", "$x=" + x + "$."], "Handle the parentheses."); }],
    extreme: [function () { return num("Solve the inequality $-2x>6$; give the boundary value.", -3, 0.001, ["Divide by $-2$, flip sign.", "$x<-3$.", "Boundary $-3$."], "Flip when dividing by a negative."); }]
  });
  G("alg-07-quadratic-equations", {
    easy: [function () { var r = R(2, 9); return num("Solve $x^2-" + (r * r) + "=0$; give the positive solution.", r, 0.001, ["$x^2=" + (r * r) + "$.", "$x=\\pm" + r + "$.", "Positive: $" + r + "$."], "Square-root property."); }],
    medium: [function () { var p = R(1, 6), q = R(1, 6); return num("Solve $x^2-" + (p + q) + "x+" + (p * q) + "=0$; give the larger root.", Math.max(p, q), 0.001, ["Factor $(x-" + p + ")(x-" + q + ")$.", "Roots $" + p + "," + q + "$.", "Larger: $" + Math.max(p, q) + "$."], "Zero-product."); }],
    hard: [function () { var h = R(1, 4), k = R(1, 9); var big = h + Math.sqrt(k); return num("Solve $(x-" + h + ")^2=" + k + "$; give the larger solution.", big, 0.02, ["$x-" + h + "=\\pm\\sqrt{" + k + "}$.", "$x=" + h + "+\\sqrt{" + k + "}$.", "$\\approx" + sig(big) + "$."], "Square-root property with $\\pm$."); }],
    extreme: [function () { var b = R(1, 5), c = R(1, 5); var disc = b * b - 4 * c; return num("Discriminant of $x^2+" + b + "x+" + c + "$.", disc, 0.001, ["$b^2-4ac=" + (b * b) + "-" + (4 * c) + "$.", "$=" + disc + "$.", "Sign tells solution type."], "$b^2-4ac$."); }]
  });
  G("alg-08-polynomial-rational-equations", {
    easy: [function () { var a = R(2, 6); return num("Solve $x^3-" + (a * a) + "x=0$; give the positive nonzero root.", a, 0.001, ["Factor $x(x-" + a + ")(x+" + a + ")$.", "Roots $0,\\pm" + a + "$.", "Positive: $" + a + "$."], "GCF then difference of squares."); }],
    medium: [function () { var a = R(2, 5), b = R(1, 4); var s = a + b; return num("Solve $\\dfrac1x+\\dfrac{1}{" + a + "}=\\dfrac{" + (a + b) + "}{" + (a * b) + "}$? ... simpler: solve $\\dfrac{x}{x-1}=" + 2 + "$.", 2, 0.001, ["Multiply by $x-1$: $x=2(x-1)$.", "$x=2x-2$.", "$x=2$."], "Clear the denominator, then check."); }],
    hard: [function () { return mc("Solve $x^4-5x^2+4=0$; how many real roots?", ["4", "2", "1", "0"], 0, ["$u=x^2$: $u^2-5u+4=0\\Rightarrow u=1,4$.", "$x=\\pm1,\\pm2$.", "Four real roots."], "Substitute $u=x^2$."); }],
    extreme: [function () { return mc("Why is $x=2$ extraneous for $\\dfrac{1}{x-2}=\\dfrac{2}{x-2}$?", ["It makes a denominator 0", "It's negative", "It's too big", "It isn't extraneous"], 0, ["$x=2$ zeros the denominator.", "Undefined in the original.", "Reject it."], "Excluded values can't be solutions."); }]
  });
  G("alg-09-radical-equations", {
    easy: [function () { var r = R(2, 9); return num("Solve $\\sqrt{x}=" + r + "$.", r * r, 0.01, ["Square both sides.", "$x=" + (r * r) + "$.", "Check ✓."], "Square to undo the root."); }],
    medium: [function () { var r = R(2, 6), b = R(1, 8); return num("Solve $\\sqrt{x+" + b + "}=" + r + "$.", r * r - b, 0.01, ["Square: $x+" + b + "=" + (r * r) + "$.", "$x=" + (r * r - b) + "$.", "Check ✓."], "Isolate, then square."); }],
    hard: [function () { var a = R(2, 4), b = R(1, 3); return num("Solve $\\sqrt{2x-" + b + "}=" + a + "$.", (a * a + b) / 2, 0.02, ["Square: $2x-" + b + "=" + (a * a) + "$.", "$2x=" + (a * a + b) + "$.", "$x=" + sig((a * a + b) / 2) + "$."], "Square both sides."); }],
    extreme: [function () { return mc("Solve $\\sqrt{x}=-2$.", ["No solution", "$x=4$", "$x=-4$", "$x=2$"], 0, ["A principal root is $\\ge0$.", "Can't equal $-2$.", "No solution."], "Roots aren't negative."); }]
  });
  G("alg-10-lines", {
    easy: [function () { var x1 = R(0, 3), y1 = R(0, 5), dx = R(1, 4), dy = R(1, 8); return num("Slope through $(" + x1 + "," + y1 + ")$ and $(" + (x1 + dx) + "," + (y1 + dy) + ")$.", dy / dx, 0.02, ["$m=\\dfrac{" + dy + "}{" + dx + "}$.", "$=" + sig(dy / dx) + "$.", "Done."], "Rise over run."); }],
    medium: [function () { var m = R(2, 5), b = RN(-5, 5); var x = R(1, 4); return num("For $y=" + m + "x+(" + b + ")$, find $y$ at $x=" + x + "$.", m * x + b, 0.01, ["Substitute $x=" + x + "$.", "$" + m + "(" + x + ")+" + b + "$.", "$=" + (m * x + b) + "$."], "Plug into $y=mx+b$."); }],
    hard: [function () { var m = R(2, 5), x = R(1, 4), y = R(1, 8); var b = y - m * x; return num("Line with slope $" + m + "$ through $(" + x + "," + y + ")$: find the $y$-intercept.", b, 0.01, ["$y-" + y + "=" + m + "(x-" + x + ")$.", "$b=" + y + "-" + m + "\\cdot" + x + "$.", "$=" + b + "$."], "Point-slope, then find $b$."); }],
    extreme: [function () { var num1 = R(1, 4), den = R(2, 5); return num("Slope perpendicular to $m=" + num1 + "/" + den + "$ (as a decimal).", -den / num1, 0.02, ["Negative reciprocal.", "$-" + den + "/" + num1 + "$.", "$=" + sig(-den / num1) + "$."], "Flip and negate."); }]
  });
  G("alg-11-conics", {
    easy: [function () { var h = RN(-4, 4), k = RN(-4, 4), r = R(2, 7); return num("For $(x-(" + h + "))^2+(y-(" + k + "))^2=" + (r * r) + "$, give the radius.", r, 0.01, ["$r^2=" + (r * r) + "$.", "$r=" + r + "$.", "Done."], "$r=\\sqrt{r^2}$."); }],
    medium: [function () { var h = R(1, 5), k = RN(-5, 5); return num("Vertex of $y=(x-" + h + ")^2+(" + k + ")$: give the $x$-coordinate.", h, 0.01, ["Vertex form.", "$h=" + h + "$.", "Done."], "Read $(h,k)$."); }],
    hard: [function () { var a = R(1, 4), c = R(1, 9); return num("Vertex $x$ of $y=x^2-" + (2 * a) + "x+" + c + "$.", a, 0.01, ["$x=-b/(2a)=" + (2 * a) + "/2$.", "$=" + a + "$.", "Done."], "$x=-b/(2a)$."); }],
    extreme: [function () { var a = R(1, 4); return num("Complete the square: $x^2+" + (2 * a) + "x+1=(x+" + a + ")^2+k$; find $k$.", 1 - a * a, 0.01, ["$(x+" + a + ")^2=x^2+" + (2 * a) + "x+" + (a * a) + "$.", "$k=1-" + (a * a) + "$.", "$=" + (1 - a * a) + "$."], "Add and subtract $(b/2)^2$."); }]
  });
  G("alg-12-systems", {
    easy: [function () { var x = R(1, 6), y = R(1, 6); var s = x + y, d = x - y; return num("Solve $x+y=" + s + "$, $x-y=" + d + "$; give $x$.", x, 0.001, ["Add: $2x=" + (s + d) + "$.", "$x=" + x + "$.", "Done."], "Add to eliminate $y$."); }],
    medium: [function () { var x = R(1, 5), m = R(2, 4), y2 = R(1, 6); var c = m * x + y2; return num("Solve $y=" + m + "x$, $x+y=" + (x + m * x) + "$; give $x$.", x, 0.001, ["Substitute: $x+" + m + "x=" + (x + m * x) + "$.", "$" + (m + 1) + "x=" + (x + m * x) + "$.", "$x=" + x + "$."], "Substitution."); }],
    hard: [function () { return mc("How many solutions: $y=2x+1$, $y=2x-3$?", ["None (parallel)", "One", "Infinitely many", "Two"], 0, ["Same slope, different intercept.", "Parallel.", "No solution."], "Equal slopes, unequal intercepts."); }],
    extreme: [function () { var r = R(2, 4); return num("Line $y=x$ meets circle $x^2+y^2=" + (2 * r * r) + "$; give the positive intersection $x$.", r, 0.02, ["$2x^2=" + (2 * r * r) + "\\Rightarrow x^2=" + (r * r) + "$.", "$x=\\pm" + r + "$.", "Positive: $" + r + "$."], "Substitute $y=x$."); }]
  });
  G("alg-13-right-triangle-trig", {
    easy: [function () { return mc("$\\cos 60^\\circ=?$", ["$\\tfrac12$", "$\\tfrac{\\sqrt3}{2}$", "$1$", "$\\tfrac{\\sqrt2}{2}$"], 0, ["30-60-90 triangle.", "adj/hyp $=1/2$.", "$\\tfrac12$."], "Special angle."); }],
    medium: [function () { var o = R(3, 8), a = R(3, 8); var h = Math.sqrt(o * o + a * a); return num("Right triangle: opp $=" + o + "$, adj $=" + a + "$. Find the hypotenuse.", h, 0.02, ["$\\sqrt{" + (o * o) + "+" + (a * a) + "}$.", "$=\\sqrt{" + (o * o + a * a) + "}$.", "$=" + sig(h) + "$."], "Pythagorean theorem."); }],
    hard: [function () { var L = R(10, 25); var deg = pick([30, 60]); var h = L * (deg === 30 ? 0.5 : Math.sqrt(3) / 2); return num("A " + L + "-ft ladder leans at $" + deg + "^\\circ$. How high does it reach?", h, 0.02, ["Height $=" + L + "\\sin" + deg + "^\\circ$.", "$\\sin" + deg + "^\\circ=" + (deg === 30 ? "0.5" : "\\sqrt3/2") + "$.", "$\\approx" + sig(h) + "$ ft."], "Height $=L\\sin\\theta$."); }],
    extreme: [function () { return mc("On the unit circle, the point at $180^\\circ$ is?", ["$(-1,0)$", "$(0,1)$", "$(1,0)$", "$(0,-1)$"], 0, ["$(\\cos180^\\circ,\\sin180^\\circ)$.", "$=(-1,0)$.", "Done."], "Coordinates are $(\\cos,\\sin)$."); }]
  });
  G("alg-14-exp-log", {
    easy: [function () { var b = pick([2, 3, 5]), e = R(2, 4); return num("Evaluate $\\log_{" + b + "}" + Math.pow(b, e) + "$.", e, 0.001, ["$" + b + "^?=" + Math.pow(b, e) + "$.", "$" + b + "^{" + e + "}$.", "$=" + e + "$."], "What power gives it?"); }],
    medium: [function () { return mc("Expand $\\log(xy)$.", ["$\\log x+\\log y$", "$\\log x\\cdot\\log y$", "$\\log x-\\log y$", "$(\\log x)^y$"], 0, ["Product law.", "$\\log x+\\log y$.", "Done."], "Product ⇒ sum."); }],
    hard: [function () { var e = R(2, 6); return num("Solve $2^x=" + Math.pow(2, e) + "$.", e, 0.001, ["$" + Math.pow(2, e) + "=2^{" + e + "}$.", "$x=" + e + "$.", "Done."], "Match the bases."); }],
    extreme: [function () { var v = pick([5, 10, 20, 50]); return num("Solve $e^x=" + v + "$ (to 2 dp).", Math.log(v), 0.02, ["Take $\\ln$.", "$x=\\ln" + v + "$.", "$\\approx" + sig(Math.log(v)) + "$."], "Take the natural log."); }]
  });

  // tag every instance with a source label (shown as a chip)
  // (handled per-generator above where useful; default source below)
  void S; void SRC; void RN;
})();
