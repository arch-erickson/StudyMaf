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

  // ================= Lesson 2: The Electric Field =================
  register("phys1442-02-efield", {
    easy: [
      function () { var q = rpick([1, 2, 4, 5]), F = rpick([0.05, 0.10, 0.20]); var Efield = F / (q * 1e-6);
        return num("A charge of $" + q + "\\ \\mu\\text{C}$ feels a force of $" + F + "$ N at a point. What is the electric field there?", Efield, sig(Efield), 0.03,
          ["Field is force per unit charge: $E = F/q$.", "$E = \\dfrac{" + F + "}{" + q + "\\times10^{-6}}$", "$E \\approx " + sig(Efield) + "$ N/C"],
          "Divide the force by the charge.", "N/C"); },
      function () { var q = rpick([2, 4, 5, 8]), r = rpick([0.20, 0.30, 0.50]); var Ef = K * q * 1e-6 / (r * r);
        return num("Find the electric field $" + r + "$ m from a $+" + q + "\\ \\mu\\text{C}$ point charge.", Ef, sig(Ef), 0.03,
          ["Use $E = k\\dfrac{q}{r^2}$.", "$E = (8.99\\times10^9)\\dfrac{" + q + "\\times10^{-6}}{(" + r + ")^2}$", "$E \\approx " + sig(Ef) + "$ N/C"],
          "Use the point charge field $E = k q/r^2$.", "N/C"); },
      function () { var neg = rpick([true, false]);
        return mc("The electric field around a " + (neg ? "negative" : "positive") + " charge points...", ["Toward the charge", "Away from the charge"], neg ? 0 : 1,
          ["Field lines leave positive charge and enter negative charge.", "So a " + (neg ? "negative" : "positive") + " charge's field points " + (neg ? "toward" : "away from") + " it."],
          "Field points away from positive, toward negative."); }
    ],
    medium: [
      function () { var q = rpick([2, 3, 5]), Efield = rpick([1000, 2000, 5000]); var F = q * 1e-6 * Efield;
        return num("A $" + q + "\\ \\mu\\text{C}$ charge sits in a field of $" + Efield + "$ N/C. What force does it feel?", F, sig(F), 0.03,
          ["Force from a field is $F = qE$.", "$F = (" + q + "\\times10^{-6})(" + Efield + ")$", "$F \\approx " + sig(F) + "$ N"],
          "Use $F = qE$.", "N"); },
      function () { var V = rpick([50, 100, 200]), d = rpick([0.002, 0.005, 0.01]); var Efield = V / d;
        return num("Two parallel plates $" + d + "$ m apart have $" + V + "$ V across them. What is the field between them?", Efield, sig(Efield), 0.02,
          ["Between parallel plates the field is uniform: $E = V/d$.", "$E = \\dfrac{" + V + "}{" + d + "}$", "$E = " + sig(Efield) + "$ N/C"],
          "For parallel plates, $E = V/d$.", "N/C"); },
      function () { return mc("Which way does the force on an electron point, compared with the electric field?", ["The same direction as the field", "The opposite direction to the field", "Perpendicular to the field", "There is no force"], 1,
          ["Force is $F = qE$, and an electron's charge is negative.", "A negative charge is pushed opposite to the field."],
          "Remember the electron's charge sign in $F = qE$."); }
    ],
    hard: [
      function () { var q = rpick([2, 3, 4]), d = rpick([0.20, 0.40]); var r = d / 2; var each = K * q * 1e-6 / (r * r); var net = 2 * each;
        return num("On a line, $+" + q + "\\ \\mu\\text{C}$ is at $x=0$ and $-" + q + "\\ \\mu\\text{C}$ is at $x=" + d + "$ m. Find the field size at the midpoint.", net, sig(net), 0.03,
          ["Each charge is $" + r + "$ m from the middle, giving $E = k\\dfrac{" + q + "\\times10^{-6}}{(" + r + ")^2} \\approx " + sig(each) + "$ N/C.", "Between a $+$ and a $-$ charge both fields point the same way, so they add.", "$E_{net} \\approx " + sig(net) + "$ N/C"],
          "Between a positive and a negative charge, the two fields add up.", "N/C"); },
      function () { var Efield = rpick([1000, 5000, 10000]); var a = E * Efield / 9.11e-31;
        return num("An electron is let go in a uniform field of $" + Efield + "$ N/C. What is its acceleration?", a, a.toExponential(2), 0.04,
          ["First the force: $F = eE = (1.6\\times10^{-19})(" + Efield + ")$.", "Then $a = F/m$ with $m = 9.11\\times10^{-31}$ kg.", "$a \\approx " + a.toExponential(2) + "$ m/s$^2$"],
          "Find the force $eE$, then use $a = F/m$.", "m/s²"); }
    ],
    extreme: [
      function () { var nEl = rpick([5, 10, 20]); var q = nEl * E; var Efield = rpick([1e4, 2e4]); var m = q * Efield / 9.8;
        return multi("A charged oil drop hangs perfectly still in an upward field of $" + Efield.toExponential(0) + "$ N/C. It carries $" + nEl + "$ extra electrons.",
          [ { label: "Its charge $q$ (in C)", type: "numeric", answerValue: q, answerText: q.toExponential(2), tol: 0.03 },
            { label: "Its mass (in kg)", type: "numeric", answerValue: m, answerText: m.toExponential(2), tol: 0.04 } ],
          ["Charge is $q = " + nEl + "e = " + q.toExponential(2) + "$ C.", "Hanging still means the electric force balances gravity: $qE = mg$, so $m = qE/g = " + m.toExponential(2) + "$ kg."],
          "The charge is $n\\times e$; for it to hang, the electric force must balance gravity."); }
    ]
  });

  return { register: register, has: has, make: make, difficulties: difficulties };
})();
