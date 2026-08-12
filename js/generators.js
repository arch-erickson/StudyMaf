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

  return { register: register, has: has, make: make, difficulties: difficulties };
})();
