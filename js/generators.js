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

  // ================= Lesson 3: Gauss's Law (Vol.2 Ch.6) =================
  // Modeled on syllabus problems: 22, 37 (flux basics), 27, 31, 43 (flux/Gauss),
  // 23, 69 (charge density from flux / conducting pipe), 44, 42 (spheres).
  register("phys1442-03-gauss", {
    easy: [
      // #22 — flux through an area at an angle: Phi = E A cos(theta)
      function () { var Ef = rpick([20, 30, 50]), A = rpick([0.5, 1.0, 2.0]), th = rpick([0, 30, 60]); var Phi = Ef * A * Math.cos(th * Math.PI / 180);
        return S(num("A uniform electric field of $" + Ef + "$ N/C passes through a flat area of $" + A + "\\ \\text{m}^2$. The normal to the area makes a $" + th + "^\\circ$ angle with the field. What is the electric flux?", Phi, sig(Phi), 0.03,
          ["Flux counts only the perpendicular part: $\\Phi = EA\\cos\\theta$.", "$\\Phi = (" + Ef + ")(" + A + ")\\cos " + th + "^\\circ$", "$\\Phi \\approx " + sig(Phi) + "$ N·m²/C"],
          "Use $\\Phi = EA\\cos\\theta$ with the angle from the normal.", "N·m²/C"), "Vol. 2, Ch. 6 · Problem 22"); },
      // #37 — net charge enclosed from the flux through a closed surface
      function () { var Phi = rpick([1, 2, 5, 8]) * 1e5; var Q = EPS0 * Phi;
        return S(num("The electric flux through a closed spherical surface is $" + (Phi / 1e5) + "\\times10^{5}$ N·m²/C. What is the net charge enclosed?", Q, Q.toExponential(2), 0.03,
          ["Gauss's law: $\\Phi = Q_{enc}/\\varepsilon_0$, so $Q_{enc} = \\varepsilon_0\\Phi$.", "$Q_{enc} = (8.85\\times10^{-12})(" + (Phi / 1e5) + "\\times10^{5})$", "$Q_{enc} \\approx " + Q.toExponential(2) + "$ C"],
          "Rearrange Gauss's law: $Q = \\varepsilon_0\\Phi$.", "C"), "Vol. 2, Ch. 6 · Problem 37"); }
    ],
    medium: [
      // #27 — flux of a given field vector through a circle in the xy-plane (only E_z counts)
      function () { var Ex = rpick([20, 40, 60]), Ez = rpick([50, 100, 150]), r = rpick([1.0, 2.0, 3.0]); var A = Math.PI * r * r; var Phi = Ez * A;
        return S(num("A uniform field $\\vec{E} = " + Ex + "\\,\\hat{x} + " + Ez + "\\,\\hat{z}$ N/C passes through a circular area of radius $" + r + "$ m lying in the $xy$-plane. What is the electric flux through it?", Phi, sig(Phi), 0.03,
          ["The area's normal is $\\hat{z}$, so only the $z$-component of $\\vec{E}$ makes flux.", "$\\Phi = E_z\\,(\\pi r^2) = " + Ez + "\\,\\pi(" + r + ")^2$", "$\\Phi \\approx " + sig(Phi) + "$ N·m²/C"],
          "Only the field component along the area's normal ($\\hat{z}$ here) contributes.", "N·m²/C"), "Vol. 2, Ch. 6 · Problem 27"); },
      // #31 — net flux through a closed surface enclosing several charges
      function () { var a = rpick([2, 3, 4]), b = rpick([1, 2]), c = rpick([3, 5]); var Qenc = (a - b + c) * 1e-6; var Phi = Qenc / EPS0;
        return S(num("A closed surface encloses three point charges: $+" + a + "\\ \\mu\\text{C}$, $-" + b + "\\ \\mu\\text{C}$, and $+" + c + "\\ \\mu\\text{C}$. What is the net electric flux through the surface?", Phi, Phi.toExponential(2), 0.03,
          ["Only enclosed charge matters: $Q_{enc} = (" + a + " - " + b + " + " + c + ")\\ \\mu\\text{C} = " + (a - b + c) + "\\ \\mu\\text{C}$.", "$\\Phi = Q_{enc}/\\varepsilon_0 = \\dfrac{" + (a - b + c) + "\\times10^{-6}}{8.85\\times10^{-12}}$", "$\\Phi \\approx " + Phi.toExponential(2) + "$ N·m²/C"],
          "Add the enclosed charges (with signs), then divide by $\\varepsilon_0$.", "N·m²/C"), "Vol. 2, Ch. 6 · Problem 31"); },
      // #43 — field a distance r from a very long, thin charged wire
      function () { var lam = rpick([2, 3, 5]), rcm = rpick([2.0, 4.0, 5.0]); var r = rcm / 100; var Ef = 2 * K * lam * 1e-6 / r;
        return S(num("A very long, thin wire has a uniform linear charge density $\\lambda = " + lam + "\\ \\mu\\text{C/m}$. What is the electric field $" + rcm + "$ cm from the wire?", Ef, Ef.toExponential(2), 0.03,
          ["A cylindrical Gaussian surface gives $E = \\dfrac{\\lambda}{2\\pi\\varepsilon_0 r} = \\dfrac{2k\\lambda}{r}$.", "$E = \\dfrac{2(8.99\\times10^9)(" + lam + "\\times10^{-6})}{" + r + "}$", "$E \\approx " + Ef.toExponential(2) + "$ N/C"],
          "Use the line-charge result $E = 2k\\lambda/r$.", "N/C"), "Vol. 2, Ch. 6 · Problem 43"); }
    ],
    hard: [
      // #23 — charge density on a large sheet, from the flux through a parallel area
      function () { var scm = 5.0, s = scm / 100, A = s * s; var Ef = rpick([200, 400, 800]); var Phi = Ef * A; var sigma = 2 * EPS0 * Ef;
        return S(num("Close to a large charged sheet, the flux through a square of side $" + scm + "$ cm held parallel to the sheet is $" + sig(Phi) + "$ N·m²/C. What is the surface charge density on the sheet?", sigma, sigma.toExponential(2), 0.04,
          ["The field is perpendicular to the area, so $E = \\Phi/A = " + sig(Phi) + "/(" + s + ")^2 \\approx " + sig(Ef) + "$ N/C.", "A large sheet gives $E = \\sigma/(2\\varepsilon_0)$, so $\\sigma = 2\\varepsilon_0 E$.", "$\\sigma = 2(8.85\\times10^{-12})(" + sig(Ef) + ") \\approx " + sigma.toExponential(2) + "$ C/m²"],
          "Get $E$ from $\\Phi=EA$, then use the sheet field $E=\\sigma/2\\varepsilon_0$.", "C/m²"), "Vol. 2, Ch. 6 · Problem 23"); },
      // #69 — conducting pipe with surface charge density: field inside and outside
      function () { var sig_uC = rpick([1, 2, 4]), acm = rpick([2, 3]), rcm = rpick([5, 8]); var a = acm / 100, r = rcm / 100;
        var Eout = sig_uC * 1e-6 * a / (EPS0 * r);
        return S(multi("A long straight metal pipe of radius $" + acm + "$ cm carries a surface charge density $\\sigma = " + sig_uC + "\\ \\mu\\text{C/m}^2$.",
          [ { label: "Electric field inside the hollow pipe (N/C)", type: "mc", choices: ["Zero", "$\\sigma/\\varepsilon_0$", "$\\sigma/2\\varepsilon_0$"], answerIndex: 0 },
            { label: "Electric field $" + rcm + "$ cm from the axis (outside) (N/C)", type: "numeric", answerValue: Eout, answerText: Eout.toExponential(2), tol: 0.04 } ],
          ["Inside a conductor / hollow charged pipe a Gaussian surface encloses no charge, so $E = 0$.", "Outside, the enclosed charge per length is $\\lambda = \\sigma(2\\pi a)$, giving $E = \\dfrac{\\lambda}{2\\pi\\varepsilon_0 r} = \\dfrac{\\sigma a}{\\varepsilon_0 r}$.", "$E = \\dfrac{(" + sig_uC + "\\times10^{-6})(" + a + ")}{(8.85\\times10^{-12})(" + r + ")} \\approx " + Eout.toExponential(2) + "$ N/C"],
          "Inside a hollow conductor $E=0$; outside, treat it as a line with $\\lambda=\\sigma\\,2\\pi a$."), "Vol. 2, Ch. 6 · Problem 69"); }
    ],
    extreme: [
      // #44 — uniformly charged solid sphere: field at an inside point and an outside point
      function () { var Qu = rpick([3, 5, 8]), Rcm = 10, rin = rpick([2, 5]), rout = 20; var Q = Qu * 1e-6, R = Rcm / 100;
        var Ein = K * Q * (rin / 100) / (R * R * R); var Eout = K * Q / ((rout / 100) * (rout / 100));
        return S(multi("A charge of $" + Qu + "\\ \\mu\\text{C}$ is spread uniformly through a solid sphere of radius $" + Rcm + "$ cm.",
          [ { label: "Field at $" + rin + "$ cm from the center (inside) (N/C)", type: "numeric", answerValue: Ein, answerText: Ein.toExponential(2), tol: 0.05 },
            { label: "Field at $" + rout + "$ cm from the center (outside) (N/C)", type: "numeric", answerValue: Eout, answerText: Eout.toExponential(2), tol: 0.05 } ],
          ["Inside a uniform sphere only the charge within radius $r$ counts: $E = \\dfrac{kQr}{R^3} \\approx " + Ein.toExponential(2) + "$ N/C.", "Outside it acts like a point charge: $E = \\dfrac{kQ}{r^2} \\approx " + Eout.toExponential(2) + "$ N/C.", "Note the field grows with $r$ inside, then falls as $1/r^2$ outside."],
          "Inside: $E=kQr/R^3$. Outside: $E=kQ/r^2$ (like a point charge)."), "Vol. 2, Ch. 6 · Problem 44"); },
      // #42 — spherical charge from a volume density: total charge and the surface field
      function () { var rho_m = rpick([1.0, 2.0, 4.0]), Rcm = rpick([8, 10]); var rho = rho_m * 1e-3, R = Rcm / 100;
        var Q = rho * (4 / 3) * Math.PI * R * R * R; var Es = K * Q / (R * R);
        return S(multi("A sphere of radius $" + Rcm + "$ cm carries a uniform volume charge density $\\rho = " + rho_m + "\\times10^{-3}$ C/m³.",
          [ { label: "Total charge $Q$ (C)", type: "numeric", answerValue: Q, answerText: Q.toExponential(2), tol: 0.04 },
            { label: "Field magnitude at the surface (N/C)", type: "numeric", answerValue: Es, answerText: Es.toExponential(2), tol: 0.05 } ],
          ["Total charge $= $ density $\\times$ volume: $Q = \\rho\\,\\tfrac{4}{3}\\pi R^3 \\approx " + Q.toExponential(2) + "$ C.", "At the surface it acts like a point charge: $E = kQ/R^2 \\approx " + Es.toExponential(2) + "$ N/C.", "This is the largest the field gets; inside it is smaller, outside it falls off."],
          "Get $Q=\\rho\\cdot\\tfrac43\\pi R^3$, then $E=kQ/R^2$ at the surface."), "Vol. 2, Ch. 6 · Problem 42"); }
    ]
  });

  // ================= Lesson 4: Electric Potential (Vol.2 Ch.7) =================
  // Modeled on syllabus problems: 32, 46 (easy), 31, 34, 52 (medium),
  // 39, 43 (hard), 56, 70 (extreme).
  register("phys1442-04-potential", {
    easy: [
      // #32 — average power output: P = Energy / time
      function () { var En = rpick([200, 300, 400]), tms = rpick([5, 10, 15]); var P = En / (tms * 1e-3);
        return S(num("A heart defibrillator dissipates $" + En + "$ J of energy in $" + tms + "$ ms. What is its average power output?", P, P.toExponential(2), 0.02,
          ["Power is energy per unit time: $P = E/t$.", "$P = \\dfrac{" + En + "}{" + tms + "\\times10^{-3}}$", "$P \\approx " + P.toExponential(2) + "$ W"],
          "Use $P = E/t$ with the time in seconds.", "W"), "Vol. 2, Ch. 7 · Problem 32"); },
      // #46 — how far from a point charge is the potential V? r = kq/V
      function () { var qn = rpick([2, 5, 8]), V = rpick([100, 200, 500]); var r = K * qn * 1e-9 / V;
        return S(num("How far from a $+" + qn + "$ nC point charge is the electric potential equal to $" + V + "$ V?", r, sig(r), 0.03,
          ["The potential of a point charge is $V = kq/r$, so $r = kq/V$.", "$r = \\dfrac{(8.99\\times10^9)(" + qn + "\\times10^{-9})}{" + V + "}$", "$r \\approx " + sig(r) + "$ m"],
          "Solve $V = kq/r$ for $r$.", "m"), "Vol. 2, Ch. 7 · Problem 46"); }
    ],
    medium: [
      // #31 — energy of a proton-electron pair a distance d apart (magnitude)
      function () { var d = rpick([0.5, 1.0, 2.0]); var dm = d * 1e-10; var U = K * E * E / dm;
        return S(num("An electron is brought from far away to $" + d + "\\times10^{-10}$ m from a proton. What is the magnitude of the electric potential energy of the pair?", U, U.toExponential(2), 0.03,
          ["Two point charges have $U = k\\dfrac{q_1 q_2}{r}$; here $|q_1 q_2| = e^2$.", "$|U| = (8.99\\times10^9)\\dfrac{(1.6\\times10^{-19})^2}{" + d + "\\times10^{-10}}$", "$|U| \\approx " + U.toExponential(2) + "$ J (the actual value is negative — the charges attract)"],
          "Use $U = ke^2/r$; the pair attracts, so the energy is negative.", "J"), "Vol. 2, Ch. 7 · Problem 31"); },
      // #34 — electron accelerated through a voltage; final (non-relativistic) speed
      function () { var kV = rpick([20, 30, 40]); var v = Math.sqrt(2 * E * kV * 1e3 / ME);
        return S(num("An X-ray tube accelerates electrons from rest through $" + kV + "$ kV. Non-relativistically, what is their maximum speed?", v, v.toExponential(2), 0.03,
          ["All the electrical energy becomes kinetic: $eV = \\tfrac12 m v^2$.", "$v = \\sqrt{\\dfrac{2eV}{m}} = \\sqrt{\\dfrac{2(1.6\\times10^{-19})(" + kV + "\\times10^{3})}{9.11\\times10^{-31}}}$", "$v \\approx " + v.toExponential(2) + "$ m/s"],
          "Set $eV = \\tfrac12 m v^2$ and solve for $v$.", "m/s"), "Vol. 2, Ch. 7 · Problem 34"); },
      // #52 — potential at a point from two charges (scalar sum)
      function () { var q1 = rpick([2, 3, 5]), q2 = rpick([2, 4, 6]), r1cm = rpick([3, 4]), r2cm = rpick([4, 5]); var r1 = r1cm / 100, r2 = r2cm / 100;
        var V = K * (q1 * 1e-6 / r1 - q2 * 1e-6 / r2);
        return S(num("A charge $+" + q1 + "\\ \\mu\\text{C}$ is $" + r1cm + "$ cm from point $P$, and a charge $-" + q2 + "\\ \\mu\\text{C}$ is $" + r2cm + "$ cm from $P$. What is the electric potential at $P$?", V, sig(V), 0.03,
          ["Potential is a scalar sum (keep signs): $V = k\\left(\\dfrac{q_1}{r_1} + \\dfrac{q_2}{r_2}\\right)$.", "$V = (8.99\\times10^9)\\left(\\dfrac{" + q1 + "\\times10^{-6}}{" + r1 + "} - \\dfrac{" + q2 + "\\times10^{-6}}{" + r2 + "}\\right)$", "$V \\approx " + sig(V) + "$ V"],
          "Add each charge's $kq/r$ with its sign — no vectors, potential is a scalar.", "V"), "Vol. 2, Ch. 7 · Problem 52"); }
    ],
    hard: [
      // #39 — parallel plates: field from a known potential at a point, and plate voltage
      function () { var d1cm = rpick([8, 6, 5]), Vp = rpick([300, 450, 600]), D = 0.10; var d1 = d1cm / 100; var Ef = Vp / d1; var Vplates = Ef * D;
        return S(multi("Two parallel plates are $10.0$ cm apart, and one is at $0$ V. The potential $" + d1cm + "$ cm from the zero-volt plate is $" + Vp + "$ V.",
          [ { label: "Electric field strength between the plates (V/m)", type: "numeric", answerValue: Ef, answerText: sig(Ef), tol: 0.03 },
            { label: "Voltage between the plates (V)", type: "numeric", answerValue: Vplates, answerText: sig(Vplates), tol: 0.03 } ],
          ["The field is uniform, so $E = V/d = " + Vp + "/" + d1 + " \\approx " + sig(Ef) + "$ V/m.", "Across the full gap: $V = E\\,d = (" + sig(Ef) + ")(0.10) \\approx " + sig(Vplates) + "$ V."],
          "Uniform field: $E=V/d$. Use the known point to get $E$, then multiply by the full gap."), "Vol. 2, Ch. 7 · Problem 39"); },
      // #43 — potential difference from a radial field E = a/s (line integral)
      function () { var a = rpick([100, 200, 500]), s1 = rpick([2, 5]), s2 = rpick([10, 20]); var dV = a * Math.log(s2 / s1);
        return S(num("Near a long axis the field points radially outward with magnitude $E(s) = " + a + "/s$ (SI units). What is the potential difference $V(s_1) - V(s_2)$ between $s_1 = " + s1 + "$ cm and $s_2 = " + s2 + "$ cm?", dV, sig(dV), 0.03,
          ["Potential difference is a line integral: $V(s_1) - V(s_2) = \\displaystyle\\int_{s_1}^{s_2} E\\,ds$.", "$= \\displaystyle\\int_{s_1}^{s_2}\\dfrac{" + a + "}{s}\\,ds = " + a + "\\ln\\dfrac{s_2}{s_1}$.", "$= " + a + "\\ln(" + (s2 / s1) + ") \\approx " + sig(dV) + "$ V"],
          "Integrate $E\\,ds$; $\\int ds/s = \\ln s$, so the answer is $a\\ln(s_2/s_1)$.", "V"), "Vol. 2, Ch. 7 · Problem 43"); }
    ],
    extreme: [
      // #56 — electric field from a given potential (gradient)
      function () { var a = rpick([2, 3, 5]), b = rpick([4, 6]), x0 = rpick([1, 2]); var Ex = -2 * a * x0, Ey = -b;
        return S(multi("In a region the electric potential is $V(x,y) = " + a + "x^2 + " + b + "y$ (volts, with $x,y$ in metres). Find the electric field at the point $x = " + x0 + "$ m.",
          [ { label: "$E_x$ (V/m, include the sign)", type: "numeric", answerValue: Ex, answerText: String(Ex), tol: 0.02 },
            { label: "$E_y$ (V/m, include the sign)", type: "numeric", answerValue: Ey, answerText: String(Ey), tol: 0.02 } ],
          ["The field is minus the gradient: $E_x = -\\dfrac{\\partial V}{\\partial x}$, $E_y = -\\dfrac{\\partial V}{\\partial y}$.", "$\\dfrac{\\partial V}{\\partial x} = 2(" + a + ")x$, so $E_x = -2(" + a + ")(" + x0 + ") = " + Ex + "$ V/m.", "$\\dfrac{\\partial V}{\\partial y} = " + b + "$, so $E_y = " + Ey + "$ V/m."],
          "Take $E = -\\nabla V$: differentiate $V$ with respect to $x$ and $y$, then negate."), "Vol. 2, Ch. 7 · Problem 56"); },
      // #70 — electron accelerated across plates: kinetic energy and final speed
      function () { var V = rpick([100, 200, 500]); var KE = E * V; var v = Math.sqrt(2 * KE / ME);
        return S(multi("An electron starts from rest and is accelerated across a uniform field between two plates with a potential difference of $" + V + "$ V.",
          [ { label: "Kinetic energy gained (J)", type: "numeric", answerValue: KE, answerText: KE.toExponential(2), tol: 0.03 },
            { label: "Final speed (m/s)", type: "numeric", answerValue: v, answerText: v.toExponential(2), tol: 0.03 } ],
          ["Energy from the field: $KE = eV = (1.6\\times10^{-19})(" + V + ") \\approx " + KE.toExponential(2) + "$ J.", "Then $\\tfrac12 m v^2 = KE$, so $v = \\sqrt{2\\,KE/m} \\approx " + v.toExponential(2) + "$ m/s."],
          "The work $eV$ becomes kinetic energy; then solve $\\tfrac12 mv^2 = eV$ for $v$."), "Vol. 2, Ch. 7 · Problem 70"); }
    ]
  });

  // ================= Lesson 5: Capacitance & Capacitors (Vol.2 Ch.8) =================
  // Modeled on syllabus problems: 19, 21 (easy), 25, 32, 41 (medium),
  // 29, 33, 36 (hard), 51 (extreme).
  register("phys1442-05-capacitance", {
    easy: [
      // #19 — charge stored: Q = CV
      function () { var C = rpick([10, 20, 50]), V = rpick([100, 120, 200]); var Q = C * 1e-12 * V;
        return S(num("What charge is stored in a $" + C + "$ pF capacitor when $" + V + ".0$ V is applied to it?", Q, Q.toExponential(2), 0.02,
          ["Capacitance relates charge and voltage: $Q = CV$.", "$Q = (" + C + "\\times10^{-12})(" + V + ")$", "$Q \\approx " + Q.toExponential(2) + "$ C"],
          "Use $Q = CV$ (capacitance in farads, voltage in volts).", "C"), "Vol. 2, Ch. 8 · Problem 19"); },
      // #21 — voltage from charge: V = Q/C
      function () { var C = rpick([2, 5, 10]), Q = rpick([20, 50, 100]); var V = Q / C;
        return S(num("Calculate the voltage applied to a $" + C + ".0\\ \\mu\\text{F}$ capacitor when it holds $" + Q + "\\ \\mu\\text{C}$ of charge.", V, sig(V), 0.02,
          ["Rearrange $Q = CV$ to $V = Q/C$.", "$V = \\dfrac{" + Q + "\\ \\mu\\text{C}}{" + C + "\\ \\mu\\text{F}} = \\dfrac{" + Q + "}{" + C + "}$", "$V = " + sig(V) + "$ V"],
          "The micro-units cancel: $V = Q/C$.", "V"), "Vol. 2, Ch. 8 · Problem 21"); }
    ],
    medium: [
      // #25 — plate area of a parallel-plate capacitor: A = Cd/eps0
      function () { var C = rpick([5, 10, 20]), dmm = rpick([1.0, 2.0]); var d = dmm / 1000; var A = C * 1e-12 * d / EPS0;
        return S(num("The plates of an empty parallel-plate capacitor of capacitance $" + C + ".0$ pF are $" + dmm + "$ mm apart. What is the area of each plate?", A, A.toExponential(2), 0.03,
          ["Parallel-plate capacitance: $C = \\dfrac{\\varepsilon_0 A}{d}$, so $A = \\dfrac{Cd}{\\varepsilon_0}$.", "$A = \\dfrac{(" + C + "\\times10^{-12})(" + d + ")}{8.85\\times10^{-12}}$", "$A \\approx " + A.toExponential(2) + "$ m²"],
          "Solve $C=\\varepsilon_0 A/d$ for $A$.", "m²"), "Vol. 2, Ch. 8 · Problem 25"); },
      // #32 — three capacitors in parallel: equivalent C and total charge
      function () { var c1 = rpick([2, 3]), c2 = rpick([4, 5]), c3 = rpick([6, 8]), V = 500; var Ceq = c1 + c2 + c3; var Q = Ceq * 1e-6 * V;
        return S(multi("Three capacitors of $" + c1 + "\\ \\mu\\text{F}$, $" + c2 + "\\ \\mu\\text{F}$, and $" + c3 + "\\ \\mu\\text{F}$ are connected in parallel across a $" + V + "$-V source.",
          [ { label: "Equivalent capacitance (μF)", type: "numeric", answerValue: Ceq, answerText: sig(Ceq), tol: 0.02 },
            { label: "Total charge stored (C)", type: "numeric", answerValue: Q, answerText: Q.toExponential(2), tol: 0.03 } ],
          ["In parallel, capacitances add: $C_{eq} = " + c1 + "+" + c2 + "+" + c3 + " = " + Ceq + "\\ \\mu$F.", "Every capacitor has the full $" + V + "$ V across it.", "Total charge $Q = C_{eq}V = (" + Ceq + "\\times10^{-6})(" + V + ") \\approx " + Q.toExponential(2) + "$ C."],
          "Parallel capacitors add; each sees the full voltage, and $Q=C_{eq}V$."), "Vol. 2, Ch. 8 · Problem 32"); },
      // #41 — energy stored in a capacitor: U = 1/2 C V^2
      function () { var C = rpick([2, 5, 10]), V = rpick([6, 12, 50]); var U = 0.5 * C * 1e-6 * V * V;
        return S(num("How much energy is stored in a $" + C + ".0\\ \\mu\\text{F}$ capacitor connected to a $" + V + ".0$-V battery?", U, U.toExponential(2), 0.03,
          ["Energy stored: $U = \\tfrac12 C V^2$.", "$U = \\tfrac12 (" + C + "\\times10^{-6})(" + V + ")^2$", "$U \\approx " + U.toExponential(2) + "$ J"],
          "Use $U = \\tfrac12 CV^2$.", "J"), "Vol. 2, Ch. 8 · Problem 41"); }
    ],
    hard: [
      // #29 — cylindrical capacitor: radius ratio from capacitance per unit length
      function () { var cpl = rpick([15, 20, 30]); var ratio = Math.exp(2 * Math.PI * EPS0 / (cpl * 1e-12));
        return S(num("A cylindrical capacitor has a capacitance per unit length of $" + cpl + "$ pF/m. What is the ratio $b/a$ of the outer to inner radius?", ratio, sig(ratio), 0.04,
          ["For a cylindrical capacitor $\\dfrac{C}{L} = \\dfrac{2\\pi\\varepsilon_0}{\\ln(b/a)}$.", "So $\\ln(b/a) = \\dfrac{2\\pi\\varepsilon_0}{C/L} = \\dfrac{2\\pi(8.85\\times10^{-12})}{" + cpl + "\\times10^{-12}}$.", "$b/a = e^{" + sig(2 * Math.PI * EPS0 / (cpl * 1e-12)) + "} \\approx " + sig(ratio) + "$"],
          "Invert $C/L = 2\\pi\\varepsilon_0/\\ln(b/a)$, then exponentiate.", ""), "Vol. 2, Ch. 8 · Problem 29"); },
      // #33 — network: two in parallel, then in series with a third
      function () { var c1 = rpick([2, 3]), c2 = rpick([3, 4]), c3 = rpick([3, 6]); var par = c1 + c2; var Ceq = par * c3 / (par + c3);
        return S(num("Capacitors $" + c1 + "\\ \\mu\\text{F}$ and $" + c2 + "\\ \\mu\\text{F}$ are wired in parallel, and that pair is in series with a $" + c3 + "\\ \\mu\\text{F}$ capacitor. What is the total capacitance?", Ceq, sig(Ceq), 0.03,
          ["First the parallel pair adds: $" + c1 + "+" + c2 + " = " + par + "\\ \\mu$F.", "Then in series with $" + c3 + "\\ \\mu$F: $\\dfrac{1}{C_{eq}} = \\dfrac{1}{" + par + "} + \\dfrac{1}{" + c3 + "}$.", "$C_{eq} = \\dfrac{(" + par + ")(" + c3 + ")}{" + par + "+" + c3 + "} \\approx " + sig(Ceq) + "\\ \\mu$F"],
          "Combine the parallel pair first (add), then series with the third (reciprocals).", "μF"), "Vol. 2, Ch. 8 · Problem 33"); },
      // #36 — network: two in series, in parallel with a third
      function () { var c1 = rpick([6, 4]), c2 = rpick([3, 2]), c3 = rpick([4, 5]); var ser = c1 * c2 / (c1 + c2); var Ceq = ser + c3;
        return S(num("Capacitors $" + c1 + "\\ \\mu\\text{F}$ and $" + c2 + "\\ \\mu\\text{F}$ are wired in series, and that combination is in parallel with a $" + c3 + "\\ \\mu\\text{F}$ capacitor. Find the equivalent capacitance.", Ceq, sig(Ceq), 0.03,
          ["The series pair: $\\dfrac{(" + c1 + ")(" + c2 + ")}{" + c1 + "+" + c2 + "} = " + sig(ser) + "\\ \\mu$F.", "Then in parallel with $" + c3 + "\\ \\mu$F, capacitances add.", "$C_{eq} = " + sig(ser) + " + " + c3 + " \\approx " + sig(Ceq) + "\\ \\mu$F"],
          "Series pair uses reciprocals; then add the parallel capacitor.", "μF"), "Vol. 2, Ch. 8 · Problem 36"); }
    ],
    extreme: [
      // #51 — parallel-plate capacitor: capacitance with air and with a dielectric
      function () { var Acm = rpick([100, 200]), dmm = rpick([1.0, 2.0]), kap = rpick([4.0, 6.0]); var A = Acm * 1e-4, d = dmm / 1000;
        var C0 = EPS0 * A / d; var Cd = kap * C0;
        return S(multi("An air-filled parallel-plate capacitor has plates of area $" + Acm + "\\ \\text{cm}^2$ separated by $" + dmm + "$ mm.",
          [ { label: "Capacitance with air (F)", type: "numeric", answerValue: C0, answerText: C0.toExponential(2), tol: 0.03 },
            { label: "Capacitance after filling with a dielectric of constant $" + kap + "$ (F)", type: "numeric", answerValue: Cd, answerText: Cd.toExponential(2), tol: 0.03 } ],
          ["Air capacitance: $C_0 = \\dfrac{\\varepsilon_0 A}{d} = \\dfrac{(8.85\\times10^{-12})(" + A + ")}{" + d + "} \\approx " + C0.toExponential(2) + "$ F.", "A dielectric multiplies the capacitance by $\\kappa$: $C = \\kappa C_0 = " + kap + "\\times " + C0.toExponential(2) + " \\approx " + Cd.toExponential(2) + "$ F."],
          "First $C_0=\\varepsilon_0 A/d$ (convert cm² and mm to SI); then multiply by $\\kappa$."), "Vol. 2, Ch. 8 · Problem 51"); }
    ]
  });

  // ================= Lesson 6: Electric Current & Resistance (Vol.2 Ch.9) =================
  // Modeled on syllabus problems: 23, 34 (easy), 29, 50, 52 (medium),
  // 25, 40, 59 (hard), 62 (extreme).
  register("phys1442-06-current", {
    easy: [
      // #23 — number of electrons past a point: N = It/e
      function () { var I = rpick([2, 4, 6]), t = 3; var N = I * t / E;
        return S(num("A constant current of $" + I + ".0$ A flows in a wire. How many electrons pass a point in $" + t + ".00$ s?", N, N.toExponential(2), 0.03,
          ["Charge that flows: $q = It$. Number of electrons: $N = q/e = It/e$.", "$N = \\dfrac{(" + I + ")(" + t + ")}{1.6\\times10^{-19}}$", "$N \\approx " + N.toExponential(2) + "$ electrons"],
          "Total charge is $It$; divide by $e$ for the electron count.", "electrons"), "Vol. 2, Ch. 9 · Problem 23"); },
      // #34 — current through a bulb: I = V/R (Ohm's law)
      function () { var R = rpick([2, 5, 10]), V = 3; var I = V / R;
        return S(num("What current flows through the bulb of a $" + V + ".00$-V flashlight when its hot resistance is $" + R + ".00\\ \\Omega$?", I, sig(I), 0.02,
          ["Ohm's law: $I = V/R$.", "$I = \\dfrac{" + V + "}{" + R + "}$", "$I = " + sig(I) + "$ A"],
          "Use Ohm's law $I = V/R$.", "A"), "Vol. 2, Ch. 9 · Problem 34"); }
    ],
    medium: [
      // #29 — current density of a beam: J = I / (pi r^2)
      function () { var Ima = rpick([2, 5, 8]), rmm = 1.0; var r = rmm / 1000; var J = Ima * 1e-3 / (Math.PI * r * r);
        return S(num("An electron beam carries a current of $" + Ima + ".0$ mA within a radius of $" + rmm + ".00$ mm. What is the magnitude of the current density?", J, sig(J), 0.03,
          ["Current density is current per area: $J = I/A = I/(\\pi r^2)$.", "$J = \\dfrac{" + Ima + "\\times10^{-3}}{\\pi(" + r + ")^2}$", "$J \\approx " + sig(J) + "$ A/m²"],
          "Divide the current by the cross-sectional area $\\pi r^2$.", "A/m²"), "Vol. 2, Ch. 9 · Problem 29"); },
      // #50 — current through a resistor across a D cell: I = V/R
      function () { var R = rpick([10, 20, 50]), V = 1.5; var I = V / R;
        return S(num("A $" + R + ".0\\ \\Omega$ resistor is connected across a D-cell battery ($" + V + "$ V). What is the current through the resistor?", I, sig(I), 0.02,
          ["Ohm's law: $I = V/R$.", "$I = \\dfrac{" + V + "}{" + R + "}$", "$I = " + sig(I) + "$ A"],
          "Use $I = V/R$.", "A"), "Vol. 2, Ch. 9 · Problem 50"); },
      // #52 — resistance from voltage and measured current: R = V/I
      function () { var I = rpick([0.25, 0.50, 0.80]), V = 20; var R = V / I;
        return S(num("A resistor is connected across a $" + V + ".00$-V supply and the measured current is $" + I + "$ A. What is its resistance?", R, sig(R), 0.02,
          ["Rearrange Ohm's law: $R = V/I$.", "$R = \\dfrac{" + V + "}{" + I + "}$", "$R = " + sig(R) + "\\ \\Omega$"],
          "Use $R = V/I$.", "Ω"), "Vol. 2, Ch. 9 · Problem 52"); }
    ],
    hard: [
      // #25 — current as the time-derivative of charge: I = dq/dt
      function () { var a = rpick([2, 3]), b = rpick([4, 5]), t = rpick([2, 3]); var I = 2 * a * t + b;
        return S(num("The charge passing through a conductor is modeled as $q(t) = " + a + "t^2 + " + b + "t$ (coulombs, $t$ in seconds). What is the current at $t = " + t + ".0$ s?", I, sig(I), 0.02,
          ["Current is the rate of change of charge: $I = \\dfrac{dq}{dt}$.", "$\\dfrac{dq}{dt} = 2(" + a + ")t + " + b + "$.", "At $t = " + t + "$: $I = 2(" + a + ")(" + t + ") + " + b + " = " + sig(I) + "$ A."],
          "Differentiate $q(t)$ with respect to time, then plug in $t$.", "A"), "Vol. 2, Ch. 9 · Problem 25"); },
      // #40 — radius of a rod from its resistance: R = rho L / (pi r^2)
      function () { var Rm = rpick([1, 2, 5]), Lcm = 30; var R = Rm * 1e-3, L = Lcm / 100, rho = 2.2e-7; var r = Math.sqrt(rho * L / (Math.PI * R));
        return S(num("A lead rod ($\\rho = 2.2\\times10^{-7}\\ \\Omega\\cdot$m) is $" + Lcm + ".0$ cm long and has a resistance of $" + Rm + ".0$ m$\\Omega$. What is the radius of the rod?", r, sig(r), 0.04,
          ["Resistance is $R = \\dfrac{\\rho L}{A} = \\dfrac{\\rho L}{\\pi r^2}$, so $r = \\sqrt{\\dfrac{\\rho L}{\\pi R}}$.", "$r = \\sqrt{\\dfrac{(2.2\\times10^{-7})(" + L + ")}{\\pi(" + R + ")}}$", "$r \\approx " + sig(r) + "$ m"],
          "Solve $R = \\rho L/(\\pi r^2)$ for $r$.", "m"), "Vol. 2, Ch. 9 · Problem 40"); },
      // #59 — current and voltage from power and resistance
      function () { var P = rpick([2, 8, 18]), R = rpick([2, 8]); var I = Math.sqrt(P / R); var V = I * R;
        return S(multi("A resistor of resistance $" + R + ".0\\ \\Omega$ dissipates $" + P + ".0$ W of power.",
          [ { label: "Current through the resistor (A)", type: "numeric", answerValue: I, answerText: sig(I), tol: 0.03 },
            { label: "Voltage drop across it (V)", type: "numeric", answerValue: V, answerText: sig(V), tol: 0.03 } ],
          ["Power and resistance: $P = I^2 R$, so $I = \\sqrt{P/R} = \\sqrt{" + P + "/" + R + "} \\approx " + sig(I) + "$ A.", "Then Ohm's law: $V = IR = (" + sig(I) + ")(" + R + ") \\approx " + sig(V) + "$ V."],
          "From $P=I^2R$ get $I=\\sqrt{P/R}$; then $V=IR$."), "Vol. 2, Ch. 9 · Problem 59"); }
    ],
    extreme: [
      // #62 — max current from a power rating, and the power at half that current
      function () { var Pw = rpick([0.25, 0.50, 1.0]), R = rpick([100, 200, 500]); var Imax = Math.sqrt(Pw / R); var Phalf = Pw / 4;
        return S(multi("A $" + Pw + "$-W resistor of resistance $" + R + "\\ \\Omega$ carries the maximum current it can handle without damage.",
          [ { label: "Maximum safe current (A)", type: "numeric", answerValue: Imax, answerText: Imax.toExponential(2), tol: 0.03 },
            { label: "Power dissipated if the current is cut in half (W)", type: "numeric", answerValue: Phalf, answerText: sig(Phalf), tol: 0.03 } ],
          ["Maximum power sets the current: $P = I^2R$, so $I_{max} = \\sqrt{P/R} = \\sqrt{" + Pw + "/" + R + "} \\approx " + Imax.toExponential(2) + "$ A.", "Power goes as $I^2$, so halving the current gives one-quarter the power: $P' = P/4 = " + sig(Phalf) + "$ W."],
          "$I_{max}=\\sqrt{P/R}$; since $P\\propto I^2$, half the current means a quarter of the power."), "Vol. 2, Ch. 9 · Problem 62"); }
    ]
  });

  // ================= Lesson 7: DC Circuits & Kirchhoff's Rules (Vol.2 Ch.10) =================
  // Modeled on syllabus problems: 26, 63 (easy), 23, 25 (medium),
  // 35, 36, 38 (hard), 42, 53 (extreme). Figure-based circuits are modeled with
  // solvable networks in the same style.
  register("phys1442-07-dc-circuits", {
    easy: [
      // #26 — three resistors in series, then in parallel
      function () { var a = rpick([2, 4]), b = rpick([3, 6]), c = rpick([6, 12]); var ser = a + b + c; var par = 1 / (1 / a + 1 / b + 1 / c);
        return S(multi("Three resistors of $" + a + "\\ \\Omega$, $" + b + "\\ \\Omega$, and $" + c + "\\ \\Omega$ are available.",
          [ { label: "Their resistance in series (Ω)", type: "numeric", answerValue: ser, answerText: sig(ser), tol: 0.02 },
            { label: "Their resistance in parallel (Ω)", type: "numeric", answerValue: par, answerText: sig(par), tol: 0.03 } ],
          ["In series, resistances add: $" + a + "+" + b + "+" + c + " = " + ser + "\\ \\Omega$.", "In parallel, reciprocals add: $\\dfrac{1}{R} = \\dfrac{1}{" + a + "}+\\dfrac{1}{" + b + "}+\\dfrac{1}{" + c + "}$, so $R \\approx " + sig(par) + "\\ \\Omega$."],
          "Series: add them. Parallel: add the reciprocals, then invert."), "Vol. 2, Ch. 10 · Problem 26"); },
      // #63 — smallest dangerous voltage across a known resistance: V = IR
      function () { var Ima = rpick([0.30, 0.50, 1.00]), R = rpick([300, 500, 1000]); var V = Ima * 1e-3 * R;
        return S(num("A current as small as $" + Ima + "$ mA through the heart can be dangerous. If the resistance of the exposed heart is $" + R + "\\ \\Omega$, what is the smallest voltage that poses this danger?", V, sig(V), 0.02,
          ["Ohm's law relates them: $V = IR$.", "$V = (" + Ima + "\\times10^{-3})(" + R + ")$", "$V = " + sig(V) + "$ V"],
          "Use $V = IR$ with the current in amps.", "V"), "Vol. 2, Ch. 10 · Problem 63"); }
    ],
    medium: [
      // #23 — internal resistance from the terminal-voltage drop: r = dV/dI
      function () { var dV = rpick([1.5, 2.0, 3.0]), dI = rpick([4.0, 5.0]); var r = dV / dI;
        return S(num("A voltage source's terminal voltage drops by $" + dV + "$ V when the current it supplies increases by $" + dI + "$ A. What is its internal resistance?", r, sig(r), 0.02,
          ["Terminal voltage is $V = \\varepsilon - Ir$, so a change gives $\\Delta V = -r\\,\\Delta I$.", "$r = \\dfrac{\\Delta V}{\\Delta I} = \\dfrac{" + dV + "}{" + dI + "}$", "$r = " + sig(r) + "\\ \\Omega$"],
          "The terminal voltage sags by $r\\,\\Delta I$, so $r = \\Delta V/\\Delta I$.", "Ω"), "Vol. 2, Ch. 10 · Problem 23"); },
      // #25 — charging battery: internal resistance and power dissipated inside
      function () { var emf = 12, Vt = rpick([15, 16, 18]), I = rpick([8, 10]); var r = (Vt - emf) / I; var P = I * I * r;
        return S(multi("A $" + emf + ".0$-V battery shows a terminal voltage of $" + Vt + ".0$ V while being charged by a current of $" + I + ".0$ A.",
          [ { label: "Internal resistance (Ω)", type: "numeric", answerValue: r, answerText: sig(r), tol: 0.03 },
            { label: "Power dissipated inside the battery (W)", type: "numeric", answerValue: P, answerText: sig(P), tol: 0.03 } ],
          ["While charging, the terminal voltage exceeds the emf: $V = \\varepsilon + Ir$, so $r = \\dfrac{V-\\varepsilon}{I} = \\dfrac{" + (Vt - emf) + "}{" + I + "} \\approx " + sig(r) + "\\ \\Omega$.", "Internal heating: $P = I^2 r = (" + I + ")^2(" + sig(r) + ") \\approx " + sig(P) + "$ W."],
          "Charging: $V=\\varepsilon+Ir$ ⇒ $r=(V-\\varepsilon)/I$; then $P=I^2r$."), "Vol. 2, Ch. 10 · Problem 25"); }
    ],
    hard: [
      // #35 — battery with R1 in series with (R2 parallel R3): equivalent R and total current
      function () { var V = rpick([12, 24]), R1 = rpick([2, 4]), R2 = rpick([6, 12]), R3 = rpick([6, 12]); var par = R2 * R3 / (R2 + R3); var Req = R1 + par; var I = V / Req;
        return S(multi("A $" + V + "$-V battery drives $R_1 = " + R1 + "\\ \\Omega$ in series with a parallel pair $R_2 = " + R2 + "\\ \\Omega$ and $R_3 = " + R3 + "\\ \\Omega$.",
          [ { label: "Equivalent resistance of the circuit (Ω)", type: "numeric", answerValue: Req, answerText: sig(Req), tol: 0.03 },
            { label: "Total current from the battery (A)", type: "numeric", answerValue: I, answerText: sig(I), tol: 0.03 } ],
          ["Parallel pair: $\\dfrac{R_2 R_3}{R_2+R_3} = " + sig(par) + "\\ \\Omega$.", "Add the series resistor: $R_{eq} = " + R1 + " + " + sig(par) + " = " + sig(Req) + "\\ \\Omega$.", "Total current: $I = V/R_{eq} = " + V + "/" + sig(Req) + " \\approx " + sig(I) + "$ A."],
          "Collapse the parallel pair first, add the series resistor, then $I=V/R_{eq}$."), "Vol. 2, Ch. 10 · Problem 35"); },
      // #36 — single-loop circuit: current and total power
      function () { var V = rpick([9, 12, 18]), R1 = rpick([2, 3]), R2 = rpick([4, 6]); var Req = R1 + R2; var I = V / Req; var P = V * I;
        return S(multi("A $" + V + "$-V battery is connected to $" + R1 + "\\ \\Omega$ and $" + R2 + "\\ \\Omega$ in series.",
          [ { label: "Current in the loop (A)", type: "numeric", answerValue: I, answerText: sig(I), tol: 0.03 },
            { label: "Total power supplied by the battery (W)", type: "numeric", answerValue: P, answerText: sig(P), tol: 0.03 } ],
          ["Series resistance: $R = " + R1 + "+" + R2 + " = " + Req + "\\ \\Omega$; current $I = V/R = " + sig(I) + "$ A.", "Power supplied: $P = VI = (" + V + ")(" + sig(I) + ") \\approx " + sig(P) + "$ W."],
          "Add series resistors, get $I=V/R$, then $P=VI$."), "Vol. 2, Ch. 10 · Problem 36"); },
      // #38 — Kirchhoff loop with two opposing emfs in one series loop
      function () { var V1 = rpick([12, 18]), V2 = rpick([6, 9]), R1 = rpick([2, 3]), R2 = rpick([3, 4]); var I = (V1 - V2) / (R1 + R2);
        return S(num("In a single loop, a $" + V1 + "$-V battery and a $" + V2 + "$-V battery oppose each other, in series with resistors $" + R1 + "\\ \\Omega$ and $" + R2 + "\\ \\Omega$. Using the loop rule, what current flows?", I, sig(I), 0.03,
          ["Kirchhoff's loop rule: $V_1 - V_2 - I R_1 - I R_2 = 0$.", "$I = \\dfrac{V_1 - V_2}{R_1 + R_2} = \\dfrac{" + V1 + " - " + V2 + "}{" + R1 + " + " + R2 + "}$", "$I = " + sig(I) + "$ A"],
          "Opposing emfs subtract; divide the net emf by the total resistance.", "A"), "Vol. 2, Ch. 10 · Problem 38"); }
    ],
    extreme: [
      // #42 — two-loop network with two emfs: solve for the branch currents
      function () { var V1 = rpick([12, 18]), V2 = rpick([6, 9]), R1 = rpick([2, 4]), R2 = rpick([3, 6]), R3 = rpick([4, 6]);
        var det = (R1 + R3) * (R2 + R3) - R3 * R3;
        var I1 = (V1 * (R2 + R3) - V2 * R3) / det, I2 = (V2 * (R1 + R3) - V1 * R3) / det;
        return S(multi("Two loops share a middle branch. The left loop has a $" + V1 + "$-V battery with $R_1 = " + R1 + "\\ \\Omega$; the right loop a $" + V2 + "$-V battery with $R_2 = " + R2 + "\\ \\Omega$; the shared middle branch is $R_3 = " + R3 + "\\ \\Omega$. Find the branch currents $I_1$ and $I_2$.",
          [ { label: "Current $I_1$ in the left branch (A)", type: "numeric", answerValue: I1, answerText: sig(I1), tol: 0.05 },
            { label: "Current $I_2$ in the right branch (A)", type: "numeric", answerValue: I2, answerText: sig(I2), tol: 0.05 } ],
          ["Junction: $I_3 = I_1 + I_2$. Loop rules: $V_1 = I_1 R_1 + I_3 R_3$ and $V_2 = I_2 R_2 + I_3 R_3$.", "Substitute $I_3$ and solve the 2×2 system.", "$I_1 \\approx " + sig(I1) + "$ A, $I_2 \\approx " + sig(I2) + "$ A (with $I_3 = I_1 + I_2$)."],
          "Write the junction rule and both loop rules, substitute $I_3=I_1+I_2$, and solve the two equations."), "Vol. 2, Ch. 10 · Problem 42"); },
      // #53 — RC charging: time constant and capacitor voltage after one time constant
      function () { var Rk = rpick([1, 2, 5]), Cu = rpick([10, 20, 50]), V = rpick([6, 12]); var R = Rk * 1e3, C = Cu * 1e-6; var tau = R * C; var Vc = V * (1 - Math.exp(-1));
        return S(multi("A $" + V + ".0$-V emf charges a $" + Cu + "\\ \\mu\\text{F}$ capacitor through a $" + Rk + ".0$ k$\\Omega$ resistor.",
          [ { label: "RC time constant (s)", type: "numeric", answerValue: tau, answerText: sig(tau), tol: 0.03 },
            { label: "Capacitor voltage after one time constant (V)", type: "numeric", answerValue: Vc, answerText: sig(Vc), tol: 0.03 } ],
          ["Time constant: $\\tau = RC = (" + R + ")(" + C + ") = " + sig(tau) + "$ s.", "Charging: $V_C(t) = V(1 - e^{-t/\\tau})$. After one time constant $t=\\tau$: $V_C = V(1 - e^{-1}) \\approx 0.632\\,V = " + sig(Vc) + "$ V."],
          "$\\tau=RC$; after one $\\tau$ the capacitor reaches $63\\%$ of the emf."), "Vol. 2, Ch. 10 · Problem 53"); }
    ]
  });

  // ================= Lesson 8: Magnetic Forces & Fields (Vol.2 Ch.11) =================
  // Modeled on syllabus problems 15,17,19,33,34,35 (right-hand-rule directions, easy),
  // 23,25,38 (medium), 40 (hard), 52 (extreme). Target = 11 problems.
  var L8 = (function () {
    var D = { "to the right": [1, 0, 0], "to the left": [-1, 0, 0], "upward": [0, 1, 0], "downward": [0, -1, 0], "out of the page": [0, 0, 1], "into the page": [0, 0, -1] };
    var NAMES = Object.keys(D);
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function name(v) { for (var i = 0; i < NAMES.length; i++) { var d = D[NAMES[i]]; if (d[0] === v[0] && d[1] === v[1] && d[2] === v[2]) return NAMES[i]; } return null; }
    function perpPair() { var a, b; do { a = rpick(NAMES); b = rpick(NAMES); } while (D[a][0] * D[b][0] + D[a][1] * D[b][1] + D[a][2] * D[b][2] !== 0); return [D[a], D[b], a, b]; }
    return { NAMES: NAMES, cross: cross, name: name, perpPair: perpPair };
  })();
  function l8mc(prompt, answerName, steps, hint, src) {
    return S(mc(prompt, L8.NAMES.slice(), L8.NAMES.indexOf(answerName), steps, hint), src);
  }
  register("phys1442-08-magnetic-force", {
    easy: [
      // #15 — force on a positive charge:  F = q v x B
      function () { var p = L8.perpPair(); var F = L8.name(L8.cross(p[0], p[1]));
        return l8mc("A positive charge moves " + p[2] + " in a magnetic field pointing " + p[3] + ". What is the direction of the magnetic force on it?",
          F, ["Use the right-hand rule for $\\vec{F} = q\\vec{v}\\times\\vec{B}$ (positive charge).", "Point fingers along $\\vec{v}$ (" + p[2] + "), curl toward $\\vec{B}$ (" + p[3] + "); the thumb gives $\\vec{F}$: " + F + "."],
          "Right-hand rule: fingers along $\\vec{v}$, curl to $\\vec{B}$, thumb is $\\vec{F}$ (flip for negative charge).", "Vol. 2, Ch. 11 · Problem 15"); },
      // #17 — velocity of a NEGATIVE charge given the force it feels
      function () { var p = L8.perpPair(); var v = p[0], B = p[1]; var F = L8.name(L8.cross(v, B).map(function (x) { return -x; })); // negative charge
        return l8mc("A negative charge in a field pointing " + p[3] + " feels a magnetic force " + F + ". In what direction is the charge moving?",
          L8.name(v), ["For a negative charge $\\vec{F} = -q|\\,|\\vec{v}\\times\\vec{B}$, so the force is opposite $\\vec{v}\\times\\vec{B}$.", "Working the right-hand rule backward (and flipping for the negative sign) gives $\\vec{v}$: " + L8.name(v) + "."],
          "Apply the right-hand rule, then flip the result because the charge is negative.", "Vol. 2, Ch. 11 · Problem 17"); },
      // #19 — field that produces a given force on a positive charge
      function () { var p = L8.perpPair(); var v = p[0]; var B = p[1]; var F = L8.name(L8.cross(v, B));
        return l8mc("A positive charge moving " + p[2] + " feels a magnetic force " + F + ". Assuming $\\vec{B}\\perp\\vec{v}$, in what direction does the magnetic field point?",
          p[3], ["From $\\vec{F} = q\\vec{v}\\times\\vec{B}$, the field must be perpendicular to both $\\vec{v}$ and $\\vec{F}$.", "The right-hand rule that makes $\\vec{v}\\times\\vec{B}$ point " + F + " requires $\\vec{B}$ " + p[3] + "."],
          "$\\vec{B}$ is perpendicular to both $\\vec{v}$ and $\\vec{F}$; pick the one that reproduces $\\vec{F}$.", "Vol. 2, Ch. 11 · Problem 19"); },
      // #33 — force on a current-carrying wire:  F = I L x B
      function () { var p = L8.perpPair(); var F = L8.name(L8.cross(p[0], p[1]));
        return l8mc("A wire carries current " + p[2] + " through a field pointing " + p[3] + ". What is the direction of the magnetic force on the wire?",
          F, ["Use the right-hand rule for $\\vec{F} = I\\vec{L}\\times\\vec{B}$.", "Fingers along the current (" + p[2] + "), curl to $\\vec{B}$ (" + p[3] + "); thumb gives $\\vec{F}$: " + F + "."],
          "Same rule as for a moving charge, using the current direction for $\\vec{L}$.", "Vol. 2, Ch. 11 · Problem 33"); },
      // #34 — current direction that feels a given force
      function () { var p = L8.perpPair(); var I = p[0], B = p[1]; var F = L8.name(L8.cross(I, B));
        return l8mc("A wire in a field pointing " + p[3] + " feels a magnetic force " + F + ". In what direction does the current flow?",
          L8.name(I), ["From $\\vec{F} = I\\vec{L}\\times\\vec{B}$, work the right-hand rule backward.", "The current direction that gives a force " + F + " is " + L8.name(I) + "."],
          "Reverse the right-hand rule: find the current that produces the shown force.", "Vol. 2, Ch. 11 · Problem 34"); },
      // #35 — field that produces a given force on a current
      function () { var p = L8.perpPair(); var I = p[0]; var F = L8.name(L8.cross(I, p[1]));
        return l8mc("A wire carrying current " + p[2] + " feels a magnetic force " + F + ". Assuming $\\vec{B}\\perp I$, in what direction does the field point?",
          p[3], ["$\\vec{B}$ is perpendicular to both the current and the force.", "The field that makes $I\\vec{L}\\times\\vec{B}$ point " + F + " is " + p[3] + "."],
          "$\\vec{B}\\perp$ both $\\vec{I}$ and $\\vec{F}$; choose the one that reproduces $\\vec{F}$.", "Vol. 2, Ch. 11 · Problem 35"); }
    ],
    medium: [
      // #23 — angle between v and B from the magnetic force
      function () { var vE = rpick([2, 3, 5]), B = 1.25, deg = rpick([30, 45, 60]); var v = vE * 1e6; var F = E * v * B * Math.sin(deg * Math.PI / 180);
        return S(num("An electron moving at $" + vE + ".0\\times10^{6}$ m/s in a $" + B + "$-T field feels a magnetic force of $" + F.toExponential(2) + "$ N. What acute angle does its velocity make with the field?", deg, String(deg), 0.03,
          ["Magnetic force: $F = qvB\\sin\\theta$, so $\\sin\\theta = \\dfrac{F}{qvB}$.", "$\\sin\\theta = \\dfrac{" + F.toExponential(2) + "}{(1.6\\times10^{-19})(" + v.toExponential(1) + ")(" + B + ")}$", "$\\theta \\approx " + deg + "^\\circ$ (the other answer is $" + (180 - deg) + "^\\circ$)."],
          "Solve $F = qvB\\sin\\theta$ for $\\theta$; there are two angles.", "°"), "Vol. 2, Ch. 11 · Problem 23"); },
      // #25 — radius of circular motion:  r = mv/(qB)
      function () { var vE = rpick([3, 5, 8]), Bu = rpick([1.0, 2.0, 5.0]); var v = vE * 1e6, B = Bu * 1e-6; var r = ME * v / (E * B);
        return S(num("A cosmic-ray electron moves at $" + vE + ".0\\times10^{6}$ m/s perpendicular to Earth's field, where the strength is $" + Bu + "\\times10^{-6}$ T. What is the radius of its circular path?", r, sig(r), 0.03,
          ["The magnetic force supplies the centripetal force: $qvB = \\dfrac{mv^2}{r}$, so $r = \\dfrac{mv}{qB}$.", "$r = \\dfrac{(9.11\\times10^{-31})(" + v.toExponential(1) + ")}{(1.6\\times10^{-19})(" + B.toExponential(1) + ")}$", "$r \\approx " + sig(r) + "$ m"],
          "Set the magnetic force equal to $mv^2/r$ and solve: $r=mv/(qB)$.", "m"), "Vol. 2, Ch. 11 · Problem 25"); },
      // #38 — field strength from the force on a current-carrying wire
      function () { var I = rpick([20, 30, 40]), F = rpick([1.5, 2.16, 3.0]), Lcm = rpick([4, 5]); var L = Lcm / 100; var B = F / (I * L);
        return S(num("A wire carrying $" + I + ".0$ A passes through a magnet and feels a $" + F + "$-N force on the $" + Lcm + ".00$ cm of wire in the field (field perpendicular to the wire). What is the field strength?", B, sig(B), 0.03,
          ["For a wire perpendicular to the field, $F = BIL$, so $B = \\dfrac{F}{IL}$.", "$B = \\dfrac{" + F + "}{(" + I + ")(" + L + ")}$", "$B \\approx " + sig(B) + "$ T"],
          "Use $F = BIL$ and solve for $B$ (length in metres).", "T"), "Vol. 2, Ch. 11 · Problem 38"); }
    ],
    hard: [
      // #40 — maximum torque on a multi-turn loop and torque at an angle
      function () { var N = rpick([100, 150, 200]), sidecm = rpick([15, 18, 20]), I = rpick([25, 50]), B = rpick([1.2, 1.6]), deg = rpick([10.9, 30, 45]);
        var A = (sidecm / 100) * (sidecm / 100); var tmax = N * I * A * B; var t = tmax * Math.sin(deg * Math.PI / 180);
        return S(multi("A $" + N + "$-turn square loop $" + sidecm + ".0$ cm on a side carries $" + I + ".0$ A in a $" + B + "$-T field.",
          [ { label: "Maximum torque (N·m)", type: "numeric", answerValue: tmax, answerText: sig(tmax), tol: 0.03 },
            { label: "Torque when the field makes " + deg + "° with the loop's plane-normal offset (N·m)", type: "numeric", answerValue: t, answerText: sig(t), tol: 0.04 } ],
          ["Loop area $A = (" + sidecm / 100 + ")^2 = " + sig(A) + "$ m². Maximum torque $\\tau_{max} = NIAB = " + sig(tmax) + "$ N·m.", "At an angle: $\\tau = NIAB\\sin\\theta = \\tau_{max}\\sin " + deg + "^\\circ \\approx " + sig(t) + "$ N·m."],
          "Maximum torque is $NIAB$; at an angle multiply by $\\sin\\theta$."), "Vol. 2, Ch. 11 · Problem 40"); }
    ],
    extreme: [
      // #52 — Hall probe: the Hall voltage scales as I*B, so B2 = (V2/V1)(I1/I2) B1
      function () { var V1 = rpick([40, 60]), V2 = rpick([50, 80]), I1 = 2.0, B1 = 1.0, I2 = 1.7; var B2 = (V2 / V1) * (I1 / I2) * B1;
        return S(num("A Hall probe reads $" + V1 + "$ mV for a current of $" + I1 + "$ A in a $" + B1 + "$-T field. What field gives a reading of $" + V2 + "$ mV at $" + I2 + "$ A?", B2, sig(B2), 0.03,
          ["The Hall voltage is $V_H = \\dfrac{IB}{nqt}$, so $V_H \\propto IB$ and $\\dfrac{V_H}{IB}$ is constant.", "$B_2 = \\dfrac{V_2}{V_1}\\cdot\\dfrac{I_1}{I_2}\\cdot B_1 = \\dfrac{" + V2 + "}{" + V1 + "}\\cdot\\dfrac{" + I1 + "}{" + I2 + "}\\cdot " + B1 + "$", "$B_2 \\approx " + sig(B2) + "$ T"],
          "Since $V_H\\propto IB$, scale $B$ by the voltage ratio and inverse current ratio.", "T"), "Vol. 2, Ch. 11 · Problem 52"); }
    ]
  });

  // ================= Lesson 9: Sources of Magnetic Field (Vol.2 Ch.12) =================
  // Modeled on syllabus problems: 23, 49 (easy), 37, 43, 42, 61 (medium),
  // 31, 20, 57 (hard), 33, 46 (extreme). Target = 11. (mu0 = 4*pi*1e-7)
  var MU0 = 4 * Math.PI * 1e-7;
  register("phys1442-09-magnetic-sources", {
    easy: [
      // #23 — current in a long wire from the field at a distance:  I = 2*pi*r*B/mu0
      function () { var Bu = rpick([2, 4, 8]), rcm = 50; var B = Bu * 1e-6, r = rcm / 100; var I = 2 * Math.PI * r * B / MU0;
        return S(num("The magnetic field $" + rcm + "$ cm from a long, straight wire is $" + Bu + ".0\\ \\mu\\text{T}$. What current flows in the wire?", I, sig(I), 0.03,
          ["Field of a long wire: $B = \\dfrac{\\mu_0 I}{2\\pi r}$, so $I = \\dfrac{2\\pi r B}{\\mu_0}$.", "$I = \\dfrac{2\\pi(" + r + ")(" + B.toExponential(1) + ")}{4\\pi\\times10^{-7}}$", "$I \\approx " + sig(I) + "$ A"],
          "Solve $B = \\mu_0 I/(2\\pi r)$ for $I$.", "A"), "Vol. 2, Ch. 12 · Problem 23"); },
      // #49 — field inside a solenoid:  B = mu0 n I
      function () { var n = rpick([1500, 2000, 3000]), I = rpick([3.0, 5.2, 8.0]); var B = MU0 * n * I;
        return S(num("A solenoid is wound with $" + n + "$ turns per meter. When the current is $" + I + "$ A, what is the magnetic field inside it?", B, sig(B), 0.03,
          ["Inside a long solenoid the field is $B = \\mu_0 n I$.", "$B = (4\\pi\\times10^{-7})(" + n + ")(" + I + ")$", "$B \\approx " + sig(B) + "$ T"],
          "Use $B = \\mu_0 n I$ with $n$ in turns per metre.", "T"), "Vol. 2, Ch. 12 · Problem 49"); }
    ],
    medium: [
      // #37 — field at the center of a flat multi-turn circular loop:  B = mu0 N I /(2R)
      function () { var N = rpick([10, 20, 50]), Rcm = rpick([5, 10]), I = rpick([0.5, 1.0, 2.0]); var R = Rcm / 100; var B = MU0 * N * I / (2 * R);
        return S(num("A flat circular loop has $" + N + "$ turns of radius $" + Rcm + ".0$ cm and carries $" + I + "$ A. What is the magnetic field at the center of the loop?", B, sig(B), 0.03,
          ["At the center of a circular coil, $B = \\dfrac{\\mu_0 N I}{2R}$.", "$B = \\dfrac{(4\\pi\\times10^{-7})(" + N + ")(" + I + ")}{2(" + R + ")}$", "$B \\approx " + sig(B) + "$ T"],
          "Use the loop-center formula $B = \\mu_0 N I/(2R)$.", "T"), "Vol. 2, Ch. 12 · Problem 37"); },
      // #43 — solenoid field from turn count and length:  B = mu0 (N/l) I
      function () { var N = rpick([200, 500], 0), lcm = rpick([20, 40]), I = rpick([2.0, 5.0]); var l = lcm / 100; var B = MU0 * (N / l) * I;
        return S(num("A solenoid has $" + N + "$ evenly spaced turns over a length of $" + lcm + ".0$ cm and carries $" + I + "$ A. What is the field inside?", B, sig(B), 0.03,
          ["The turn density is $n = N/l$, and $B = \\mu_0 n I = \\mu_0 \\dfrac{N}{l} I$.", "$B = (4\\pi\\times10^{-7})\\dfrac{" + N + "}{" + l + "}(" + I + ")$", "$B \\approx " + sig(B) + "$ T"],
          "Get $n = N/l$ first, then $B = \\mu_0 n I$.", "T"), "Vol. 2, Ch. 12 · Problem 43"); },
      // #42 — Ampere's law: line integral of B equals mu0 times enclosed current
      function () { var I1 = rpick([3, 5, 8]), I2 = rpick([1, 2, 4]); var Ienc = I1 - I2; var val = MU0 * Ienc;
        return S(num("An Amperian loop encloses a $" + I1 + ".0$-A current and a $" + I2 + ".0$-A current flowing the opposite way. Evaluate $\\oint \\vec{B}\\cdot d\\vec{l}$ around the loop.", val, val.toExponential(2), 0.03,
          ["Ampère's law: $\\oint \\vec{B}\\cdot d\\vec{l} = \\mu_0 I_{enc}$.", "Net enclosed current (opposite directions subtract): $I_{enc} = " + I1 + " - " + I2 + " = " + Ienc + "$ A.", "$\\oint \\vec{B}\\cdot d\\vec{l} = (4\\pi\\times10^{-7})(" + Ienc + ") \\approx " + val.toExponential(2) + "$ T·m"],
          "Only enclosed current counts, with sign; multiply the net by $\\mu_0$.", "T·m"), "Vol. 2, Ch. 12 · Problem 42"); },
      // #61 — total dipole moment of a domain: N atoms times the atomic moment
      function () { var muA = 1.8e-23, Np = rpick([1, 5]), Ne = rpick([17, 18]); var N = Np * Math.pow(10, Ne); var tot = N * muA;
        return S(num("An iron atom has a magnetic dipole moment of about $1.8\\times10^{-23}\\ \\text{A·m}^2$. What is the maximum dipole moment of a domain containing $" + Np + "\\times10^{" + Ne + "}$ atoms (all aligned)?", tot, tot.toExponential(2), 0.03,
          ["Fully aligned, the moments simply add: $\\mu_{tot} = N\\,\\mu_{atom}$.", "$\\mu_{tot} = (" + Np + "\\times10^{" + Ne + "})(1.8\\times10^{-23})$", "$\\mu_{tot} \\approx " + tot.toExponential(2) + "$ A·m²"],
          "Multiply the number of aligned atoms by the per-atom moment.", "A·m²"), "Vol. 2, Ch. 12 · Problem 61"); }
    ],
    hard: [
      // #31 — force per length between two parallel currents
      function () { var I1 = rpick([2, 3]), I2 = rpick([4, 5]), dcm = rpick([5, 10]); var d = dcm / 100; var fL = MU0 * I1 * I2 / (2 * Math.PI * d);
        return S(multi("Two long parallel wires are $" + dcm + ".0$ cm apart. One carries $" + I1 + ".0$ A, the other $" + I2 + ".0$ A, in opposite directions.",
          [ { label: "Force per unit length (N/m)", type: "numeric", answerValue: fL, answerText: fL.toExponential(2), tol: 0.03 },
            { label: "Do the wires attract or repel?", type: "mc", choices: ["Repel", "Attract"], answerIndex: 0 } ],
          ["Force per length: $\\dfrac{F}{L} = \\dfrac{\\mu_0 I_1 I_2}{2\\pi d} = \\dfrac{(4\\pi\\times10^{-7})(" + I1 + ")(" + I2 + ")}{2\\pi(" + d + ")} \\approx " + fL.toExponential(2) + "$ N/m.", "Opposite currents repel (parallel currents would attract)."],
          "Use $F/L = \\mu_0 I_1 I_2/(2\\pi d)$; opposite currents repel."), "Vol. 2, Ch. 12 · Problem 31"); },
      // #20 — field at the center of a rectangular loop
      function () { var acm = rpick([10, 20]), bcm = rpick([20, 30]), I = rpick([5, 10]); var a = acm / 100, b = bcm / 100; var B = (2 * MU0 * I / Math.PI) * Math.sqrt(a * a + b * b) / (a * b);
        return S(num("A rectangular loop of wire with sides $" + acm + "$ cm and $" + bcm + "$ cm carries a current of $" + I + ".0$ A. What is the magnetic field at the center of the loop?", B, B.toExponential(2), 0.04,
          ["Add the field of all four finite straight sides at the center; the result is $B = \\dfrac{2\\mu_0 I}{\\pi}\\dfrac{\\sqrt{a^2+b^2}}{ab}$.", "$B = \\dfrac{2(4\\pi\\times10^{-7})(" + I + ")}{\\pi}\\dfrac{\\sqrt{" + a + "^2+" + b + "^2}}{(" + a + ")(" + b + ")}$", "$B \\approx " + B.toExponential(2) + "$ T"],
          "Each side is a finite wire; the combined center field is $\\frac{2\\mu_0 I}{\\pi}\\frac{\\sqrt{a^2+b^2}}{ab}$.", "T"), "Vol. 2, Ch. 12 · Problem 20"); },
      // #57 — field inside a toroid:  B = mu0 N I /(2*pi*r)
      function () { var N = rpick([400, 500]), I = rpick([1.5, 2.0]), innercm = rpick([20, 25]), sidecm = 3; var r = innercm / 100 + (sidecm / 100) / 2; var B = MU0 * N * I / (2 * Math.PI * r);
        return S(num("A toroid with a $" + sidecm + ".0$ cm × $" + sidecm + ".0$ cm square cross-section has an inner radius of $" + innercm + ".0$ cm, $" + N + "$ turns, and carries $" + I + "$ A. What is the field at the center of the cross-section?", B, sig(B), 0.03,
          ["Inside a toroid, $B = \\dfrac{\\mu_0 N I}{2\\pi r}$ with $r$ the distance from the axis.", "Center of the cross-section: $r = " + innercm / 100 + " + " + (sidecm / 100) / 2 + " = " + r + "$ m.", "$B = \\dfrac{(4\\pi\\times10^{-7})(" + N + ")(" + I + ")}{2\\pi(" + r + ")} \\approx " + sig(B) + "$ T"],
          "Toroid field is $\\mu_0 N I/(2\\pi r)$; use $r$ to the middle of the cross-section.", "T"), "Vol. 2, Ch. 12 · Problem 57"); }
    ],
    extreme: [
      // #33 — two long antiparallel wires: field at a point between them adds
      function () { var I = rpick([5, 10]), acm = rpick([2, 4]), bcm = rpick([6, 8]); var a = acm / 100, b = bcm / 100; var B = MU0 * I / (2 * Math.PI) * (1 / a + 1 / b);
        return S(num("Two long parallel wire sections carry the same current $" + I + ".0$ A in opposite directions. A point $P$ lies $" + acm + "$ cm from one wire and $" + bcm + "$ cm from the other (between them). What is the magnetic field at $P$?", B, sig(B), 0.03,
          ["Each wire gives $B = \\mu_0 I/(2\\pi r)$. Between antiparallel currents the two fields point the same way, so they add.", "$B = \\dfrac{\\mu_0 I}{2\\pi}\\left(\\dfrac{1}{a} + \\dfrac{1}{b}\\right) = \\dfrac{(4\\pi\\times10^{-7})(" + I + ")}{2\\pi}\\left(\\dfrac{1}{" + a + "} + \\dfrac{1}{" + b + "}\\right)$", "$B \\approx " + sig(B) + "$ T"],
          "Add each wire's $\\mu_0 I/(2\\pi r)$; between opposite currents the fields reinforce.", "T"), "Vol. 2, Ch. 12 · Problem 33"); },
      // #46 — hollow cylindrical conductor: field in the cavity and outside
      function () { var I = rpick([10, 20]), routcm = rpick([5, 8]); var rout = routcm / 100; var Bout = MU0 * I / (2 * Math.PI * rout);
        return S(multi("A long hollow cylindrical conductor (inner radius $2$ cm, outer radius $4$ cm) carries a total current of $" + I + ".0$ A spread over its shell.",
          [ { label: "Field in the hollow cavity, $r < 2$ cm (T)", type: "mc", choices: ["Zero", "$\\mu_0 I/2\\pi r$", "$\\mu_0 I/2\\pi R$"], answerIndex: 0 },
            { label: "Field outside at $r = " + routcm + "$ cm (T)", type: "numeric", answerValue: Bout, answerText: Bout.toExponential(2), tol: 0.03 } ],
          ["An Amperian loop inside the cavity encloses no current, so $B = 0$ there.", "Outside, all the current is enclosed: $B = \\dfrac{\\mu_0 I}{2\\pi r} = \\dfrac{(4\\pi\\times10^{-7})(" + I + ")}{2\\pi(" + rout + ")} \\approx " + Bout.toExponential(2) + "$ T."],
          "Cavity encloses no current ($B=0$); outside behaves like a straight wire $\\mu_0 I/(2\\pi r)$."), "Vol. 2, Ch. 12 · Problem 46"); }
    ]
  });

  // ================= Lesson 10: Electromagnetic Induction & Faraday's Law (Vol.2 Ch.13) =================
  // Modeled on syllabus problems: 24, 36 (easy), 40, 43, 28 (medium),
  // 26, 31, 34 (hard), 45, 56 (extreme). Target = 10.
  register("phys1442-10-induction", {
    easy: [
      // #24 — emf from a uniform field collapsing to zero:  emf = N A (dB/dt)
      function () { var N = rpick([50, 100]), diamcm = rpick([10, 15]), B = rpick([0.50, 0.80]), dt = rpick([0.10, 0.20]); var A = Math.PI * Math.pow(diamcm / 200, 2); var emf = N * A * B / dt;
        return S(num("A $" + N + "$-turn coil of diameter $" + diamcm + "$ cm sits perpendicular to a $" + B + "$-T field. Find the emf induced if the field is reduced to zero uniformly in $" + dt + "$ s.", emf, sig(emf), 0.03,
          ["Faraday's law: $\\varepsilon = N\\dfrac{\\Delta\\Phi}{\\Delta t} = NA\\dfrac{\\Delta B}{\\Delta t}$, with $A = \\pi r^2$.", "$A = \\pi(" + (diamcm / 200) + ")^2 = " + sig(A) + "$ m². $\\varepsilon = (" + N + ")(" + sig(A) + ")\\dfrac{" + B + "}{" + dt + "}$", "$\\varepsilon \\approx " + sig(emf) + "$ V"],
          "Use $\\varepsilon = NA\\,\\Delta B/\\Delta t$ (area of the circular coil is $\\pi r^2$).", "V"), "Vol. 2, Ch. 13 · Problem 24"); },
      // #36 — Lenz's law: direction of the induced current
      function () { var rising = rpick([true, false]); var ans = rising ? "Clockwise" : "Counterclockwise";
        return S(mc("The upward magnetic flux through a horizontal loop is " + (rising ? "increasing" : "decreasing") + ". Viewed from above, which way does the induced current flow?",
          ["Clockwise", "Counterclockwise", "No current is induced", "It reverses every instant"], rising ? 0 : 1,
          ["Lenz's law: the induced current opposes the change in flux.", (rising ? "To oppose the increasing upward flux, the current makes downward flux inside the loop — clockwise seen from above." : "To oppose the decreasing upward flux, the current makes upward flux inside the loop — counterclockwise seen from above.")],
          "Lenz's law: the induced current fights the change. Rising upward flux ⇒ clockwise from above."), "Vol. 2, Ch. 13 · Problem 36"); }
    ],
    medium: [
      // #40 — average emf from rotating a coil out of a field
      function () { var N = rpick([500, 1000]), A = rpick([0.010, 0.020]), B = rpick([0.50, 1.0]), dt = 0.010; var emf = N * B * A / dt;
        return S(num("A coil of $" + N + "$ turns enclosing an area of $" + A + "\\ \\text{m}^2$ is rotated in $" + dt + "$ s from a position where its plane is perpendicular to a $" + B + "$-T field to where its plane is parallel to the field. What is the average emf?", emf, sig(emf), 0.03,
          ["The flux goes from $BA$ (perpendicular) to $0$ (parallel), so $\\Delta\\Phi = BA$.", "$\\varepsilon = N\\dfrac{\\Delta\\Phi}{\\Delta t} = \\dfrac{(" + N + ")(" + B + ")(" + A + ")}{" + dt + "}$", "$\\varepsilon \\approx " + sig(emf) + "$ V"],
          "Flux drops from $BA$ to $0$; use $\\varepsilon = N\\,\\Delta\\Phi/\\Delta t$.", "V"), "Vol. 2, Ch. 13 · Problem 40"); },
      // #43 — motional emf on a moving rod, plus the force on an electron in it
      function () { var Lcm = rpick([25, 30]), v = rpick([5.0, 8.0]), B = rpick([0.25, 0.40]); var L = Lcm / 100; var Fe = E * v * B; var emf = B * L * v;
        return S(multi("A $" + Lcm + "$-cm rod moves at $" + v + "$ m/s perpendicular to a $" + B + "$-T magnetic field (rod, velocity, and field all mutually perpendicular).",
          [ { label: "Magnetic force on an electron in the rod (N)", type: "numeric", answerValue: Fe, answerText: Fe.toExponential(2), tol: 0.03 },
            { label: "Motional emf along the rod (V)", type: "numeric", answerValue: emf, answerText: sig(emf), tol: 0.03 } ],
          ["Force on each electron: $F = evB = (1.6\\times10^{-19})(" + v + ")(" + B + ") \\approx " + Fe.toExponential(2) + "$ N.", "Motional emf: $\\varepsilon = BLv = (" + B + ")(" + L + ")(" + v + ") \\approx " + sig(emf) + "$ V."],
          "Force on a charge is $evB$; the motional emf is $BLv$."), "Vol. 2, Ch. 13 · Problem 43"); },
      // #28 — induced current from a changing field, given the coil resistance
      function () { var Acm = rpick([100, 200]), R = rpick([2.0, 5.0]), dBdt = rpick([0.20, 0.50]); var A = Acm * 1e-4; var emf = A * dBdt; var I = emf / R;
        return S(num("A single-turn coil of area $" + Acm + "\\ \\text{cm}^2$ and resistance $" + R + "\\ \\Omega$ sits perpendicular to a field changing at $" + dBdt + "$ T/s. What current is induced?", I, sig(I), 0.03,
          ["Induced emf: $\\varepsilon = A\\dfrac{dB}{dt} = (" + A + ")(" + dBdt + ") = " + sig(emf) + "$ V.", "Then Ohm's law: $I = \\varepsilon/R = " + sig(emf) + "/" + R + "$.", "$I \\approx " + sig(I) + "$ A"],
          "First $\\varepsilon = A\\,dB/dt$, then $I = \\varepsilon/R$.", "A"), "Vol. 2, Ch. 13 · Problem 28"); }
    ],
    hard: [
      // #26 — induced current in a square copper loop (compute the wire resistance)
      function () { var scm = rpick([5, 6, 8]), dBdt_m = rpick([5, 10]), rwmm = rpick([0.5, 1.0]); var s = scm / 100, dBdt = dBdt_m * 1e-3, rw = rwmm / 1000, rho = 1.68e-8;
        var emf = s * s * dBdt; var R = rho * (4 * s) / (Math.PI * rw * rw); var I = emf / R;
        return S(num("A square loop $" + scm + ".0$ cm on a side is made of copper wire of radius $" + rwmm + "$ mm. A perpendicular field changes at $" + dBdt_m + ".0$ mT/s. What current flows in the loop? ($\\rho_{Cu} = 1.68\\times10^{-8}\\ \\Omega\\cdot$m)", I, I.toExponential(2), 0.05,
          ["Induced emf: $\\varepsilon = A\\dfrac{dB}{dt} = (" + s + ")^2(" + dBdt + ") = " + emf.toExponential(2) + "$ V.", "Wire resistance: $R = \\dfrac{\\rho\\,(4s)}{\\pi r_w^2} = " + R.toExponential(2) + "\\ \\Omega$.", "$I = \\varepsilon/R \\approx " + I.toExponential(2) + "$ A"],
          "Get $\\varepsilon = A\\,dB/dt$ and the wire resistance $R=\\rho L/(\\pi r_w^2)$ with $L=4s$; then $I=\\varepsilon/R$.", "A"), "Vol. 2, Ch. 13 · Problem 26"); },
      // #31 — emf from a linearly time-varying field over a rectangular loop
      function () { var acm = rpick([10, 20]), bcm = rpick([15, 25]), alpha = rpick([2.0, 5.0]); var a = acm / 100, b = bcm / 100; var emf = a * b * alpha;
        return S(num("A rectangular loop $" + acm + "$ cm by $" + bcm + "$ cm lies in a magnetic field (perpendicular to the loop) that grows as $B(t) = " + alpha + "t$ T. What is the magnitude of the induced emf?", emf, sig(emf), 0.03,
          ["$\\varepsilon = -\\dfrac{d\\Phi}{dt} = -A\\dfrac{dB}{dt}$, and $\\dfrac{dB}{dt} = " + alpha + "$ T/s.", "$|\\varepsilon| = A\\,(" + alpha + ") = (" + a + ")(" + b + ")(" + alpha + ")$", "$|\\varepsilon| \\approx " + sig(emf) + "$ V"],
          "$dB/dt$ is the constant slope; $|\\varepsilon| = A\\,dB/dt$.", "V"), "Vol. 2, Ch. 13 · Problem 31"); },
      // #34 — emf from a time-dependent flux through an N-turn loop (derivative)
      function () { var N = rpick([20, 40]), a = rpick([2, 3]), b = rpick([4, 5]), t = rpick([1, 2]); var emf = N * (2 * a * t + b);
        return S(num("The magnetic flux through a $" + N + "$-turn loop varies as $\\Phi(t) = " + a + "t^2 + " + b + "t$ (Wb). What is the magnitude of the induced emf at $t = " + t + ".0$ s?", emf, sig(emf), 0.02,
          ["Faraday's law: $\\varepsilon = -N\\dfrac{d\\Phi}{dt}$.", "$\\dfrac{d\\Phi}{dt} = 2(" + a + ")t + " + b + "$; at $t = " + t + "$ this is $" + (2 * a * t + b) + "$ Wb/s.", "$|\\varepsilon| = N(2at+b) = " + N + "\\times " + (2 * a * t + b) + " = " + sig(emf) + "$ V"],
          "Differentiate the flux, plug in $t$, then multiply by $N$.", "V"), "Vol. 2, Ch. 13 · Problem 34"); }
    ],
    extreme: [
      // #45 — rod on rails: emf, current, and dissipated power
      function () { var B = rpick([0.30, 0.50]), Lcm = rpick([20, 40]), v = rpick([4.0, 6.0]), R = rpick([2.0, 5.0]); var L = Lcm / 100; var emf = B * L * v; var I = emf / R; var P = I * I * R;
        return S(multi("A rod of length $" + Lcm + "$ cm slides at $" + v + "$ m/s on frictionless, zero-resistance rails in a $" + B + "$-T field. The circuit's only resistance is a $" + R + "\\ \\Omega$ resistor.",
          [ { label: "Induced emf (V)", type: "numeric", answerValue: emf, answerText: sig(emf), tol: 0.03 },
            { label: "Current in the circuit (A)", type: "numeric", answerValue: I, answerText: sig(I), tol: 0.03 },
            { label: "Power dissipated (W)", type: "numeric", answerValue: P, answerText: sig(P), tol: 0.04 } ],
          ["Motional emf: $\\varepsilon = BLv = (" + B + ")(" + L + ")(" + v + ") = " + sig(emf) + "$ V.", "Current: $I = \\varepsilon/R = " + sig(I) + "$ A.", "Power: $P = I^2 R = " + sig(P) + "$ W."],
          "$\\varepsilon=BLv$, then $I=\\varepsilon/R$, then $P=I^2R$."), "Vol. 2, Ch. 13 · Problem 45"); },
      // #56 — angular velocity of a rotating coil from its maximum emf
      function () { var N = rpick([20, 50]), sidecm = rpick([12, 15]), B = rpick([0.050, 0.080]), emfmax_mV = rpick([30, 50]); var A = Math.pow(sidecm / 100, 2); var w = emfmax_mV * 1e-3 / (N * B * A);
        return S(num("A flat square coil of $" + N + "$ turns, $" + sidecm + ".0$ cm on a side, rotates in a $" + B + "$-T field. The maximum emf produced is $" + emfmax_mV + ".0$ mV. What is its angular velocity?", w, sig(w), 0.03,
          ["A rotating coil gives $\\varepsilon_{max} = N B A \\omega$, so $\\omega = \\dfrac{\\varepsilon_{max}}{N B A}$.", "$A = (" + sidecm / 100 + ")^2 = " + sig(A) + "$ m². $\\omega = \\dfrac{" + emfmax_mV + "\\times10^{-3}}{(" + N + ")(" + B + ")(" + sig(A) + ")}$", "$\\omega \\approx " + sig(w) + "$ rad/s"],
          "Peak emf is $NBA\\omega$; solve for $\\omega$.", "rad/s"), "Vol. 2, Ch. 13 · Problem 56"); }
    ]
  });

  return { register: register, has: has, make: make, difficulties: difficulties };
})();
