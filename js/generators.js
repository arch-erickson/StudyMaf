/* StudyMAF question generation engine.
 *
 * Each lesson registers generators grouped by difficulty. A generator makes ONE
 * fresh instance of a question: same wording, new numbers, with the answer and
 * worked steps computed at the same time. So we can hand a student an endless
 * supply of a given difficulty until they get one right.
 *
 * Instance shapes:
 *   numeric: { type:"numeric", prompt, answerValue, answerText, unit, tol, steps, hint }
 *   choice:  { type:"mc", prompt, choices:[...], answerIndex, steps, hint }
 *   multi:   { type:"multi", prompt, parts:[part...], steps, hint }
 *     part (numeric): { label, type:"numeric", answerValue, answerText, tol }
 *     part (mc):      { label, type:"mc", choices, answerIndex }
 */
window.Generators = (function () {
  "use strict";
  var reg = {};
  var K = 8.99e9, E = 1.6e-19;

  function rpick(a) { return a[Math.floor(Math.random() * a.length)]; }
  // format to ~3 significant figures for display (exponential for very big/small)
  function sig(x) { if (x === 0) return "0"; var a = Math.abs(x); if (a >= 1e5 || a < 1e-3) return x.toExponential(2); return (+x.toPrecision(3)).toString(); }
  function num(prompt, value, text, tol, steps, hint, unit) { return { type: "numeric", prompt: prompt, answerValue: value, answerText: text, unit: unit || "", tol: tol || 0.03, steps: steps, hint: hint }; }
  function mc(prompt, choices, answerIndex, steps, hint) { return { type: "mc", prompt: prompt, choices: choices, answerIndex: answerIndex, steps: steps, hint: hint }; }
  function multi(prompt, parts, steps, hint) { return { type: "multi", prompt: prompt, parts: parts, steps: steps, hint: hint }; }
  // tag an instance with the syllabus problem it is modeled on (shown in the session)
  function S(inst, source) { inst.source = source; return inst; }

  function register(lessonId, sets) { reg[lessonId] = sets; }
  function has(lessonId) { return !!reg[lessonId]; }
  function difficulties(lessonId) {
    var set = reg[lessonId]; if (!set) return [];
    return ["easy", "medium", "hard", "extreme"].filter(function (d) { return set[d] && set[d].length; });
  }
  function make(lessonId, difficulty) {
    var set = reg[lessonId]; if (!set) return null;
    var fns = set[difficulty] || set.medium || []; if (!fns.length) return null;
    var inst = rpick(fns)();
    inst.difficulty = difficulty; return inst;
  }

  // ================= Lesson 1: Coulomb's Law (Vol.2 Ch.5) =================
  // Modeled on the syllabus problems: 40, 43 (charge quantization),
  // 51, 53 (Coulomb's law + superposition), 56 (2-D), 62 (triangle).
  register("phys1442-01-coulomb", {
    easy: [
      // #40 — a lightning bolt moves Q coulombs; how many fundamental charges?
      function () { var Q = rpick([20, 30, 40, 50, 60]); var n = Q / E;
        return S(num("A lightning bolt moves $" + Q + ".0$ C of charge from a cloud to the ground. How many fundamental units of charge $e$ is this?", n, n.toExponential(2), 0.04,
          ["Charge only comes in whole multiples of $e = 1.6\\times10^{-19}$ C, so $n = Q/e$.", "$n = \\dfrac{" + Q + ".0}{1.6\\times10^{-19}}$", "$n \\approx " + n.toExponential(2) + "$ units"],
          "Divide the total charge by $e = 1.6\\times10^{-19}$ C.", "units"), "Vol. 2, Ch. 5 · Problem 40"); },
      // #43 — a small charged object carries a net charge; how many excess electrons?
      function () { var qn = rpick([2, 5, 8]); var n = qn * 1e-9 / E;
        return S(num("A speck of dust in an electrostatic precipitator carries a net charge of $-" + qn + ".00$ nC. How many excess electrons does it hold?", n, n.toExponential(2), 0.04,
          ["A negative charge means extra electrons, each carrying $-e$. So $n = |Q|/e$.", "$n = \\dfrac{" + qn + "\\times10^{-9}}{1.6\\times10^{-19}}$", "$n \\approx " + n.toExponential(2) + "$ electrons"],
          "Each excess electron adds $-1.6\\times10^{-19}$ C. Divide the charge by $e$.", "electrons"), "Vol. 2, Ch. 5 · Problem 43"); }
    ],
    medium: [
      // #51 — two protons in a nucleus, femtometer distance, repulsion force
      function () { var d = rpick([2.0, 3.0, 4.0]); var dm = d * 1e-15; var F = K * E * E / (dm * dm);
        return S(num("Two protons in an atomic nucleus are about $" + d + "\\times10^{-15}$ m apart. What is the electric force of repulsion between them?", F, sig(F), 0.03,
          ["Each proton carries $e = 1.6\\times10^{-19}$ C, so $F = k\\dfrac{e^2}{d^2}$.", "$F = (8.99\\times10^9)\\dfrac{(1.6\\times10^{-19})^2}{(" + d + "\\times10^{-15})^2}$", "$F \\approx " + sig(F) + "$ N"],
          "Both charges equal $e$; use Coulomb's law with the tiny nuclear distance.", "N"), "Vol. 2, Ch. 5 · Problem 51"); },
      // #53 — three charges on a line; net force on the charge placed midway
      function () { var q1 = rpick([2, 3, 4]), q2 = rpick([5, 6, 8]), q3 = rpick([1, 2]); var r = 0.50;
        var F1 = K * q1 * 1e-6 * q3 * 1e-6 / (r * r), F2 = K * q2 * 1e-6 * q3 * 1e-6 / (r * r);
        var net = Math.abs(F2 - F1); var toward = q2 > q1 ? "q_1" : "q_2";
        return S(num("Two charges $q_1 = +" + q1 + "\\ \\mu\\text{C}$ and $q_2 = +" + q2 + "\\ \\mu\\text{C}$ are $1.0$ m apart. A third charge $q_3 = +" + q3 + "\\ \\mu\\text{C}$ is placed midway between them. What is the magnitude of the net force on $q_3$?", net, sig(net), 0.04,
          ["Each outer charge is $r = 0.50$ m from $q_3$.", "$F_1 = k\\dfrac{q_1 q_3}{r^2} \\approx " + sig(F1) + "$ N (pushes toward $q_2$); $F_2 \\approx " + sig(F2) + "$ N (pushes toward $q_1$).", "They oppose, so net $= |F_2 - F_1| \\approx " + sig(net) + "$ N, directed toward $" + toward + "$."],
          "Find each force on $q_3$ separately; they point opposite ways, so subtract.", "N"), "Vol. 2, Ch. 5 · Problem 53"); }
    ],
    hard: [
      // #56 — two point charges at 2-D coordinates; force magnitude (distance via Pythagoras)
      function () { var q1 = rpick([2, 3, 4]), q2 = rpick([2, 3, 5]); var leg = rpick([[3, 4], [6, 8]]); var a = leg[0], b = leg[1];
        var r = Math.sqrt(a * a + b * b) / 100; var F = K * q1 * 1e-6 * q2 * 1e-6 / (r * r);
        return S(num("Charge $q_1 = +" + q1 + "\\ \\mu\\text{C}$ sits at the origin and $q_2 = +" + q2 + "\\ \\mu\\text{C}$ sits at $(" + a + ",\\ " + b + ")$ cm. What is the magnitude of the force between them?", F, sig(F), 0.04,
          ["First the separation from the coordinates: $r = \\sqrt{" + a + "^2 + " + b + "^2} = " + Math.round(Math.sqrt(a * a + b * b)) + "$ cm $= " + r + "$ m.", "Then Coulomb's law: $F = k\\dfrac{q_1 q_2}{r^2}$.", "$F = (8.99\\times10^9)\\dfrac{(" + q1 + "\\times10^{-6})(" + q2 + "\\times10^{-6})}{(" + r + ")^2} \\approx " + sig(F) + "$ N"],
          "Use the coordinates to get $r$ with the Pythagorean theorem, then apply Coulomb's law.", "N"), "Vol. 2, Ch. 5 · Problem 56"); }
    ],
    extreme: [
      // #62 — three charges at the corners of a right triangle; net force on one
      function () { var q = rpick([2, 3, 4]), d = rpick([0.10, 0.20]); var Q = q * 1e-6;
        var Fadj = K * Q * Q / (d * d);
        var Fdiag = K * Q * Q / (2 * d * d);
        var Fx = -Fdiag / Math.SQRT2, Fy = Fadj + Fdiag / Math.SQRT2;
        var mag = Math.hypot(Fx, Fy);
        return S(multi("Three equal charges $+" + q + "\\ \\mu\\text{C}$ sit at the corners of a right triangle with legs $" + d + "$ m: one at the origin, one at $(" + d + ",0)$, and one at $(0," + d + ")$. Find the net force on the charge at $(0," + d + ")$.",
          [ { label: "Magnitude of the net force (N)", type: "numeric", answerValue: mag, answerText: sig(mag), tol: 0.06 },
            { label: "Roughly which way does it point?", type: "mc", choices: ["Up and to the left (away from the other two)", "Straight down toward the origin", "Straight right"], answerIndex: 0 } ],
          ["From the charge directly below (distance $" + d + "$ m): $F = k\\dfrac{q^2}{d^2} \\approx " + sig(Fadj) + "$ N, pointing $+y$.", "From the charge across the hypotenuse (distance $\\sqrt2\\,d$): $F = k\\dfrac{q^2}{2d^2} \\approx " + sig(Fdiag) + "$ N, pointing up-left.", "Add components: $F_x \\approx " + sig(Fx) + "$ N, $F_y \\approx " + sig(Fy) + "$ N, so $|F| \\approx " + sig(mag) + "$ N, up and to the left."],
          "Find each force as a vector, split into $x$ and $y$, add the components, then recombine."), "Vol. 2, Ch. 5 · Problem 62"); }
    ]
  });

  // ================= Lesson 2: The Electric Field (Vol.2 Ch.5) =================
  // Modeled on the syllabus problems: 69 (E=F/q), 100 (field-line rules),
  // 77 (field + force from two charges), 81 (line charge), 80 (charged plate),
  // 84 (semicircular arc), 94 (proton deflection), 106 (dipole).
  var EPS0 = 8.85e-12, MP = 1.67e-27, ME = 9.11e-31;
  register("phys1442-02-efield", {
    easy: [
      // #69 — field at a point from the force on a test charge
      function () { var q = rpick([2, 3, 4, 5]), F = rpick([0.05, 0.10, 0.20, 0.40]); var Ef = F / (q * 1e-6);
        return S(num("At a point in space, a $" + q + "\\ \\mu\\text{C}$ charge feels a force of $" + F + "$ N. What is the electric field at that point?", Ef, sig(Ef), 0.03,
          ["The field is the force per unit charge: $E = F/q$.", "$E = \\dfrac{" + F + "}{" + q + "\\times10^{-6}}$", "$E \\approx " + sig(Ef) + "$ N/C"],
          "Divide the force by the charge: $E = F/q$.", "N/C"), "Vol. 2, Ch. 5 · Problem 69"); },
      // #100 — which statement about field lines is INCORRECT?
      function () {
        var wrong = rpick([
          "Two field lines can cross where the field is strong.",
          "Field lines can start in empty space, away from any charge.",
          "Field lines point from negative charge toward positive charge."
        ]);
        var choices = [wrong, "Field lines start on positive charge and end on negative charge.", "The field is stronger where the lines are closer together.", "A field line shows the direction of the force on a positive test charge."];
        for (var s = choices.length - 1; s > 0; s--) { var j = Math.floor(Math.random() * (s + 1)); var t = choices[s]; choices[s] = choices[j]; choices[j] = t; }
        var ai = choices.indexOf(wrong);
        return S(mc("Which statement about electric field lines is INCORRECT?", choices, ai,
          ["Field lines never cross, always run from $+$ to $-$, and never begin in empty space.", "“" + wrong + "” breaks one of those rules, so it is the incorrect statement."],
          "Recall the rules: lines go $+\\to-$, never cross, and density shows strength."), "Vol. 2, Ch. 5 · Problem 100"); }
    ],
    medium: [
      // #77 — two charges 1.0 m apart: field at the midpoint, then force on a charge there
      function () { var q1 = rpick([3, 4, 5]), q2 = rpick([2, 3, 6]), q3 = rpick([1, 2]); var r = 0.50;
        var E1 = K * q1 * 1e-6 / (r * r), E2 = K * q2 * 1e-6 / (r * r); var Enet = E1 + E2; var F = q3 * 1e-6 * Enet;
        return S(multi("A charge $+" + q1 + "\\ \\mu\\text{C}$ and a charge $-" + q2 + "\\ \\mu\\text{C}$ are placed $1.0$ m apart.",
          [ { label: "Electric field magnitude at the midpoint (N/C)", type: "numeric", answerValue: Enet, answerText: sig(Enet), tol: 0.04 },
            { label: "Force on a $+" + q3 + "\\ \\mu\\text{C}$ charge placed there (N)", type: "numeric", answerValue: F, answerText: sig(F), tol: 0.04 } ],
          ["Each charge is $r = 0.50$ m from the midpoint. $E = k|q|/r^2$ gives $E_1 \\approx " + sig(E1) + "$ and $E_2 \\approx " + sig(E2) + "$ N/C.", "Toward the $+$ and away toward the $-$ both point the same way, so they add: $E \\approx " + sig(Enet) + "$ N/C.", "Force on the test charge: $F = qE = (" + q3 + "\\times10^{-6})(" + sig(Enet) + ") \\approx " + sig(F) + "$ N."],
          "Find each charge's field at the midpoint, add them (they point the same way), then use $F=qE$."), "Vol. 2, Ch. 5 · Problem 77"); },
      // #81 — field a distance r from a long, uniformly charged wire
      function () { var lam = rpick([2, 3, 5]), r = rpick([1.0, 2.0, 4.0]); var Ef = 2 * K * lam * 1e-6 / r;
        return S(num("A long straight wire is charged uniformly at $\\lambda = " + lam + "\\ \\mu\\text{C/m}$. What is the magnitude of the electric field $" + r + "$ m from the wire?", Ef, sig(Ef), 0.03,
          ["A long line of charge gives $E = \\dfrac{2k\\lambda}{r}$ (it falls off as $1/r$, not $1/r^2$).", "$E = \\dfrac{2(8.99\\times10^9)(" + lam + "\\times10^{-6})}{" + r + "}$", "$E \\approx " + sig(Ef) + "$ N/C, pointing radially away from the wire"],
          "For a long charged wire use $E = 2k\\lambda/r$.", "N/C"), "Vol. 2, Ch. 5 · Problem 81"); }
    ],
    hard: [
      // #80 — charged conducting plate; acceleration of a nearby electron
      function () { var Qn = rpick([2, 4, 6]), side = 1.0; var sigma = Qn * 1e-6 / (side * side); var Ef = sigma / EPS0; var a = E * Ef / ME;
        return S(num("A conducting plate $1.0$ m on a side carries a charge of $" + Qn + "\\ \\mu\\text{C}$, spread evenly. An electron is placed just above the center. What is the electron's acceleration?", a, a.toExponential(2), 0.05,
          ["Surface charge density $\\sigma = Q/A = \\dfrac{" + Qn + "\\times10^{-6}}{1.0} $ C/m$^2$.", "Just outside a conductor $E = \\sigma/\\varepsilon_0 \\approx " + sig(Ef) + "$ N/C.", "Then $a = \\dfrac{eE}{m_e} = \\dfrac{(1.6\\times10^{-19})(" + sig(Ef) + ")}{9.11\\times10^{-31}} \\approx " + a.toExponential(2) + "$ m/s$^2$."],
          "Find $\\sigma=Q/A$, then $E=\\sigma/\\varepsilon_0$, then $a=eE/m_e$.", "m/s²"), "Vol. 2, Ch. 5 · Problem 80"); },
      // #84 — field at the center of a uniformly charged semicircular wire
      function () { var lam = rpick([2, 3, 5]), Rcm = rpick([4, 5, 10]); var R = Rcm / 100; var Ef = 2 * K * lam * 1e-6 / R;
        return S(num("A thin semicircular wire of radius $" + Rcm + "$ cm carries a uniform charge of $\\lambda = " + lam + "\\ \\mu\\text{C/m}$. What is the electric field at the center $P$ of the semicircle?", Ef, sig(Ef), 0.03,
          ["By symmetry only the component along the axis survives; integrating around the arc gives $E = \\dfrac{2k\\lambda}{R}$.", "$E = \\dfrac{2(8.99\\times10^9)(" + lam + "\\times10^{-6})}{" + R + "}$", "$E \\approx " + sig(Ef) + "$ N/C"],
          "For a semicircular arc the field at the center is $E = 2k\\lambda/R$.", "N/C"), "Vol. 2, Ch. 5 · Problem 84"); }
    ],
    extreme: [
      // #94 — a proton enters a uniform field between plates; downward deflection
      function () { var Ef = rpick([500, 800, 1000]), L = rpick([0.04, 0.06, 0.10]), v = rpick([1e5, 2e5]);
        var a = E * Ef / MP; var t = L / v; var d = 0.5 * a * t * t;
        return S(multi("A proton enters the uniform field between two charged plates. The field is $E = " + Ef + "$ N/C, the plates are $" + L + "$ m long, and the proton enters at $v = " + v.toExponential(0) + "$ m/s parallel to the plates.",
          [ { label: "Acceleration of the proton (m/s²)", type: "numeric", answerValue: a, answerText: a.toExponential(2), tol: 0.05 },
            { label: "Downward deflection $d$ as it leaves the plates (m)", type: "numeric", answerValue: d, answerText: d.toExponential(2), tol: 0.06 } ],
          ["Sideways there is no force, so time in the field is $t = L/v = " + t.toExponential(2) + "$ s.", "The field accelerates it: $a = eE/m_p = \\dfrac{(1.6\\times10^{-19})(" + Ef + ")}{1.67\\times10^{-27}} \\approx " + a.toExponential(2) + "$ m/s$^2$.", "Deflection like projectile motion: $d = \\tfrac12 a t^2 \\approx " + d.toExponential(2) + "$ m."],
          "Constant speed along the plates sets the time; the field gives $a=eE/m_p$; then $d=\\tfrac12 a t^2$."), "Vol. 2, Ch. 5 · Problem 94"); },
      // #106 — dipole moment and the torque on it in a field
      function () { var q = rpick([2, 4, 5]), dcm = rpick([2, 3, 4]), Ef = rpick([1e5, 2e5, 5e5]);
        var p = q * 1e-9 * dcm * 1e-2; var tau = p * Ef;
        return S(multi("Two charges $+" + q + "$ nC and $-" + q + "$ nC are held $" + dcm + "$ cm apart, forming a dipole.",
          [ { label: "Dipole moment $p$ (C·m)", type: "numeric", answerValue: p, answerText: p.toExponential(2), tol: 0.03 },
            { label: "Torque when placed sideways in a $" + Ef.toExponential(0) + "$ N/C field (N·m)", type: "numeric", answerValue: tau, answerText: tau.toExponential(2), tol: 0.04 } ],
          ["Dipole moment: $p = qd = (" + q + "\\times10^{-9})(" + dcm + "\\times10^{-2}) \\approx " + p.toExponential(2) + "$ C·m.", "Torque in a field: $\\tau = pE\\sin\\theta$. Placed sideways ($\\theta = 90^\\circ$), $\\sin\\theta = 1$.", "$\\tau = pE \\approx " + tau.toExponential(2) + "$ N·m."],
          "Dipole moment is $p=qd$; the torque is $\\tau = pE\\sin\\theta$ (maximum at $90^\\circ$)."), "Vol. 2, Ch. 5 · Problem 106"); }
    ]
  });

  return { register: register, has: has, make: make, difficulties: difficulties };
})();
