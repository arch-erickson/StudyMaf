#!/usr/bin/env node
/* Seed Physics I — Algebra Based (PHYS 1433): 14 lesson JSONs at full PHYS-1442
 * depth. Source: CityTech PHYS 1433 syllabus + OpenStax College Physics 2e.
 * Algebra-based framing (kinematic equations, no calculus derivations).
 * Diagrams added by tools/build-sci-diagrams.js. Run: node tools/seed-phys1433.js */
"use strict";
const fs = require("fs"), path = require("path");
const LDIR = path.resolve(__dirname, "..", "data", "lessons");
const g = (plain, in_class) => ({ plain, in_class });
const cn = (level, heading, explanation, math_steps) => ({ level, heading, explanation, math_steps });
const ex = (title, scenario, how_the_math_applies) => ({ title, scenario, how_the_math_applies });
const pr = (id, difficulty, prompt, correct_answer, solution_steps, hint) => ({ id, difficulty, prompt, correct_answer, solution_steps, hint });
const vids = (a, b, c) => ({ concept_query: a, math_query: b, combined_query: c });

const LESSONS = [
{ id: "phys1433-01-units", title: "Units, Measurement & Problem-Solving", chapter: "Ch. 1", problems: [1,12,17,29,33,40],
  summary: "Physics uses SI units and a consistent problem-solving method: list knowns, choose the right equation, check units, and evaluate with sensible significant figures. Unit conversion and order-of-magnitude estimation keep answers grounded.",
  glossary: {
    "SI units": g("Standard metric units of measurement.", "meter, kilogram, second, and derived N, J, W."),
    "unit conversion": g("Rewriting a value in other units.", "Multiply by ratios equal to 1 so units cancel."),
    "significant figures": g("The reliable digits of a measurement.", "The result can't be more precise than its inputs."),
    "dimensional analysis": g("Checking equations by their units.", "Both sides must share the same units."),
    "order of magnitude": g("The nearest power of ten.", "For fast estimates and reality checks."),
    "scientific notation": g("Numbers as $c\\times10^n$.", "Handles very large or small values."),
    "problem-solving strategy": g("A systematic approach to physics problems.", "Knowns → equation → solve → check units."),
    "accuracy vs precision": g("Correctness vs repeatability.", "Accurate ≈ true; precise ≈ consistent.")
  },
  concepts: [
    cn(1, "SI units", "Mechanical quantities build from meter, kilogram, and second; derived units like the newton ($\\text{kg·m/s}^2$) and joule ($\\text{N·m}$) combine them.", ["Identify the base units.", "Combine per the definition.", "Name the derived unit."]),
    cn(2, "Unit conversion", "Convert by multiplying by ratios equal to 1, arranged so unwanted units cancel and the target unit remains.", ["Write the starting value.", "Multiply by cancelling ratios.", "Simplify to the desired unit."]),
    cn(3, "Significant figures", "Report only the digits your data support: multiplication/division keeps the fewest significant figures, addition keeps the fewest decimal places.", ["Count sig figs in each input.", "×/÷ → fewest sig figs.", "+/− → fewest decimals."]),
    cn(4, "Dimensional checks", "A correct equation is dimensionally consistent — every term has the same units. A mismatch signals an error before you even plug in numbers.", ["List the units of each term.", "Require them to match.", "Fix the equation if they don't."]),
    cn(5, "Estimation and strategy", "Approach every problem the same way: identify knowns and the unknown, pick an equation, solve symbolically, then evaluate — and use order-of-magnitude estimates to sanity-check.", ["List knowns and the unknown.", "Choose and solve the equation.", "Check units and magnitude."])
  ],
  examples: [
    ex("Speed limit conversion", "A sign reads 100 km/h; you think in mph.", "Unit conversion turns km/h into mph using cancelling ratios."),
    ex("Checking an answer's size", "You compute a person's mass as 5000 kg.", "An order-of-magnitude check flags it as unreasonable — a units or arithmetic slip."),
    ex("Lab measurement precision", "A ruler reads to the millimeter.", "Significant-figure rules keep the reported result honest about its precision.")
  ],
  videos: vids("SI units measurement significant figures physics", "unit conversion dimensional analysis estimation examples", "physics 1 algebra measurement units worked problems"),
  problems: [
    pr("p01","easy","Convert $90$ km/h to m/s.","$25$ m/s",["Divide by $3.6$.","$90/3.6$.","$25$ m/s."],"km/h ÷ 3.6 = m/s."),
    pr("p02","easy","How many significant figures in $3.020$?","$4$",["All shown digits count here.","$3,0,2,0$.","$4$."],"Trailing zero after a decimal counts."),
    pr("p03","easy","What SI unit is energy measured in?","Joule (J)",["$J=N\\cdot m$.","Work/energy unit.","Joule."],"Energy = force × distance."),
    pr("p04","medium","Convert $2.5$ hours to seconds.","$9000$ s",["$2.5\\times3600$.","$=9000$.","s."],"1 h = 3600 s."),
    pr("p05","medium","A field is $50.0$ m by $30$ m. Area with correct sig figs?","$1500$ m² (2 sf)",["$50.0\\times30=1500$.","Fewest sig figs is 2.","$1.5\\times10^3$ m²."],"×/÷ keeps fewest sig figs."),
    pr("p06","medium","Estimate the order of magnitude of a person's height in meters.","$10^0$",["$\\sim1.7$ m.","Nearest power of ten.","$10^0$."],"About 1 meter."),
    pr("p07","hard","Convert $60$ mph to m/s ($1$ mi $=1609$ m).","$\\approx26.8$ m/s",["$60\\times1609/3600$.","$=96540/3600$.","$\\approx26.8$ m/s."],"Convert miles to m, hours to s.")
  ] },

{ id: "phys1433-02-kinematics-1d", title: "Motion Along a Straight Line", chapter: "Ch. 2", problems: [3,13,20,28,35,42],
  summary: "One-dimensional motion is described by displacement, velocity, and acceleration. The kinematic equations $v=v_0+at$, $x=x_0+v_0t+\\tfrac12at^2$, and $v^2=v_0^2+2a\\Delta x$ solve constant-acceleration problems, including free fall.",
  glossary: {
    "displacement": g("Change in position (with direction).", "$\\Delta x=x_f-x_i$."),
    "velocity": g("Displacement per unit time.", "$v=\\Delta x/\\Delta t$; a vector."),
    "acceleration": g("Change in velocity per unit time.", "$a=\\Delta v/\\Delta t$."),
    "kinematic equations": g("Constant-acceleration formulas.", "$v=v_0+at$; $x=x_0+v_0t+\\tfrac12at^2$; $v^2=v_0^2+2a\\Delta x$."),
    "free fall": g("Motion under gravity alone.", "$a=g\\approx9.8\\ \\text{m/s}^2$ downward."),
    "speed": g("Magnitude of velocity.", "Ignores direction."),
    "deceleration": g("Slowing down (acceleration opposite to motion).", "Negative acceleration relative to velocity."),
    "graphs of motion": g("Position/velocity vs time plots.", "Slopes give rates; areas give distances.")
  },
  concepts: [
    cn(1, "Position, velocity, acceleration", "Velocity is how fast position changes; acceleration is how fast velocity changes. Signs indicate direction along the line.", ["Track position along the line.", "Velocity $=\\Delta x/\\Delta t$.", "Acceleration $=\\Delta v/\\Delta t$."]),
    cn(2, "The kinematic equations", "For constant acceleration, three equations connect $x,v,a,t$. Choose the one that omits the quantity you neither know nor want.", ["List knowns and the unknown.", "Pick the equation missing the unwanted variable.", "Solve."]),
    cn(3, "Free fall", "Ignoring air resistance, all objects fall with $a=g\\approx9.8\\ \\text{m/s}^2$. Apply the kinematic equations with that acceleration.", ["Set $a=g$ (downward positive or negative by choice).", "Apply the kinematic equations.", "Velocity is zero at the top of a rise."]),
    cn(4, "Graphs of motion", "The slope of a position–time graph is velocity; the slope of a velocity–time graph is acceleration; the area under a velocity–time graph is displacement.", ["Slope of $x$-$t$ = velocity.", "Slope of $v$-$t$ = acceleration.", "Area under $v$-$t$ = displacement."]),
    cn(5, "Average vs instantaneous", "Average velocity uses total displacement over total time; instantaneous velocity is the value at a single instant. They match only for constant velocity.", ["Average $=\\Delta x/\\Delta t$ over the trip.", "Instantaneous is at one moment.", "Equal only when velocity is constant."])
  ],
  examples: [
    ex("Reaction and braking distance", "A driver reacts, then brakes.", "Kinematics finds reaction distance (constant speed) plus braking distance ($v^2=v_0^2+2a\\Delta x$)."),
    ex("Dropping keys from a window", "Keys fall to a friend below.", "Free-fall equations give the fall time and catch speed."),
    ex("A drag race", "A car accelerates down a strip.", "$x=\\tfrac12at^2$ relates the run to the acceleration and time.")
  ],
  videos: vids("one dimensional motion kinematic equations algebra", "kinematics constant acceleration free fall examples", "physics 1 straight line motion worked problems"),
  problems: [
    pr("p01","easy","A car speeds from $10$ to $30$ m/s in $5$ s. Find the acceleration.","$4$ m/s²",["$a=\\Delta v/\\Delta t$.","$=(30-10)/5$.","$4$ m/s²."],"$a=\\Delta v/\\Delta t$."),
    pr("p02","easy","A rock falls from rest for $3$ s. Find its speed.","$\\approx29.4$ m/s",["$v=gt$.","$=9.8(3)$.","$29.4$ m/s."],"$v=gt$."),
    pr("p03","medium","A car at $25$ m/s decelerates at $5$ m/s². How far to stop?","$62.5$ m",["$0=v_0^2+2a\\Delta x$: $0=625-10\\Delta x$.","$\\Delta x=62.5$.","m."],"$v^2=v_0^2+2a\\Delta x$."),
    pr("p04","medium","A ball is thrown up at $12$ m/s. Find the max height.","$\\approx7.35$ m",["$0=v_0^2-2gh$.","$h=144/19.6$.","$7.35$ m."],"$v=0$ at the top."),
    pr("p05","medium","From rest at $3$ m/s², how far in $4$ s?","$24$ m",["$x=\\tfrac12 at^2$.","$=\\tfrac12(3)(16)$.","$24$ m."],"$x=\\tfrac12 at^2$."),
    pr("p06","hard","A car travels $100$ m while speeding from $10$ to $30$ m/s. Find its acceleration.","$4$ m/s²",["$v^2=v_0^2+2a\\Delta x$: $900=100+200a$.","$a=800/200$.","$4$ m/s²."],"Solve $v^2=v_0^2+2a\\Delta x$ for $a$."),
    pr("p07","hard","A ball thrown up at $20$ m/s — total time in the air (returns to start)?","$\\approx4.08$ s",["Up time $=20/9.8=2.04$ s.","Double it.","$4.08$ s."],"Symmetric up and down.")
  ] },

{ id: "phys1433-03-kinematics-2d", title: "Two-Dimensional Motion & Projectiles", chapter: "Ch. 3", problems: [8,15,22,29,36,43],
  summary: "Vectors add by components ($A_x=A\\cos\\theta$, $A_y=A\\sin\\theta$). In two dimensions, horizontal and vertical motions are independent: a projectile keeps constant horizontal velocity while undergoing vertical free fall, tracing a parabola.",
  glossary: {
    "vector": g("A quantity with magnitude and direction.", "Add by components."),
    "components": g("Projections onto the x and y axes.", "$A_x=A\\cos\\theta$, $A_y=A\\sin\\theta$."),
    "resultant": g("The vector sum.", "$\\sqrt{R_x^2+R_y^2}$ at angle $\\arctan(R_y/R_x)$."),
    "projectile": g("An object moving under gravity only.", "Horizontal constant velocity; vertical free fall."),
    "range": g("Horizontal distance traveled.", "Largest at a $45^\\circ$ launch on level ground."),
    "time of flight": g("How long a projectile is airborne.", "Set by the vertical motion."),
    "independence of motion": g("x and y motions don't interact.", "Linked only by shared time."),
    "trajectory": g("The projectile's path.", "A parabola.")
  },
  concepts: [
    cn(1, "Vectors and components", "Split each vector into $A_x=A\\cos\\theta$ and $A_y=A\\sin\\theta$; components add as plain numbers, then recombine into magnitude and direction.", ["Resolve into $x$ and $y$.", "Add components separately.", "Recombine: $\\sqrt{R_x^2+R_y^2}$, angle from $\\arctan$."]),
    cn(2, "Independence of motion", "In 2D, horizontal and vertical motions proceed independently, sharing only the clock. Solve each with 1D kinematics.", ["Separate into $x$ and $y$ motions.", "Apply kinematics to each.", "Connect through the common time."]),
    cn(3, "Projectile launch", "Resolve the launch velocity: $v_{0x}=v_0\\cos\\theta$ (constant) and $v_{0y}=v_0\\sin\\theta$ (free fall). These drive the whole trajectory.", ["Find $v_{0x}$ and $v_{0y}$.", "$x$: constant velocity; $y$: free fall.", "Combine for the path."]),
    cn(4, "Time of flight and range", "Vertical motion sets the flight time; multiplying by the constant horizontal velocity gives the range.", ["Find flight time from $y$-motion.", "Range $=v_{0x}\\times$ time.", "Max height when $v_y=0$."]),
    cn(5, "Maximum range", "On level ground, range is $R=\\dfrac{v_0^2\\sin2\\theta}{g}$, greatest at $\\theta=45^\\circ$.", ["Use $R=v_0^2\\sin2\\theta/g$.", "$\\sin2\\theta$ peaks at $45^\\circ$.", "Complementary angles give the same range."])
  ],
  examples: [
    ex("A long jump", "An athlete leaps at an angle.", "Range depends on takeoff speed and angle — near $45^\\circ$ for maximum distance."),
    ex("A thrown basketball", "A shot arcs toward the hoop.", "The parabolic path comes from horizontal constant velocity plus vertical gravity."),
    ex("A plane dropping supplies", "A package released from a moving plane.", "It keeps the plane's horizontal velocity while falling — independent motions.")
  ],
  videos: vids("vectors components projectile motion algebra", "projectile range time of flight height examples", "physics 1 two dimensional projectile worked problems"),
  problems: [
    pr("p01","easy","A $12$-unit vector points at $60^\\circ$. Find its $y$-component.","$\\approx10.4$",["$A_y=A\\sin\\theta$.","$=12\\sin60^\\circ$.","$\\approx10.4$."],"$A_y=A\\sin\\theta$."),
    pr("p02","easy","Find the magnitude of components $(6,8)$.","$10$",["$\\sqrt{36+64}$.","$=\\sqrt{100}$.","$10$."],"Pythagoras."),
    pr("p03","medium","A ball rolls off a $1.8$ m table at $2$ m/s. How long to land?","$\\approx0.606$ s",["$1.8=\\tfrac12(9.8)t^2$.","$t=\\sqrt{3.6/9.8}$.","$\\approx0.606$ s."],"Height sets the time."),
    pr("p04","medium","In the previous problem, how far from the table does it land?","$\\approx1.21$ m",["$x=v t=2(0.606)$.","$\\approx1.21$ m.","Done."],"Range = horizontal speed × time."),
    pr("p05","medium","A projectile launches at $30$ m/s, $30^\\circ$. Find $v_{0x}$.","$\\approx26$ m/s",["$v_{0x}=30\\cos30^\\circ$.","$=30(0.866)$.","$\\approx26$ m/s."],"$v_{0x}=v_0\\cos\\theta$."),
    pr("p06","hard","Find the range for a $20$ m/s launch at $45^\\circ$.","$\\approx40.8$ m",["$R=v_0^2\\sin2\\theta/g=400\\sin90^\\circ/9.8$.","$=400/9.8$.","$\\approx40.8$ m."],"$R=v_0^2\\sin2\\theta/g$."),
    pr("p07","hard","Which two launch angles give the same range?","Complementary (e.g. $30^\\circ$ & $60^\\circ$)",["$\\sin2\\theta=\\sin2(90-\\theta)$.","Complementary angles match.","$30^\\circ$ and $60^\\circ$."],"$\\theta$ and $90-\\theta$.")
  ] },

{ id: "phys1433-04-newtons-laws", title: "Newton's Laws of Motion", chapter: "Ch. 4", problems: [9,13,18,20,22,31],
  summary: "Newton's laws relate force and motion: inertia keeps velocity constant without a net force; $F_{net}=ma$; and forces occur in equal-and-opposite pairs. Free-body diagrams turn scenarios into force equations for tension, weight, and the normal force.",
  glossary: {
    "Newton's first law": g("No net force ⇒ constant velocity.", "Inertia — objects resist changes in motion."),
    "Newton's second law": g("Net force = mass × acceleration.", "$F_{net}=ma$."),
    "Newton's third law": g("Forces come in equal, opposite pairs.", "Action–reaction on different objects."),
    "free-body diagram": g("All forces on one object drawn as arrows.", "The setup for $\\sum F=ma$."),
    "weight": g("Gravitational force on a mass.", "$W=mg$."),
    "normal force": g("Perpendicular support from a surface.", "Balances the perpendicular load."),
    "tension": g("Pulling force through a rope or cable.", "Same throughout an ideal massless rope."),
    "net force": g("Vector sum of all forces.", "Sets the acceleration.")
  },
  concepts: [
    cn(1, "Inertia (first law)", "An object maintains its velocity unless a net force acts. Motion doesn't require a continuous force — only changes in motion do.", ["Check whether the net force is zero.", "If zero, velocity is constant.", "A force changes, not maintains, motion."]),
    cn(2, "F = ma (second law)", "The net force equals mass times acceleration. Solve by drawing a free-body diagram and summing forces along each axis.", ["Draw the free-body diagram.", "Sum forces per axis.", "Set $\\sum F=ma$ and solve."]),
    cn(3, "Weight and normal force", "Weight is $W=mg$, always downward. The normal force is the surface's perpendicular push, equal to the perpendicular load when there's no perpendicular acceleration.", ["Weight $=mg$ downward.", "Normal balances the perpendicular forces.", "On an incline, $N=mg\\cos\\theta$."]),
    cn(4, "Tension and connected objects", "Ropes transmit tension. For connected masses, apply $F=ma$ to each and use the shared acceleration to link them.", ["Assign a tension to each rope.", "Write $F=ma$ for each object.", "Solve using the common acceleration."]),
    cn(5, "Action–reaction (third law)", "Every force has an equal, opposite partner acting on the other object. Because they act on different bodies, they never cancel on a single object.", ["Identify the interacting pair.", "The forces are equal and opposite.", "They act on different objects."])
  ],
  examples: [
    ex("Pulling a sled", "A rope pulls a sled across snow.", "Tension minus friction gives the net force; $F=ma$ yields the acceleration."),
    ex("Standing on the ground", "You push down; the ground pushes up.", "The normal force (third-law partner) supports your weight."),
    ex("Tug of war", "Two teams pull a rope.", "Net force decides the motion; the rope's tension is the same throughout.")
  ],
  videos: vids("newtons laws of motion free body diagram algebra", "F=ma tension normal force weight examples", "physics 1 newtons laws worked problems"),
  problems: [
    pr("p01","easy","A $6$ kg object accelerates at $2$ m/s². Find the net force.","$12$ N",["$F=ma$.","$=6(2)$.","$12$ N."],"$F=ma$."),
    pr("p02","easy","Find the weight of a $12$ kg mass.","$\\approx117.6$ N",["$W=mg$.","$=12(9.8)$.","$117.6$ N."],"$W=mg$."),
    pr("p03","medium","A $4$ kg box is pulled with $20$ N against $8$ N friction. Find its acceleration.","$3$ m/s²",["Net $=20-8=12$ N.","$a=12/4$.","$3$ m/s²."],"Subtract friction first."),
    pr("p04","medium","A $2$ kg lamp hangs at rest. Find the cord tension.","$\\approx19.6$ N",["$T=mg$.","$=2(9.8)$.","$19.6$ N."],"Tension balances weight."),
    pr("p05","medium","A $70$ kg person in an elevator accelerating up at $1.5$ m/s². Find the normal force.","$\\approx791$ N",["$N=m(g+a)$.","$=70(11.3)$.","$791$ N."],"$N=m(g+a)$."),
    pr("p06","hard","A $10$ kg block on a frictionless $37^\\circ$ incline. Find the acceleration.","$\\approx5.9$ m/s²",["$a=g\\sin37^\\circ$.","$=9.8(0.6)$.","$\\approx5.9$ m/s²."],"$a=g\\sin\\theta$."),
    pr("p07","hard","Masses $4$ kg and $6$ kg over a frictionless pulley. Find the acceleration.","$\\approx1.96$ m/s²",["$a=(m_2-m_1)g/(m_1+m_2)=2(9.8)/10$.","$=1.96$ m/s².","Done."],"Atwood machine.")
  ] },

{ id: "phys1433-05-friction-circular", title: "Friction & Circular Motion", chapter: "Ch. 5 & 6", problems: [5,12,19,26,33,40],
  summary: "Friction opposes sliding, $f=\\mu N$, with static friction up to a maximum before slipping. Uniform circular motion requires a centripetal (inward) force $F_c=mv^2/r$, supplied by friction, tension, gravity, or a banked road.",
  glossary: {
    "kinetic friction": g("Friction while surfaces slide.", "$f_k=\\mu_k N$."),
    "static friction": g("Friction preventing sliding, up to a max.", "$f_s\\le\\mu_s N$."),
    "coefficient of friction": g("Sets friction's strength.", "$\\mu$; static usually larger than kinetic."),
    "centripetal force": g("Net inward force for circular motion.", "$F_c=mv^2/r$."),
    "centripetal acceleration": g("Inward acceleration in a circle.", "$a_c=v^2/r$."),
    "banked curve": g("A tilted road aiding turning.", "The normal force's component turns the car."),
    "period (circular)": g("Time for one revolution.", "$T=2\\pi r/v$."),
    "uniform circular motion": g("Constant speed around a circle.", "Speed constant, velocity direction changing.")
  },
  concepts: [
    cn(1, "Kinetic friction", "While an object slides, kinetic friction opposes the motion with magnitude $f_k=\\mu_k N$. Include it in the force balance along the surface.", ["Find the normal force $N$.", "$f_k=\\mu_k N$, opposing motion.", "Add it to $\\sum F=ma$."]),
    cn(2, "Static friction", "Static friction adjusts to prevent sliding up to a maximum $f_{s,\\max}=\\mu_s N$. An object stays put until the applied force exceeds this.", ["Static friction matches the applied force.", "Its max is $\\mu_s N$.", "Slipping begins beyond that."]),
    cn(3, "Centripetal acceleration", "An object moving in a circle at constant speed accelerates toward the center: $a_c=v^2/r$. Its velocity direction constantly changes.", ["Speed constant, direction changing.", "$a_c=v^2/r$, pointing inward.", "It needs a net inward force."]),
    cn(4, "Centripetal force", "Some real force must provide the inward pull: $F_c=mv^2/r$. Identify it (friction, tension, gravity) and set it equal to $mv^2/r$.", ["Identify the inward force source.", "Set it equal to $mv^2/r$.", "Solve for the unknown."]),
    cn(5, "Cars on curves", "On a flat curve, static friction supplies the centripetal force, giving a maximum safe speed $v=\\sqrt{\\mu_s g r}$; banking lets a road turn cars with less reliance on friction.", ["Flat curve: $\\mu_s mg=mv^2/r$.", "Max speed $v=\\sqrt{\\mu_s g r}$.", "Banking adds a normal-force component."])
  ],
  examples: [
    ex("Anti-lock brakes", "Brakes prevent wheel lockup.", "They keep tires in static (not kinetic) friction, which grips better for shorter stops."),
    ex("A car on a highway ramp", "A curved ramp turns a car.", "Friction (or banking) supplies $mv^2/r$; exceed the max speed and it skids."),
    ex("A spinning bucket of water", "Water stays in an over-the-top swing.", "The required centripetal force keeps the water pressed inward at the top.")
  ],
  videos: vids("friction static kinetic centripetal force circular motion", "coefficient of friction centripetal acceleration examples", "physics 1 friction circular motion worked problems"),
  problems: [
    pr("p01","easy","A $5$ kg box on a floor, $\\mu_k=0.2$. Find the kinetic friction.","$\\approx9.8$ N",["$N=mg=49$ N.","$f=0.2(49)$.","$9.8$ N."],"$f=\\mu N$."),
    pr("p02","easy","A $1$ kg ball circles at $2$ m/s, radius $0.5$ m. Find the centripetal force.","$8$ N",["$F_c=mv^2/r$.","$=1(4)/0.5$.","$8$ N."],"$F_c=mv^2/r$."),
    pr("p03","medium","Find the centripetal acceleration for $v=15$ m/s, $r=45$ m.","$5$ m/s²",["$a_c=v^2/r$.","$=225/45$.","$5$ m/s²."],"$a_c=v^2/r$."),
    pr("p04","medium","A $2$ kg mass on a $1$ m string swings in a horizontal circle at $4$ m/s. Find the tension.","$32$ N",["$T=mv^2/r$.","$=2(16)/1$.","$32$ N."],"Tension provides $F_c$."),
    pr("p05","medium","Maximum static friction for a $10$ kg box, $\\mu_s=0.5$.","$\\approx49$ N",["$f_{max}=\\mu_s mg$.","$=0.5(10)(9.8)$.","$49$ N."],"$f_s\\le\\mu_s N$."),
    pr("p06","hard","A car rounds a flat curve, $r=80$ m, $\\mu_s=0.6$. Find the max speed.","$\\approx21.7$ m/s",["$v=\\sqrt{\\mu_s g r}$.","$=\\sqrt{0.6(9.8)(80)}$.","$\\approx21.7$ m/s."],"$v=\\sqrt{\\mu_s g r}$."),
    pr("p07","hard","A ball on a string swings in a vertical circle ($r=1$ m). Find the minimum speed at the top.","$\\approx3.13$ m/s",["At the top, gravity provides $F_c$: $v=\\sqrt{gr}$.","$=\\sqrt{9.8}$.","$\\approx3.13$ m/s."],"Minimum: gravity alone supplies $mv^2/r$.")
  ] },

{ id: "phys1433-06-gravitation", title: "Gravitation", chapter: "Ch. 6", problems: [7,14,21,28,35,42],
  summary: "Newton's law of universal gravitation, $F=Gm_1m_2/r^2$, describes the attraction between any two masses. Surface gravity is $g=GM/R^2$, and for circular orbits gravity supplies the centripetal force, giving $v=\\sqrt{GM/r}$.",
  glossary: {
    "universal gravitation": g("Every mass attracts every other.", "$F=G\\dfrac{m_1m_2}{r^2}$."),
    "gravitational constant": g("The constant $G$.", "$6.67\\times10^{-11}\\ \\text{N·m}^2/\\text{kg}^2$."),
    "inverse-square law": g("Force falls off as $1/r^2$.", "Double the distance ⇒ quarter the force."),
    "surface gravity": g("Local free-fall acceleration.", "$g=GM/R^2$."),
    "orbital speed": g("Speed for a circular orbit.", "$v=\\sqrt{GM/r}$."),
    "orbital period": g("Time for one orbit.", "$T=2\\pi r/v$; Kepler's third law."),
    "weight on a planet": g("Gravitational force there.", "$W=mg$ with that planet's $g$."),
    "Kepler's laws": g("Rules of planetary orbits.", "Ellipses; equal areas; $T^2\\propto r^3$.")
  },
  concepts: [
    cn(1, "Universal gravitation", "Any two masses attract with $F=Gm_1m_2/r^2$, directed along the line joining them — the same inverse-square form as the electric force.", ["Insert the masses and separation.", "$F=Gm_1m_2/r^2$.", "The force is attractive."]),
    cn(2, "The inverse-square law", "Gravity weakens with the square of the distance: doubling $r$ cuts the force to a quarter. This shapes orbits and tides.", ["Compare distances as a ratio.", "Force scales as $1/r^2$.", "Twice as far ⇒ one-quarter as strong."]),
    cn(3, "Surface gravity", "A planet's surface gravity is $g=GM/R^2$. Weight $mg$ therefore depends on the planet's mass and radius, not just your mass.", ["Compute $g=GM/R^2$.", "Weight $=mg$ locally.", "Mass is unchanged everywhere."]),
    cn(4, "Orbits", "For a circular orbit, gravity is the centripetal force: $GMm/r^2=mv^2/r$, so orbital speed is $v=\\sqrt{GM/r}$.", ["Set gravity $=mv^2/r$.", "Solve $v=\\sqrt{GM/r}$.", "Higher orbits move slower."]),
    cn(5, "Kepler's third law", "Orbital period grows with radius: $T^2\\propto r^3$. Combining $v=\\sqrt{GM/r}$ with $T=2\\pi r/v$ gives the relation.", ["Use $T=2\\pi r/v$.", "Substitute $v=\\sqrt{GM/r}$.", "Get $T^2\\propto r^3$."])
  ],
  examples: [
    ex("GPS satellites", "Satellites orbit at a set altitude.", "Their orbital speed follows $v=\\sqrt{GM/r}$, fixing the orbit's period."),
    ex("Weight on the Moon", "You'd weigh less on the Moon.", "The Moon's smaller $GM/R^2$ makes $g$ about $1/6$ of Earth's."),
    ex("Ocean tides", "The Moon raises tides on Earth.", "The inverse-square gravity is slightly stronger on the near side, stretching the oceans.")
  ],
  videos: vids("universal gravitation inverse square law surface gravity", "orbital speed keplers laws examples", "physics 1 gravitation worked problems"),
  problems: [
    pr("p01","easy","Two $500$ kg masses are $1$ m apart. Find the gravitational force.","$\\approx1.67\\times10^{-5}$ N",["$F=Gm_1m_2/r^2$.","$=6.67\\times10^{-11}(2.5\\times10^5)/1$.","$\\approx1.67\\times10^{-5}$ N."],"$F=Gm_1m_2/r^2$."),
    pr("p02","easy","If distance doubles, how does gravitational force change?","Quarter",["$F\\propto1/r^2$.","$1/2^2=1/4$.","Quarter."],"Inverse-square."),
    pr("p03","medium","Find $g$ at Earth's surface ($M=5.97\\times10^{24}$ kg, $R=6.37\\times10^6$ m).","$\\approx9.8$ m/s²",["$g=GM/R^2$.","$=6.67\\times10^{-11}(5.97\\times10^{24})/(6.37\\times10^6)^2$.","$\\approx9.8$ m/s²."],"$g=GM/R^2$."),
    pr("p04","medium","Your mass is $70$ kg. Your weight where $g=3.7$ m/s² (Mars)?","$259$ N",["$W=mg$.","$=70(3.7)$.","$259$ N."],"Use the local $g$."),
    pr("p05","medium","Find the orbital speed at $r=8\\times10^6$ m around Earth.","$\\approx7.05\\times10^3$ m/s",["$v=\\sqrt{GM/r}$.","$=\\sqrt{6.67\\times10^{-11}(5.97\\times10^{24})/8\\times10^6}$.","$\\approx7.05$ km/s."],"$v=\\sqrt{GM/r}$."),
    pr("p06","hard","Two planets: one twice the mass, twice the radius. How does surface gravity compare?","Half",["$g=GM/R^2$; $g'=G(2M)/(2R)^2=GM/(2R^2)$.","Half of original.","$g'=g/2$."],"Plug $2M$ and $2R$ into $GM/R^2$."),
    pr("p07","hard","If orbit radius quadruples, how does the period change? ($T^2\\propto r^3$)","×8",["$T^2\\propto r^3$; $r\\to4r$ ⇒ $T^2\\times64$.","$T\\times8$.","Period is 8× longer."],"$T\\propto r^{3/2}$.")
  ] },

{ id: "phys1433-07-work-energy-power", title: "Work, Energy & Power", chapter: "Ch. 7", problems: [13,17,19,22,24,36],
  summary: "Work is $W=Fd\\cos\\theta$; it changes kinetic energy ($W_{net}=\\Delta KE$). Gravitational and elastic potential energy store work, and mechanical energy is conserved without friction. Power is the rate of doing work, $P=W/t=Fv$.",
  glossary: {
    "work": g("Energy transferred by a force over distance.", "$W=Fd\\cos\\theta$."),
    "kinetic energy": g("Energy of motion.", "$KE=\\tfrac12mv^2$."),
    "potential energy": g("Stored energy of position.", "$U=mgh$ (gravity), $\\tfrac12kx^2$ (spring)."),
    "work-energy theorem": g("Net work equals change in KE.", "$W_{net}=\\Delta KE$."),
    "conservation of energy": g("Mechanical energy constant without friction.", "$KE_i+U_i=KE_f+U_f$."),
    "power": g("Rate of doing work.", "$P=W/t=Fv$, in watts."),
    "efficiency": g("Useful output over input energy.", "Always less than 100% in real machines."),
    "joule": g("The SI unit of energy.", "$1\\ \\text{J}=1\\ \\text{N·m}$.")
  },
  concepts: [
    cn(1, "Work", "Work is force times displacement in the force's direction: $W=Fd\\cos\\theta$. A perpendicular force does no work; friction does negative work.", ["Identify force, displacement, angle.", "$W=Fd\\cos\\theta$.", "Sign follows $\\cos\\theta$."]),
    cn(2, "Kinetic energy and the work–energy theorem", "A moving mass has $KE=\\tfrac12mv^2$, and the net work done on it equals the change in that energy: $W_{net}=\\Delta KE$.", ["Compute $\\tfrac12mv^2$.", "Net work $=\\Delta KE$.", "Solve for speed or distance."]),
    cn(3, "Potential energy", "Gravitational PE is $U=mgh$; elastic PE is $\\tfrac12kx^2$. These store the work done against gravity or in a spring.", ["Choose a reference for height.", "$U=mgh$ or $\\tfrac12kx^2$.", "Only changes in $U$ matter."]),
    cn(4, "Conservation of energy", "Without friction, mechanical energy $KE+U$ is conserved; set the total at two points equal to find a speed or height. Friction converts some to heat.", ["Write $KE+U$ at two points.", "Set them equal (no friction).", "With friction, subtract the heat lost."]),
    cn(5, "Power", "Power measures how fast work is done: $P=W/t$, or $P=Fv$ for a steady force at speed $v$. Its unit is the watt.", ["Divide work by time, or use $Fv$.", "Units are J/s = W.", "More power ⇒ faster energy delivery."])
  ],
  examples: [
    ex("Climbing stairs", "You raise your body up several floors.", "Work $mgh$ is done against gravity; power depends on how fast you climb."),
    ex("A roller coaster drop", "A car speeds up going downhill.", "Potential energy converts to kinetic — conservation of energy without much friction."),
    ex("An electric motor's rating", "A motor lists its wattage.", "$P=Fv$ tells the force it can sustain at a given speed.")
  ],
  videos: vids("work energy theorem kinetic potential energy algebra", "conservation of energy power P=Fv examples", "physics 1 work energy power worked problems"),
  problems: [
    pr("p01","easy","A $40$ N force moves a box $3$ m in its direction. Find the work.","$120$ J",["$W=Fd$.","$=40(3)$.","$120$ J."],"$W=Fd$ when aligned."),
    pr("p02","easy","Find the KE of a $3$ kg ball at $4$ m/s.","$24$ J",["$KE=\\tfrac12mv^2$.","$=\\tfrac12(3)(16)$.","$24$ J."],"$\\tfrac12mv^2$."),
    pr("p03","medium","A $30$ N force acts at $37^\\circ$ over $5$ m. Find the work.","$\\approx120$ J",["$W=Fd\\cos37^\\circ$.","$=30(5)(0.8)$.","$120$ J."],"Include $\\cos\\theta$."),
    pr("p04","medium","A ball falls from $10$ m — speed at the bottom (energy method)?","$\\approx14$ m/s",["$v=\\sqrt{2gh}$.","$=\\sqrt{2(9.8)(10)}$.","$\\approx14$ m/s."],"$v=\\sqrt{2gh}$."),
    pr("p05","medium","A crane lifts $500$ N a height of $12$ m in $6$ s. Find the power.","$1000$ W",["$P=W/t=(500\\cdot12)/6$.","$=6000/6$.","$1000$ W."],"$P=W/t$."),
    pr("p06","hard","A $2$ kg block hits a spring ($k=200$ N/m) at $3$ m/s. Find the max compression.","$\\approx0.3$ m",["$\\tfrac12mv^2=\\tfrac12kx^2$: $9=100x^2$? No: $\\tfrac12(2)(9)=\\tfrac12(200)x^2$.","$9=100x^2\\Rightarrow x^2=0.09$.","$x=0.3$ m."],"KE → spring PE."),
    pr("p07","hard","A car engine delivers $60$ kW at $30$ m/s. Find the driving force.","$2000$ N",["$P=Fv$ ⇒ $F=P/v$.","$=60000/30$.","$2000$ N."],"$F=P/v$.")
  ] },

{ id: "phys1433-08-momentum", title: "Momentum & Collisions", chapter: "Ch. 8", problems: [3,8,14,27,28,35],
  summary: "Momentum $p=mv$ changes by impulse $J=F\\Delta t=\\Delta p$. In an isolated system total momentum is conserved. Collisions are elastic (KE conserved) or inelastic (KE lost); perfectly inelastic collisions stick together.",
  glossary: {
    "momentum": g("Mass times velocity.", "$p=mv$; a vector."),
    "impulse": g("Force applied over time.", "$J=F\\Delta t=\\Delta p$."),
    "conservation of momentum": g("Total momentum constant with no external force.", "$\\sum p_i=\\sum p_f$."),
    "elastic collision": g("Kinetic energy is conserved.", "Both $p$ and $KE$ conserved."),
    "inelastic collision": g("Some kinetic energy is lost.", "$p$ conserved, $KE$ not."),
    "perfectly inelastic": g("Objects stick together.", "Common final velocity."),
    "recoil": g("Backward motion from ejecting mass.", "From zero total momentum."),
    "impulse-momentum theorem": g("Impulse equals momentum change.", "$F\\Delta t=\\Delta p$.")
  },
  concepts: [
    cn(1, "Momentum and impulse", "Momentum is $p=mv$; a force acting over time delivers impulse $J=F\\Delta t=\\Delta p$. Longer contact time means smaller force for the same change.", ["Compute $p=mv$.", "Impulse $=F\\Delta t=\\Delta p$.", "Longer $\\Delta t$ ⇒ smaller $F$."]),
    cn(2, "Conservation of momentum", "With no external force, total momentum is unchanged. Set total momentum before equal to after.", ["Sum momenta before.", "Sum momenta after.", "Set them equal."]),
    cn(3, "Elastic vs inelastic", "Elastic collisions conserve kinetic energy; inelastic ones don't. Perfectly inelastic collisions stick together and lose the most KE.", ["Elastic: $p$ and $KE$ conserved.", "Inelastic: only $p$ conserved.", "Perfectly inelastic: common velocity."]),
    cn(4, "Perfectly inelastic collisions", "When objects stick, momentum conservation gives one common final velocity: $m_1v_1+m_2v_2=(m_1+m_2)v_f$.", ["Add the incoming momenta.", "Divide by the total mass.", "That's the common speed."]),
    cn(5, "Impulse and safety", "Extending a collision's duration lowers the peak force ($F=\\Delta p/\\Delta t$) — why we use airbags, padding, and follow-through.", ["Fix $\\Delta p$.", "Increase $\\Delta t$.", "Peak force drops."])
  ],
  examples: [
    ex("Catching an egg gently", "You move your hands back to catch it.", "Lengthening the stopping time reduces the force, so the egg survives."),
    ex("Rocket launch", "Exhaust shoots out the bottom.", "Momentum conservation propels the rocket up with equal-and-opposite momentum."),
    ex("A car crash", "Two cars collide and crumple.", "An inelastic collision conserves momentum while losing kinetic energy to deformation.")
  ],
  videos: vids("momentum impulse conservation collisions algebra", "elastic inelastic collision recoil examples", "physics 1 momentum collisions worked problems"),
  problems: [
    pr("p01","easy","Find the momentum of a $4$ kg cart at $5$ m/s.","$20$ kg·m/s",["$p=mv$.","$=4(5)$.","$20$ kg·m/s."],"$p=mv$."),
    pr("p02","easy","A $15$ N force acts for $3$ s. Find the impulse.","$45$ N·s",["$J=F\\Delta t$.","$=15(3)$.","$45$ N·s."],"$J=F\\Delta t$."),
    pr("p03","medium","A $3$ kg ball at $4$ m/s sticks to a $1$ kg ball at rest. Find their speed.","$3$ m/s",["$3(4)=(4)v$.","$v=12/4$.","$3$ m/s."],"Perfectly inelastic."),
    pr("p04","medium","A $0.4$ kg ball hits a wall at $5$ m/s and bounces at $5$ m/s. Find the impulse.","$4$ N·s",["$\\Delta p=0.4(5-(-5))$.","$=0.4(10)$.","$4$ N·s."],"Account for direction reversal."),
    pr("p05","medium","A $50$ kg skater throws a $4$ kg ball at $6$ m/s. Find her recoil speed.","$0.48$ m/s",["$0=50v-4(6)$.","$v=24/50$.","$0.48$ m/s."],"Total momentum stays zero."),
    pr("p06","hard","A $2000$ kg truck at $15$ m/s hits a stopped $1000$ kg car; they stick. Find their speed.","$10$ m/s",["$2000(15)=3000v$.","$v=30000/3000$.","$10$ m/s."],"Inelastic conservation."),
    pr("p07","hard","Equal masses collide elastically, one at $8$ m/s, one at rest. Find the final speeds.","$0$ and $8$ m/s",["Equal-mass elastic ⇒ exchange velocities.","First stops, second moves at $8$ m/s.","Done."],"They swap velocities.")
  ] },

{ id: "phys1433-09-rotation-torque", title: "Rotational Motion & Torque", chapter: "Ch. 9 & 10", problems: [4,11,18,25,32,39],
  summary: "Rotation mirrors linear motion with angular position, velocity, and acceleration. Torque $\\tau=rF\\sin\\theta$ is the turning effect of a force; $\\tau=I\\alpha$ is the rotational $F=ma$; and angular momentum $L=I\\omega$ is conserved without external torque.",
  glossary: {
    "angular velocity": g("Rotation rate.", "$\\omega$, in rad/s; $v=r\\omega$."),
    "angular acceleration": g("Rate of change of $\\omega$.", "$\\alpha$; $a=r\\alpha$."),
    "torque": g("A force's turning effect.", "$\\tau=rF\\sin\\theta$."),
    "lever arm": g("Perpendicular distance from axis to force.", "Longer arm ⇒ more torque."),
    "moment of inertia": g("Rotational resistance to speeding up.", "$I$; depends on mass distribution."),
    "rotational Newton's law": g("$\\tau=I\\alpha$.", "The rotational analog of $F=ma$."),
    "angular momentum": g("Rotational momentum $L=I\\omega$.", "Conserved without external torque."),
    "rotational KE": g("Energy of spinning.", "$\\tfrac12I\\omega^2$.")
  },
  concepts: [
    cn(1, "Angular quantities", "Rotation uses angular position, velocity $\\omega$, and acceleration $\\alpha$, linked to linear motion by $v=r\\omega$ and $a=r\\alpha$.", ["Use $\\theta,\\omega,\\alpha$ like $x,v,a$.", "Convert with $v=r\\omega$.", "Apply the rotational kinematic equations."]),
    cn(2, "Torque", "Torque is the turning effect of a force: $\\tau=rF\\sin\\theta$. It's largest with a long lever arm and a perpendicular push.", ["Find the distance from the axis.", "$\\tau=rF\\sin\\theta$.", "Maximum when the force is perpendicular."]),
    cn(3, "Moment of inertia and $\\tau=I\\alpha$", "Moment of inertia is rotational mass; the net torque gives angular acceleration via $\\tau=I\\alpha$.", ["Get $I$ for the object.", "Sum torques.", "$\\sum\\tau=I\\alpha$."]),
    cn(4, "Rotational equilibrium and energy", "For balance, net torque is zero; a spinning object stores $\\tfrac12I\\omega^2$ of energy.", ["Set $\\sum\\tau=0$ for balance.", "Rotational KE $=\\tfrac12I\\omega^2$.", "Rolling adds $\\tfrac12mv^2$."]),
    cn(5, "Angular momentum conservation", "With no external torque, $L=I\\omega$ stays constant; drawing mass inward lowers $I$ and speeds up rotation.", ["Set $I_i\\omega_i=I_f\\omega_f$.", "Smaller $I$ ⇒ larger $\\omega$.", "Solve for the new spin."])
  ],
  examples: [
    ex("A wrench on a bolt", "A longer wrench loosens a stubborn bolt.", "The longer lever arm increases torque for the same force."),
    ex("A diver's tuck", "A diver tucks to flip faster.", "Reducing $I$ raises $\\omega$ since angular momentum is conserved."),
    ex("A merry-go-round", "Kids run and jump on.", "Torque changes its spin; angular momentum accounts for the new rate.")
  ],
  videos: vids("rotational motion torque lever arm moment of inertia", "angular momentum conservation rotational kinematics examples", "physics 1 rotation torque worked problems"),
  problems: [
    pr("p01","easy","A wheel spins at $8$ rad/s, radius $0.25$ m. Find the rim speed.","$2$ m/s",["$v=r\\omega$.","$=0.25(8)$.","$2$ m/s."],"$v=r\\omega$."),
    pr("p02","easy","A $25$ N force acts $0.4$ m from an axis, perpendicular. Find the torque.","$10$ N·m",["$\\tau=rF$.","$=0.4(25)$.","$10$ N·m."],"$\\tau=rF$."),
    pr("p03","medium","Torque $18$ N·m on $I=6$ kg·m². Find $\\alpha$.","$3$ rad/s²",["$\\alpha=\\tau/I$.","$=18/6$.","$3$ rad/s²."],"$\\tau=I\\alpha$."),
    pr("p04","medium","A $40$ N force acts $0.5$ m from a pivot at $30^\\circ$. Find the torque.","$10$ N·m",["$\\tau=rF\\sin\\theta$.","$=0.5(40)(0.5)$.","$10$ N·m."],"Include $\\sin\\theta$."),
    pr("p05","medium","Rotational KE of $I=3$ kg·m² at $4$ rad/s.","$24$ J",["$\\tfrac12I\\omega^2$.","$=\\tfrac12(3)(16)$.","$24$ J."],"$\\tfrac12I\\omega^2$."),
    pr("p06","hard","A diver with $I=6$ kg·m² at $1.5$ rad/s tucks to $I=2$. Find the new $\\omega$.","$4.5$ rad/s",["$6(1.5)=2\\omega$.","$\\omega=9/2$.","$4.5$ rad/s."],"Conserve $L=I\\omega$."),
    pr("p07","hard","A balanced seesaw: a $40$ kg child sits $1.5$ m left. A $30$ kg child sits how far right?","$2$ m",["$40(1.5)=30 d$.","$d=60/30$.","$2$ m."],"Set torques equal.")
  ] },

{ id: "phys1433-10-equilibrium", title: "Static Equilibrium", chapter: "Ch. 11", problems: [2,7,14,21,28,35],
  summary: "An object is in static equilibrium when the net force and the net torque are both zero. Solving involves drawing forces, picking a convenient pivot to eliminate an unknown, and applying $\\sum F=0$ and $\\sum\\tau=0$.",
  glossary: {
    "static equilibrium": g("At rest with zero net force and torque.", "$\\sum F=0$ and $\\sum\\tau=0$."),
    "pivot": g("The axis chosen for torque calculations.", "Pick it at an unknown force to simplify."),
    "center of gravity": g("Where weight effectively acts.", "Used for the weight's torque."),
    "torque balance": g("Clockwise torques equal counterclockwise.", "$\\sum\\tau=0$."),
    "force balance": g("Up forces equal down; left equal right.", "$\\sum F=0$ per axis."),
    "support force": g("Upward force from a support or hinge.", "An unknown to solve for."),
    "stability": g("Resistance to tipping.", "Related to the base and center of gravity."),
    "moment": g("Another word for torque.", "Force times lever arm.")
  },
  concepts: [
    cn(1, "The equilibrium conditions", "Both conditions must hold: no net force (won't accelerate) and no net torque (won't rotate). Each yields equations.", ["$\\sum F_x=0$, $\\sum F_y=0$.", "$\\sum\\tau=0$.", "Solve the system."]),
    cn(2, "Choosing a pivot", "Since torque depends on the axis, put the pivot at an unknown force to drop it from the torque equation.", ["Locate an unknown force.", "Take torques there.", "It vanishes from $\\sum\\tau=0$."]),
    cn(3, "Center of gravity", "Treat an object's weight as acting at its center of gravity when computing its torque.", ["Find the center of gravity.", "Weight acts there.", "Include its torque."]),
    cn(4, "Solving beam problems", "Draw all forces (weights, supports, loads), choose a pivot, write $\\sum\\tau=0$, then use $\\sum F=0$ for the remaining unknown.", ["Draw the free-body diagram.", "$\\sum\\tau=0$ about a chosen pivot.", "$\\sum F=0$ for the rest."]),
    cn(5, "Stability", "An object is stable while its center of gravity stays over its base of support; it tips when the center passes the base's edge.", ["Locate the center of gravity.", "Keep it over the base.", "Tipping starts at the edge."])
  ],
  examples: [
    ex("A hanging sign", "A sign hangs from a bracket.", "Force and torque balance give the tension and hinge force."),
    ex("A person on a diving board", "Someone stands near the end.", "Torque balance about the fixed support finds the reaction forces."),
    ex("Stacking blocks", "How far can a block overhang?", "The stack stays up while the combined center of gravity is over the base.")
  ],
  videos: vids("static equilibrium force torque balance algebra", "beam problems pivot center of gravity examples", "physics 1 equilibrium worked problems"),
  problems: [
    pr("p01","easy","A uniform $6$ m beam weighs $300$ N. Find the torque of its weight about one end.","$900$ N·m",["Weight at center (3 m).","$\\tau=3(300)$.","$900$ N·m."],"Center of gravity at the middle."),
    pr("p02","easy","A $60$ N weight is $2$ m from a pivot. Find its torque.","$120$ N·m",["$\\tau=rF$.","$=2(60)$.","$120$ N·m."],"$\\tau=rF$."),
    pr("p03","medium","A $40$ N weight $1$ m left of a pivot — what weight $2$ m right balances it?","$20$ N",["$40(1)=W(2)$.","$W=40/2$.","$20$ N."],"Set torques equal."),
    pr("p04","medium","Two supports hold a $200$ N uniform beam at its ends. Find each support force.","$100$ N each",["Symmetry splits the weight.","$200/2$.","$100$ N each."],"Symmetric load splits evenly."),
    pr("p05","medium","A $500$ N sign hangs $1.2$ m from a wall on a bracket. Find the torque about the wall.","$600$ N·m",["$\\tau=rF$.","$=1.2(500)$.","$600$ N·m."],"$\\tau=rF$."),
    pr("p06","hard","A $4$ m beam ($120$ N) on end supports has a $300$ N load $1$ m from the left. Find the left support force.","$285$ N",["Torque about right end: $F_L(4)=120(2)+300(3)$.","$F_L=1140/4$.","$285$ N."],"Take torques about the right support."),
    pr("p07","hard","A ladder's weight $150$ N acts at its center $2$ m up a $4$ m ladder. Torque about the base foot?","$300$ N·m (× horizontal factor)",["Weight torque uses horizontal distance from the base.","For a vertical ladder, $\\tau=0$; tilted, $\\tau=150\\times(\\text{horizontal offset})$.","Depends on the angle."],"Torque uses the horizontal lever arm.")
  ] },

{ id: "phys1433-11-fluids", title: "Fluids", chapter: "Ch. 12", problems: [1,2,7,10,15,20],
  summary: "Fluids exert pressure that grows with depth ($P=P_0+\\rho gh$). Buoyancy equals the weight of displaced fluid (Archimedes). Pascal's principle powers hydraulics, continuity conserves flow rate, and Bernoulli links pressure to speed.",
  glossary: {
    "pressure": g("Force per unit area.", "$P=F/A$, in pascals."),
    "density": g("Mass per unit volume.", "$\\rho=m/V$."),
    "pressure with depth": g("Deeper means higher pressure.", "$P=P_0+\\rho gh$."),
    "buoyant force": g("Upward force on a submerged object.", "Weight of displaced fluid."),
    "Archimedes' principle": g("Buoyancy = displaced fluid weight.", "$F_b=\\rho Vg$."),
    "Pascal's principle": g("Applied pressure transmits fully.", "Basis of hydraulic lifts."),
    "continuity": g("Flow rate is constant.", "$A_1v_1=A_2v_2$."),
    "Bernoulli's principle": g("Faster flow, lower pressure.", "$P+\\tfrac12\\rho v^2+\\rho gh=$ const.")
  },
  concepts: [
    cn(1, "Pressure and depth", "Pressure rises with depth: $P=P_0+\\rho gh$, and acts equally in all directions at a point.", ["Start from surface pressure.", "Add $\\rho gh$.", "Same at equal depths."]),
    cn(2, "Buoyancy", "A submerged object feels an upward force equal to the weight of displaced fluid: $F_b=\\rho_{fluid}Vg$. It floats if that matches its weight.", ["Find displaced volume.", "$F_b=\\rho Vg$.", "Compare to weight."]),
    cn(3, "Pascal's principle", "Pressure applied to a confined fluid transmits everywhere, so a hydraulic system multiplies force by the piston-area ratio.", ["Equal pressure on both pistons.", "$F_1/A_1=F_2/A_2$.", "Bigger area ⇒ bigger force."]),
    cn(4, "Continuity", "Incompressible flow keeps $Av$ constant, so a narrower pipe speeds the fluid up.", ["$A_1v_1=A_2v_2$.", "Smaller area ⇒ faster.", "Solve for the unknown speed."]),
    cn(5, "Bernoulli's principle", "Along a streamline, higher speed means lower pressure ($P+\\tfrac12\\rho v^2+\\rho gh$ constant) — the idea behind lift and atomizers.", ["Write Bernoulli at two points.", "Faster ⇒ lower pressure.", "Solve for $P$ or $v$."])
  ],
  examples: [
    ex("Floating and sinking", "A cork floats; a coin sinks.", "Objects float when their density is below the fluid's — a buoyancy comparison."),
    ex("Hydraulic brakes", "A light pedal press stops a car.", "Pascal's principle amplifies the force through the brake fluid."),
    ex("A shower curtain pulling in", "The curtain billows toward the water.", "Fast-moving air lowers pressure (Bernoulli), so outside air pushes it in.")
  ],
  videos: vids("fluid pressure depth buoyancy archimedes algebra", "pascal continuity bernoulli examples", "physics 1 fluids worked problems"),
  problems: [
    pr("p01","easy","Find the pressure $4$ m deep in water ($\\rho=1000$, ignore atmosphere).","$\\approx3.92\\times10^{4}$ Pa",["$P=\\rho gh$.","$=1000(9.8)(4)$.","$3.92\\times10^4$ Pa."],"$P=\\rho gh$."),
    pr("p02","easy","Find the density of $9$ kg in $0.003$ m³.","$3000$ kg/m³",["$\\rho=m/V$.","$=9/0.003$.","$3000$ kg/m³."],"$\\rho=m/V$."),
    pr("p03","medium","An object displaces $0.02$ m³ of water. Find the buoyant force.","$196$ N",["$F_b=\\rho Vg$.","$=1000(0.02)(9.8)$.","$196$ N."],"$F_b=\\rho_{fluid}Vg$."),
    pr("p04","medium","Water at $3$ m/s in area $0.2$ m². Find the speed where area is $0.05$ m².","$12$ m/s",["$A_1v_1=A_2v_2$.","$0.2(3)=0.05v$.","$12$ m/s."],"Continuity."),
    pr("p05","medium","Hydraulic lift: $200$ N on $0.02$ m². Find the force on $0.5$ m².","$5000$ N",["$F_2=F_1A_2/A_1$.","$=200(0.5/0.02)$.","$5000$ N."],"$F_1/A_1=F_2/A_2$."),
    pr("p06","hard","A block of density $800$ kg/m³ floats in water. What fraction is submerged?","$0.8$",["Fraction $=\\rho_{obj}/\\rho_{water}$.","$=800/1000$.","$0.8$."],"Density ratio."),
    pr("p07","hard","Total pressure $3$ m deep in water (atmosphere $1.0\\times10^5$ Pa).","$\\approx1.29\\times10^{5}$ Pa",["$P=P_0+\\rho gh=10^5+1000(9.8)(3)$.","$=10^5+2.94\\times10^4$.","$\\approx1.29\\times10^5$ Pa."],"Add atmospheric pressure.")
  ] },

{ id: "phys1433-12-temperature-heat", title: "Temperature & Heat", chapter: "Ch. 13", problems: [3,8,14,27,28,35],
  summary: "Temperature measures molecular kinetic energy; heat is energy that flows between objects at different temperatures. $Q=mc\\Delta T$ warms things, $Q=mL$ changes phase, and materials expand as $\\Delta L=\\alpha L\\Delta T$. Heat moves by conduction, convection, and radiation.",
  glossary: {
    "temperature": g("Measure of average molecular KE.", "Use kelvin for gas calculations."),
    "heat": g("Energy transferred by a temperature difference.", "$Q$, in joules; hot → cold."),
    "specific heat": g("Heat to warm 1 kg by 1 K.", "$Q=mc\\Delta T$."),
    "latent heat": g("Heat for a phase change.", "$Q=mL$ (fusion or vaporization)."),
    "thermal expansion": g("Growth with temperature.", "$\\Delta L=\\alpha L\\Delta T$."),
    "conduction": g("Heat through direct contact.", "Fast in metals."),
    "convection": g("Heat carried by moving fluid.", "Warm fluid rises."),
    "radiation": g("Heat as electromagnetic waves.", "No medium needed.")
  },
  concepts: [
    cn(1, "Temperature vs heat", "Temperature is a measure of molecular kinetic energy; heat is energy transferred because of a temperature difference, flowing hot to cold.", ["Temperature ↔ molecular KE.", "Heat is energy in transit.", "Flows hot → cold."]),
    cn(2, "Specific heat", "Warming (without phase change) needs $Q=mc\\Delta T$. Water's high $c$ makes it slow to heat and cool.", ["Find $m$, $c$, $\\Delta T$.", "$Q=mc\\Delta T$.", "Positive warms, negative cools."]),
    cn(3, "Phase changes", "Melting and boiling absorb heat at constant temperature: $Q=mL$. Full heating curves combine $mc\\Delta T$ and $mL$ segments.", ["Use $Q=mL$ for the change.", "Temperature holds during it.", "Add heating segments as needed."]),
    cn(4, "Thermal expansion", "Materials generally expand when heated: $\\Delta L=\\alpha L\\Delta T$ — the reason for expansion gaps in bridges and rails.", ["Find $\\alpha$.", "$\\Delta L=\\alpha L\\Delta T$.", "Areas and volumes expand too."]),
    cn(5, "Heat transfer", "Heat moves three ways: conduction (contact), convection (fluid motion), and radiation (electromagnetic waves, no medium required).", ["Conduction: through materials.", "Convection: via moving fluid.", "Radiation: through empty space."])
  ],
  examples: [
    ex("A metal spoon in soup", "The handle heats up.", "Conduction carries heat along the metal, which conducts well."),
    ex("Boiling water for pasta", "Water heats then boils.", "Specific heat warms it to $100^\\circ$C; latent heat drives the boiling."),
    ex("Feeling the sun's warmth", "You warm up in sunlight.", "Radiation transfers heat across empty space to your skin.")
  ],
  videos: vids("temperature heat specific heat latent heat conduction convection radiation", "specific heat phase change thermal expansion examples", "physics 1 heat worked problems"),
  problems: [
    pr("p01","easy","Heat to warm $1$ kg of water ($c=4186$) by $20$ K?","$\\approx83720$ J",["$Q=mc\\Delta T$.","$=1(4186)(20)$.","$83720$ J."],"$Q=mc\\Delta T$."),
    pr("p02","easy","Convert $100^\\circ$C to kelvin.","$373$ K",["$K=C+273$.","$100+273$.","$373$ K."],"Add 273."),
    pr("p03","medium","Melt $0.2$ kg of ice ($L_f=3.34\\times10^5$). Find the heat.","$\\approx66800$ J",["$Q=mL$.","$=0.2(3.34\\times10^5)$.","$66800$ J."],"$Q=mL$."),
    pr("p04","medium","A $3$ m aluminum rod ($\\alpha=2.4\\times10^{-5}$) heats by $40$ K. Find $\\Delta L$.","$\\approx2.88\\times10^{-3}$ m",["$\\Delta L=\\alpha L\\Delta T$.","$=2.4\\times10^{-5}(3)(40)$.","$2.88\\times10^{-3}$ m."],"$\\Delta L=\\alpha L\\Delta T$."),
    pr("p05","medium","Which transfers heat with no medium: conduction, convection, or radiation?","Radiation",["Radiation uses EM waves.","No medium needed.","Radiation."],"Sunlight through space."),
    pr("p06","hard","Heat $0.3$ kg of water from $25^\\circ$C to $100^\\circ$C ($c=4186$).","$\\approx94185$ J",["$Q=mc\\Delta T=0.3(4186)(75)$.","$=94185$ J.","Done."],"$Q=mc\\Delta T$."),
    pr("p07","hard","A $0.1$ kg ice cube at $0^\\circ$C melts then warms to $20^\\circ$C. Total heat? ($L_f=3.34\\times10^5$, $c=4186$)","$\\approx41772$ J",["Melt: $0.1(3.34\\times10^5)=33400$ J.","Warm: $0.1(4186)(20)=8372$ J.","Total $\\approx41772$ J."],"Add $mL_f$ then $mc\\Delta T$.")
  ] },

{ id: "phys1433-13-thermodynamics", title: "Thermodynamics", chapter: "Ch. 14 & 15", problems: [4,9,16,23,30,37],
  summary: "The first law is energy conservation with heat and work: $\\Delta U=Q-W$. The second law says heat flows spontaneously hot → cold and no engine is perfectly efficient — engine efficiency is capped by the Carnot limit $1-T_c/T_h$.",
  glossary: {
    "internal energy": g("Total microscopic energy.", "$\\Delta U=Q-W$."),
    "first law": g("Energy conservation with heat/work.", "$\\Delta U=Q-W$."),
    "second law": g("Heat flows hot → cold; entropy rises.", "Limits efficiency."),
    "heat engine": g("Turns heat into work.", "Efficiency $e=W/Q_h$."),
    "efficiency": g("Fraction of heat becoming work.", "$e=1-Q_c/Q_h$."),
    "Carnot limit": g("Maximum possible efficiency.", "$1-T_c/T_h$ (kelvin)."),
    "entropy": g("Measure of disorder.", "Increases spontaneously."),
    "isothermal/adiabatic": g("Constant-temperature vs no-heat processes.", "Special paths on a $P$-$V$ diagram.")
  },
  concepts: [
    cn(1, "The first law", "Energy is conserved: internal energy change equals heat in minus work out, $\\Delta U=Q-W$. Watch the signs of $Q$ and $W$.", ["Heat in is $+Q$; work by the gas is $+W$.", "$\\Delta U=Q-W$.", "Solve for the unknown."]),
    cn(2, "Work in gas processes", "As a gas expands it does work $W=P\\Delta V$ (constant pressure) — the area under the $P$–$V$ curve.", ["Sketch the $P$–$V$ path.", "Constant $P$: $W=P\\Delta V$.", "General: area under the curve."]),
    cn(3, "The second law", "Heat won't flow cold → hot on its own, entropy tends to increase, and no engine converts heat fully to work.", ["Heat flows hot → cold naturally.", "Entropy increases overall.", "No 100% efficient engine."]),
    cn(4, "Heat engines", "An engine absorbs $Q_h$, outputs work $W$, and rejects $Q_c$: efficiency $e=W/Q_h=1-Q_c/Q_h$.", ["Find $Q_h$, $Q_c$, $W=Q_h-Q_c$.", "$e=W/Q_h$.", "Express as a percentage."]),
    cn(5, "The Carnot limit", "Between hot and cold reservoirs, the best possible efficiency is $e_{max}=1-T_c/T_h$ (kelvin). Real engines fall short.", ["Use absolute temperatures.", "$e_{max}=1-T_c/T_h$.", "Real efficiency is lower."])
  ],
  examples: [
    ex("A gasoline engine", "Fuel burns to move a car.", "Only part of the heat becomes work; the Carnot limit caps the best case."),
    ex("A refrigerator", "It moves heat from cold to hot.", "That requires work — the second law forbids it happening for free."),
    ex("A power plant", "Steam drives a turbine.", "Running hotter raises the Carnot efficiency, so plants push $T_h$ as high as materials allow.")
  ],
  videos: vids("first law thermodynamics heat work internal energy", "heat engine efficiency carnot second law examples", "physics 1 thermodynamics worked problems"),
  problems: [
    pr("p01","easy","A gas absorbs $400$ J and does $150$ J of work. Find $\\Delta U$.","$250$ J",["$\\Delta U=Q-W$.","$=400-150$.","$250$ J."],"$\\Delta U=Q-W$."),
    pr("p02","easy","A gas expands at $1.5\\times10^5$ Pa by $0.002$ m³. Find the work.","$300$ J",["$W=P\\Delta V$.","$=1.5\\times10^5(0.002)$.","$300$ J."],"$W=P\\Delta V$."),
    pr("p03","medium","An engine takes $2000$ J, exhausts $1400$ J. Find the efficiency.","$0.3$ (30%)",["$e=1-Q_c/Q_h$.","$=1-1400/2000$.","$0.3$."],"$e=1-Q_c/Q_h$."),
    pr("p04","medium","Carnot efficiency between $500$ K and $250$ K.","$0.5$ (50%)",["$e=1-T_c/T_h$.","$=1-250/500$.","$0.5$."],"Kelvin temperatures."),
    pr("p05","medium","An engine does $500$ J from $1250$ J input. Find the exhaust heat.","$750$ J",["$Q_c=Q_h-W$.","$=1250-500$.","$750$ J."],"$Q_c=Q_h-W$."),
    pr("p06","hard","A gas releases $200$ J while $80$ J of work is done on it. Find $\\Delta U$.","$-120$ J",["$Q=-200$, $W=-80$ (on the gas).","$\\Delta U=-200-(-80)$.","$-120$ J."],"Mind the signs."),
    pr("p07","hard","An engine between $600$ K and $400$ K runs at efficiency $0.2$. What fraction of Carnot is that?","$\\approx0.6$",["Carnot $=1-400/600=0.333$.","$0.2/0.333$.","$\\approx0.6$."],"Compare to $1-T_c/T_h$.")
  ] },

{ id: "phys1433-14-waves-sound", title: "Waves & Sound", chapter: "Ch. 16", problems: [5,10,17,24,31,38],
  summary: "Waves carry energy without transporting matter. The wave relation $v=f\\lambda$ links speed, frequency, and wavelength. Sound is a longitudinal wave; standing waves on strings and in pipes set musical pitches, and the Doppler effect shifts observed frequency with motion.",
  glossary: {
    "wave": g("A disturbance carrying energy through a medium.", "Transverse or longitudinal."),
    "wavelength": g("Distance between successive crests.", "$\\lambda$."),
    "frequency": g("Cycles per second.", "$f$, in hertz; $f=1/T$."),
    "wave speed": g("How fast the wave travels.", "$v=f\\lambda$."),
    "amplitude": g("Maximum displacement.", "Sets loudness/brightness."),
    "longitudinal wave": g("Vibration along the travel direction.", "Sound is longitudinal."),
    "standing wave": g("A fixed pattern from interference.", "Nodes and antinodes; sets pitches."),
    "Doppler effect": g("Frequency shift from relative motion.", "Higher approaching, lower receding.")
  },
  concepts: [
    cn(1, "Wave basics", "A wave transfers energy without moving the medium along with it. Key quantities: wavelength $\\lambda$, frequency $f$, and amplitude.", ["Identify wavelength and frequency.", "Amplitude sets the energy.", "The medium oscillates in place."]),
    cn(2, "The wave equation", "Speed, frequency, and wavelength are tied together by $v=f\\lambda$. Solve for any one given the others.", ["Write $v=f\\lambda$.", "Rearrange for the unknown.", "Wave speed is set by the medium."]),
    cn(3, "Sound as a longitudinal wave", "Sound is a pressure wave whose vibrations run along the travel direction. Its speed depends on the medium (fastest in solids).", ["Sound vibrates along its path.", "Speed depends on the medium.", "$\\approx343$ m/s in air."]),
    cn(4, "Standing waves and pitch", "Reflections create standing waves with fixed nodes; strings and pipes support specific wavelengths (harmonics) that set musical pitches.", ["Fixed ends force nodes there.", "Allowed wavelengths give harmonics.", "$f_n=n f_1$ for a string."]),
    cn(5, "The Doppler effect", "When a source and observer move relative to each other, the observed frequency rises on approach and falls on recession.", ["Approaching ⇒ higher frequency.", "Receding ⇒ lower frequency.", "The shift grows with relative speed."])
  ],
  examples: [
    ex("Tuning a guitar", "Adjusting string tension changes pitch.", "The standing-wave frequency $v=f\\lambda$ shifts with wave speed on the string."),
    ex("An ambulance siren", "The pitch drops as it passes.", "The Doppler effect raises then lowers the observed frequency."),
    ex("Echoes in a canyon", "A shout returns after a delay.", "Sound's finite speed and $v=f\\lambda$ set the echo timing.")
  ],
  videos: vids("waves wavelength frequency wave speed v=flambda", "sound standing waves doppler effect examples", "physics 1 waves sound worked problems"),
  problems: [
    pr("p01","easy","A wave has $f=2$ Hz and $\\lambda=3$ m. Find its speed.","$6$ m/s",["$v=f\\lambda$.","$=2(3)$.","$6$ m/s."],"$v=f\\lambda$."),
    pr("p02","easy","A wave has period $0.25$ s. Find its frequency.","$4$ Hz",["$f=1/T$.","$=1/0.25$.","$4$ Hz."],"$f=1/T$."),
    pr("p03","medium","Sound ($v=343$ m/s) has $f=686$ Hz. Find the wavelength.","$0.5$ m",["$\\lambda=v/f$.","$=343/686$.","$0.5$ m."],"$\\lambda=v/f$."),
    pr("p04","medium","A $2$ m string's fundamental has $\\lambda=4$ m. If $v=200$ m/s, find $f_1$.","$50$ Hz",["$f=v/\\lambda$.","$=200/4$.","$50$ Hz."],"Fundamental $\\lambda=2L$."),
    pr("p05","medium","Is sound a transverse or longitudinal wave?","Longitudinal",["Vibration is along travel.","Pressure wave.","Longitudinal."],"Compressions and rarefactions."),
    pr("p06","hard","A string's fundamental is $100$ Hz. Find the third harmonic.","$300$ Hz",["$f_n=n f_1$.","$3(100)$.","$300$ Hz."],"Harmonics are multiples."),
    pr("p07","hard","Light travels at $3\\times10^8$ m/s. A radio wave has $f=100$ MHz. Find $\\lambda$.","$3$ m",["$\\lambda=c/f$.","$=3\\times10^8/10^8$.","$3$ m."],"$\\lambda=v/f$ with $v=c$.")
  ] }
];

function writeLessons(list) {
  for (const L of list) {
    const doc = { title: L.title, summary: L.summary, glossary: L.glossary, concept_sections: L.concepts, real_world_examples: L.examples, videos: L.videos, problems: L.problems };
    fs.writeFileSync(path.join(LDIR, L.id + ".json"), JSON.stringify(doc, null, 2) + "\n");
  }
}
module.exports = { LESSONS, writeLessons };
if (require.main === module) { writeLessons(LESSONS); console.log("wrote " + LESSONS.length + " phys1433 lessons"); }
