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
  function sig(x) { if (x === 0) return "0"; var d = Math.abs(x) >= 1000 || Math.abs(x) < 0.01 ? x.toExponential(2) : x.toPrecision(3); return String(+d) === d.toString() ? String(x) : d; }
  function num(prompt, value, text, tol, steps, hint, unit) { return { type: "numeric", prompt: prompt, answerValue: value, answerText: text, unit: unit || "", tol: tol || 0.03, steps: steps, hint: hint }; }
  function mc(prompt, choices, answerIndex, steps, hint) { return { type: "mc", prompt: prompt, choices: choices, answerIndex: answerIndex, steps: steps, hint: hint }; }
  function multi(prompt, parts, steps, hint) { return { type: "multi", prompt: prompt, parts: parts, steps: steps, hint: hint }; }

  function register(lessonId, sets) { reg[lessonId] = sets; }
  function has(lessonId) { return !!reg[lessonId]; }
  function make(lessonId, difficulty) {
    var set = reg[lessonId]; if (!set) return null;
    var fns = set[difficulty] || set.medium || []; if (!fns.length) return null;
    var inst = rpick(fns)();
    inst.difficulty = difficulty; return inst;
  }

  // ================= Lesson 1: Coulomb's Law =================
  register("phys1442-01-coulomb", {
    easy: [
      function () { var q = rpick([1, 2, 4, 5, 8]); var n = q * 1e-6 / E;
        return num("How many extra electrons make up a charge of $" + q + "\\ \\mu\\text{C}$?", n, n.toExponential(2), 0.04,
          ["Charge only comes in whole units of $e = 1.6\\times10^{-19}$ C, so $n = Q/e$.", "$n = \\dfrac{" + q + "\\times10^{-6}}{1.6\\times10^{-19}}$", "$n \\approx " + n.toExponential(2) + "$ electrons"],
          "Divide the charge by $e = 1.6\\times10^{-19}$ C.", "electrons"); },
      function () { var q1 = rpick([1, 2, 3]), q2 = rpick([2, 3, 4]), r = rpick([0.10, 0.20, 0.50]); var F = K * q1 * 1e-6 * q2 * 1e-6 / (r * r);
        return num("Two charges of $" + q1 + "\\ \\mu\\text{C}$ and $" + q2 + "\\ \\mu\\text{C}$ are $" + r + "$ m apart. What is the force between them?", F, sig(F), 0.03,
          ["Use Coulomb's law $F = k\\dfrac{q_1 q_2}{r^2}$.", "$F = (8.99\\times10^9)\\dfrac{(" + q1 + "\\times10^{-6})(" + q2 + "\\times10^{-6})}{(" + r + ")^2}$", "$F \\approx " + sig(F) + "$ N"],
          "Put the charges in coulombs, then use $F = k q_1 q_2 / r^2$.", "N"); },
      function () { var p = rpick([["positive", "positive", "Repel"], ["negative", "negative", "Repel"], ["positive", "negative", "Attract"], ["negative", "positive", "Attract"]]);
        return mc("A " + p[0] + " charge sits near a " + p[1] + " charge. Do they attract or repel?", ["Attract", "Repel"], p[2] === "Attract" ? 0 : 1,
          ["Same signs push apart, opposite signs pull together.", "Here the charges are " + p[0] + " and " + p[1] + ", so they " + p[2].toLowerCase() + "."],
          "Same signs repel. Opposite signs attract."); }
    ],
    medium: [
      function () { var F0 = rpick([4, 8, 12, 16]), f = rpick([2, 3, 4]); var nf = F0 / (f * f);
        return num("Two charges feel a force of $" + F0 + "$ N. If you move them $" + f + "$ times farther apart, what is the new force?", nf, sig(nf), 0.02,
          ["The force drops with the square of the distance, so $F \\propto 1/r^2$.", "Moving $" + f + "$ times farther divides the force by $" + f + "^2 = " + f * f + "$.", "$F' = " + F0 + "/" + f * f + " = " + sig(nf) + "$ N"],
          "The force falls off as $1/r^2$.", "N"); },
      function () { var F = rpick([1, 2, 4, 9]), r = rpick([0.30, 0.50, 1.0]); var q = Math.sqrt(F * r * r / K) * 1e6;
        return num("Two equal charges $" + r + "$ m apart repel with $" + F + "$ N. What is each charge, in $\\mu$C?", q, sig(q), 0.03,
          ["With equal charges, $F = k\\dfrac{q^2}{r^2}$, so $q = \\sqrt{\\dfrac{F r^2}{k}}$.", "$q = \\sqrt{\\dfrac{(" + F + ")(" + r + ")^2}{8.99\\times10^9}}$", "$q \\approx " + sig(q) + "\\ \\mu$C"],
          "Set both charges equal and solve $F = k q^2/r^2$ for $q$.", "μC"); },
      function () { return mc("Which change makes the force between two charges $4$ times larger?", ["Halve the distance", "Double the distance", "Halve one of the charges", "Triple the distance"], 0,
          ["Force is $F = k q_1 q_2 / r^2$.", "Halving $r$ divides by $(1/2)^2$, which multiplies the force by $4$."],
          "Look at how $r$ appears in $F = k q_1 q_2/r^2$."); }
    ],
    hard: [
      function () { var a = rpick([2, 3, 4]), b = rpick([1, 2]); var d = 0.20;
        var F13 = K * a * 1e-6 * 1e-6 / (0.40 * 0.40); var F23 = K * b * 1e-6 * 1e-6 / (0.20 * 0.20); var net = F13 - F23;
        var dir = net < 0 ? 0 : 1; var mag = Math.abs(net);
        return multi("On a line: $+" + a + "\\ \\mu\\text{C}$ at $x=0$, $-" + b + "\\ \\mu\\text{C}$ at $x=0.20$ m, and $+1\\ \\mu\\text{C}$ at $x=0.40$ m. Find the force on the $+1\\ \\mu\\text{C}$ charge.",
          [ { label: "Magnitude of the net force (N)", type: "numeric", answerValue: mag, answerText: sig(mag), tol: 0.05 },
            { label: "Direction", type: "mc", choices: ["Toward $-x$ (toward the negative charge)", "Toward $+x$ (away from both)"], answerIndex: dir } ],
          ["Force from $+" + a + "\\ \\mu$C ($r=0.40$): $F_{13} \\approx " + sig(F13) + "$ N pushing in $+x$.", "Force from $-" + b + "\\ \\mu$C ($r=0.20$): $F_{23} \\approx " + sig(F23) + "$ N pulling in $-x$.", "Net $= " + sig(net) + "$ N, so magnitude $" + sig(mag) + "$ N toward " + (dir === 0 ? "$-x$" : "$+x$") + "."],
          "Find each force on its own, mark its direction, then add."); },
      function () { var n = rpick([2, 3]), d = rpick([0.30, 0.60]); var x = d / (1 + n);
        return num("Charge $+q$ sits at $x=0$ and $+" + (n * n) + "q$ at $x=" + d + "$ m. How far from the small charge is the net force on a test charge zero?", x, sig(x), 0.03,
          ["Set the two force sizes equal: $k\\dfrac{q}{x^2} = k\\dfrac{" + n * n + "q}{(" + d + "-x)^2}$.", "Take the square root: $" + d + " - x = " + n + "x$.", "$x = " + sig(x) + "$ m from the small charge."],
          "The zero point sits closer to the smaller charge. Set the force sizes equal.", "m"); }
    ],
    extreme: [
      function () { var qa = rpick([4, 6, 8]), qb = rpick([2, 4]), r = rpick([0.10, 0.20]); var each = (qa - qb) / 2; var F = K * each * 1e-6 * each * 1e-6 / (r * r);
        return multi("Two identical metal spheres carry $+" + qa + "\\ \\mu\\text{C}$ and $-" + qb + "\\ \\mu\\text{C}$. They are touched together, then moved $" + r + "$ m apart.",
          [ { label: "Charge on each sphere after touching (in $\\mu$C)", type: "numeric", answerValue: each, answerText: sig(each), tol: 0.02 },
            { label: "Force between them afterward (in N)", type: "numeric", answerValue: F, answerText: sig(F), tol: 0.03 } ],
          ["Touching lets identical spheres share the total charge evenly: each gets $\\dfrac{" + qa + " + (-" + qb + ")}{2} = " + each + "\\ \\mu$C.", "Then $F = k\\dfrac{(" + each + "\\times10^{-6})^2}{(" + r + ")^2} \\approx " + sig(F) + "$ N, repulsive since both are now positive."],
          "First split the total charge evenly, then use Coulomb's law with the new charges."); }
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

  return { register: register, has: has, make: make };
})();
