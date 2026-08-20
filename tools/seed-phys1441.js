#!/usr/bin/env node
/* Seed Physics I — Calculus Based (PHYS 1441): 14 lesson JSONs at full PHYS-1442
 * depth. Source: CityTech PHYS 1441 outline + OpenStax University Physics Vol 1–2.
 * Diagrams added by tools/build-sci-diagrams.js. Run: node tools/seed-phys1441.js */
"use strict";
const fs = require("fs"), path = require("path");
const LDIR = path.resolve(__dirname, "..", "data", "lessons");
const g = (plain, in_class) => ({ plain, in_class });
const cn = (level, heading, explanation, math_steps) => ({ level, heading, explanation, math_steps });
const ex = (title, scenario, how_the_math_applies) => ({ title, scenario, how_the_math_applies });
const pr = (id, difficulty, prompt, correct_answer, solution_steps, hint) => ({ id, difficulty, prompt, correct_answer, solution_steps, hint });
const vids = (a, b, c) => ({ concept_query: a, math_query: b, combined_query: c });

const LESSONS = [
{ id: "phys1441-01-units", title: "Units, Measurement & Estimation", chapter: "Vol. 1, Ch. 1", problems: [27,31,40,60,64,81],
  summary: "Physics rests on SI units, dimensional consistency, significant figures, and order-of-magnitude estimates. Every equation must balance units, and unit conversions use ratios that cancel to leave the target unit.",
  glossary: {
    "SI units": g("The standard metric base units of physics.", "meter (m), kilogram (kg), second (s), and derived units like N, J, W."),
    "dimension": g("The physical type of a quantity (length, time, mass).", "Both sides of a valid equation share the same dimensions."),
    "dimensional analysis": g("Checking or deriving relations by their units.", "If units don't match, the equation is wrong."),
    "significant figures": g("The meaningful digits in a measurement.", "The answer's precision can't exceed the least-precise input."),
    "unit conversion": g("Rewriting a quantity in different units.", "Multiply by ratios equal to 1 so unwanted units cancel."),
    "order of magnitude": g("The nearest power of ten of a quantity.", "For quick estimates and sanity checks."),
    "scientific notation": g("Writing numbers as $c\\times10^n$.", "Keeps track of very large or small values."),
    "accuracy vs precision": g("Closeness to truth vs repeatability.", "Accurate ≈ correct; precise ≈ consistent.")
  },
  concepts: [
    cn(1, "SI base units", "All mechanical quantities build from meter, kilogram, and second. Derived units combine them: velocity is m/s, force is $\\text{kg·m/s}^2=\\text{N}$, energy is $\\text{N·m}=\\text{J}$.", ["Identify the base units involved.", "Combine them per the definition.", "Name the derived unit (N, J, W…)."]),
    cn(2, "Dimensional analysis", "Every term in an equation must have the same dimensions. Checking units catches errors and can even reveal the form of a relation up to a constant.", ["Write each quantity's dimensions.", "Require both sides to match.", "A mismatch means a mistake."]),
    cn(3, "Unit conversion", "Multiply by conversion ratios (each equal to 1) arranged so the unwanted units cancel and the desired unit remains.", ["Write the starting quantity.", "Multiply by ratios that cancel unwanted units.", "Simplify to the target unit."]),
    cn(4, "Significant figures", "Report only as many digits as your least-precise measurement justifies. Multiplication/division keeps the fewest sig figs; addition keeps the fewest decimal places.", ["Count sig figs in each input.", "For ×/÷ keep the fewest sig figs.", "For +/− keep the fewest decimals."]),
    cn(5, "Estimation", "An order-of-magnitude estimate rounds each quantity to the nearest power of ten and combines them — a fast reality check on any calculation.", ["Round inputs to powers of ten.", "Combine the exponents.", "Compare to your detailed answer."])
  ],
  examples: [
    ex("Reading a car's fuel economy", "A car is rated in miles per gallon.", "Converting mpg to km/L is a unit conversion using ratios that cancel miles and gallons."),
    ex("Checking a physics formula", "You're unsure if $v=\\sqrt{2gh}$ is right.", "Dimensional analysis confirms both sides are m/s, a quick correctness check."),
    ex("Estimating a stadium crowd", "How many people fill a stadium?", "An order-of-magnitude estimate multiplies rough area by density to a power of ten.")
  ],
  videos: vids("SI units dimensional analysis significant figures physics", "unit conversion significant figures example problems", "physics 1 measurement units estimation worked problems"),
  problems: [
    pr("p01","easy","Convert $72$ km/h to m/s.","$20$ m/s",["$72\\,\\tfrac{km}{h}\\times\\tfrac{1000\\,m}{km}\\times\\tfrac{1\\,h}{3600\\,s}$.","$=72/3.6$.","$=20$ m/s."],"Divide km/h by 3.6."),
    pr("p02","easy","How many sig figs in $0.00450$?","$3$",["Leading zeros don't count.","$4,5,0$ are significant.","$3$."],"Trailing zero after a decimal counts."),
    pr("p03","easy","What are the SI units of force?","$\\text{kg·m/s}^2$ (N)",["$F=ma$.","$\\text{kg}\\cdot\\text{m/s}^2$.","= newton (N)."],"Use $F=ma$."),
    pr("p04","medium","Convert $5.0\\ \\text{m}^2$ to cm².","$5.0\\times10^{4}$ cm²",["$1\\,m=100\\,cm$, so $1\\,m^2=10^4\\,cm^2$.","$5.0\\times10^4$.","cm²."],"Square the length conversion."),
    pr("p05","medium","Is $x=\\tfrac12 at^2$ dimensionally consistent? ($a$ in m/s², $t$ in s)","Yes (both sides m)",["$a t^2$: $\\tfrac{m}{s^2}\\cdot s^2=m$.","Left side $x$ is m.","Consistent."],"Check the units of $at^2$."),
    pr("p06","medium","Estimate the order of magnitude of the number of seconds in a year.","$10^{7}$",["$\\sim3\\times10^7$ s.","Nearest power of ten.","$10^7$."],"$365\\times24\\times3600$."),
    pr("p07","hard","A rectangle is $2.5\\ \\text{m}\\times1.20\\ \\text{m}$. Give the area with correct sig figs.","$3.0\\ \\text{m}^2$",["$2.5\\times1.20=3.00$.","Fewest sig figs is 2.","$3.0\\ \\text{m}^2$."],"×/÷ keeps the fewest sig figs.")
  ] },

{ id: "phys1441-02-kinematics-1d", title: "Kinematics in One Dimension", chapter: "Vol. 1, Ch. 3", problems: [28,29,35,41,42,45,51,68],
  summary: "Motion along a line is described by position, velocity, and acceleration. Velocity is $v=dx/dt$ and acceleration $a=dv/dt$. For constant acceleration, the kinematic equations relate displacement, velocity, acceleration, and time.",
  glossary: {
    "displacement": g("Change in position (a vector).", "$\\Delta x=x_f-x_i$; direction matters."),
    "velocity": g("Rate of change of position.", "$v=\\dfrac{dx}{dt}$; average is $\\Delta x/\\Delta t$."),
    "acceleration": g("Rate of change of velocity.", "$a=\\dfrac{dv}{dt}$."),
    "kinematic equations": g("Constant-acceleration motion formulas.", "$v=v_0+at$, $x=x_0+v_0t+\\tfrac12at^2$, $v^2=v_0^2+2a\\Delta x$."),
    "free fall": g("Motion under gravity alone.", "$a=-g\\approx-9.8\\ \\text{m/s}^2$ (downward)."),
    "average vs instantaneous": g("Over an interval vs at an instant.", "Average $=\\Delta x/\\Delta t$; instantaneous $=dx/dt$."),
    "speed": g("Magnitude of velocity.", "Always $\\ge0$; ignores direction."),
    "position-time graph": g("A plot of $x$ vs $t$.", "Its slope is velocity.")
  },
  concepts: [
    cn(1, "Position, velocity, acceleration", "Velocity is the derivative of position, $v=dx/dt$; acceleration is the derivative of velocity, $a=dv/dt$. On graphs, slope of $x(t)$ is $v$, slope of $v(t)$ is $a$.", ["Differentiate position to get velocity.", "Differentiate velocity to get acceleration.", "Read slopes off the graphs."]),
    cn(2, "The kinematic equations", "For constant $a$: $v=v_0+at$, $x=x_0+v_0t+\\tfrac12at^2$, and $v^2=v_0^2+2a\\Delta x$. Pick the equation missing the variable you don't have.", ["List knowns and the unknown.", "Choose the equation without the extra variable.", "Solve for the unknown."]),
    cn(3, "Free fall", "Near Earth, gravity gives constant downward acceleration $g\\approx9.8\\ \\text{m/s}^2$. The same kinematic equations apply with $a=-g$.", ["Set $a=-g$ (down negative).", "Apply the kinematic equations.", "At the peak, $v=0$."]),
    cn(4, "Graphical analysis", "Slopes give rates (position→velocity→acceleration); areas give accumulations (area under $v(t)$ is displacement).", ["Slope of $x$-$t$ = velocity.", "Slope of $v$-$t$ = acceleration.", "Area under $v$-$t$ = displacement."]),
    cn(5, "Average vs instantaneous", "Average velocity is total displacement over total time; instantaneous velocity is the limit as the interval shrinks — the derivative.", ["Average $=\\Delta x/\\Delta t$.", "Instantaneous $=\\lim_{\\Delta t\\to0}\\Delta x/\\Delta t$.", "They differ when velocity changes."])
  ],
  examples: [
    ex("Braking distance", "A car brakes to a stop.", "$v^2=v_0^2+2a\\Delta x$ finds the stopping distance from speed and deceleration."),
    ex("Dropping a ball off a cliff", "A stone falls from a height.", "Free-fall kinematics with $a=-g$ gives the fall time and impact speed."),
    ex("A sprinter's start", "A runner accelerates from the blocks.", "Average vs instantaneous velocity distinguishes the whole race from the top speed.")
  ],
  videos: vids("kinematics position velocity acceleration derivatives", "kinematic equations constant acceleration free fall examples", "physics 1 one dimensional motion worked problems"),
  problems: [
    pr("p01","easy","A car goes from $0$ to $20$ m/s in $4$ s. Find its acceleration.","$5$ m/s²",["$a=\\Delta v/\\Delta t$.","$=20/4$.","$5$ m/s²."],"$a=\\Delta v/\\Delta t$."),
    pr("p02","easy","A ball is dropped from rest. Find its speed after $2$ s.","$\\approx19.6$ m/s",["$v=gt$.","$=9.8(2)$.","$19.6$ m/s."],"$v=v_0+at$ with $v_0=0$."),
    pr("p03","medium","A car at $30$ m/s brakes at $6$ m/s². Find the stopping distance.","$75$ m",["$v^2=v_0^2+2a\\Delta x$, $0=900-12\\Delta x$.","$\\Delta x=900/12$.","$75$ m."],"Use $v^2=v_0^2+2a\\Delta x$."),
    pr("p04","medium","A ball thrown up at $20$ m/s reaches what maximum height?","$\\approx20.4$ m",["At top $v=0$: $0=400-2(9.8)h$.","$h=400/19.6$.","$20.4$ m."],"$v=0$ at the peak."),
    pr("p05","medium","How far does a car travel from rest in $5$ s at $4$ m/s²?","$50$ m",["$x=\\tfrac12 at^2$.","$=\\tfrac12(4)(25)$.","$50$ m."],"$x=\\tfrac12 at^2$."),
    pr("p06","hard","A ball thrown up at $15$ m/s — how long until it returns to the thrower's hand?","$\\approx3.06$ s",["Time up: $v=0$ at $t=15/9.8=1.53$ s.","Total is twice that.","$\\approx3.06$ s."],"Up-time equals down-time."),
    pr("p07","hard","Position $x(t)=3t^2-2t$. Find the velocity at $t=2$ s.","$10$ m/s",["$v=dx/dt=6t-2$.","At $t=2$: $12-2$.","$10$ m/s."],"Differentiate position."),
    pr("p08","stretch","A stone dropped takes $3$ s to hit the ground. How tall is the cliff?","$\\approx44.1$ m",["$h=\\tfrac12 g t^2$.","$=\\tfrac12(9.8)(9)$.","$44.1$ m."],"$h=\\tfrac12 g t^2$.")
  ] },

{ id: "phys1441-03-vectors-2d", title: "Vectors & Motion in Two Dimensions", chapter: "Vol. 1, Ch. 2 & 4", problems: [28,29,36,40,45,51],
  summary: "Vectors have magnitude and direction; they add by components. In two dimensions, motion separates into independent $x$ and $y$ parts — the key to projectile motion, where horizontal velocity is constant and vertical motion is free fall.",
  glossary: {
    "vector": g("A quantity with magnitude and direction.", "Add by components, not by simple sums."),
    "components": g("A vector's projections onto the axes.", "$A_x=A\\cos\\theta$, $A_y=A\\sin\\theta$."),
    "resultant": g("The vector sum of several vectors.", "Add components, then recombine."),
    "magnitude": g("A vector's length.", "$|\\vec A|=\\sqrt{A_x^2+A_y^2}$."),
    "projectile motion": g("Motion under gravity in 2D.", "Constant horizontal velocity; vertical free fall."),
    "range": g("Horizontal distance a projectile travels.", "Maximized at a $45^\\circ$ launch (level ground)."),
    "independence of motion": g("$x$ and $y$ motions don't affect each other.", "Solve them separately, linked only by time."),
    "trajectory": g("The path of a projectile.", "A parabola for constant gravity.")
  },
  concepts: [
    cn(1, "Vector components", "Break a vector into $A_x=A\\cos\\theta$ and $A_y=A\\sin\\theta$. Components add like ordinary numbers, which makes vector addition manageable.", ["Resolve each vector into $x$ and $y$.", "Add the $x$'s and the $y$'s separately.", "Recombine: magnitude $\\sqrt{R_x^2+R_y^2}$, angle $\\tan^{-1}(R_y/R_x)$."]),
    cn(2, "Adding vectors", "The resultant is found by summing components, then converting back to magnitude and direction. Graphically it's the tip-to-tail sum.", ["Sum $x$-components → $R_x$.", "Sum $y$-components → $R_y$.", "Magnitude $\\sqrt{R_x^2+R_y^2}$, direction from $\\arctan$."]),
    cn(3, "Independence of 2D motion", "Horizontal and vertical motions are independent, connected only through the shared time. Analyze each with 1D kinematics.", ["Split into $x$ and $y$ problems.", "Apply kinematics to each.", "Use the common time to link them."]),
    cn(4, "Projectile motion", "With gravity only, horizontal velocity stays constant and vertical motion is free fall. The path is a parabola.", ["$x$: constant velocity, $x=v_{0x}t$.", "$y$: free fall, $y=v_{0y}t-\\tfrac12gt^2$.", "Combine for time of flight, range, height."]),
    cn(5, "Range and maximum height", "Time of flight comes from the vertical motion; range is horizontal velocity times that time; max height occurs when $v_y=0$.", ["Find flight time from $y$-motion.", "Range $=v_{0x}\\times$ flight time.", "Max height when $v_y=0$."])
  ],
  examples: [
    ex("A kicked football", "A ball launched at an angle.", "Its range and hang time come from splitting the launch velocity into components."),
    ex("A boat crossing a river", "A boat aims across a current.", "The boat's velocity and the current add as vectors to give the real path."),
    ex("Water from a hose", "A stream arcs to the ground.", "The parabolic trajectory follows from independent horizontal and vertical motion.")
  ],
  videos: vids("vectors components addition physics", "projectile motion range height components examples", "physics 1 two dimensional motion vectors worked problems"),
  problems: [
    pr("p01","easy","A vector has magnitude $10$ at $30^\\circ$. Find its $x$-component.","$\\approx8.66$",["$A_x=A\\cos\\theta$.","$=10\\cos30^\\circ$.","$\\approx8.66$."],"$A_x=A\\cos\\theta$."),
    pr("p02","easy","Find the magnitude of a vector with components $(3,4)$.","$5$",["$\\sqrt{3^2+4^2}$.","$=\\sqrt{25}$.","$5$."],"Pythagoras."),
    pr("p03","medium","A ball is launched horizontally at $10$ m/s from $20$ m high. How long to land?","$\\approx2.02$ s",["$y$: $20=\\tfrac12(9.8)t^2$.","$t=\\sqrt{40/9.8}$.","$\\approx2.02$ s."],"Vertical motion sets the time."),
    pr("p04","medium","In the previous problem, how far horizontally does it land?","$\\approx20.2$ m",["$x=v_{0x}t=10(2.02)$.","$\\approx20.2$ m.","Done."],"Range $=v_x\\times t$."),
    pr("p05","medium","A projectile is launched at $20$ m/s, $30^\\circ$. Find $v_{0y}$.","$10$ m/s",["$v_{0y}=20\\sin30^\\circ$.","$=20(0.5)$.","$10$ m/s."],"$v_{0y}=v_0\\sin\\theta$."),
    pr("p06","hard","For that launch ($20$ m/s, $30^\\circ$), find the time of flight on level ground.","$\\approx2.04$ s",["$t=2v_{0y}/g=2(10)/9.8$.","$\\approx2.04$ s.","Done."],"Flight time $=2v_{0y}/g$."),
    pr("p07","hard","Find the range for that launch.","$\\approx35.3$ m",["$R=v_{0x}t=20\\cos30^\\circ\\times2.04$.","$\\approx17.3\\times2.04$.","$\\approx35.3$ m."],"Range $=v_x\\times$ flight time.")
  ] },

{ id: "phys1441-04-newtons-laws", title: "Newton's Laws of Motion", chapter: "Vol. 1, Ch. 5", problems: [21,33,36,40,49,60],
  summary: "Newton's three laws govern dynamics: an object keeps its velocity unless a net force acts (inertia); $\\vec F_{net}=m\\vec a$; and forces come in equal-and-opposite pairs. Free-body diagrams turn a situation into equations.",
  glossary: {
    "Newton's first law": g("Inertia: no net force ⇒ constant velocity.", "Objects resist changes in motion."),
    "Newton's second law": g("Net force equals mass times acceleration.", "$\\vec F_{net}=m\\vec a$."),
    "Newton's third law": g("Every force has an equal, opposite reaction.", "$\\vec F_{AB}=-\\vec F_{BA}$."),
    "free-body diagram": g("A sketch of all forces on one object.", "The basis for writing $\\sum F=ma$."),
    "net force": g("The vector sum of all forces.", "Determines the acceleration."),
    "mass vs weight": g("Amount of matter vs gravitational force on it.", "$W=mg$; mass is constant, weight varies with $g$."),
    "normal force": g("Support force perpendicular to a surface.", "Adjusts to prevent objects sinking through surfaces."),
    "inertia": g("Resistance to acceleration.", "Measured by mass.")
  },
  concepts: [
    cn(1, "First law: inertia", "Without a net force, an object's velocity stays constant — at rest or moving straight at constant speed. Motion doesn't need a force to continue, only to change.", ["Check whether the net force is zero.", "If so, velocity is constant.", "A force is needed only to change motion."]),
    cn(2, "Second law: $F=ma$", "The net force equals mass times acceleration. Solve problems by summing forces along each axis and setting $\\sum F=ma$.", ["Draw a free-body diagram.", "Sum forces along each axis.", "Set $\\sum F=ma$ and solve."]),
    cn(3, "Free-body diagrams", "Isolate one object and draw every force acting on it (gravity, normal, tension, friction, applied). This converts the physics into solvable equations.", ["Pick one object.", "Draw all forces as arrows.", "Choose axes and resolve into components."]),
    cn(4, "Third law: action–reaction", "Forces occur in pairs: if A pushes B, B pushes A equally and oppositely. The pair acts on different objects, so they don't cancel on one object.", ["Identify the interacting pair.", "The forces are equal and opposite.", "They act on different bodies."]),
    cn(5, "Weight and normal force", "Weight is $W=mg$. The normal force is the surface's perpendicular support; on a flat surface with no vertical acceleration it equals the weight (or its perpendicular component on an incline).", ["Compute weight $W=mg$.", "Balance vertical forces if no vertical acceleration.", "On an incline, $N=mg\\cos\\theta$."])
  ],
  examples: [
    ex("Seatbelts and inertia", "A car stops suddenly.", "Your body continues forward by inertia (first law) until the belt applies a force."),
    ex("Rocket propulsion", "A rocket pushes gas out the back.", "By the third law, the gas pushes the rocket forward."),
    ex("An elevator ride", "You feel heavier as the elevator accelerates up.", "The normal force exceeds your weight: $N-mg=ma$.")
  ],
  videos: vids("newtons three laws of motion explained free body diagram", "F=ma newtons second law tension normal force examples", "physics 1 newtons laws worked problems"),
  problems: [
    pr("p01","easy","A $10$ kg box has a net force of $30$ N. Find its acceleration.","$3$ m/s²",["$a=F/m$.","$=30/10$.","$3$ m/s²."],"$a=F_{net}/m$."),
    pr("p02","easy","What is the weight of a $5$ kg object?","$\\approx49$ N",["$W=mg$.","$=5(9.8)$.","$49$ N."],"$W=mg$."),
    pr("p03","medium","A $2$ kg block is pushed with $12$ N against $4$ N of friction. Find its acceleration.","$4$ m/s²",["Net $=12-4=8$ N.","$a=8/2$.","$4$ m/s²."],"Subtract friction, then $a=F_{net}/m$."),
    pr("p04","medium","A $3$ kg mass hangs from a rope in equilibrium. Find the tension.","$\\approx29.4$ N",["Equilibrium: $T=mg$.","$=3(9.8)$.","$29.4$ N."],"Tension balances weight."),
    pr("p05","medium","An elevator accelerates up at $2$ m/s² with a $60$ kg person. Find the normal force.","$\\approx708$ N",["$N-mg=ma$.","$N=60(9.8+2)$.","$708$ N."],"$N=m(g+a)$."),
    pr("p06","hard","A $5$ kg block on a frictionless $30^\\circ$ incline — find its acceleration.","$\\approx4.9$ m/s²",["$a=g\\sin\\theta$.","$=9.8\\sin30^\\circ$.","$4.9$ m/s²."],"$a=g\\sin\\theta$ on a frictionless incline."),
    pr("p07","hard","Two masses $3$ kg and $2$ kg connected over a frictionless pulley (Atwood). Find the acceleration.","$\\approx1.96$ m/s²",["$a=\\dfrac{(m_1-m_2)g}{m_1+m_2}=\\dfrac{(1)(9.8)}{5}$.","$=1.96$ m/s².","Done."],"Atwood: $a=(m_1-m_2)g/(m_1+m_2)$.")
  ] },

{ id: "phys1441-05-applications-gravity", title: "Applications of Newton's Laws & Gravitation", chapter: "Vol. 1, Ch. 6 & 13", problems: [13,30,37,38,48,55,61,66],
  summary: "Applying Newton's laws covers friction, uniform circular motion, and universal gravitation. Friction is $f=\\mu N$; circular motion needs centripetal force $F_c=mv^2/r$; gravity is $F=Gm_1m_2/r^2$.",
  glossary: {
    "friction": g("A force opposing relative sliding.", "$f=\\mu N$; static (up to a max) or kinetic."),
    "coefficient of friction": g("Ratio setting friction's strength.", "$\\mu$; kinetic $\\mu_k$ usually less than static $\\mu_s$."),
    "centripetal force": g("The net inward force for circular motion.", "$F_c=\\dfrac{mv^2}{r}$; points to the center."),
    "centripetal acceleration": g("Acceleration toward the center.", "$a_c=\\dfrac{v^2}{r}$."),
    "universal gravitation": g("Every mass attracts every other.", "$F=G\\dfrac{m_1m_2}{r^2}$."),
    "gravitational constant": g("The constant $G$ in Newton's law.", "$G=6.67\\times10^{-11}\\ \\text{N·m}^2/\\text{kg}^2$."),
    "orbital motion": g("Gravity providing the centripetal force.", "$\\dfrac{GMm}{r^2}=\\dfrac{mv^2}{r}$."),
    "banked curve": g("A tilted road aiding circular motion.", "The normal force's component supplies centripetal force.")
  },
  concepts: [
    cn(1, "Friction", "Kinetic friction opposes sliding with $f_k=\\mu_k N$; static friction can grow up to $f_{s,\\max}=\\mu_s N$ before slipping. Include it in the force balance along the surface.", ["Find the normal force $N$.", "Compute $f=\\mu N$.", "Add friction (opposing motion) to $\\sum F=ma$."]),
    cn(2, "Uniform circular motion", "Moving in a circle at constant speed still accelerates — toward the center, $a_c=v^2/r$. Some real force (tension, friction, gravity) must supply $F_c=mv^2/r$.", ["Identify what provides the inward force.", "Set it equal to $mv^2/r$.", "Solve for the unknown."]),
    cn(3, "Newton's law of gravitation", "Any two masses attract with $F=Gm_1m_2/r^2$ along the line joining them — the same inverse-square form as Coulomb's law.", ["Insert the two masses and separation.", "Apply $F=Gm_1m_2/r^2$.", "Direction is attractive along the line."]),
    cn(4, "Orbits", "For a circular orbit, gravity is the centripetal force: $GMm/r^2=mv^2/r$. This gives orbital speed $v=\\sqrt{GM/r}$ and relates period to radius.", ["Set gravity equal to $mv^2/r$.", "Solve $v=\\sqrt{GM/r}$.", "Use $v=2\\pi r/T$ for the period."]),
    cn(5, "Weight on other planets", "Surface gravity is $g=GM/R^2$, so weight $mg$ changes with a planet's mass and radius even though mass stays the same.", ["Compute $g=GM/R^2$.", "Weight $=mg$ there.", "Mass is unchanged."])
  ],
  examples: [
    ex("A car rounding a curve", "Friction keeps a car on a flat curve.", "Static friction supplies $mv^2/r$; too fast and it slips."),
    ex("The Moon's orbit", "The Moon circles Earth.", "Earth's gravity provides exactly the centripetal force for the orbit."),
    ex("Weight on the Moon", "Astronauts feel lighter on the Moon.", "$g_{Moon}=GM/R^2$ is about $1/6$ of Earth's, so weight drops.")
  ],
  videos: vids("friction centripetal force circular motion physics", "universal gravitation orbital speed examples", "physics 1 friction circular motion gravity worked problems"),
  problems: [
    pr("p01","easy","A $10$ kg box on a floor has $\\mu_k=0.3$. Find the kinetic friction force.","$\\approx29.4$ N",["$N=mg=98$ N.","$f=\\mu N=0.3(98)$.","$29.4$ N."],"$f=\\mu N$."),
    pr("p02","easy","A $2$ kg ball moves in a circle of radius $1$ m at $3$ m/s. Find the centripetal force.","$18$ N",["$F_c=mv^2/r$.","$=2(9)/1$.","$18$ N."],"$F_c=mv^2/r$."),
    pr("p03","medium","Find the centripetal acceleration for $v=10$ m/s, $r=25$ m.","$4$ m/s²",["$a_c=v^2/r$.","$=100/25$.","$4$ m/s²."],"$a_c=v^2/r$."),
    pr("p04","medium","Two $1000$ kg masses are $2$ m apart. Find the gravitational force.","$\\approx1.67\\times10^{-5}$ N",["$F=G m_1m_2/r^2$.","$=6.67\\times10^{-11}(10^6)/4$.","$\\approx1.67\\times10^{-5}$ N."],"$F=Gm_1m_2/r^2$."),
    pr("p05","medium","A $5$ kg block is pushed at constant velocity against $\\mu_k=0.4$. Find the push force.","$\\approx19.6$ N",["Constant velocity ⇒ push $=f=\\mu mg$.","$=0.4(5)(9.8)$.","$19.6$ N."],"At constant velocity, push equals friction."),
    pr("p06","hard","Find the orbital speed at radius $r=7\\times10^6$ m around Earth ($M=5.97\\times10^{24}$ kg).","$\\approx7.5\\times10^3$ m/s",["$v=\\sqrt{GM/r}$.","$=\\sqrt{6.67\\times10^{-11}(5.97\\times10^{24})/7\\times10^6}$.","$\\approx7.5$ km/s."],"$v=\\sqrt{GM/r}$."),
    pr("p07","hard","A car rounds a flat curve ($r=50$ m, $\\mu_s=0.8$). Find the maximum speed.","$\\approx19.8$ m/s",["$\\mu_s mg=mv^2/r$ ⇒ $v=\\sqrt{\\mu_s g r}$.","$=\\sqrt{0.8(9.8)(50)}$.","$\\approx19.8$ m/s."],"$v=\\sqrt{\\mu_s g r}$.")
  ] },

{ id: "phys1441-06-work-energy", title: "Work & Kinetic Energy", chapter: "Vol. 1, Ch. 7", problems: [28,30,40,44,50,59,61,72],
  summary: "Work is force acting through a distance, $W=Fd\\cos\\theta$ (or $\\int F\\,dx$ for varying force). The work–energy theorem says net work equals the change in kinetic energy, $W_{net}=\\Delta KE$. Power is the rate of doing work.",
  glossary: {
    "work": g("Energy transferred by a force over a distance.", "$W=Fd\\cos\\theta$; zero if force ⟂ motion."),
    "kinetic energy": g("Energy of motion.", "$KE=\\tfrac12mv^2$."),
    "work-energy theorem": g("Net work equals change in kinetic energy.", "$W_{net}=\\Delta KE$."),
    "power": g("Rate of doing work.", "$P=\\dfrac{W}{t}=Fv$, in watts."),
    "variable force work": g("Work when force changes with position.", "$W=\\int F\\,dx$ — area under the $F$-$x$ curve."),
    "joule": g("The SI unit of energy/work.", "$1\\ \\text{J}=1\\ \\text{N·m}$."),
    "watt": g("The SI unit of power.", "$1\\ \\text{W}=1\\ \\text{J/s}$."),
    "dot product": g("Work as $\\vec F\\cdot\\vec d$.", "Picks out the component of force along motion.")
  },
  concepts: [
    cn(1, "Work by a constant force", "Work is $W=Fd\\cos\\theta$, where $\\theta$ is the angle between force and displacement. A perpendicular force does no work; an opposing force does negative work.", ["Identify force, displacement, and angle.", "$W=Fd\\cos\\theta$.", "Check the sign from $\\cos\\theta$."]),
    cn(2, "Work by a variable force", "When force depends on position, work is the integral $W=\\int F\\,dx$ — the area under the force–position graph. A spring gives $W=\\tfrac12kx^2$.", ["Express $F$ as a function of $x$.", "Integrate $\\int F\\,dx$ over the path.", "For a spring, $W=\\tfrac12kx^2$."]),
    cn(3, "Kinetic energy", "A moving mass carries $KE=\\tfrac12mv^2$. It scales with the square of speed — doubling speed quadruples the energy.", ["Compute $\\tfrac12mv^2$.", "Note the $v^2$ dependence.", "Units are joules."]),
    cn(4, "The work–energy theorem", "The net work done on an object equals its change in kinetic energy: $W_{net}=\\tfrac12mv_f^2-\\tfrac12mv_i^2$. This links forces to speed changes without needing acceleration explicitly.", ["Compute total (net) work.", "Set it equal to $\\Delta KE$.", "Solve for the unknown speed or distance."]),
    cn(5, "Power", "Power is how fast work is done: $P=W/t$, or $P=Fv$ for a force acting at speed $v$. Measured in watts.", ["Divide work by time, or use $P=Fv$.", "Keep units in J/s = W.", "Larger power ⇒ faster energy transfer."])
  ],
  examples: [
    ex("Lifting weights", "Raising a barbell a set height.", "Work $W=mgh$ is done against gravity; power depends on how fast you lift."),
    ex("A car engine's power", "An engine sustains speed against drag.", "$P=Fv$ gives the power needed to overcome resistance at a given speed."),
    ex("A compressed spring launcher", "A spring flings a ball.", "The stored $\\tfrac12kx^2$ becomes the ball's kinetic energy.")
  ],
  videos: vids("work force distance kinetic energy work energy theorem", "power P=Fv variable force spring work examples", "physics 1 work energy power worked problems"),
  problems: [
    pr("p01","easy","A $50$ N force pushes a box $4$ m in the direction of motion. Find the work.","$200$ J",["$W=Fd\\cos0$.","$=50(4)$.","$200$ J."],"$W=Fd$ when aligned."),
    pr("p02","easy","Find the kinetic energy of a $2$ kg ball moving at $5$ m/s.","$25$ J",["$KE=\\tfrac12mv^2$.","$=\\tfrac12(2)(25)$.","$25$ J."],"$\\tfrac12mv^2$."),
    pr("p03","medium","A $10$ N force acts at $60^\\circ$ to a $5$ m displacement. Find the work.","$25$ J",["$W=Fd\\cos60^\\circ$.","$=10(5)(0.5)$.","$25$ J."],"Include $\\cos\\theta$."),
    pr("p04","medium","Net work of $100$ J is done on a $4$ kg cart at rest. Find its final speed.","$\\approx7.07$ m/s",["$W=\\tfrac12mv^2$.","$100=2v^2\\Rightarrow v^2=50$.","$v\\approx7.07$ m/s."],"Work–energy theorem."),
    pr("p05","medium","A motor does $600$ J in $3$ s. Find its power.","$200$ W",["$P=W/t$.","$=600/3$.","$200$ W."],"$P=W/t$."),
    pr("p06","hard","A spring ($k=200$ N/m) is compressed $0.1$ m. Find the stored energy.","$1$ J",["$W=\\tfrac12kx^2$.","$=\\tfrac12(200)(0.01)$.","$1$ J."],"$\\tfrac12kx^2$."),
    pr("p07","hard","A car needs $8000$ N of force to move at $25$ m/s. Find the power.","$200$ kW",["$P=Fv$.","$=8000(25)$.","$200{,}000$ W = 200 kW."],"$P=Fv$.")
  ] },

{ id: "phys1441-07-potential-energy", title: "Potential Energy & Conservation of Energy", chapter: "Vol. 1, Ch. 8", problems: [24,28,32,37,39,42,69,74],
  summary: "Potential energy is stored energy of position: gravitational $U=mgh$ and elastic $U=\\tfrac12kx^2$. When only conservative forces act, mechanical energy $KE+U$ is conserved. Friction removes mechanical energy as heat.",
  glossary: {
    "potential energy": g("Stored energy due to position or configuration.", "Gravitational $mgh$; elastic $\\tfrac12kx^2$."),
    "conservative force": g("A force whose work is path-independent.", "Gravity, springs; defines a potential energy."),
    "mechanical energy": g("Kinetic plus potential energy.", "$E=KE+U$."),
    "conservation of energy": g("Total energy is constant if no energy leaves.", "$KE_i+U_i=KE_f+U_f$ (no friction)."),
    "gravitational PE": g("Energy of height in gravity.", "$U=mgh$."),
    "elastic PE": g("Energy stored in a stretched/compressed spring.", "$U=\\tfrac12kx^2$."),
    "non-conservative force": g("A force that dissipates energy (friction).", "Converts mechanical energy to heat."),
    "reference level": g("Where $U=0$ is chosen.", "Only changes in $U$ matter.")
  },
  concepts: [
    cn(1, "Gravitational potential energy", "Raising a mass stores energy $U=mgh$ (relative to a chosen zero). Only differences in height matter.", ["Choose a reference height.", "$U=mgh$ above it.", "Track changes $\\Delta U=mg\\Delta h$."]),
    cn(2, "Elastic potential energy", "A spring displaced by $x$ stores $U=\\tfrac12kx^2$. This is the work done to stretch or compress it.", ["Measure displacement from equilibrium.", "$U=\\tfrac12kx^2$.", "It's always nonnegative."]),
    cn(3, "Conservation of mechanical energy", "If only conservative forces act, $KE+U$ stays constant. Set the total energy at two points equal to solve for speed or height.", ["Write $E=KE+U$ at two points.", "Set them equal (no friction).", "Solve for the unknown."]),
    cn(4, "Energy with friction", "Friction does negative work, removing mechanical energy as heat: $KE_i+U_i=KE_f+U_f+|W_{friction}|$. Energy is still conserved overall, just not the mechanical part.", ["Compute the friction work $f\\cdot d$.", "Subtract it from the initial mechanical energy.", "Solve for the final state."]),
    cn(5, "Energy diagrams", "A plot of $U$ vs position shows equilibria (minima), turning points (where $KE=0$), and allowed regions (where $E\\ge U$).", ["Plot $U(x)$ and the total energy line $E$.", "Turning points where $U=E$.", "Motion is allowed where $E\\ge U$."])
  ],
  examples: [
    ex("A roller coaster", "A car dips and rises over hills.", "Energy trades between $mgh$ and $\\tfrac12mv^2$; the first hill can't be taller than the drop."),
    ex("A pendulum swing", "A bob swings up and down.", "At the bottom it's all $KE$; at the top all $U$ — conservation gives the speed."),
    ex("A slide with friction", "A child slows on a rough slide.", "Some potential energy becomes heat, so they arrive slower than energy conservation alone predicts.")
  ],
  videos: vids("potential energy gravitational elastic conservation of energy", "conservation of mechanical energy friction examples", "physics 1 energy conservation worked problems"),
  problems: [
    pr("p01","easy","Find the gravitational PE of a $2$ kg book $3$ m high.","$\\approx58.8$ J",["$U=mgh$.","$=2(9.8)(3)$.","$58.8$ J."],"$U=mgh$."),
    pr("p02","easy","A spring ($k=100$ N/m) is stretched $0.2$ m. Find the stored energy.","$2$ J",["$U=\\tfrac12kx^2$.","$=\\tfrac12(100)(0.04)$.","$2$ J."],"$\\tfrac12kx^2$."),
    pr("p03","medium","A ball dropped from $5$ m — find its speed at the bottom (energy method).","$\\approx9.9$ m/s",["$mgh=\\tfrac12mv^2$ ⇒ $v=\\sqrt{2gh}$.","$=\\sqrt{2(9.8)(5)}$.","$\\approx9.9$ m/s."],"$v=\\sqrt{2gh}$."),
    pr("p04","medium","A pendulum released from height $0.2$ m — find the speed at the bottom.","$\\approx1.98$ m/s",["$v=\\sqrt{2gh}$.","$=\\sqrt{2(9.8)(0.2)}$.","$\\approx1.98$ m/s."],"All PE becomes KE."),
    pr("p05","medium","A $1$ kg block slides down a frictionless $2$ m-high ramp. Find its final KE.","$\\approx19.6$ J",["$KE=mgh$.","$=1(9.8)(2)$.","$19.6$ J."],"KE gained equals PE lost."),
    pr("p06","hard","A $3$ kg block slides down a $4$ m-high slope, arriving at $6$ m/s. How much energy went to friction?","$\\approx63.6$ J",["$mgh=117.6$ J; $KE=\\tfrac12(3)(36)=54$ J.","Friction $=117.6-54$.","$\\approx63.6$ J."],"Friction loss = PE − KE."),
    pr("p07","hard","A $2$ kg ball is launched up a spring ($k=800$ N/m) compressed $0.1$ m. Find the max height (ignore mass of spring).","$\\approx0.204$ m",["$\\tfrac12kx^2=mgh$: $4=2(9.8)h$.","$h=4/19.6$.","$\\approx0.204$ m."],"Spring PE → gravitational PE.")
  ] },

{ id: "phys1441-08-momentum", title: "Linear Momentum & Collisions", chapter: "Vol. 1, Ch. 9", problems: [24,27,29,36,42,45,52,54],
  summary: "Momentum $\\vec p=m\\vec v$ changes by impulse $\\vec J=\\vec F\\Delta t=\\Delta\\vec p$. In an isolated system total momentum is conserved. Collisions are elastic (kinetic energy conserved) or inelastic (some KE lost); perfectly inelastic ones stick together.",
  glossary: {
    "momentum": g("Mass times velocity — 'quantity of motion'.", "$\\vec p=m\\vec v$; a vector."),
    "impulse": g("The change in momentum from a force over time.", "$\\vec J=\\vec F\\,\\Delta t=\\Delta\\vec p$."),
    "conservation of momentum": g("Total momentum is constant with no external force.", "$\\sum p_i=\\sum p_f$."),
    "elastic collision": g("Kinetic energy is conserved.", "Both momentum and KE are conserved."),
    "inelastic collision": g("Some kinetic energy is lost.", "Momentum conserved, KE not."),
    "perfectly inelastic": g("Objects stick together after impact.", "Maximum KE lost; move with common velocity."),
    "center of mass": g("The average position of a system's mass.", "Moves as if all mass and external force were there."),
    "recoil": g("Backward motion when mass is ejected.", "Momentum conservation from rest.")
  },
  concepts: [
    cn(1, "Momentum and impulse", "Momentum is $\\vec p=m\\vec v$. A force over time delivers impulse $\\vec J=\\vec F\\Delta t$, which equals the momentum change $\\Delta\\vec p$.", ["Compute $p=mv$.", "Impulse $=F\\Delta t=\\Delta p$.", "A longer time reduces the force for the same $\\Delta p$."]),
    cn(2, "Conservation of momentum", "With no net external force, the total momentum of a system is unchanged. Set total momentum before equal to total after.", ["Sum momenta before the interaction.", "Sum momenta after.", "Set them equal (external force ≈ 0)."]),
    cn(3, "Elastic collisions", "Both momentum and kinetic energy are conserved. For two objects, this gives two equations to solve for the final velocities.", ["Write momentum conservation.", "Write KE conservation.", "Solve the two equations for the final speeds."]),
    cn(4, "Inelastic collisions", "Momentum is conserved but kinetic energy isn't. In a perfectly inelastic collision the objects stick and move together at a common velocity.", ["Use momentum conservation.", "For 'stick together', one common final velocity.", "KE lost = initial KE − final KE."]),
    cn(5, "Impulse and safety", "Spreading a collision over more time reduces the peak force ($F=\\Delta p/\\Delta t$) — the principle behind airbags and crumple zones.", ["Fix the momentum change $\\Delta p$.", "Increase $\\Delta t$ to lower $F$.", "That's how safety devices work."])
  ],
  examples: [
    ex("Airbags", "A crash stops a driver quickly.", "The airbag lengthens the stopping time, cutting the force via $F=\\Delta p/\\Delta t$."),
    ex("Rocket recoil", "A gun or rocket ejects mass.", "Momentum conservation from rest gives equal-and-opposite momenta — recoil."),
    ex("Billiard balls", "One ball strikes another.", "A near-elastic collision conserves both momentum and kinetic energy.")
  ],
  videos: vids("momentum impulse conservation of momentum physics", "elastic inelastic collision examples momentum", "physics 1 momentum collisions worked problems"),
  problems: [
    pr("p01","easy","Find the momentum of a $3$ kg cart at $4$ m/s.","$12$ kg·m/s",["$p=mv$.","$=3(4)$.","$12$ kg·m/s."],"$p=mv$."),
    pr("p02","easy","A $10$ N force acts for $2$ s. Find the impulse.","$20$ N·s",["$J=F\\Delta t$.","$=10(2)$.","$20$ N·s."],"$J=F\\Delta t$."),
    pr("p03","medium","A $2$ kg ball at $3$ m/s hits and sticks to a $1$ kg ball at rest. Find their common speed.","$2$ m/s",["$p$: $2(3)=(3)v$.","$v=6/3$.","$2$ m/s."],"Perfectly inelastic: stick together."),
    pr("p04","medium","A $0.5$ kg ball hits a wall at $4$ m/s and bounces back at $4$ m/s. Find the impulse.","$4$ N·s",["$\\Delta p=m(v_f-v_i)=0.5(4-(-4))$.","$=0.5(8)$.","$4$ N·s."],"Include the direction change."),
    pr("p05","medium","A $60$ kg skater throws a $2$ kg ball at $10$ m/s. Find the skater's recoil speed.","$\\approx0.33$ m/s",["$0=60v-2(10)$.","$v=20/60$.","$0.33$ m/s."],"Total momentum starts at zero."),
    pr("p06","hard","A $1$ kg cart at $6$ m/s collides elastically with an equal cart at rest. Find the final speeds.","$0$ and $6$ m/s",["Equal masses, elastic: they exchange velocities.","First stops, second moves at $6$ m/s.","Done."],"Equal-mass elastic ⇒ swap velocities."),
    pr("p07","hard","A $1500$ kg car at $20$ m/s hits a stopped $1000$ kg car; they stick. Find their speed.","$12$ m/s",["$1500(20)=2500v$.","$v=30000/2500$.","$12$ m/s."],"Inelastic momentum conservation.")
  ] },

{ id: "phys1441-09-rotation", title: "Rotational Motion & Angular Momentum", chapter: "Vol. 1, Ch. 10 & 11", problems: [29,35,41,47,58,71,85],
  summary: "Rotation parallels linear motion: angular position, velocity, and acceleration, with torque $\\tau=rF\\sin\\theta$ as the rotational force and moment of inertia $I$ as rotational mass. $\\tau=I\\alpha$, rotational KE is $\\tfrac12I\\omega^2$, and angular momentum $L=I\\omega$ is conserved.",
  glossary: {
    "angular velocity": g("Rotation rate.", "$\\omega=d\\theta/dt$, in rad/s; $v=r\\omega$."),
    "angular acceleration": g("Rate of change of angular velocity.", "$\\alpha=d\\omega/dt$; $a=r\\alpha$."),
    "torque": g("The rotational effect of a force.", "$\\tau=rF\\sin\\theta$; causes angular acceleration."),
    "moment of inertia": g("Rotational 'mass' — resistance to angular acceleration.", "$I$ depends on mass distribution."),
    "rotational Newton's law": g("Torque equals $I$ times angular acceleration.", "$\\tau=I\\alpha$."),
    "rotational kinetic energy": g("Energy of spinning.", "$KE=\\tfrac12I\\omega^2$."),
    "angular momentum": g("Rotational momentum.", "$L=I\\omega$; conserved with no external torque."),
    "rolling": g("Combined translation and rotation.", "$v=r\\omega$ for rolling without slipping.")
  },
  concepts: [
    cn(1, "Rotational kinematics", "Angular quantities mirror linear ones: $\\omega=d\\theta/dt$, $\\alpha=d\\omega/dt$, with the same constant-$\\alpha$ equations. Link to linear motion by $v=r\\omega$, $a=r\\alpha$.", ["Use $\\theta,\\omega,\\alpha$ like $x,v,a$.", "Apply the rotational kinematic equations.", "Convert with $v=r\\omega$ when needed."]),
    cn(2, "Torque", "Torque $\\tau=rF\\sin\\theta$ measures a force's turning effect — larger with more force, a longer lever arm, or a perpendicular push.", ["Find the force and its distance from the axis.", "$\\tau=rF\\sin\\theta$.", "Maximum when the force is perpendicular."]),
    cn(3, "Moment of inertia and $\\tau=I\\alpha$", "Moment of inertia $I$ plays the role of mass in rotation, depending on how mass is distributed. Newton's second law becomes $\\tau=I\\alpha$.", ["Determine $I$ for the shape.", "Sum torques.", "Set $\\sum\\tau=I\\alpha$ and solve."]),
    cn(4, "Rotational energy", "A spinning body has $KE=\\tfrac12I\\omega^2$. A rolling object has both translational and rotational kinetic energy.", ["Compute $\\tfrac12I\\omega^2$.", "For rolling, add $\\tfrac12mv^2$.", "Use $v=r\\omega$ to combine."]),
    cn(5, "Conservation of angular momentum", "With no external torque, $L=I\\omega$ is constant. Reducing $I$ (pulling mass inward) speeds up rotation — the skater effect.", ["Set $I_i\\omega_i=I_f\\omega_f$.", "Decrease $I$ ⇒ increase $\\omega$.", "Solve for the new spin rate."])
  ],
  examples: [
    ex("A figure skater's spin", "A skater pulls in their arms and spins faster.", "Angular momentum $I\\omega$ is conserved, so smaller $I$ means larger $\\omega$."),
    ex("Opening a door", "You push far from the hinges.", "A larger lever arm gives more torque for the same force."),
    ex("A rolling ball down a ramp", "A ball rolls without slipping.", "Its energy splits between translation and rotation, so it's slower than a sliding block.")
  ],
  videos: vids("rotational motion torque moment of inertia angular", "angular momentum conservation rotational energy examples", "physics 1 rotation torque worked problems"),
  problems: [
    pr("p01","easy","A wheel spins at $10$ rad/s, radius $0.5$ m. Find the rim speed.","$5$ m/s",["$v=r\\omega$.","$=0.5(10)$.","$5$ m/s."],"$v=r\\omega$."),
    pr("p02","easy","A $20$ N force acts $0.3$ m from an axis, perpendicular. Find the torque.","$6$ N·m",["$\\tau=rF$.","$=0.3(20)$.","$6$ N·m."],"$\\tau=rF\\sin90^\\circ$."),
    pr("p03","medium","A torque of $12$ N·m acts on $I=4$ kg·m². Find the angular acceleration.","$3$ rad/s²",["$\\alpha=\\tau/I$.","$=12/4$.","$3$ rad/s²."],"$\\tau=I\\alpha$."),
    pr("p04","medium","Find the rotational KE of $I=2$ kg·m² spinning at $5$ rad/s.","$25$ J",["$KE=\\tfrac12I\\omega^2$.","$=\\tfrac12(2)(25)$.","$25$ J."],"$\\tfrac12I\\omega^2$."),
    pr("p05","medium","A $30$ N force acts $0.4$ m from an axis at $30^\\circ$. Find the torque.","$6$ N·m",["$\\tau=rF\\sin\\theta$.","$=0.4(30)(0.5)$.","$6$ N·m."],"Include $\\sin\\theta$."),
    pr("p06","hard","A skater with $I=4$ kg·m² at $2$ rad/s pulls in to $I=1$ kg·m². Find the new $\\omega$.","$8$ rad/s",["$I_i\\omega_i=I_f\\omega_f$: $4(2)=1\\omega$.","$\\omega=8$.","$8$ rad/s."],"Conserve $L=I\\omega$."),
    pr("p07","hard","A wheel accelerates from rest at $2$ rad/s² for $3$ s. Find its final angular velocity and angle turned.","$6$ rad/s, $9$ rad",["$\\omega=\\alpha t=6$; $\\theta=\\tfrac12\\alpha t^2=9$.","Done.","$6$ rad/s, $9$ rad."],"Rotational kinematics.")
  ] },

{ id: "phys1441-10-equilibrium", title: "Static Equilibrium & Elasticity", chapter: "Vol. 1, Ch. 12", problems: [32,42,69,70],
  summary: "An object is in static equilibrium when both net force and net torque are zero. Solving requires choosing a pivot to eliminate unknowns. Materials deform under stress; within the elastic limit, strain is proportional to stress (Hooke's law for solids).",
  glossary: {
    "static equilibrium": g("At rest with no net force and no net torque.", "$\\sum F=0$ and $\\sum\\tau=0$."),
    "pivot choice": g("Picking an axis to zero out an unknown force's torque.", "Choose where an unknown acts."),
    "center of gravity": g("Where weight effectively acts.", "Used to compute the weight's torque."),
    "stress": g("Force per unit area on a material.", "$\\sigma=F/A$, in pascals."),
    "strain": g("Fractional deformation.", "$\\varepsilon=\\Delta L/L$; dimensionless."),
    "Young's modulus": g("Stiffness of a material.", "$Y=\\text{stress}/\\text{strain}$."),
    "elastic limit": g("Beyond it, deformation is permanent.", "Hooke's law holds only below it."),
    "torque balance": g("Clockwise torques equal counterclockwise.", "$\\sum\\tau=0$ about any pivot.")
  },
  concepts: [
    cn(1, "Conditions for equilibrium", "Two conditions must hold: the net force is zero (no translation) and the net torque is zero (no rotation). Both give equations to solve.", ["Set $\\sum F_x=0$ and $\\sum F_y=0$.", "Set $\\sum\\tau=0$.", "Solve the system for the unknowns."]),
    cn(2, "Choosing a pivot", "Torque depends on the chosen axis, so pick the pivot at an unknown force to eliminate its torque and simplify the equations.", ["Locate an unknown force.", "Take torques about that point.", "Its torque drops out of $\\sum\\tau=0$."]),
    cn(3, "Center of gravity", "An extended object's weight acts at its center of gravity. Use that point when computing the weight's torque.", ["Find the center of gravity.", "Weight acts there.", "Include its torque about the pivot."]),
    cn(4, "Stress and strain", "Stress is force per area, strain is fractional length change, and within the elastic limit they're proportional: $\\sigma=Y\\varepsilon$.", ["Stress $=F/A$.", "Strain $=\\Delta L/L$.", "Relate them with Young's modulus $Y$."]),
    cn(5, "Elasticity limits", "Materials behave elastically (returning to shape) only up to the elastic limit; beyond it they deform permanently and eventually fracture.", ["Stay below the elastic limit for Hooke's law.", "Beyond it, deformation is permanent.", "Further stress leads to fracture."])
  ],
  examples: [
    ex("A ladder against a wall", "A ladder leans without slipping.", "Force and torque balance (with friction at the base) keep it in equilibrium."),
    ex("A cantilever beam", "A balcony juts from a wall.", "Torque balance about the wall determines the support forces."),
    ex("Stretching a steel cable", "A cable elongates under load.", "Stress and Young's modulus predict the stretch $\\Delta L$.")
  ],
  videos: vids("static equilibrium torque force balance physics", "stress strain youngs modulus examples", "physics 1 equilibrium elasticity worked problems"),
  problems: [
    pr("p01","easy","A uniform $4$ m beam weighs $200$ N. Find the torque of its weight about one end.","$400$ N·m",["Weight acts at center ($2$ m).","$\\tau=2(200)$.","$400$ N·m."],"Center of gravity at the middle."),
    pr("p02","easy","Two children balance a seesaw: $30$ kg at $2$ m. Find the torque about the pivot.","$\\approx588$ N·m",["$\\tau=r(mg)=2(30)(9.8)$.","$=588$.","N·m."],"$\\tau=r\\,mg$."),
    pr("p03","medium","A $50$ N weight sits $1$ m left of a pivot. What weight $3$ m right balances it?","$\\approx16.7$ N",["$50(1)=W(3)$.","$W=50/3$.","$16.7$ N."],"Set the two torques equal."),
    pr("p04","medium","A wire has $\\sigma=F/A$ with $F=100$ N, $A=2\\times10^{-6}$ m². Find the stress.","$5\\times10^{7}$ Pa",["$\\sigma=F/A$.","$=100/(2\\times10^{-6})$.","$5\\times10^7$ Pa."],"$\\sigma=F/A$."),
    pr("p05","medium","A $2$ m rod stretches $0.001$ m. Find the strain.","$5\\times10^{-4}$",["$\\varepsilon=\\Delta L/L$.","$=0.001/2$.","$5\\times10^{-4}$."],"$\\varepsilon=\\Delta L/L$."),
    pr("p06","hard","A uniform $6$ m beam ($100$ N) rests on two supports at the ends, with a $200$ N load $2$ m from the left. Find the left support force.","$\\approx183$ N",["Torque about right end: $F_L(6)=100(3)+200(4)$.","$F_L=1100/6$.","$\\approx183$ N."],"Take torques about the right support.")
  ] },

{ id: "phys1441-11-fluids", title: "Fluid Mechanics", chapter: "Vol. 1, Ch. 14", problems: [45,50,65,68,77,86,89,105],
  summary: "Fluids exert pressure that increases with depth ($P=P_0+\\rho gh$). Buoyancy (Archimedes) lifts submerged objects by the weight of displaced fluid. Flowing fluids obey continuity ($Av$ constant) and Bernoulli's equation relating pressure, speed, and height.",
  glossary: {
    "pressure": g("Force per unit area in a fluid.", "$P=F/A$, in pascals; acts in all directions."),
    "density": g("Mass per unit volume.", "$\\rho=m/V$."),
    "pressure with depth": g("Pressure rises with depth in a fluid.", "$P=P_0+\\rho gh$."),
    "buoyant force": g("Upward force on a submerged object.", "Equals the weight of displaced fluid (Archimedes)."),
    "Archimedes' principle": g("Buoyancy equals displaced fluid weight.", "$F_b=\\rho_{fluid}Vg$."),
    "continuity equation": g("Flow rate is constant along a pipe.", "$A_1v_1=A_2v_2$."),
    "Bernoulli's equation": g("Energy conservation for flowing fluids.", "$P+\\tfrac12\\rho v^2+\\rho gh=\\text{constant}$."),
    "Pascal's principle": g("Pressure applied to a fluid transmits undiminished.", "Basis of hydraulic lifts.")
  },
  concepts: [
    cn(1, "Pressure and depth", "Pressure in a static fluid increases with depth: $P=P_0+\\rho gh$. It acts equally in all directions at a point.", ["Start from surface pressure $P_0$.", "Add $\\rho gh$ for depth $h$.", "Pressure is the same at equal depths."]),
    cn(2, "Buoyancy", "A submerged object feels an upward buoyant force equal to the weight of the fluid it displaces: $F_b=\\rho_{fluid}Vg$. It floats if $F_b\\ge$ weight.", ["Find the displaced volume $V$.", "$F_b=\\rho_{fluid}Vg$.", "Compare to the object's weight."]),
    cn(3, "Pascal's principle and hydraulics", "Pressure applied to an enclosed fluid transmits equally everywhere, so a small force on a small piston lifts a large load on a big piston: $F_1/A_1=F_2/A_2$.", ["Equal pressure on both pistons.", "$F_1/A_1=F_2/A_2$.", "Larger area ⇒ larger force."]),
    cn(4, "Continuity", "For incompressible flow, what enters must exit: $A_1v_1=A_2v_2$. A narrower pipe means faster flow.", ["Flow rate $Av$ is constant.", "Smaller area ⇒ higher speed.", "Solve $A_1v_1=A_2v_2$."]),
    cn(5, "Bernoulli's equation", "Along a streamline, $P+\\tfrac12\\rho v^2+\\rho gh$ is constant — faster flow means lower pressure. It explains lift and flow through pipes.", ["Write Bernoulli at two points.", "Higher speed ⇒ lower pressure.", "Solve for the unknown $P$, $v$, or $h$."])
  ],
  examples: [
    ex("Why ships float", "A steel ship floats though steel sinks.", "Its shape displaces enough water that buoyancy equals the ship's weight."),
    ex("A hydraulic car lift", "A small pump raises a heavy car.", "Pascal's principle multiplies force by the piston-area ratio."),
    ex("Airplane lift / a shower curtain", "Fast air lowers pressure.", "Bernoulli's equation links higher speed to lower pressure, creating lift or suction.")
  ],
  videos: vids("fluid pressure depth buoyancy archimedes principle", "continuity bernoulli equation flow examples", "physics 1 fluids worked problems"),
  problems: [
    pr("p01","easy","Find the pressure $10$ m deep in water ($\\rho=1000$, ignore atmosphere).","$\\approx9.8\\times10^{4}$ Pa",["$P=\\rho gh$.","$=1000(9.8)(10)$.","$9.8\\times10^4$ Pa."],"$P=\\rho gh$."),
    pr("p02","easy","Find the density of a $6$ kg object of volume $0.002$ m³.","$3000$ kg/m³",["$\\rho=m/V$.","$=6/0.002$.","$3000$ kg/m³."],"$\\rho=m/V$."),
    pr("p03","medium","An object displaces $0.01$ m³ of water. Find the buoyant force.","$\\approx98$ N",["$F_b=\\rho Vg$.","$=1000(0.01)(9.8)$.","$98$ N."],"$F_b=\\rho_{fluid}Vg$."),
    pr("p04","medium","Water flows at $2$ m/s in a pipe of area $0.1$ m². Find the speed where the area is $0.05$ m².","$4$ m/s",["$A_1v_1=A_2v_2$.","$0.1(2)=0.05v$.","$v=4$ m/s."],"Continuity: $Av$ constant."),
    pr("p05","medium","A hydraulic lift: $F_1=100$ N on $A_1=0.01$ m². Find the lift force on $A_2=0.5$ m².","$5000$ N",["$F_2=F_1 A_2/A_1$.","$=100(0.5/0.01)$.","$5000$ N."],"$F_1/A_1=F_2/A_2$."),
    pr("p06","hard","Find the total pressure $5$ m deep in water (add atmosphere $1.0\\times10^5$ Pa).","$\\approx1.49\\times10^{5}$ Pa",["$P=P_0+\\rho gh=10^5+1000(9.8)(5)$.","$=10^5+4.9\\times10^4$.","$\\approx1.49\\times10^5$ Pa."],"Add atmospheric pressure."),
    pr("p07","hard","A block of density $600$ kg/m³ floats in water. What fraction is submerged?","$0.6$",["Fraction $=\\rho_{obj}/\\rho_{water}$.","$=600/1000$.","$0.6$."],"Float fraction is the density ratio.")
  ] },

{ id: "phys1441-12-oscillations", title: "Oscillations", chapter: "Vol. 1, Ch. 15", problems: [22,25,28,30,32,35,42,45],
  summary: "Simple harmonic motion arises from a restoring force proportional to displacement ($F=-kx$). Its motion is sinusoidal with period $T=2\\pi\\sqrt{m/k}$ (spring) or $2\\pi\\sqrt{L/g}$ (pendulum). Energy trades between kinetic and elastic potential.",
  glossary: {
    "simple harmonic motion": g("Oscillation with a linear restoring force.", "$F=-kx$; sinusoidal in time."),
    "restoring force": g("A force pulling back toward equilibrium.", "Proportional to displacement in SHM."),
    "period": g("Time for one full cycle.", "$T$; spring $2\\pi\\sqrt{m/k}$, pendulum $2\\pi\\sqrt{L/g}$."),
    "frequency": g("Cycles per second.", "$f=1/T$, in hertz."),
    "amplitude": g("Maximum displacement from equilibrium.", "Sets the energy $\\tfrac12kA^2$."),
    "angular frequency": g("$\\omega=2\\pi f=\\sqrt{k/m}$.", "Appears in $x(t)=A\\cos(\\omega t)$."),
    "spring constant": g("Stiffness of a spring.", "$k$; larger $k$ ⇒ faster oscillation."),
    "SHM energy": g("Trades between kinetic and elastic PE.", "Total $\\tfrac12kA^2$ is constant.")
  },
  concepts: [
    cn(1, "The restoring force", "SHM occurs when the restoring force is proportional to displacement: $F=-kx$. The minus sign means it always points back toward equilibrium.", ["Check the force is $\\propto-x$.", "That guarantees SHM.", "Identify the effective $k$."]),
    cn(2, "Period and frequency", "For a mass–spring, $T=2\\pi\\sqrt{m/k}$; for a small-angle pendulum, $T=2\\pi\\sqrt{L/g}$. Frequency is $f=1/T$.", ["Pick the right formula.", "Plug in $m,k$ or $L,g$.", "Frequency $=1/T$."]),
    cn(3, "The motion in time", "Displacement follows $x(t)=A\\cos(\\omega t+\\phi)$ with $\\omega=\\sqrt{k/m}$. Velocity and acceleration are its derivatives, peaking a quarter cycle apart.", ["Write $x(t)=A\\cos(\\omega t)$.", "Differentiate for $v$ and $a$.", "Max speed at equilibrium, max $|a|$ at the ends."]),
    cn(4, "Energy in SHM", "Total energy $\\tfrac12kA^2$ trades between kinetic and elastic potential. At the extremes it's all potential; at equilibrium all kinetic.", ["Total energy $=\\tfrac12kA^2$.", "At $x=A$: all PE; at $x=0$: all KE.", "Max speed $v_{max}=\\omega A$."]),
    cn(5, "The pendulum", "A pendulum approximates SHM for small angles, with period depending only on length and gravity — not on mass or amplitude.", ["Assume a small angle.", "$T=2\\pi\\sqrt{L/g}$.", "Independent of mass and amplitude."])
  ],
  examples: [
    ex("A grandfather clock", "A pendulum keeps time.", "Its period $2\\pi\\sqrt{L/g}$ depends only on length, so the clock is set by adjusting $L$."),
    ex("Car suspension", "Springs absorb bumps.", "The suspension is a mass–spring oscillator; damping stops it from bouncing forever."),
    ex("A vibrating guitar string", "A plucked string oscillates.", "It undergoes harmonic motion whose frequency sets the pitch.")
  ],
  videos: vids("simple harmonic motion restoring force period frequency", "spring pendulum period energy SHM examples", "physics 1 oscillations SHM worked problems"),
  problems: [
    pr("p01","easy","A spring has $k=200$ N/m and mass $0.5$ kg. Find the period.","$\\approx0.314$ s",["$T=2\\pi\\sqrt{m/k}$.","$=2\\pi\\sqrt{0.5/200}$.","$\\approx0.314$ s."],"$T=2\\pi\\sqrt{m/k}$."),
    pr("p02","easy","A pendulum is $1$ m long. Find its period.","$\\approx2.01$ s",["$T=2\\pi\\sqrt{L/g}$.","$=2\\pi\\sqrt{1/9.8}$.","$\\approx2.01$ s."],"$T=2\\pi\\sqrt{L/g}$."),
    pr("p03","medium","A spring–mass system has $T=0.5$ s. Find the frequency.","$2$ Hz",["$f=1/T$.","$=1/0.5$.","$2$ Hz."],"$f=1/T$."),
    pr("p04","medium","Find the angular frequency for $k=100$ N/m, $m=4$ kg.","$5$ rad/s",["$\\omega=\\sqrt{k/m}$.","$=\\sqrt{100/4}$.","$5$ rad/s."],"$\\omega=\\sqrt{k/m}$."),
    pr("p05","medium","A $0.2$ kg mass on a spring ($k=50$) has amplitude $0.1$ m. Find the total energy.","$0.25$ J",["$E=\\tfrac12kA^2$.","$=\\tfrac12(50)(0.01)$.","$0.25$ J."],"$\\tfrac12kA^2$."),
    pr("p06","hard","For the previous system, find the maximum speed.","$\\approx1.58$ m/s",["$\\omega=\\sqrt{50/0.2}=15.8$; $v_{max}=\\omega A$.","$=15.8(0.1)$.","$\\approx1.58$ m/s."],"$v_{max}=\\omega A$."),
    pr("p07","hard","How does the pendulum period change if length is quadrupled?","Doubles",["$T\\propto\\sqrt L$.","$\\sqrt4=2$.","Period doubles."],"$T\\propto\\sqrt{L}$.")
  ] },

{ id: "phys1441-13-temperature-heat", title: "Temperature, Heat & Kinetic Theory", chapter: "Vol. 2, Ch. 1 & 2", problems: [44,53,62,69,20,27,46],
  summary: "Temperature measures average molecular kinetic energy. Heat $Q$ flows between objects at different temperatures; $Q=mc\\Delta T$ raises temperature and $Q=mL$ drives phase changes. The ideal gas law $PV=nRT$ links pressure, volume, and temperature.",
  glossary: {
    "temperature": g("A measure of average molecular kinetic energy.", "In kelvin for gas-law calculations."),
    "heat": g("Energy transferred due to a temperature difference.", "$Q$, in joules; flows hot → cold."),
    "specific heat": g("Heat to raise 1 kg by 1 K.", "$Q=mc\\Delta T$."),
    "latent heat": g("Heat for a phase change at constant temperature.", "$Q=mL$ (fusion or vaporization)."),
    "thermal expansion": g("Materials grow with temperature.", "$\\Delta L=\\alpha L\\Delta T$."),
    "ideal gas law": g("Relation among $P$, $V$, $T$ for a gas.", "$PV=nRT$."),
    "kinetic theory": g("Gas behavior from molecular motion.", "Average KE $\\propto T$."),
    "heat transfer": g("Conduction, convection, radiation.", "Three ways heat moves.")
  },
  concepts: [
    cn(1, "Temperature vs heat", "Temperature measures average molecular kinetic energy; heat is energy in transit due to a temperature difference. Heat flows from hot to cold until equilibrium.", ["Temperature ↔ molecular KE.", "Heat is transferred energy.", "Flow direction: hot → cold."]),
    cn(2, "Specific heat", "To change temperature without a phase change, $Q=mc\\Delta T$. Water's high specific heat means it resists temperature change.", ["Identify mass, specific heat, temperature change.", "$Q=mc\\Delta T$.", "Positive $Q$ warms, negative cools."]),
    cn(3, "Phase changes and latent heat", "During melting or boiling, temperature stays constant while heat $Q=mL$ is absorbed or released to change phase.", ["Use $Q=mL$ (fusion or vaporization).", "Temperature is constant during the change.", "Add $mc\\Delta T$ segments for full heating curves."]),
    cn(4, "Thermal expansion", "Most materials expand when heated: $\\Delta L=\\alpha L\\Delta T$. This is why bridges have expansion joints.", ["Find the expansion coefficient $\\alpha$.", "$\\Delta L=\\alpha L\\Delta T$.", "Areas and volumes expand accordingly."]),
    cn(5, "The ideal gas law", "For a gas, $PV=nRT$ ties pressure, volume, and absolute temperature together. Use kelvin, and hold quantities fixed to find how the others respond.", ["Convert temperatures to kelvin.", "Apply $PV=nRT$.", "For a fixed amount, $P_1V_1/T_1=P_2V_2/T_2$."])
  ],
  examples: [
    ex("Coastal climate moderation", "Coasts have milder temperatures.", "Water's large specific heat stores heat, buffering temperature swings."),
    ex("Ice cooling a drink", "Melting ice keeps a drink cold.", "Latent heat of fusion absorbs energy at constant $0^\\circ$C."),
    ex("A hot-air balloon", "Heating air makes it rise.", "The ideal gas law: heating at constant pressure lowers density, giving lift.")
  ],
  videos: vids("temperature heat specific heat latent heat kinetic theory", "specific heat phase change ideal gas law examples", "physics 1 thermal heat worked problems"),
  problems: [
    pr("p01","easy","How much heat raises $2$ kg of water ($c=4186$) by $10$ K?","$\\approx83720$ J",["$Q=mc\\Delta T$.","$=2(4186)(10)$.","$83720$ J."],"$Q=mc\\Delta T$."),
    pr("p02","easy","Convert $27^\\circ$C to kelvin.","$300$ K",["$K=C+273$.","$27+273$.","$300$ K."],"Add 273."),
    pr("p03","medium","Melt $0.5$ kg of ice ($L_f=3.34\\times10^5$ J/kg). Find the heat.","$\\approx1.67\\times10^{5}$ J",["$Q=mL$.","$=0.5(3.34\\times10^5)$.","$1.67\\times10^5$ J."],"$Q=mL$."),
    pr("p04","medium","A $2$ m steel rod ($\\alpha=1.2\\times10^{-5}$) heats by $50$ K. Find $\\Delta L$.","$1.2\\times10^{-3}$ m",["$\\Delta L=\\alpha L\\Delta T$.","$=1.2\\times10^{-5}(2)(50)$.","$1.2\\times10^{-3}$ m."],"$\\Delta L=\\alpha L\\Delta T$."),
    pr("p05","medium","A gas at $2$ atm, $300$ K is heated to $600$ K at constant volume. Find the new pressure.","$4$ atm",["$P_1/T_1=P_2/T_2$.","$2/300=P/600$.","$4$ atm."],"Constant $V$: $P\\propto T$."),
    pr("p06","hard","Find the temperature of $1$ mol of gas at $P=1.0\\times10^5$ Pa, $V=0.025$ m³ ($R=8.31$).","$\\approx301$ K",["$T=PV/(nR)$.","$=10^5(0.025)/8.31$.","$\\approx301$ K."],"$PV=nRT$."),
    pr("p07","hard","How much heat warms $0.5$ kg of water from $20^\\circ$C to $100^\\circ$C, then boils it all ($L_v=2.26\\times10^6$)? ($c=4186$)","$\\approx1.30\\times10^{6}$ J",["Heat: $0.5(4186)(80)=1.67\\times10^5$ J.","Boil: $0.5(2.26\\times10^6)=1.13\\times10^6$ J.","Total $\\approx1.30\\times10^6$ J."],"Add $mc\\Delta T$ then $mL_v$.")
  ] },

{ id: "phys1441-14-thermodynamics", title: "The Laws of Thermodynamics", chapter: "Vol. 2, Ch. 3 & 4", problems: [22,23,26,28,23,24,26,44],
  summary: "The first law is energy conservation for heat and work: $\\Delta U=Q-W$. The second law says heat flows spontaneously hot → cold and no engine is perfectly efficient. Engine efficiency is bounded by the Carnot limit $1-T_c/T_h$.",
  glossary: {
    "internal energy": g("Total microscopic energy of a system.", "Changes via heat and work: $\\Delta U=Q-W$."),
    "first law": g("Energy conservation with heat and work.", "$\\Delta U=Q-W$."),
    "work by a gas": g("Work done as a gas expands.", "$W=\\int P\\,dV$; area under the $P$-$V$ curve."),
    "second law": g("Heat won't flow cold → hot on its own; entropy tends to increase.", "Limits engine efficiency."),
    "heat engine": g("A device converting heat to work.", "Efficiency $e=W/Q_h$."),
    "efficiency": g("Fraction of heat turned into work.", "$e=W/Q_h=1-Q_c/Q_h$."),
    "Carnot efficiency": g("The maximum possible efficiency.", "$e_{max}=1-T_c/T_h$ (kelvin)."),
    "entropy": g("A measure of disorder.", "Increases for spontaneous processes.")
  },
  concepts: [
    cn(1, "The first law", "Energy is conserved: the change in internal energy equals heat added minus work done by the system, $\\Delta U=Q-W$. Track signs carefully.", ["Identify heat in $Q$ and work out $W$.", "$\\Delta U=Q-W$.", "Positive $Q$ adds energy; positive $W$ removes it."]),
    cn(2, "Work in thermodynamic processes", "A gas does work $W=\\int P\\,dV$ as it expands — the area under the $P$–$V$ curve. Constant-pressure work is $W=P\\Delta V$.", ["Sketch the $P$–$V$ path.", "Work is the area under it.", "Constant $P$: $W=P\\Delta V$."]),
    cn(3, "The second law", "Heat flows spontaneously from hot to cold, never the reverse without work, and entropy tends to increase. No process can convert heat entirely into work.", ["Heat flows hot → cold naturally.", "Entropy of an isolated system increases.", "No 100%-efficient engine exists."]),
    cn(4, "Heat engines and efficiency", "An engine takes in $Q_h$, does work $W$, and dumps $Q_c$: efficiency $e=W/Q_h=1-Q_c/Q_h$. Real engines are well below the ideal.", ["Find $Q_h$, $Q_c$, and $W=Q_h-Q_c$.", "$e=W/Q_h$.", "Compare to the Carnot limit."]),
    cn(5, "The Carnot limit", "The maximum efficiency between reservoirs at $T_h$ and $T_c$ (kelvin) is $e_{max}=1-T_c/T_h$. No engine can beat it.", ["Use absolute temperatures.", "$e_{max}=1-T_c/T_h$.", "Real efficiency is always lower."])
  ],
  examples: [
    ex("A car engine", "Fuel burns to drive the car.", "Only a fraction of the heat becomes work; the Carnot limit caps how good it can be."),
    ex("A refrigerator", "Heat is moved from cold to hot.", "This requires work input — the second law forbids it happening for free."),
    ex("Steam power plants", "High-temperature steam drives turbines.", "Higher $T_h$ raises the Carnot efficiency, so plants run as hot as materials allow.")
  ],
  videos: vids("first law thermodynamics internal energy heat work", "heat engine efficiency carnot second law examples", "physics 1 thermodynamics worked problems"),
  problems: [
    pr("p01","easy","A gas absorbs $500$ J of heat and does $200$ J of work. Find $\\Delta U$.","$300$ J",["$\\Delta U=Q-W$.","$=500-200$.","$300$ J."],"$\\Delta U=Q-W$."),
    pr("p02","easy","A gas expands at constant $P=2\\times10^5$ Pa by $\\Delta V=0.001$ m³. Find the work.","$200$ J",["$W=P\\Delta V$.","$=2\\times10^5(0.001)$.","$200$ J."],"$W=P\\Delta V$."),
    pr("p03","medium","An engine takes $1000$ J and exhausts $600$ J. Find its efficiency.","$0.4$ (40%)",["$e=1-Q_c/Q_h$.","$=1-600/1000$.","$0.4$."],"$e=1-Q_c/Q_h$."),
    pr("p04","medium","Find the Carnot efficiency between $600$ K and $300$ K.","$0.5$ (50%)",["$e=1-T_c/T_h$.","$=1-300/600$.","$0.5$."],"Use kelvin."),
    pr("p05","medium","An engine does $400$ J of work per cycle taking in $1000$ J. Find the heat exhausted.","$600$ J",["$Q_c=Q_h-W$.","$=1000-400$.","$600$ J."],"$Q_c=Q_h-W$."),
    pr("p06","hard","A gas releases $300$ J of heat while $150$ J of work is done on it. Find $\\Delta U$.","$-150$ J",["$Q=-300$, $W=-150$ (on the gas).","$\\Delta U=Q-W=-300-(-150)$.","$-150$ J."],"Mind the signs of $Q$ and $W$."),
    pr("p07","hard","A real engine between $500$ K and $300$ K has efficiency $0.25$. What fraction of the Carnot limit is that?","$\\approx0.625$",["Carnot $=1-300/500=0.4$.","Ratio $=0.25/0.4$.","$\\approx0.625$."],"Compare to $e_{max}=1-T_c/T_h$.")
  ] }
];

function writeLessons(list) {
  for (const L of list) {
    const doc = { title: L.title, summary: L.summary, glossary: L.glossary, concept_sections: L.concepts, real_world_examples: L.examples, videos: L.videos, problems: L.problems };
    fs.writeFileSync(path.join(LDIR, L.id + ".json"), JSON.stringify(doc, null, 2) + "\n");
  }
}
module.exports = { LESSONS, writeLessons };
if (require.main === module) { writeLessons(LESSONS); console.log("wrote " + LESSONS.length + " phys1441 lessons"); }
