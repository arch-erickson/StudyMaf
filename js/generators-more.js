/* StudyMAF — question generators for the three added classes: Physics I —
 * Calculus Based (phys1441), Physics I — Algebra Based (phys1433), and
 * Precalculus (precalc). Self-contained: registers into window.Generators with
 * its own local helpers, giving each lesson endless fresh numeric/MC problems —
 * the same engine PHYS 1442 and the math classes use. Loaded after
 * js/generators.js (and alongside js/generators-math.js). */
(function () {
  "use strict";
  if (!window.Generators || !window.Generators.register) return;
  var G = window.Generators.register;

  function R(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function RN(a, b) { var v = R(a, b); return v === 0 ? (b > 0 ? 1 : -1) : v; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function sig(x) { if (x === 0) return "0"; var a = Math.abs(x); if (a >= 1e5 || a < 1e-3) return x.toExponential(2); return (+x.toPrecision(4)).toString(); }
  function num(prompt, value, tol, steps, hint, unit) { return { type: "numeric", prompt: prompt, answerValue: value, answerText: sig(value), unit: unit || "", tol: tol == null ? 0.02 : tol, steps: steps, hint: hint }; }
  function mc(prompt, choices, idx, steps, hint) { return { type: "mc", prompt: prompt, choices: choices, answerIndex: idx, steps: steps, hint: hint }; }
  var g = 9.8;

  // =========================================================================
  // PHYSICS I — shared generator builders (used by phys1441 & phys1433)
  // =========================================================================
  function units() { return {
    easy: [
      function () { var km = R(2, 20); return num("Convert $" + km + "$ km to meters.", km * 1000, 0.001, ["$1$ km $=1000$ m.", "$" + km + "\\times1000$.", "$=" + km * 1000 + "$ m."], "Multiply by 1000.", "m"); },
      function () { var cm = R(20, 200); return num("Convert $" + cm + "$ cm to meters.", cm / 100, 0.01, ["$100$ cm $=1$ m.", "$" + cm + "/100$.", "$=" + sig(cm / 100) + "$ m."], "Divide by 100.", "m"); }
    ],
    medium: [
      function () { var a = R(2, 9), b = R(1, 3); return num("How many significant figures in $" + a + "." + b + "0\\times10^{3}$?", 3, 0.001, ["Count all shown digits.", "$" + a + ", " + b + ", 0$.", "Three sig figs."], "Trailing zeros after a decimal count."); },
      function () { var mps = R(5, 30); return num("Convert $" + mps + "$ m/s to km/h.", mps * 3.6, 0.02, ["Multiply by $3.6$.", "$" + mps + "\\times3.6$.", "$=" + sig(mps * 3.6) + "$ km/h."], "$1$ m/s $=3.6$ km/h.", "km/h"); }
    ],
    hard: [
      function () { var L = R(2, 8); return num("A cube is $" + L + "$ m on a side. Find its volume.", L * L * L, 0.01, ["$V=s^3$.", "$" + L + "^3$.", "$=" + L * L * L + "$ m³."], "Cube the side length.", "m³"); }
    ],
    extreme: [
      function () { return mc("The dimensions of speed are:", ["$[L][T]^{-1}$", "$[L][T]$", "$[L]^2[T]$", "$[T][L]^{-1}$"], 0, ["Speed = distance/time.", "$[L]/[T]$.", "$[L][T]^{-1}$."], "Length over time."); }
    ]
  }; }

  function kinematics() { return {
    easy: [
      function () { var v = R(5, 30), t = R(2, 10); return num("An object moves at constant $" + v + "$ m/s for $" + t + "$ s. Distance?", v * t, 0.01, ["$d=vt$.", "$" + v + "\\times" + t + "$.", "$=" + v * t + "$ m."], "Distance = speed × time.", "m"); }
    ],
    medium: [
      function () { var a = R(2, 6), t = R(2, 8); return num("From rest, $a=" + a + "$ m/s² for $" + t + "$ s. Final speed?", a * t, 0.01, ["$v=at$.", "$" + a + "\\times" + t + "$.", "$=" + a * t + "$ m/s."], "$v=v_0+at$ with $v_0=0$.", "m/s"); },
      function () { var a = R(2, 5), t = R(2, 6); return num("From rest, $a=" + a + "$ m/s² for $" + t + "$ s. Distance?", 0.5 * a * t * t, 0.02, ["$d=\\tfrac12at^2$.", "$0.5\\times" + a + "\\times" + t + "^2$.", "$=" + sig(0.5 * a * t * t) + "$ m."], "$d=\\tfrac12at^2$.", "m"); }
    ],
    hard: [
      function () { var t = R(1, 4); return num("A ball is dropped. Speed after $" + t + "$ s? ($g=9.8$)", g * t, 0.02, ["$v=gt$.", "$9.8\\times" + t + "$.", "$=" + sig(g * t) + "$ m/s."], "$v=gt$.", "m/s"); }
    ],
    extreme: [
      function () { var v = R(10, 30); return num("A ball thrown up at $" + v + "$ m/s. Max height? ($g=9.8$)", v * v / (2 * g), 0.03, ["$h=v^2/(2g)$.", "$" + v + "^2/(2\\cdot9.8)$.", "$=" + sig(v * v / (2 * g)) + "$ m."], "At the top $v=0$: $h=v_0^2/2g$.", "m"); }
    ]
  }; }

  function vectors() { return {
    easy: [
      function () { var a = R(3, 8), b = R(3, 8); return num("A vector has components $(" + a + "," + b + ")$. Find its magnitude.", Math.hypot(a, b), 0.02, ["$|v|=\\sqrt{x^2+y^2}$.", "$\\sqrt{" + a + "^2+" + b + "^2}$.", "$=" + sig(Math.hypot(a, b)) + "$."], "Pythagorean theorem."); }
    ],
    medium: [
      function () { var m = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]); return num("A vector of magnitude " + m[2] + " has x-component " + m[0] + ". Find its y-component.", m[1], 0.01, ["$y=\\sqrt{r^2-x^2}$.", "$\\sqrt{" + m[2] + "^2-" + m[0] + "^2}$.", "$=" + m[1] + "$."], "Use $r^2=x^2+y^2$."); }
    ],
    hard: [
      function () { var r = R(5, 20), th = pick([30, 45, 60]); var rad = th * Math.PI / 180; return num("A vector of magnitude $" + r + "$ points at $" + th + "°$. Find its x-component.", r * Math.cos(rad), 0.03, ["$x=r\\cos\\theta$.", "$" + r + "\\cos" + th + "°$.", "$=" + sig(r * Math.cos(rad)) + "$."], "$x=r\\cos\\theta$."); }
    ],
    extreme: [
      function () { var ax = R(2, 6), ay = R(2, 6), bx = R(1, 5), by = R(1, 5); return num("Add $(" + ax + "," + ay + ")$ and $(" + bx + "," + by + ")$; give the magnitude of the sum.", Math.hypot(ax + bx, ay + by), 0.03, ["Add components: $(" + (ax + bx) + "," + (ay + by) + ")$.", "Magnitude $\\sqrt{\\ }$.", "$=" + sig(Math.hypot(ax + bx, ay + by)) + "$."], "Add componentwise, then magnitude."); }
    ]
  }; }

  function newton() { return {
    easy: [
      function () { var m = R(2, 10), a = R(1, 6); return num("Find the net force on $" + m + "$ kg accelerating at $" + a + "$ m/s².", m * a, 0.01, ["$F=ma$.", "$" + m + "\\times" + a + "$.", "$=" + m * a + "$ N."], "Newton's second law.", "N"); }
    ],
    medium: [
      function () { var m = R(2, 12); return num("Find the weight of a $" + m + "$ kg object. ($g=9.8$)", m * g, 0.02, ["$W=mg$.", "$" + m + "\\times9.8$.", "$=" + sig(m * g) + "$ N."], "$W=mg$.", "N"); }
    ],
    hard: [
      function () { var F = R(20, 60), m = R(2, 8); return num("A $" + F + "$ N force acts on $" + m + "$ kg. Find the acceleration.", F / m, 0.02, ["$a=F/m$.", "$" + F + "/" + m + "$.", "$=" + sig(F / m) + "$ m/s²."], "$a=F/m$.", "m/s²"); }
    ],
    extreme: [
      function () { var m = R(2, 6), F1 = R(20, 40), F2 = R(5, 18); return num("Forces $" + F1 + "$ N and $" + F2 + "$ N act in opposite directions on $" + m + "$ kg. Find $a$.", (F1 - F2) / m, 0.02, ["Net $=" + F1 + "-" + F2 + "=" + (F1 - F2) + "$ N.", "$a=F/m$.", "$=" + sig((F1 - F2) / m) + "$ m/s²."], "Net force first.", "m/s²"); }
    ]
  }; }

  function friction() { return {
    easy: [
      function () { var mu = pick([0.2, 0.3, 0.4, 0.5]), N = R(20, 80); return num("Find friction force: $\\mu=" + mu + "$, normal force $" + N + "$ N.", mu * N, 0.02, ["$f=\\mu N$.", "$" + mu + "\\times" + N + "$.", "$=" + sig(mu * N) + "$ N."], "$f=\\mu N$.", "N"); }
    ],
    medium: [
      function () { var m = R(2, 8); return num("A $" + m + "$ kg box on level ground: find the normal force. ($g=9.8$)", m * g, 0.02, ["On level ground $N=mg$.", "$" + m + "\\times9.8$.", "$=" + sig(m * g) + "$ N."], "$N=mg$ on flat ground.", "N"); }
    ],
    hard: [
      function () { var m = R(2, 6), v = R(4, 12), r = R(5, 20); return num("Centripetal force on $" + m + "$ kg at $" + v + "$ m/s around radius $" + r + "$ m.", m * v * v / r, 0.02, ["$F=mv^2/r$.", "$" + m + "\\cdot" + v + "^2/" + r + "$.", "$=" + sig(m * v * v / r) + "$ N."], "$F_c=mv^2/r$.", "N"); }
    ],
    extreme: [
      function () { var v = R(5, 15), r = R(8, 25); return num("Centripetal acceleration at $" + v + "$ m/s, radius $" + r + "$ m.", v * v / r, 0.02, ["$a=v^2/r$.", "$" + v + "^2/" + r + "$.", "$=" + sig(v * v / r) + "$ m/s²."], "$a_c=v^2/r$.", "m/s²"); }
    ]
  }; }

  function gravity() { return {
    easy: [
      function () { var m = R(2, 20); return num("Weight of $" + m + "$ kg on Earth? ($g=9.8$)", m * g, 0.02, ["$W=mg$.", "$" + m + "\\times9.8$.", "$=" + sig(m * g) + "$ N."], "$W=mg$.", "N"); }
    ],
    medium: [
      function () { var m = R(2, 20); return num("Weight of $" + m + "$ kg on the Moon? ($g_{moon}=1.6$)", m * 1.6, 0.02, ["$W=mg_{moon}$.", "$" + m + "\\times1.6$.", "$=" + sig(m * 1.6) + "$ N."], "Use Moon gravity 1.6.", "N"); }
    ],
    hard: [
      function () { var r = R(2, 5); return mc("If distance from a planet doubles, gravitational force becomes:", ["$1/4$ as strong", "half", "double", "$4\\times$"], 0, ["$F\\propto1/r^2$.", "Double $r$ ⇒ $1/2^2$.", "$1/4$."], "Inverse-square law."); }
    ],
    extreme: [
      function () { var m = R(1, 5); var G6 = 6.67e-11; var M = 5.97e24, r = 6.37e6; return num("Gravitational force on $" + m + "$ kg at Earth's surface using $F=GMm/r^2$.", G6 * M * m / (r * r), 0.05, ["$F=GMm/r^2$.", "Plug $G,M,r$.", "$\\approx" + sig(G6 * M * m / (r * r)) + "$ N."], "Should be about $" + m + "\\times9.8$.", "N"); }
    ]
  }; }

  function workenergy() { return {
    easy: [
      function () { var F = R(5, 40), d = R(2, 12); return num("Work done by $" + F + "$ N over $" + d + "$ m (same direction).", F * d, 0.01, ["$W=Fd$.", "$" + F + "\\times" + d + "$.", "$=" + F * d + "$ J."], "$W=Fd$.", "J"); }
    ],
    medium: [
      function () { var m = R(2, 8), v = R(2, 10); return num("Kinetic energy of $" + m + "$ kg at $" + v + "$ m/s.", 0.5 * m * v * v, 0.02, ["$KE=\\tfrac12mv^2$.", "$0.5\\cdot" + m + "\\cdot" + v + "^2$.", "$=" + sig(0.5 * m * v * v) + "$ J."], "$KE=\\tfrac12mv^2$.", "J"); }
    ],
    hard: [
      function () { var W = R(50, 200), t = R(2, 10); return num("Power to do $" + W + "$ J in $" + t + "$ s.", W / t, 0.02, ["$P=W/t$.", "$" + W + "/" + t + "$.", "$=" + sig(W / t) + "$ W."], "$P=W/t$.", "W"); }
    ],
    extreme: [
      function () { var m = R(2, 6), v = R(4, 12); return num("A $" + m + "$ kg object at $" + v + "$ m/s is stopped. Work done by the brakes?", -0.5 * m * v * v, 0.02, ["Work = $\\Delta KE=0-\\tfrac12mv^2$.", "$-0.5\\cdot" + m + "\\cdot" + v + "^2$.", "$=" + sig(-0.5 * m * v * v) + "$ J."], "Work–energy theorem (negative).", "J"); }
    ]
  }; }

  function potential() { return {
    easy: [
      function () { var m = R(2, 10), h = R(2, 15); return num("Gravitational PE of $" + m + "$ kg at height $" + h + "$ m. ($g=9.8$)", m * g * h, 0.02, ["$U=mgh$.", "$" + m + "\\cdot9.8\\cdot" + h + "$.", "$=" + sig(m * g * h) + "$ J."], "$U=mgh$.", "J"); }
    ],
    medium: [
      function () { var k = R(50, 300), x = pick([0.1, 0.2, 0.3, 0.5]); return num("Spring PE: $k=" + k + "$ N/m stretched $" + x + "$ m.", 0.5 * k * x * x, 0.02, ["$U=\\tfrac12kx^2$.", "$0.5\\cdot" + k + "\\cdot" + x + "^2$.", "$=" + sig(0.5 * k * x * x) + "$ J."], "$U=\\tfrac12kx^2$.", "J"); }
    ],
    hard: [
      function () { var h = R(2, 20); return num("A ball dropped from $" + h + "$ m: speed at the ground? ($g=9.8$)", Math.sqrt(2 * g * h), 0.03, ["$mgh=\\tfrac12mv^2$.", "$v=\\sqrt{2gh}$.", "$=" + sig(Math.sqrt(2 * g * h)) + "$ m/s."], "Energy conservation.", "m/s"); }
    ],
    extreme: [
      function () { var m = R(2, 5), h = R(5, 15); return num("A $" + m + "$ kg object falls from $" + h + "$ m. KE just before impact? ($g=9.8$)", m * g * h, 0.02, ["All PE ⇒ KE.", "$KE=mgh$.", "$=" + sig(m * g * h) + "$ J."], "PE converts fully to KE.", "J"); }
    ]
  }; }

  function momentum() { return {
    easy: [
      function () { var m = R(2, 12), v = R(2, 15); return num("Momentum of $" + m + "$ kg at $" + v + "$ m/s.", m * v, 0.01, ["$p=mv$.", "$" + m + "\\times" + v + "$.", "$=" + m * v + "$ kg·m/s."], "$p=mv$.", "kg·m/s"); }
    ],
    medium: [
      function () { var F = R(5, 40), t = R(2, 8); return num("Impulse of $" + F + "$ N acting for $" + t + "$ s.", F * t, 0.01, ["$J=Ft$.", "$" + F + "\\times" + t + "$.", "$=" + F * t + "$ N·s."], "$J=Ft$.", "N·s"); }
    ],
    hard: [
      function () { var m1 = R(2, 6), v1 = R(3, 10), m2 = R(2, 6); return num("A $" + m1 + "$ kg cart at $" + v1 + "$ m/s hits a stationary $" + m2 + "$ kg cart; they stick. Final speed?", m1 * v1 / (m1 + m2), 0.02, ["Momentum: $m_1v_1=(m_1+m_2)v$.", "$v=" + m1 + "\\cdot" + v1 + "/(" + m1 + "+" + m2 + ")$.", "$=" + sig(m1 * v1 / (m1 + m2)) + "$ m/s."], "Conserve momentum (perfectly inelastic).", "m/s"); }
    ],
    extreme: [
      function () { var m1 = R(2, 5), v1 = R(4, 10), m2 = R(2, 5), v2 = R(2, 8); return num("Total momentum: $" + m1 + "$ kg at $+" + v1 + "$ m/s and $" + m2 + "$ kg at $-" + v2 + "$ m/s.", m1 * v1 - m2 * v2, 0.02, ["Add with signs.", "$" + m1 + "\\cdot" + v1 + "-" + m2 + "\\cdot" + v2 + "$.", "$=" + (m1 * v1 - m2 * v2) + "$ kg·m/s."], "Momentum is a vector — mind the signs.", "kg·m/s"); }
    ]
  }; }

  function rotation() { return {
    easy: [
      function () { var F = R(5, 30), r = pick([0.2, 0.5, 1, 1.5, 2]); return num("Torque from $" + F + "$ N at radius $" + r + "$ m (perpendicular).", F * r, 0.02, ["$\\tau=Fr$.", "$" + F + "\\times" + r + "$.", "$=" + sig(F * r) + "$ N·m."], "$\\tau=rF$.", "N·m"); }
    ],
    medium: [
      function () { var rev = R(1, 5); return num("Convert $" + rev + "$ revolutions to radians.", rev * 2 * Math.PI, 0.02, ["$1$ rev $=2\\pi$ rad.", "$" + rev + "\\times2\\pi$.", "$=" + sig(rev * 2 * Math.PI) + "$ rad."], "$2\\pi$ rad per revolution.", "rad"); }
    ],
    hard: [
      function () { var I = R(2, 10), al = R(1, 6); return num("Torque to give moment of inertia $" + I + "$ kg·m² an angular acceleration $" + al + "$ rad/s².", I * al, 0.02, ["$\\tau=I\\alpha$.", "$" + I + "\\times" + al + "$.", "$=" + I * al + "$ N·m."], "Rotational Newton's law.", "N·m"); }
    ],
    extreme: [
      function () { var I = R(2, 8), w = R(2, 8); return num("Rotational KE: $I=" + I + "$ kg·m², $\\omega=" + w + "$ rad/s.", 0.5 * I * w * w, 0.02, ["$KE=\\tfrac12I\\omega^2$.", "$0.5\\cdot" + I + "\\cdot" + w + "^2$.", "$=" + sig(0.5 * I * w * w) + "$ J."], "$KE_{rot}=\\tfrac12I\\omega^2$.", "J"); }
    ]
  }; }

  function equilibrium() { return {
    easy: [
      function () { var a = R(10, 40), b = R(10, 40); return num("Two upward forces $" + a + "$ N and $" + b + "$ N support a weight in equilibrium. Find the weight.", a + b, 0.01, ["$\\sum F=0$.", "$W=" + a + "+" + b + "$.", "$=" + (a + b) + "$ N."], "Up forces balance the weight.", "N"); }
    ],
    medium: [
      function () { var F = R(10, 40), d = pick([0.5, 1, 1.5, 2]); return num("A seesaw balances: torque of $" + F + "$ N at $" + d + "$ m on one side. Find the balancing torque.", F * d, 0.02, ["Torques balance.", "$\\tau=" + F + "\\times" + d + "$.", "$=" + sig(F * d) + "$ N·m."], "Equal and opposite torques.", "N·m"); }
    ],
    hard: [
      function () { var W = R(100, 400), d1 = R(1, 3), d2 = R(1, 4); return num("A $" + W + "$ N weight sits $" + d1 + "$ m from a pivot. What force at $" + d2 + "$ m balances it?", W * d1 / d2, 0.02, ["$F d_2=W d_1$.", "$F=" + W + "\\cdot" + d1 + "/" + d2 + "$.", "$=" + sig(W * d1 / d2) + "$ N."], "Balance the torques.", "N"); }
    ],
    extreme: [
      function () { var T = R(50, 150), th = pick([30, 45, 60]); var rad = th * Math.PI / 180; return num("A cable at $" + th + "°$ has tension $" + T + "$ N. Find its vertical component.", T * Math.sin(rad), 0.03, ["$T_y=T\\sin\\theta$.", "$" + T + "\\sin" + th + "°$.", "$=" + sig(T * Math.sin(rad)) + "$ N."], "Vertical component $=T\\sin\\theta$.", "N"); }
    ]
  }; }

  function fluids() { return {
    easy: [
      function () { var F = R(20, 100), A = pick([0.5, 1, 2, 4]); return num("Pressure from $" + F + "$ N over $" + A + "$ m².", F / A, 0.02, ["$P=F/A$.", "$" + F + "/" + A + "$.", "$=" + sig(F / A) + "$ Pa."], "$P=F/A$.", "Pa"); }
    ],
    medium: [
      function () { var rho = 1000, h = R(2, 20); return num("Pressure at depth $" + h + "$ m in water ($\\rho=1000$, $g=9.8$).", rho * g * h, 0.02, ["$P=\\rho gh$.", "$1000\\cdot9.8\\cdot" + h + "$.", "$=" + sig(rho * g * h) + "$ Pa."], "$P=\\rho gh$.", "Pa"); }
    ],
    hard: [
      function () { var V = pick([0.001, 0.002, 0.005]); var rho = 1000; return num("Buoyant force on a $" + V + "$ m³ object fully submerged in water.", rho * g * V, 0.03, ["$F_b=\\rho gV$.", "$1000\\cdot9.8\\cdot" + V + "$.", "$=" + sig(rho * g * V) + "$ N."], "Archimedes: $F_b=\\rho gV$.", "N"); }
    ],
    extreme: [
      function () { var A1 = R(2, 6), A2 = R(1, 4) * 10, F1 = R(10, 40); return num("Hydraulic press: input $" + F1 + "$ N on area $" + A1 + "$ cm², output area $" + A2 + "$ cm². Output force?", F1 * A2 / A1, 0.03, ["$F_2=F_1 A_2/A_1$.", "$" + F1 + "\\cdot" + A2 + "/" + A1 + "$.", "$=" + sig(F1 * A2 / A1) + "$ N."], "Pascal's principle.", "N"); }
    ]
  }; }

  function oscillations() { return {
    easy: [
      function () { var T = pick([0.5, 1, 2, 4]); return num("Frequency of an oscillation with period $" + T + "$ s.", 1 / T, 0.02, ["$f=1/T$.", "$1/" + T + "$.", "$=" + sig(1 / T) + "$ Hz."], "$f=1/T$.", "Hz"); }
    ],
    medium: [
      function () { var L = pick([0.5, 1, 2, 4]); return num("Period of a pendulum of length $" + L + "$ m. ($g=9.8$)", 2 * Math.PI * Math.sqrt(L / g), 0.03, ["$T=2\\pi\\sqrt{L/g}$.", "$2\\pi\\sqrt{" + L + "/9.8}$.", "$=" + sig(2 * Math.PI * Math.sqrt(L / g)) + "$ s."], "$T=2\\pi\\sqrt{L/g}$.", "s"); }
    ],
    hard: [
      function () { var k = R(50, 300), m = R(1, 6); return num("Period of a $" + m + "$ kg mass on a spring, $k=" + k + "$ N/m.", 2 * Math.PI * Math.sqrt(m / k), 0.03, ["$T=2\\pi\\sqrt{m/k}$.", "$2\\pi\\sqrt{" + m + "/" + k + "}$.", "$=" + sig(2 * Math.PI * Math.sqrt(m / k)) + "$ s."], "$T=2\\pi\\sqrt{m/k}$.", "s"); }
    ],
    extreme: [
      function () { var k = R(50, 300), A = pick([0.1, 0.2, 0.3]); return num("Max PE of a spring, $k=" + k + "$ N/m, amplitude $" + A + "$ m.", 0.5 * k * A * A, 0.02, ["$U_{max}=\\tfrac12kA^2$.", "$0.5\\cdot" + k + "\\cdot" + A + "^2$.", "$=" + sig(0.5 * k * A * A) + "$ J."], "All energy is PE at max displacement.", "J"); }
    ]
  }; }

  function tempheat() { return {
    easy: [
      function () { var c = R(0, 100); return num("Convert $" + c + "$°C to Kelvin.", c + 273.15, 0.01, ["$K=°C+273.15$.", "$" + c + "+273.15$.", "$=" + sig(c + 273.15) + "$ K."], "Add 273.15.", "K"); }
    ],
    medium: [
      function () { var c = R(0, 100); return num("Convert $" + c + "$°C to Fahrenheit.", c * 9 / 5 + 32, 0.02, ["$F=\\tfrac95C+32$.", "$" + c + "\\cdot1.8+32$.", "$=" + sig(c * 9 / 5 + 32) + "$ °F."], "$F=\\tfrac95C+32$.", "°F"); }
    ],
    hard: [
      function () { var m = R(100, 500), dT = R(5, 40); var cw = 4186; return num("Heat to warm $" + m + "$ g of water by $" + dT + "$°C. ($c=4186$ J/kg·°C)", (m / 1000) * cw * dT, 0.03, ["$Q=mc\\Delta T$.", "$" + (m / 1000) + "\\cdot4186\\cdot" + dT + "$.", "$=" + sig((m / 1000) * cw * dT) + "$ J."], "$Q=mc\\Delta T$ (mass in kg).", "J"); }
    ],
    extreme: [
      function () { var L = R(2, 10), a = 12e-6, dT = R(20, 80); return num("Thermal expansion of a $" + L + "$ m steel beam, $\\Delta T=" + dT + "$°C ($\\alpha=1.2\\times10^{-5}$).", L * a * dT, 0.05, ["$\\Delta L=\\alpha L\\Delta T$.", "$1.2e{-5}\\cdot" + L + "\\cdot" + dT + "$.", "$=" + sig(L * a * dT) + "$ m."], "$\\Delta L=\\alpha L\\Delta T$.", "m"); }
    ]
  }; }

  function thermo() { return {
    easy: [
      function () { var Q = R(100, 500), W = R(20, 90); return num("First law: internal energy change if $Q=" + Q + "$ J added and $W=" + W + "$ J done by the gas.", Q - W, 0.01, ["$\\Delta U=Q-W$.", "$" + Q + "-" + W + "$.", "$=" + (Q - W) + "$ J."], "$\\Delta U=Q-W$.", "J"); }
    ],
    medium: [
      function () { var Th = R(400, 800), Tc = R(200, 350); return num("Carnot efficiency between $T_h=" + Th + "$ K and $T_c=" + Tc + "$ K.", 1 - Tc / Th, 0.02, ["$\\eta=1-T_c/T_h$.", "$1-" + Tc + "/" + Th + "$.", "$=" + sig(1 - Tc / Th) + "$."], "$\\eta=1-T_c/T_h$."); }
    ],
    hard: [
      function () { var Qh = R(500, 1000), Qc = R(100, 400); return num("Efficiency of an engine taking $" + Qh + "$ J and exhausting $" + Qc + "$ J.", 1 - Qc / Qh, 0.02, ["$\\eta=1-Q_c/Q_h$.", "$1-" + Qc + "/" + Qh + "$.", "$=" + sig(1 - Qc / Qh) + "$."], "$\\eta=W/Q_h=1-Q_c/Q_h$."); }
    ],
    extreme: [
      function () { var n = R(1, 3), dT = R(50, 200); var Rgas = 8.314; return num("Heat at constant volume for $" + n + "$ mol monatomic gas, $\\Delta T=" + dT + "$ K ($C_v=\\tfrac32R$).", n * 1.5 * Rgas * dT, 0.03, ["$Q=nC_v\\Delta T$, $C_v=\\tfrac32R$.", "$" + n + "\\cdot1.5\\cdot8.314\\cdot" + dT + "$.", "$=" + sig(n * 1.5 * Rgas * dT) + "$ J."], "$Q=n\\tfrac32R\\Delta T$.", "J"); }
    ]
  }; }

  function waves() { return {
    easy: [
      function () { var f = R(100, 500), lam = pick([0.5, 1, 2]); return num("Wave speed: frequency $" + f + "$ Hz, wavelength $" + lam + "$ m.", f * lam, 0.02, ["$v=f\\lambda$.", "$" + f + "\\times" + lam + "$.", "$=" + sig(f * lam) + "$ m/s."], "$v=f\\lambda$.", "m/s"); }
    ],
    medium: [
      function () { var lam = pick([0.5, 1, 2, 4]); var v = 343; return num("Frequency of a sound wave of wavelength $" + lam + "$ m ($v=343$ m/s).", v / lam, 0.02, ["$f=v/\\lambda$.", "$343/" + lam + "$.", "$=" + sig(v / lam) + "$ Hz."], "$f=v/\\lambda$.", "Hz"); }
    ],
    hard: [
      function () { var d = R(340, 3400); var v = 340; return num("An echo returns after bouncing off a wall $" + d + "$ m away. Round-trip time? ($v=340$)", 2 * d / v, 0.02, ["Distance $=2d$.", "$t=2\\cdot" + d + "/340$.", "$=" + sig(2 * d / v) + "$ s."], "Sound travels there and back.", "s"); }
    ],
    extreme: [
      function () { var f = R(400, 800); var v = 340, vs = R(10, 30); return num("Doppler: source at $" + vs + "$ m/s approaching, emits $" + f + "$ Hz. Observed frequency? ($v=340$)", f * v / (v - vs), 0.03, ["$f'=f\\,v/(v-v_s)$.", "$" + f + "\\cdot340/(340-" + vs + ")$.", "$=" + sig(f * v / (v - vs)) + "$ Hz."], "Approaching ⇒ higher pitch.", "Hz"); }
    ]
  }; }

  // ---- register phys1441 (calculus-based) ----
  G("phys1441-01-units", units());
  G("phys1441-02-kinematics-1d", kinematics());
  G("phys1441-03-vectors-2d", vectors());
  G("phys1441-04-newtons-laws", newton());
  G("phys1441-05-applications-gravity", gravity());
  G("phys1441-06-work-energy", workenergy());
  G("phys1441-07-potential-energy", potential());
  G("phys1441-08-momentum", momentum());
  G("phys1441-09-rotation", rotation());
  G("phys1441-10-equilibrium", equilibrium());
  G("phys1441-11-fluids", fluids());
  G("phys1441-12-oscillations", oscillations());
  G("phys1441-13-temperature-heat", tempheat());
  G("phys1441-14-thermodynamics", thermo());

  // ---- register phys1433 (algebra-based) ----
  G("phys1433-01-units", units());
  G("phys1433-02-kinematics-1d", kinematics());
  G("phys1433-03-kinematics-2d", vectors());
  G("phys1433-04-newtons-laws", newton());
  G("phys1433-05-friction-circular", friction());
  G("phys1433-06-gravitation", gravity());
  G("phys1433-07-work-energy-power", workenergy());
  G("phys1433-08-momentum", momentum());
  G("phys1433-09-rotation-torque", rotation());
  G("phys1433-10-equilibrium", equilibrium());
  G("phys1433-11-fluids", fluids());
  G("phys1433-12-temperature-heat", tempheat());
  G("phys1433-13-thermodynamics", thermo());
  G("phys1433-14-waves-sound", waves());

  // =========================================================================
  // PRECALCULUS
  // =========================================================================
  G("precalc-01-functions", {
    easy: [
      function () { var m = RN(-4, 5), b = R(-5, 6), x = R(1, 6); return num("If $f(x)=" + m + "x+" + (b < 0 ? b : "+" + b) + "$, find $f(" + x + ")$.", m * x + b, 0.001, ["Substitute $x=" + x + "$.", "$" + m + "(" + x + ")" + (b < 0 ? b : "+" + b) + "$.", "$=" + (m * x + b) + "$."], "Plug in the input."); }
    ],
    medium: [
      function () { var a = R(2, 8); return mc("Domain of $f(x)=\\dfrac{1}{x-" + a + "}$?", ["$x\\neq" + a + "$", "$x\\neq0$", "all reals", "$x>" + a + "$"], 0, ["Denominator zero at $x=" + a + "$.", "Exclude it.", "$x\\neq" + a + "$."], "Where does the denominator vanish?"); }
    ],
    hard: [
      function () { var a = R(2, 9); return mc("Domain of $f(x)=\\sqrt{x-" + a + "}$?", ["$x\\ge" + a + "$", "$x\\le" + a + "$", "$x\\neq" + a + "$", "all reals"], 0, ["Need $x-" + a + "\\ge0$.", "$x\\ge" + a + "$.", "$[" + a + ",\\infty)$."], "Even roots need a nonnegative inside."); }
    ],
    extreme: [
      function () { var a = R(1, 4); return mc("Domain of $f(x)=\\dfrac{\\sqrt{x}}{x-" + a + "}$?", ["$x\\ge0,\\ x\\neq" + a + "$", "$x>" + a + "$", "$x\\neq" + a + "$", "all $x\\ge0$"], 0, ["Root needs $x\\ge0$.", "Denominator needs $x\\neq" + a + "$.", "Combine."], "Two restrictions at once."); }
    ]
  });
  G("precalc-02-function-formulas", {
    easy: [
      function () { var x = R(1, 6); return num("If $f(x)=x^2+1$, find $f(" + x + ")$.", x * x + 1, 0.001, ["$" + x + "^2+1$.", "$=" + (x * x + 1) + "$.", "Done."], "Square, then add 1."); }
    ],
    medium: [
      function () { var a = R(1, 4), b = R(1, 4); var lo = a, hi = a + b; return num("Average rate of change of $f(x)=x^2$ on $[" + lo + "," + hi + "]$.", (hi * hi - lo * lo) / (hi - lo), 0.01, ["$\\dfrac{f(" + hi + ")-f(" + lo + ")}{" + hi + "-" + lo + "}$.", "$\\dfrac{" + (hi * hi) + "-" + (lo * lo) + "}{" + (hi - lo) + "}$.", "$=" + sig((hi * hi - lo * lo) / (hi - lo)) + "$."], "$\\dfrac{f(b)-f(a)}{b-a}$."); }
    ],
    hard: [
      function () { var m = R(2, 7); return mc("Difference quotient of $f(x)=" + m + "x$ simplifies to:", ["$" + m + "$", "$" + m + "x$", "$" + m + "h$", "$0$"], 0, ["$\\dfrac{" + m + "(x+h)-" + m + "x}{h}$.", "$=\\dfrac{" + m + "h}{h}$.", "$=" + m + "$."], "The $h$ cancels."); }
    ],
    extreme: [
      function () { var x = R(1, 5); return mc("Difference quotient of $f(x)=x^2$ is:", ["$2x+h$", "$2x$", "$x+h$", "$2xh$"], 0, ["$\\dfrac{(x+h)^2-x^2}{h}$.", "$=\\dfrac{2xh+h^2}{h}$.", "$=2x+h$."], "Expand $(x+h)^2$ and cancel $h$."); }
    ]
  });
  G("precalc-03-function-graphs", {
    easy: [
      function () { var c = R(1, 9); return num("Find the y-intercept of $f(x)=x^2-" + c + "$.", -c, 0.001, ["$f(0)=0-" + c + "$.", "$=-" + c + "$.", "Done."], "Compute $f(0)$."); }
    ],
    medium: [
      function () { var c = R(1, 9); var r = Math.sqrt(c * c); return mc("How many x-intercepts does $f(x)=x^2-" + (c * c) + "$ have?", ["2", "1", "0", "infinite"], 0, ["$x^2=" + (c * c) + "$.", "$x=\\pm" + c + "$.", "Two intercepts."], "Solve $x^2=$ constant."); }
    ],
    hard: [
      function () { return mc("Is $f(x)=x^3$ even, odd, or neither?", ["Odd", "Even", "Neither", "Both"], 0, ["$f(-x)=-x^3$.", "$=-f(x)$.", "Odd."], "Compare $f(-x)$ to $-f(x)$."); }
    ],
    extreme: [
      function () { return mc("Is $f(x)=x^4-x^2$ even, odd, or neither?", ["Even", "Odd", "Neither", "Both"], 0, ["$f(-x)=x^4-x^2$.", "$=f(x)$.", "Even."], "Test $f(-x)$."); }
    ]
  });
  G("precalc-04-transformations", {
    easy: [
      function () { var k = R(2, 6); return mc("How does $f(x)+" + k + "$ transform the graph?", ["Up " + k, "Down " + k, "Right " + k, "Left " + k], 0, ["Added outside.", "Vertical shift up.", "By " + k + "."], "Outside +k shifts vertically."); }
    ],
    medium: [
      function () { var h = R(2, 6); return mc("How does $f(x-" + h + ")$ transform the graph?", ["Right " + h, "Left " + h, "Up " + h, "Down " + h], 0, ["Inside $x-" + h + "$.", "Opposite sign ⇒ right.", "By " + h + "."], "Inside shifts go opposite the sign."); }
    ],
    hard: [
      function () { var h = R(1, 5), k = R(1, 6); return mc("Vertex of $y=(x-" + h + ")^2+" + k + "$?", ["$(" + h + "," + k + ")$", "$(-" + h + "," + k + ")$", "$(" + h + ",-" + k + ")$", "$(0,0)$"], 0, ["Right " + h + ", up " + k + ".", "Vertex moves.", "$(" + h + "," + k + ")$."], "Shift the vertex of $y=x^2$."); }
    ],
    extreme: [
      function () { var h = R(1, 4), k = R(1, 5); return mc("Vertex of $y=-2(x+" + h + ")^2-" + k + "$?", ["$(-" + h + ",-" + k + ")$", "$(" + h + "," + k + ")$", "$(-" + h + "," + k + ")$", "$(" + h + ",-" + k + ")$"], 0, ["Inside $+" + h + "$ ⇒ left.", "Outside $-" + k + "$ ⇒ down.", "Stretch keeps vertex fixed."], "The stretch factor doesn't move the vertex."); }
    ]
  });
  G("precalc-05-operations", {
    easy: [
      function () { var x = R(1, 5); return num("If $f(x)=x+2$ and $g(x)=3x$, find $(f+g)(" + x + ")$.", (x + 2) + 3 * x, 0.001, ["$f=" + (x + 2) + "$, $g=" + (3 * x) + "$.", "Add.", "$=" + ((x + 2) + 3 * x) + "$."], "Add the two outputs."); }
    ],
    medium: [
      function () { var x = R(1, 4); return num("If $f(x)=x^2$ and $g(x)=x+1$, find $(f\\circ g)(" + x + ")$.", (x + 1) * (x + 1), 0.001, ["$g(" + x + ")=" + (x + 1) + "$.", "$f(" + (x + 1) + ")=" + (x + 1) + "^2$.", "$=" + (x + 1) * (x + 1) + "$."], "Inner function first."); }
    ],
    hard: [
      function () { var x = R(1, 4); return num("If $f(x)=2x$ and $g(x)=x-3$, find $g(f(" + x + "))$.", 2 * x - 3, 0.001, ["$f(" + x + ")=" + (2 * x) + "$.", "$g(" + (2 * x) + ")=" + (2 * x) + "-3$.", "$=" + (2 * x - 3) + "$."], "Apply $f$, then $g$."); }
    ],
    extreme: [
      function () { var a = R(2, 6); return mc("Domain of $f(g(x))$ where $f(x)=\\sqrt{x}$, $g(x)=x-" + a + "$?", ["$x\\ge" + a + "$", "$x\\le" + a + "$", "$x\\neq" + a + "$", "all reals"], 0, ["Need $g(x)\\ge0$.", "$x-" + a + "\\ge0$.", "$x\\ge" + a + "$."], "The inside of the root must be $\\ge0$."); }
    ]
  });
  G("precalc-06-inverse", {
    easy: [
      function () { var b = R(2, 9); return mc("Inverse of $f(x)=x+" + b + "$?", ["$x-" + b + "$", "$x+" + b + "$", "$" + b + "-x$", "$x/" + b + "$"], 0, ["Swap: $x=y+" + b + "$.", "$y=x-" + b + "$.", "Done."], "Undo the addition."); }
    ],
    medium: [
      function () { var m = R(2, 6); return mc("Inverse of $f(x)=" + m + "x$?", ["$x/" + m + "$", "$" + m + "x$", "$x-" + m + "$", "$" + m + "/x$"], 0, ["$x=" + m + "y$.", "$y=x/" + m + "$.", "Done."], "Undo the multiplication."); }
    ],
    hard: [
      function () { var m = R(2, 5), b = R(1, 6); var y = R(2, 8); return num("If $f(x)=" + m + "x-" + b + "$, find $f^{-1}(" + y + ")$.", (y + b) / m, 0.01, ["$x=" + m + "y-" + b + "$; $y=(x+" + b + ")/" + m + "$.", "At $x=" + y + "$.", "$=" + sig((y + b) / m) + "$."], "Solve $x=f(y)$, then plug in."); }
    ],
    extreme: [
      function () { var a = R(2, 6); return num("If $f(" + a + ")=" + (a * a) + "$ and $f$ is invertible, find $f^{-1}(" + (a * a) + ")$.", a, 0.001, ["Inverse reverses the pair.", "$(" + a + "," + (a * a) + ")\\to(" + (a * a) + "," + a + ")$.", "$=" + a + "$."], "Swap the coordinates."); }
    ]
  });
  G("precalc-07-poly-division", {
    easy: [
      function () { var a = R(1, 6); return num("Remainder Theorem: remainder of $P(x)=x^2+1$ divided by $x-" + a + "$.", a * a + 1, 0.01, ["$P(" + a + ")=" + a + "^2+1$.", "$=" + (a * a + 1) + "$.", "That's the remainder."], "Remainder $=P(a)$."); }
    ],
    medium: [
      function () { var a = R(1, 5); return mc("Is $x-" + a + "$ a factor of $P(x)=x^2-" + (a * a) + "$?", ["Yes", "No", "Only if $a=0$", "Cannot tell"], 0, ["$P(" + a + ")=" + (a * a) + "-" + (a * a) + "=0$.", "Zero remainder.", "Factor."], "Check $P(a)=0$."); }
    ],
    hard: [
      function () { var r = R(2, 5), s = R(1, 4); return mc("Divide $x^2-" + (r + s) + "x+" + (r * s) + "$ by $x-" + r + "$. Quotient?", ["$x-" + s + "$", "$x+" + s + "$", "$x-" + r + "$", "$x+" + r + "$"], 0, ["Factors: $(x-" + r + ")(x-" + s + ")$.", "Cancel $(x-" + r + ")$.", "$x-" + s + "$."], "Factor the quadratic first."); }
    ],
    extreme: [
      function () { var a = R(1, 4); return num("Remainder of $x^3-" + (3 * a) + "x+" + (2 * a * a * a) + "$ divided by $x-" + a + "$.", a * a * a - 3 * a * a + 2 * a * a * a, 0.01, ["$P(" + a + ")=" + a + "^3-" + (3 * a) + "(" + a + ")+" + (2 * a * a * a) + "$.", "Compute.", "$=" + (a * a * a - 3 * a * a + 2 * a * a * a) + "$."], "Evaluate $P(a)$."); }
    ]
  });
  G("precalc-08-poly-graphs", {
    easy: [
      function () { return mc("End behavior of $f(x)=x^2$: both ends go —", ["Up", "Down", "Opposite ways", "Flat"], 0, ["Even degree, positive lead.", "Both ends match.", "Up."], "Even degree ⇒ ends agree."); }
    ],
    medium: [
      function () { var n = R(3, 6); return num("Max number of turning points of a degree-$" + n + "$ polynomial?", n - 1, 0.001, ["At most $n-1$.", "$" + n + "-1$.", "$=" + (n - 1) + "$."], "$n-1$ turning points."); }
    ],
    hard: [
      function () { var m = pick([2, 4]); return mc("At the zero of $(x-3)^{" + m + "}$, the graph —", ["Touches", "Crosses", "Jumps", "Ends"], 0, ["Multiplicity " + m + " (even).", "Touches and turns.", "Touch."], "Even multiplicity ⇒ touch."); }
    ],
    extreme: [
      function () { var a = R(1, 4), b = R(1, 4), c = R(1, 4); return num("Y-intercept of $f(x)=(x-" + a + ")(x+" + b + ")(x-" + c + ")$.", (-a) * (b) * (-c), 0.01, ["$f(0)=(-" + a + ")(" + b + ")(-" + c + ")$.", "Multiply.", "$=" + ((-a) * (b) * (-c)) + "$."], "Evaluate at $x=0$."); }
    ]
  });
  G("precalc-09-poly-roots", {
    easy: [
      function () { var n = R(2, 6); return num("How many roots (with multiplicity) does a degree-$" + n + "$ polynomial have?", n, 0.001, ["Fundamental Theorem of Algebra.", "Degree $" + n + "$.", "$" + n + "$ roots."], "Count equals the degree."); }
    ],
    medium: [
      function () { var r = R(1, 5), s = R(1, 5); return mc("Roots of $x^2-" + (r + s) + "x+" + (r * s) + "$?", ["$" + r + "," + s + "$", "$-" + r + ",-" + s + "$", "$" + (r + s) + "," + (r * s) + "$", "no real roots"], 0, ["Factor $(x-" + r + ")(x-" + s + ")$.", "Set each to 0.", "$" + r + "," + s + "$."], "Factor the quadratic."); }
    ],
    hard: [
      function () { var a = R(1, 4), b = R(1, 4); return mc("If $" + a + "+" + b + "i$ is a root of a real polynomial, another root is —", ["$" + a + "-" + b + "i$", "$-" + a + "+" + b + "i$", "$" + a + "+" + b + "i$", "$" + b + "+" + a + "i$"], 0, ["Complex roots pair as conjugates.", "Flip the imaginary sign.", "$" + a + "-" + b + "i$."], "Conjugate pair."); }
    ],
    extreme: [
      function () { var a = R(2, 5); return mc("A cubic has roots $" + a + ", " + a + ", -1$. With lead 1, it is —", ["$(x-" + a + ")^2(x+1)$", "$(x-" + a + ")(x+1)^2$", "$(x+" + a + ")^2(x-1)$", "$(x-" + a + ")^3$"], 0, ["Double root at $" + a + "$, single at $-1$.", "$(x-" + a + ")^2(x+1)$.", "Done."], "Include the multiplicity."); }
    ]
  });
  G("precalc-10-rational", {
    easy: [
      function () { var a = R(2, 8); return mc("Vertical asymptote of $R(x)=\\dfrac{1}{x-" + a + "}$?", ["$x=" + a + "$", "$x=0$", "$x=-" + a + "$", "none"], 0, ["Denominator zero at $" + a + "$.", "Numerator nonzero.", "$x=" + a + "$."], "Where the bottom is zero."); }
    ],
    medium: [
      function () { var a = R(2, 6); return num("Horizontal asymptote $y=?$ of $R(x)=\\dfrac{" + a + "x}{x+1}$.", a, 0.01, ["Equal degrees.", "Ratio of leads $=" + a + "/1$.", "$y=" + a + "$."], "Compare leading coefficients."); }
    ],
    hard: [
      function () { return mc("Horizontal asymptote of $R(x)=\\dfrac{2x}{x^2+1}$?", ["$y=0$", "$y=2$", "$y=1$", "none"], 0, ["Bottom degree larger.", "$y=0$.", "Done."], "Bigger bottom degree ⇒ $y=0$."); }
    ],
    extreme: [
      function () { var a = R(1, 4); return mc("The factor $(x-" + a + ")$ cancels in $R(x)=\\dfrac{(x-" + a + ")(x+2)}{x-" + a + "}$. At $x=" + a + "$ there is a —", ["Hole", "Vertical asymptote", "Horizontal asymptote", "Root"], 0, ["Cancelling factor.", "Removable discontinuity.", "Hole."], "Cancelling factor ⇒ hole."); }
    ]
  });
  G("precalc-11-asymptotes", {
    easy: [
      function () { var a = R(2, 7); return mc("Vertical asymptote of $\\dfrac{1}{x+" + a + "}$?", ["$x=-" + a + "$", "$x=" + a + "$", "$x=0$", "none"], 0, ["Denominator zero at $-" + a + "$.", "Doesn't cancel.", "$x=-" + a + "$."], "Non-cancelling denominator zero."); }
    ],
    medium: [
      function () { var a = R(2, 6); return num("As $x\\to\\infty$, $\\dfrac{" + a + "x+1}{x}\\to$?", a, 0.01, ["Divide: $" + a + "+1/x$.", "$\\to" + a + "$.", "Done."], "Leading-term behavior."); }
    ],
    hard: [
      function () { return mc("$\\dfrac{x-1}{x-1}$ at $x=1$ has —", ["A hole", "A vertical asymptote", "A root", "Nothing special"], 0, ["Factor cancels.", "Removable.", "Hole."], "Cancelling ⇒ hole."); }
    ],
    extreme: [
      function () { return mc("Slant asymptote of $\\dfrac{x^2-1}{x}$?", ["$y=x$", "$y=0$", "$y=1$", "$y=x-1$"], 0, ["Top degree one more.", "Divide: $x-1/x$.", "$y=x$."], "Divide when the top is one degree higher."); }
    ]
  });
  G("precalc-12-inequalities", {
    easy: [
      function () { var a = R(2, 8); return mc("Solve $x-" + a + ">0$.", ["$x>" + a + "$", "$x<" + a + "$", "$x>-" + a + "$", "$x<-" + a + "$"], 0, ["Add " + a + ".", "$x>" + a + "$.", "Done."], "Isolate $x$."); }
    ],
    medium: [
      function () { var a = R(1, 5); return mc("Solve $x^2-" + (a * a) + "\\le0$.", ["$-" + a + "\\le x\\le" + a + "$", "$x\\le-" + a + "$ or $x\\ge" + a + "$", "$x\\ge" + a + "$", "all reals"], 0, ["Roots $\\pm" + a + "$.", "Parabola $\\le0$ between them.", "$[-" + a + "," + a + "]$."], "Between the roots for $\\le0$."); }
    ],
    hard: [
      function () { var r = R(1, 4), s = R(1, 4); var roots = [-s, r].sort(function (x, y) { return x - y; }); return mc("Solve $(x-" + r + ")(x+" + s + ")>0$.", ["$x<" + roots[0] + "$ or $x>" + roots[1] + "$", "$" + roots[0] + "<x<" + roots[1] + "$", "all reals", "no solution"], 0, ["Roots $" + roots[0] + "," + roots[1] + "$.", "Positive outside the roots.", "Union of the outer intervals."], "Product positive outside the roots."); }
    ],
    extreme: [
      function () { var a = R(2, 6); return mc("Solve $\\dfrac{1}{x-" + a + "}>0$.", ["$x>" + a + "$", "$x<" + a + "$", "$x\\neq" + a + "$", "all reals"], 0, ["Positive when $x-" + a + ">0$.", "$x>" + a + "$.", "Exclude " + a + "."], "Fraction is positive when the denominator is."); }
    ]
  });
  G("precalc-13-exponential", {
    easy: [
      function () { var b = R(2, 4), n = R(2, 4); return num("Evaluate $" + b + "^{" + n + "}$.", Math.pow(b, n), 0.001, ["$" + b + "^{" + n + "}$.", "Multiply " + b + " " + n + " times.", "$=" + Math.pow(b, n) + "$."], "Compute the power."); }
    ],
    medium: [
      function () { var b = pick([0.25, 0.5, 0.75, 2, 3]); return mc("Is $f(x)=" + b + "^x$ growth or decay?", [b < 1 ? "Decay" : "Growth", b < 1 ? "Growth" : "Decay", "Constant", "Linear"], 0, ["Base " + b + (b < 1 ? "$<1$." : "$>1$."), b < 1 ? "Shrinks." : "Grows.", b < 1 ? "Decay." : "Growth."], "Compare the base to 1."); }
    ],
    hard: [
      function () { var a = R(2, 6), b = R(2, 4), t = R(1, 3); return num("For $P=" + a + "\\cdot" + b + "^t$, find $P$ at $t=" + t + "$.", a * Math.pow(b, t), 0.01, ["$" + a + "\\cdot" + b + "^{" + t + "}$.", "$" + b + "^{" + t + "}=" + Math.pow(b, t) + "$.", "$=" + (a * Math.pow(b, t)) + "$."], "Evaluate the exponential model."); }
    ],
    extreme: [
      function () { var P = R(200, 800), r = pick([0.03, 0.04, 0.05]), t = R(5, 12); return num("Continuous growth: $" + P + "$ at $" + (r * 100) + "\\%$ for $" + t + "$ yr. ($A=Pe^{rt}$)", P * Math.exp(r * t), 0.03, ["$A=Pe^{rt}$.", "$" + P + "e^{" + r + "\\cdot" + t + "}$.", "$=" + sig(P * Math.exp(r * t)) + "$."], "$A=Pe^{rt}$."); }
    ]
  });
  G("precalc-14-logarithmic", {
    easy: [
      function () { var b = pick([2, 3, 5, 10]), n = R(2, 4); return num("Evaluate $\\log_{" + b + "}(" + Math.pow(b, n) + ")$.", n, 0.001, ["$" + b + "^{" + n + "}=" + Math.pow(b, n) + "$.", "So the log is " + n + ".", "Done."], "What power of the base gives the argument?"); }
    ],
    medium: [
      function () { var n = R(2, 6); return num("Evaluate $\\ln(e^{" + n + "})$.", n, 0.001, ["$\\ln$ and $e$ are inverses.", "$\\ln e^{" + n + "}=" + n + "$.", "Done."], "$\\ln e^x=x$."); }
    ],
    hard: [
      function () { var b = pick([2, 3, 5]), n = R(2, 4); return num("Solve $" + b + "^x=" + Math.pow(b, n) + "$.", n, 0.001, ["$" + Math.pow(b, n) + "=" + b + "^{" + n + "}$.", "Match exponents.", "$x=" + n + "$."], "Write both sides with the same base."); }
    ],
    extreme: [
      function () { var c = R(2, 9); return num("Solve $e^{x}=" + c + "$ (give $x=\\ln " + c + "$).", Math.log(c), 0.02, ["Take $\\ln$ of both sides.", "$x=\\ln" + c + "$.", "$=" + sig(Math.log(c)) + "$."], "Take the natural log."); }
    ]
  });

})();
