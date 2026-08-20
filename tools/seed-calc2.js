#!/usr/bin/env node
/* Seed Calculus II (MAT 1575): 14 lesson JSONs at full PHYS-1442 depth.
 * Source: CityTech MAT 1575 outline + OpenStax Calculus Vols 1–2. Diagrams added
 * by tools/build-math-diagrams.js. Run: node tools/seed-calc2.js */
"use strict";
const fs = require("fs"), path = require("path");
const LDIR = path.resolve(__dirname, "..", "data", "lessons");
const g = (plain, in_class) => ({ plain, in_class });
const cn = (level, heading, explanation, math_steps) => ({ level, heading, explanation, math_steps });
const ex = (title, scenario, how_the_math_applies) => ({ title, scenario, how_the_math_applies });
const pr = (id, difficulty, prompt, correct_answer, solution_steps, hint) => ({ id, difficulty, prompt, correct_answer, solution_steps, hint });
const vids = (a, b, c) => ({ concept_query: a, math_query: b, combined_query: c });

const LESSONS = [
{ id: "calc2-01-antiderivatives-ftc", title: "Antiderivatives & the Fundamental Theorem", chapter: "Vol. 1, Ch. 4.10, 1.2–1.3", problems: [465,470,471,476,71,73,170,171,182],
  summary: "The definite integral $\\int_a^b f\\,dx$ is the net signed area under $f$. The Fundamental Theorem of Calculus evaluates it as $F(b)-F(a)$ for any antiderivative $F$, and says $\\frac{d}{dx}\\int_a^x f\\,dt=f(x)$ — integration and differentiation are inverses.",
  glossary: {
    "antiderivative": g("A function whose derivative is the integrand.", "$F'=f$; the indefinite integral is $F+C$."),
    "definite integral": g("Net signed area between a curve and the axis on $[a,b]$.", "$\\int_a^b f\\,dx$; a number, not a family."),
    "Fundamental Theorem Part 1": g("The derivative of an accumulation function is the integrand.", "$\\frac{d}{dx}\\int_a^x f\\,dt=f(x)$."),
    "Fundamental Theorem Part 2": g("Evaluate a definite integral with any antiderivative.", "$\\int_a^b f\\,dx=F(b)-F(a)$."),
    "net area": g("Area above the axis minus area below it.", "The definite integral counts below-axis regions as negative."),
    "accumulation function": g("The running integral $A(x)=\\int_a^x f\\,dt$.", "Its slope at $x$ is $f(x)$."),
    "average value": g("The mean height of a function over an interval.", "$\\dfrac{1}{b-a}\\int_a^b f\\,dx$."),
    "properties of integrals": g("Linearity and interval rules.", "$\\int(cf+g)=c\\int f+\\int g$; $\\int_a^b=-\\int_b^a$.")
  },
  concepts: [
    cn(1, "Antiderivatives review", "Reverse the derivative rules: $\\int x^n\\,dx=\\dfrac{x^{n+1}}{n+1}+C$, $\\int e^x\\,dx=e^x+C$, $\\int\\frac1x\\,dx=\\ln|x|+C$, and the trig reversals. The $+C$ captures all antiderivatives.", ["Recall which derivative gives the integrand.", "Reverse it and add $+C$.", "Check by differentiating your answer."]),
    cn(2, "The definite integral as net area", "$\\int_a^b f\\,dx$ is the limit of Riemann sums — the net area, with area below the axis subtracted. Linearity and the endpoint-swap rule ($\\int_a^b=-\\int_b^a$) simplify computations.", ["Interpret the integral as signed area.", "Use linearity to split integrals.", "Swap limits with a sign change if needed."]),
    cn(3, "FTC Part 2: evaluating", "To compute $\\int_a^b f\\,dx$, find any antiderivative $F$ and subtract: $F(b)-F(a)$. This turns an area (a limit of sums) into one subtraction.", ["Find an antiderivative $F$.", "Compute $F(b)$ and $F(a)$.", "Subtract: $F(b)-F(a)$."]),
    cn(4, "FTC Part 1: accumulation", "The area accumulated from $a$ to $x$ defines $A(x)=\\int_a^x f\\,dt$, and $A'(x)=f(x)$. Differentiation undoes the accumulation — with the chain rule when the upper limit is a function.", ["Recognize an accumulation function.", "Its derivative is the integrand at the top limit.", "Apply the chain rule if the top limit is $g(x)$."]),
    cn(5, "Average value", "The average value of $f$ on $[a,b]$ is $\\dfrac{1}{b-a}\\int_a^b f\\,dx$ — the constant height with the same area. The Mean Value Theorem for integrals guarantees $f$ actually attains it.", ["Integrate $f$ over $[a,b]$.", "Divide by the length $b-a$.", "That's the average height."])
  ],
  examples: [
    ex("Total distance from a speedometer", "A car's speed is logged over a trip.", "Integrating speed over time gives total distance — FTC Part 2 with velocity as the integrand."),
    ex("Accumulated interest", "Interest accrues continuously at a varying rate.", "The accumulation function $\\int_0^t r(s)\\,ds$ totals the interest, and its derivative recovers the instantaneous rate."),
    ex("Average temperature", "Temperature varies through the day.", "The average value integral gives the day's mean temperature.")
  ],
  videos: vids("fundamental theorem of calculus part 1 part 2 explained", "definite integral evaluate antiderivative average value examples", "calculus 2 FTC accumulation function worked problems"),
  problems: [
    pr("p01","easy","Evaluate $\\int_0^3 x^2\\,dx$.","$9$",["$F=\\tfrac{x^3}{3}$.","$9-0$.","$=9$."],"FTC: $F(3)-F(0)$."),
    pr("p02","easy","Evaluate $\\int_1^4 (2x)\\,dx$.","$15$",["$F=x^2$.","$16-1$.","$=15$."],"Antiderivative then subtract."),
    pr("p03","easy","Find $\\int (3x^2-2)\\,dx$.","$x^3-2x+C$",["Term by term.","$x^3-2x$.","$+C$."],"Reverse each derivative."),
    pr("p04","medium","Evaluate $\\int_0^{\\pi/2}\\cos x\\,dx$.","$1$",["$F=\\sin x$.","$\\sin(\\pi/2)-\\sin0=1-0$.","$=1$."],"$\\int\\cos=\\sin$."),
    pr("p05","medium","Find $\\dfrac{d}{dx}\\int_0^x \\sqrt{t^2+1}\\,dt$.","$\\sqrt{x^2+1}$",["FTC Part 1.","Derivative = integrand at the top limit.","$\\sqrt{x^2+1}$."],"The derivative just plugs $x$ into the integrand."),
    pr("p06","medium","Find the average value of $f(x)=x^2$ on $[0,3]$.","$3$",["$\\dfrac{1}{3}\\int_0^3 x^2\\,dx=\\dfrac{9}{3}$.","$=3$.","Done."],"$\\dfrac{1}{b-a}\\int_a^b f$."),
    pr("p07","hard","Evaluate $\\int_1^2\\left(\\dfrac1x+x\\right)dx$.","$\\ln2+\\tfrac32$",["$F=\\ln|x|+\\tfrac{x^2}{2}$.","$(\\ln2+2)-(0+\\tfrac12)$.","$\\ln2+\\tfrac32$."],"Integrate each piece."),
    pr("p08","hard","Find $\\dfrac{d}{dx}\\int_0^{x^2}\\sin t\\,dt$.","$2x\\sin(x^2)$",["FTC + chain rule.","$\\sin(x^2)\\cdot\\frac{d}{dx}x^2$.","$2x\\sin(x^2)$."],"Chain rule on the upper limit."),
    pr("p09","stretch","Evaluate $\\int_{-1}^{1} x^3\\,dx$.","$0$",["$x^3$ is odd; areas cancel.","$F=\\tfrac{x^4}{4}$: $\\tfrac14-\\tfrac14$.","$=0$."],"Odd function over a symmetric interval.")
  ] },

{ id: "calc2-02-substitution", title: "Integration by Substitution", chapter: "Vol. 1, Ch. 1.5–1.6", problems: [256,258,261,265,320,321,325,327],
  summary: "Substitution reverses the chain rule: let $u=g(x)$ so $du=g'(x)\\,dx$, converting $\\int f(g(x))g'(x)\\,dx$ into $\\int f(u)\\,du$. It handles composites, and with $u=\\ln$ or exponentials, integrals like $\\int\\frac{g'}{g}\\,dx=\\ln|g|+C$.",
  glossary: {
    "u-substitution": g("Renaming an inner expression $u$ to simplify an integral.", "Reverses the chain rule: $\\int f(g)g'\\,dx=\\int f(u)\\,du$."),
    "differential du": g("The piece $du=g'(x)\\,dx$ that must appear.", "Match it to a factor of the integrand."),
    "inner function": g("The $g(x)$ you set equal to $u$.", "Usually inside a power, root, trig, or exponential."),
    "change of limits": g("Converting $x$-bounds to $u$-bounds for definite integrals.", "Then you never convert back to $x$."),
    "log integral": g("$\\int\\dfrac{g'}{g}\\,dx=\\ln|g|+C$.", "Recognize the derivative-over-function pattern."),
    "back-substitute": g("Replacing $u$ with $g(x)$ at the end (indefinite integrals).", "Not needed if you changed the limits."),
    "adjust constants": g("Multiplying/dividing to make $du$ fit exactly.", "e.g. supply a missing factor of $\\tfrac12$."),
    "exponential integral": g("$\\int e^{g}g'\\,dx=e^{g}+C$.", "Substitution with $u=g$.")
  },
  concepts: [
    cn(1, "The idea", "Substitution undoes the chain rule. Spot an inner function $g(x)$ whose derivative $g'(x)$ also appears (up to a constant). Let $u=g(x)$, $du=g'(x)\\,dx$, and rewrite everything in $u$.", ["Choose $u=g(x)$ (the inside).", "Compute $du=g'(x)\\,dx$.", "Rewrite the integral entirely in $u$."]),
    cn(2, "Adjusting constants", "If $du$ is off by a constant factor, multiply and divide to fix it. For $\\int x e^{x^2}\\,dx$, $u=x^2$ gives $du=2x\\,dx$, so supply a $\\tfrac12$.", ["Compute $du$.", "Compare to the factor present.", "Insert the reciprocal constant to match."]),
    cn(3, "Definite integrals: change the limits", "For $\\int_a^b$, convert the $x$-limits to $u$-limits with $u=g(x)$ and integrate in $u$ — no need to switch back to $x$.", ["Substitute and find $u(a)$, $u(b)$.", "Integrate in $u$ over the new limits.", "Evaluate directly."]),
    cn(4, "The logarithm pattern", "When the numerator is the derivative of the denominator, $\\int\\dfrac{g'(x)}{g(x)}\\,dx=\\ln|g(x)|+C$ — substitution with $u=g$.", ["Check: is the top the derivative of the bottom?", "Let $u=$ denominator.", "Integrate to $\\ln|u|+C$."]),
    cn(5, "Exponentials and trig via substitution", "Integrals like $\\int e^{g}g'\\,dx=e^{g}+C$ and $\\int\\cos(g)g'\\,dx=\\sin(g)+C$ are direct substitutions with $u=g$.", ["Identify $g$ inside the exp/trig.", "Confirm $g'$ is present.", "Reverse the outer function."])
  ],
  examples: [
    ex("Cooling that depends on temperature", "A model's rate depends on the current state.", "Separating and integrating yields $\\int\\frac{du}{u}=\\ln|u|$ — the log pattern from substitution."),
    ex("Work with a variable force", "Force changes as an object moves.", "Integrating $F(x)\\,dx$ over a composite path often calls for a substitution to simplify the inner dependence."),
    ex("Chain-rule in reverse for signals", "A waveform is a function of a phase that varies.", "Integrating $\\cos(\\text{phase})\\cdot(\\text{phase})'$ uses substitution to recover the amplitude.")
  ],
  videos: vids("u substitution integration reverse chain rule", "u substitution definite integral change limits examples", "calculus 2 substitution worked problems logarithm pattern"),
  problems: [
    pr("p01","easy","Find $\\int (2x)(x^2+1)^3\\,dx$.","$\\dfrac{(x^2+1)^4}{4}+C$",["$u=x^2+1$, $du=2x\\,dx$.","$\\int u^3\\,du=\\tfrac{u^4}{4}$.","$\\dfrac{(x^2+1)^4}{4}+C$."],"Let $u$ be the inside."),
    pr("p02","easy","Find $\\int \\cos(3x)\\,dx$.","$\\tfrac13\\sin(3x)+C$",["$u=3x$, $du=3\\,dx$.","$\\tfrac13\\int\\cos u\\,du$.","$\\tfrac13\\sin(3x)+C$."],"Supply the $\\tfrac13$."),
    pr("p03","medium","Find $\\int x e^{x^2}\\,dx$.","$\\tfrac12 e^{x^2}+C$",["$u=x^2$, $du=2x\\,dx$.","$\\tfrac12\\int e^u\\,du$.","$\\tfrac12 e^{x^2}+C$."],"Adjust by $\\tfrac12$."),
    pr("p04","medium","Find $\\int\\dfrac{2x}{x^2+1}\\,dx$.","$\\ln(x^2+1)+C$",["Top is derivative of bottom.","$\\int\\frac{du}{u}$.","$\\ln(x^2+1)+C$."],"Log pattern."),
    pr("p05","medium","Evaluate $\\int_0^1 2x(x^2+1)^2\\,dx$.","$\\tfrac{7}{3}$",["$u=x^2+1$: limits $1\\to2$.","$\\int_1^2 u^2\\,du=\\big[\\tfrac{u^3}{3}\\big]_1^2$.","$\\tfrac{8-1}{3}=\\tfrac73$."],"Change the limits to $u$."),
    pr("p06","hard","Find $\\int \\tan x\\,dx$.","$-\\ln|\\cos x|+C$",["$\\int\\frac{\\sin x}{\\cos x}\\,dx$; $u=\\cos x$, $du=-\\sin x\\,dx$.","$-\\int\\frac{du}{u}=-\\ln|u|$.","$-\\ln|\\cos x|+C$."],"Set $u=\\cos x$."),
    pr("p07","hard","Find $\\int\\dfrac{\\ln x}{x}\\,dx$.","$\\tfrac12(\\ln x)^2+C$",["$u=\\ln x$, $du=\\frac{dx}{x}$.","$\\int u\\,du=\\tfrac{u^2}{2}$.","$\\tfrac12(\\ln x)^2+C$."],"Let $u=\\ln x$."),
    pr("p08","stretch","Find $\\int \\sin^3 x\\cos x\\,dx$.","$\\tfrac14\\sin^4 x+C$",["$u=\\sin x$, $du=\\cos x\\,dx$.","$\\int u^3\\,du$.","$\\tfrac14\\sin^4 x+C$."],"$u=\\sin x$ absorbs the $\\cos x\\,dx$.")
  ] },

{ id: "calc2-03-parts", title: "Integration by Parts", chapter: "Vol. 2, Ch. 3.1", problems: [7,8,13,15,16,19,20,27],
  summary: "Integration by parts reverses the product rule: $\\int u\\,dv=uv-\\int v\\,du$. Choosing $u$ (to differentiate) and $dv$ (to integrate) wisely — often by the LIATE guide — turns products like $x e^x$ and $x\\ln x$ into simpler integrals.",
  glossary: {
    "integration by parts": g("A rule for integrating a product of functions.", "$\\int u\\,dv=uv-\\int v\\,du$; reverses the product rule."),
    "LIATE": g("A guide for choosing $u$: Log, Inverse-trig, Algebraic, Trig, Exponential.", "Pick $u$ as the earliest type on the list."),
    "u and dv": g("The two pieces you split the integrand into.", "$u$ gets differentiated, $dv$ gets integrated."),
    "reduction formula": g("Applying parts to lower a power step by step.", "e.g. reduces $\\int x^n e^x\\,dx$ each round."),
    "cyclic integral": g("Parts loops back to the original integral.", "Solve algebraically for the integral (e.g. $\\int e^x\\sin x$)."),
    "product rule reversed": g("The origin of the parts formula.", "$(uv)'=u'v+uv'$ integrated and rearranged."),
    "definite parts": g("Parts on $[a,b]$.", "$\\big[uv\\big]_a^b-\\int_a^b v\\,du$."),
    "choosing wisely": g("Good $u$/dv makes the new integral easier.", "Aim for a $\\int v\\,du$ simpler than the original.")
  },
  concepts: [
    cn(1, "The formula", "From the product rule, $\\int u\\,dv=uv-\\int v\\,du$. Split the integrand into a part to differentiate ($u$) and a part to integrate ($dv$).", ["Choose $u$ and $dv$ so $u\\,dv$ is the integrand.", "Differentiate $u$; integrate $dv$.", "Assemble $uv-\\int v\\,du$."]),
    cn(2, "Choosing $u$ with LIATE", "Pick $u$ as the function type appearing earliest in LIATE (Log, Inverse-trig, Algebraic, Trig, Exponential); the rest is $dv$. This usually makes $\\int v\\,du$ simpler.", ["Classify each factor by LIATE.", "Let $u$ be the earlier type.", "Let $dv$ be the remainder."]),
    cn(3, "Algebraic × exponential/trig", "For $\\int x e^x\\,dx$ or $\\int x\\cos x\\,dx$, choose $u=x$ (differentiates to a constant) so one round of parts finishes the job.", ["Set $u=x$, $dv=e^x\\,dx$ (or $\\cos x\\,dx$).", "Apply the formula.", "The remaining integral is elementary."]),
    cn(4, "Logarithms and inverse trig", "For $\\int\\ln x\\,dx$ or $\\int\\arctan x\\,dx$, let $u$ be the log/inverse-trig (there's no obvious antiderivative) and $dv=dx$.", ["Set $u=\\ln x$ (or $\\arctan x$), $dv=dx$.", "Then $v=x$ and $du$ is algebraic.", "Finish the simpler integral."]),
    cn(5, "Repeat and cyclic cases", "Sometimes parts must be applied twice (reduction), or it cycles back to the original integral — then solve for it algebraically, as with $\\int e^x\\sin x\\,dx$.", ["Apply parts once; if still a product, apply again.", "If the original reappears, set the equation.", "Solve algebraically for the integral."])
  ],
  examples: [
    ex("Work by a spring-like force", "Force times distance where force depends on position.", "Products like $x\\,e^{-x}$ arise and integrate by parts to give total work."),
    ex("Expected value in probability", "Averaging $x$ against a density $e^{-x}$.", "$\\int x e^{-x}\\,dx$ (an expected value) is a textbook integration-by-parts."),
    ex("Signal energy", "Combining a ramp with an oscillation.", "$\\int x\\sin x\\,dx$-type integrals appear and are solved by parts.")
  ],
  videos: vids("integration by parts formula LIATE choosing u dv", "integration by parts examples ln x arctan cyclic", "calculus 2 integration by parts worked problems"),
  problems: [
    pr("p01","easy","Find $\\int x e^x\\,dx$.","$e^x(x-1)+C$",["$u=x$, $dv=e^x\\,dx$; $v=e^x$.","$xe^x-\\int e^x\\,dx$.","$e^x(x-1)+C$."],"Let $u=x$."),
    pr("p02","easy","Find $\\int \\ln x\\,dx$.","$x\\ln x-x+C$",["$u=\\ln x$, $dv=dx$; $v=x$.","$x\\ln x-\\int 1\\,dx$.","$x\\ln x-x+C$."],"$u=\\ln x$, $dv=dx$."),
    pr("p03","medium","Find $\\int x\\cos x\\,dx$.","$x\\sin x+\\cos x+C$",["$u=x$, $dv=\\cos x\\,dx$; $v=\\sin x$.","$x\\sin x-\\int\\sin x\\,dx$.","$x\\sin x+\\cos x+C$."],"$u=x$."),
    pr("p04","medium","Find $\\int x\\ln x\\,dx$.","$\\tfrac{x^2}{2}\\ln x-\\tfrac{x^2}{4}+C$",["$u=\\ln x$, $dv=x\\,dx$; $v=\\tfrac{x^2}{2}$.","$\\tfrac{x^2}{2}\\ln x-\\int\\tfrac{x}{2}\\,dx$.","$\\tfrac{x^2}{2}\\ln x-\\tfrac{x^2}{4}+C$."],"$u=\\ln x$ even with the $x$."),
    pr("p05","medium","Find $\\int \\arctan x\\,dx$.","$x\\arctan x-\\tfrac12\\ln(1+x^2)+C$",["$u=\\arctan x$, $dv=dx$; $v=x$.","$x\\arctan x-\\int\\frac{x}{1+x^2}\\,dx$.","$x\\arctan x-\\tfrac12\\ln(1+x^2)+C$."],"$dv=dx$; finish with a log substitution."),
    pr("p06","hard","Find $\\int x^2 e^x\\,dx$.","$e^x(x^2-2x+2)+C$",["Parts once: $x^2e^x-2\\int xe^x\\,dx$.","Use the earlier result for $\\int xe^x$.","$e^x(x^2-2x+2)+C$."],"Apply parts twice (reduction)."),
    pr("p07","hard","Evaluate $\\int_0^1 x e^x\\,dx$.","$1$",["Antiderivative $e^x(x-1)$.","$[e^x(x-1)]_0^1=0-(-1)$.","$=1$."],"Use the indefinite result, then FTC."),
    pr("p08","stretch","Find $\\int e^x\\sin x\\,dx$.","$\\tfrac12 e^x(\\sin x-\\cos x)+C$",["Parts twice returns the original integral $I$.","$I=e^x\\sin x-e^x\\cos x-I$ (up to signs).","Solve: $I=\\tfrac12 e^x(\\sin x-\\cos x)+C$."],"Cyclic — solve for $I$.")
  ] },

{ id: "calc2-04-trig-integrals", title: "Trigonometric Integrals", chapter: "Vol. 2, Ch. 3.2", problems: [73,74,78,81,85,91,97,100],
  summary: "Integrals of powers of sine, cosine, tangent, and secant use trig identities to reduce to substitutions. Odd powers peel off one factor for $u$-substitution; even powers use the power-reduction (half-angle) identities.",
  glossary: {
    "power-reduction": g("Identities that lower even powers of sin/cos.", "$\\sin^2 x=\\tfrac{1-\\cos2x}{2}$, $\\cos^2 x=\\tfrac{1+\\cos2x}{2}$."),
    "odd power trick": g("Peel one factor to pair with $du$.", "Save one $\\sin$ (or $\\cos$) and convert the rest with $\\sin^2+\\cos^2=1$."),
    "Pythagorean identity": g("$\\sin^2 x+\\cos^2 x=1$ and its relatives.", "Also $1+\\tan^2=\\sec^2$; used to swap functions."),
    "secant-tangent": g("Integrals of $\\sec^m\\tan^n$.", "Save a $\\sec\\tan$ or $\\sec^2$ for the substitution."),
    "double-angle": g("Formulas relating angle $2x$ to $x$.", "$\\sin2x=2\\sin x\\cos x$; useful for products."),
    "u = sin or cos": g("The substitution after peeling a factor.", "Choose so its derivative matches the saved factor."),
    "product to sum": g("Rewriting $\\sin A\\cos B$ etc. as sums.", "Handles $\\int\\sin(mx)\\cos(nx)\\,dx$."),
    "reduce then integrate": g("Simplify with identities before integrating.", "Turn powers into manageable single terms.")
  },
  concepts: [
    cn(1, "Odd powers of sine or cosine", "If one of them has an odd power, save a single factor for $du$ and convert the remaining even power with $\\sin^2+\\cos^2=1$, then substitute.", ["Save one $\\sin$ (or $\\cos$) factor.", "Convert the rest using $\\sin^2=1-\\cos^2$.", "Substitute $u=\\cos$ (or $\\sin$) and integrate."]),
    cn(2, "Even powers", "When both powers are even, use power-reduction: $\\sin^2 x=\\tfrac{1-\\cos2x}{2}$, $\\cos^2 x=\\tfrac{1+\\cos2x}{2}$. This lowers the degree until integration is direct.", ["Apply the half-angle identity.", "Expand and simplify.", "Integrate each term (repeat if needed)."]),
    cn(3, "Tangent and secant", "For $\\int\\sec^m\\tan^n$, if $\\sec$ has an even power save $\\sec^2$ ($=du$ for $u=\\tan$); if $\\tan$ has an odd power save $\\sec\\tan$ ($=du$ for $u=\\sec$). Use $1+\\tan^2=\\sec^2$ to convert.", ["Decide whether $u=\\tan$ or $u=\\sec$ fits.", "Save the matching factor for $du$.", "Convert the rest with $1+\\tan^2=\\sec^2$."]),
    cn(4, "Products of different angles", "For $\\int\\sin(mx)\\cos(nx)\\,dx$ use product-to-sum identities to turn the product into a sum of single trig terms, then integrate.", ["Apply a product-to-sum formula.", "Integrate each simple term.", "Combine."]),
    cn(5, "Choosing the method", "Scan the powers: any odd power ⇒ peel a factor; all even ⇒ power-reduce; sec/tan ⇒ pick $u=\\tan$ or $u=\\sec$. A quick classification saves work.", ["Check parity of the powers.", "Match to the right technique.", "Then substitute and integrate."])
  ],
  examples: [
    ex("Power in AC circuits", "Average power involves $\\int\\sin^2$ or $\\cos^2$.", "Power-reduction identities evaluate these to give the rms-based average power."),
    ex("Fourier analysis", "Signals decompose into sines and cosines.", "Orthogonality integrals $\\int\\sin(mx)\\cos(nx)$ use product-to-sum formulas."),
    ex("Area of a wavy region", "A region bounded by a squared sinusoid.", "Its area needs $\\int\\sin^2$ or $\\cos^2$, done by power reduction.")
  ],
  videos: vids("trigonometric integrals odd even powers sine cosine", "secant tangent integrals power reduction examples", "calculus 2 trig integrals worked problems"),
  problems: [
    pr("p01","easy","Find $\\int \\sin^2 x\\,dx$.","$\\tfrac{x}{2}-\\tfrac{\\sin2x}{4}+C$",["$\\sin^2 x=\\tfrac{1-\\cos2x}{2}$.","$\\int\\tfrac12-\\tfrac12\\cos2x\\,dx$.","$\\tfrac{x}{2}-\\tfrac{\\sin2x}{4}+C$."],"Half-angle identity."),
    pr("p02","easy","Find $\\int \\cos^2 x\\,dx$.","$\\tfrac{x}{2}+\\tfrac{\\sin2x}{4}+C$",["$\\cos^2 x=\\tfrac{1+\\cos2x}{2}$.","Integrate.","$\\tfrac{x}{2}+\\tfrac{\\sin2x}{4}+C$."],"Power reduction."),
    pr("p03","medium","Find $\\int \\sin^3 x\\,dx$.","$-\\cos x+\\tfrac13\\cos^3 x+C$",["Save $\\sin x$: $\\sin^2 x=1-\\cos^2 x$.","$u=\\cos x$: $-\\int(1-u^2)\\,du$.","$-\\cos x+\\tfrac13\\cos^3 x+C$."],"Peel one sine, convert the rest."),
    pr("p04","medium","Find $\\int \\sin x\\cos^2 x\\,dx$.","$-\\tfrac13\\cos^3 x+C$",["$u=\\cos x$, $du=-\\sin x\\,dx$.","$-\\int u^2\\,du$.","$-\\tfrac13\\cos^3 x+C$."],"$u=\\cos x$."),
    pr("p05","medium","Find $\\int \\sec^2 x\\tan x\\,dx$.","$\\tfrac12\\tan^2 x+C$",["$u=\\tan x$, $du=\\sec^2 x\\,dx$.","$\\int u\\,du$.","$\\tfrac12\\tan^2 x+C$."],"Save $\\sec^2$ for $du$."),
    pr("p06","hard","Find $\\int \\tan^3 x\\sec x\\,dx$? Simpler: $\\int \\sec x\\tan x\\,dx$.","$\\sec x+C$",["Recognize the derivative of $\\sec x$.","$\\frac{d}{dx}\\sec x=\\sec x\\tan x$.","$\\sec x+C$."],"Know the sec derivative."),
    pr("p07","hard","Evaluate $\\int_0^{\\pi} \\sin^2 x\\,dx$.","$\\tfrac{\\pi}{2}$",["Antiderivative $\\tfrac{x}{2}-\\tfrac{\\sin2x}{4}$.","$\\big[\\tfrac{x}{2}\\big]_0^\\pi$ ($\\sin$ terms vanish).","$\\tfrac{\\pi}{2}$."],"The average of $\\sin^2$ is $\\tfrac12$."),
    pr("p08","stretch","Find $\\int \\cos^3 x\\,dx$.","$\\sin x-\\tfrac13\\sin^3 x+C$",["Save $\\cos x$: $\\cos^2=1-\\sin^2$.","$u=\\sin x$: $\\int(1-u^2)\\,du$.","$\\sin x-\\tfrac13\\sin^3 x+C$."],"Peel one cosine.")
  ] },

{ id: "calc2-05-trig-substitution", title: "Trigonometric Substitution", chapter: "Vol. 2, Ch. 3.3", problems: [126,128,135,139,143,147,151,153],
  summary: "Radicals of the form $\\sqrt{a^2-x^2}$, $\\sqrt{a^2+x^2}$, and $\\sqrt{x^2-a^2}$ simplify with trig substitutions $x=a\\sin\\theta$, $a\\tan\\theta$, $a\\sec\\theta$, using Pythagorean identities to remove the root. Convert back with a reference triangle.",
  glossary: {
    "trig substitution": g("Replacing $x$ with a trig function to kill a radical.", "$x=a\\sin\\theta$, $a\\tan\\theta$, or $a\\sec\\theta$ by the form."),
    "a^2 - x^2 form": g("Use $x=a\\sin\\theta$.", "Then $\\sqrt{a^2-x^2}=a\\cos\\theta$."),
    "a^2 + x^2 form": g("Use $x=a\\tan\\theta$.", "Then $\\sqrt{a^2+x^2}=a\\sec\\theta$."),
    "x^2 - a^2 form": g("Use $x=a\\sec\\theta$.", "Then $\\sqrt{x^2-a^2}=a\\tan\\theta$."),
    "reference triangle": g("A right triangle encoding the substitution.", "Reads off trig functions to convert back to $x$."),
    "back-substitute theta": g("Returning from $\\theta$ to $x$.", "Use the triangle: $\\sin\\theta=x/a$, etc."),
    "identity used": g("The Pythagorean identity that removes the root.", "$1-\\sin^2=\\cos^2$, $1+\\tan^2=\\sec^2$, $\\sec^2-1=\\tan^2$."),
    "dx conversion": g("Differentiating the substitution for $dx$.", "e.g. $dx=a\\cos\\theta\\,d\\theta$.")
  },
  concepts: [
    cn(1, "Matching the radical", "Choose the substitution by the radical: $\\sqrt{a^2-x^2}\\to x=a\\sin\\theta$, $\\sqrt{a^2+x^2}\\to x=a\\tan\\theta$, $\\sqrt{x^2-a^2}\\to x=a\\sec\\theta$.", ["Identify the form of the radical.", "Pick the matching trig substitution.", "Also compute $dx$."]),
    cn(2, "Removing the root", "The Pythagorean identity turns the radical into a single trig function: e.g. $\\sqrt{a^2-x^2}=a\\cos\\theta$. The integral becomes a trig integral.", ["Substitute $x$ and $dx$.", "Simplify the radical with the identity.", "You now have an integral in $\\theta$."]),
    cn(3, "Integrating in $\\theta$", "Evaluate the resulting trig integral (often $\\int\\cos^2$, $\\int\\sec^3$, etc.) using earlier techniques.", ["Integrate the trig expression.", "Use power-reduction or parts as needed.", "Keep the result in $\\theta$ for now."]),
    cn(4, "Converting back with a triangle", "Draw a right triangle matching the substitution to express $\\theta$-functions in $x$. For $x=a\\sin\\theta$: opposite $x$, hypotenuse $a$, adjacent $\\sqrt{a^2-x^2}$.", ["Draw the reference triangle.", "Read off each needed trig ratio in terms of $x$.", "Replace the $\\theta$-expressions."]),
    cn(5, "Completing the square first", "For radicals like $\\sqrt{x^2+4x+5}$, complete the square to $\\sqrt{(x+2)^2+1}$ and then apply the standard substitution.", ["Complete the square inside the root.", "Shift with a small substitution.", "Apply the matching trig substitution."])
  ],
  examples: [
    ex("Area of a circle segment", "Compute the area of part of a disk.", "The bounding $\\sqrt{a^2-x^2}$ integrates via $x=a\\sin\\theta$."),
    ex("Arc length of a curve", "Length involves $\\sqrt{1+(f')^2}$.", "Radicals of the $\\sqrt{a^2+x^2}$ type resolve with $x=a\\tan\\theta$."),
    ex("Electric field of a rod", "Physics integrals with $\\sqrt{x^2+a^2}$ in the denominator.", "Trig substitution with $x=a\\tan\\theta$ evaluates them cleanly.")
  ],
  videos: vids("trigonometric substitution which substitution radical forms", "trig substitution reference triangle back substitute examples", "calculus 2 trig substitution worked problems"),
  problems: [
    pr("p01","easy","Which substitution suits $\\int\\dfrac{dx}{\\sqrt{9-x^2}}$?","$x=3\\sin\\theta$",["Form $a^2-x^2$ with $a=3$.","Use $x=a\\sin\\theta$.","$x=3\\sin\\theta$."],"$a^2-x^2\\Rightarrow\\sin$."),
    pr("p02","easy","Evaluate $\\int\\dfrac{dx}{\\sqrt{1-x^2}}$.","$\\arcsin x+C$",["$x=\\sin\\theta$; integral becomes $\\int d\\theta$.","$\\theta=\\arcsin x$.","$\\arcsin x+C$."],"A standard result."),
    pr("p03","medium","Evaluate $\\int\\dfrac{dx}{1+x^2}$.","$\\arctan x+C$",["$x=\\tan\\theta$; $dx=\\sec^2\\theta\\,d\\theta$, denom $=\\sec^2\\theta$.","$\\int d\\theta=\\theta$.","$\\arctan x+C$."],"$a^2+x^2\\Rightarrow\\tan$."),
    pr("p04","medium","Which substitution suits $\\int\\sqrt{x^2-4}\\,dx$?","$x=2\\sec\\theta$",["Form $x^2-a^2$ with $a=2$.","Use $x=a\\sec\\theta$.","$x=2\\sec\\theta$."],"$x^2-a^2\\Rightarrow\\sec$."),
    pr("p05","medium","For $x=3\\sin\\theta$, what is $\\sqrt{9-x^2}$?","$3\\cos\\theta$",["$9-9\\sin^2\\theta=9\\cos^2\\theta$.","Root: $3\\cos\\theta$.","Done."],"$1-\\sin^2=\\cos^2$."),
    pr("p06","hard","Evaluate $\\int\\sqrt{4-x^2}\\,dx$.","$2\\arcsin\\tfrac{x}{2}+\\tfrac{x}{2}\\sqrt{4-x^2}+C$",["$x=2\\sin\\theta$: $\\int 4\\cos^2\\theta\\,d\\theta$.","Power-reduce and integrate: $2\\theta+2\\sin\\theta\\cos\\theta$.","Back-substitute via the triangle."],"$\\int\\cos^2$ then triangle."),
    pr("p07","hard","Complete the square: $\\sqrt{x^2+2x+5}$.","$\\sqrt{(x+1)^2+4}$",["$x^2+2x+5=(x+1)^2+4$.","Now $a^2+u^2$ form.","Use $u=2\\tan\\theta$."],"Complete the square before substituting."),
    pr("p08","stretch","Evaluate $\\int\\dfrac{dx}{\\sqrt{x^2+1}}$.","$\\ln|x+\\sqrt{x^2+1}|+C$",["$x=\\tan\\theta$: $\\int\\sec\\theta\\,d\\theta=\\ln|\\sec\\theta+\\tan\\theta|$.","Triangle: $\\sec\\theta=\\sqrt{x^2+1}$, $\\tan\\theta=x$.","$\\ln|x+\\sqrt{x^2+1}|+C$."],"$\\int\\sec\\theta$ is a known log.")
  ] },

{ id: "calc2-06-partial-fractions", title: "Partial Fractions", chapter: "Vol. 2, Ch. 3.4", problems: [183,185,187,196,199,205,209,211],
  summary: "A proper rational function splits into a sum of simpler fractions whose denominators are the factors of the original. Each piece integrates to a logarithm or arctangent, making $\\int\\frac{P(x)}{Q(x)}\\,dx$ tractable.",
  glossary: {
    "partial fractions": g("Breaking one fraction into a sum of simpler ones.", "Match denominators to the factors of $Q(x)$."),
    "proper fraction": g("Numerator degree less than denominator degree.", "Required first; otherwise do polynomial division."),
    "linear factor": g("A factor like $(x-a)$.", "Contributes a term $\\dfrac{A}{x-a}$."),
    "repeated factor": g("A factor raised to a power, $(x-a)^2$.", "Needs terms for each power: $\\dfrac{A}{x-a}+\\dfrac{B}{(x-a)^2}$."),
    "irreducible quadratic": g("A quadratic with no real roots.", "Contributes $\\dfrac{Ax+B}{x^2+bx+c}$; integrates to log + arctan."),
    "cover-up method": g("Fast way to find constants over linear factors.", "Plug in the factor's root to isolate that constant."),
    "polynomial division": g("Reducing an improper fraction first.", "Quotient + proper remainder over $Q$."),
    "clear denominators": g("Multiply through to solve for the constants.", "Then match coefficients or substitute roots.")
  },
  concepts: [
    cn(1, "Set up the decomposition", "Factor $Q(x)$ fully. Each distinct linear factor $(x-a)$ gives $\\dfrac{A}{x-a}$; repeated factors give a term per power; irreducible quadratics give $\\dfrac{Ax+B}{\\ldots}$.", ["Factor the denominator completely.", "Write one fraction per factor (per power for repeats).", "Use $Ax+B$ over irreducible quadratics."]),
    cn(2, "Solve for the constants", "Clear denominators and either substitute the roots (cover-up) or match coefficients of like powers to get a system for $A,B,\\ldots$.", ["Multiply both sides by $Q(x)$.", "Plug in roots to isolate constants, or equate coefficients.", "Solve the resulting system."]),
    cn(3, "Improper fractions first", "If the numerator's degree is $\\ge$ the denominator's, do polynomial long division first: write quotient plus a proper remainder, then decompose the remainder.", ["Compare degrees.", "Divide to get quotient + proper fraction.", "Decompose the proper part."]),
    cn(4, "Integrating the pieces", "Each simple fraction integrates cleanly: $\\int\\dfrac{A}{x-a}\\,dx=A\\ln|x-a|$, and $\\dfrac{Ax+B}{x^2+c}$ splits into a log and an arctangent.", ["Integrate linear-denominator terms to logs.", "Split quadratic terms into log + arctan.", "Add the results."]),
    cn(5, "Repeated and quadratic factors", "Repeated linear factors and irreducible quadratics need their full set of terms; missing a term makes the system unsolvable. Include every power and every $Ax+B$.", ["List every required term.", "Solve the complete system.", "Integrate all pieces."])
  ],
  examples: [
    ex("Logistic population model", "Growth that slows as it nears a cap.", "Solving it requires $\\int\\frac{dP}{P(1-P)}$, a partial-fraction integral."),
    ex("Circuit charge over time", "A rational rate expression in an RC network.", "Partial fractions integrate the rational function to describe the charge."),
    ex("Chemical reaction rates", "Concentration change as a ratio of polynomials.", "Rate laws often integrate via partial fractions to a log expression.")
  ],
  videos: vids("partial fractions decomposition linear repeated quadratic factors", "partial fractions cover up method integrate examples", "calculus 2 partial fractions worked problems"),
  problems: [
    pr("p01","easy","Decompose $\\dfrac{1}{(x-1)(x+1)}$.","$\\tfrac12\\left(\\dfrac{1}{x-1}-\\dfrac{1}{x+1}\\right)$",["$\\dfrac{A}{x-1}+\\dfrac{B}{x+1}$; cover-up gives $A=\\tfrac12$, $B=-\\tfrac12$.","Combine.","$\\tfrac12\\left(\\dfrac{1}{x-1}-\\dfrac{1}{x+1}\\right)$."],"Cover-up at $x=1$ and $x=-1$."),
    pr("p02","easy","Find $\\int\\dfrac{dx}{x^2-1}$.","$\\tfrac12\\ln\\left|\\dfrac{x-1}{x+1}\\right|+C$",["Use the decomposition above.","$\\tfrac12(\\ln|x-1|-\\ln|x+1|)$.","$\\tfrac12\\ln\\left|\\dfrac{x-1}{x+1}\\right|+C$."],"Integrate each simple fraction."),
    pr("p03","medium","Decompose $\\dfrac{3x+1}{x(x+1)}$.","$\\dfrac{1}{x}+\\dfrac{2}{x+1}$",["$\\dfrac{A}{x}+\\dfrac{B}{x+1}$; $A=1$ (at $x=0$), $B=2$ (at $x=-1$).","Combine.","$\\dfrac{1}{x}+\\dfrac{2}{x+1}$."],"Cover-up at the roots."),
    pr("p04","medium","Find $\\int\\dfrac{3x+1}{x(x+1)}\\,dx$.","$\\ln|x|+2\\ln|x+1|+C$",["Use the decomposition.","$\\int\\tfrac1x+\\tfrac{2}{x+1}\\,dx$.","$\\ln|x|+2\\ln|x+1|+C$."],"Each term is a log."),
    pr("p05","medium","What form fits $\\dfrac{1}{x(x^2+1)}$?","$\\dfrac{A}{x}+\\dfrac{Bx+C}{x^2+1}$",["$x$ is linear; $x^2+1$ is irreducible.","Use $Bx+C$ over the quadratic.","$\\dfrac{A}{x}+\\dfrac{Bx+C}{x^2+1}$."],"Irreducible quadratic needs $Bx+C$."),
    pr("p06","hard","Find $\\int\\dfrac{dx}{x(x^2+1)}$.","$\\ln|x|-\\tfrac12\\ln(x^2+1)+C$",["Decompose: $\\tfrac1x-\\dfrac{x}{x^2+1}$.","Integrate: $\\ln|x|-\\tfrac12\\ln(x^2+1)$.","$+C$."],"Split off the quadratic term."),
    pr("p07","hard","Decompose $\\dfrac{x}{(x-1)^2}$.","$\\dfrac{1}{x-1}+\\dfrac{1}{(x-1)^2}$",["Repeated factor: $\\dfrac{A}{x-1}+\\dfrac{B}{(x-1)^2}$.","$x=A(x-1)+B$; $A=1$, $B=1$.","$\\dfrac{1}{x-1}+\\dfrac{1}{(x-1)^2}$."],"Include both powers."),
    pr("p08","stretch","Before decomposing $\\dfrac{x^2}{x^2-1}$, what must you do?","Divide first (it's improper)",["Degrees are equal ⇒ improper.","Divide: $1+\\dfrac{1}{x^2-1}$.","Then decompose the remainder."],"Improper ⇒ polynomial division first.")
  ] },

{ id: "calc2-07-improper", title: "Improper Integrals", chapter: "Vol. 2, Ch. 3.7", problems: [347,349,353,357,361,365,369,373],
  summary: "Improper integrals have an infinite limit or an unbounded integrand. Replace the trouble with a limit: $\\int_a^\\infty f\\,dx=\\lim_{t\\to\\infty}\\int_a^t f\\,dx$. If the limit is finite the integral converges; otherwise it diverges.",
  glossary: {
    "improper integral": g("An integral with an infinite bound or a blowup.", "Defined by a limit of ordinary integrals."),
    "converges": g("The limit defining it is a finite number.", "The area is finite despite the infinite extent."),
    "diverges": g("The limit is infinite or does not exist.", "No finite value."),
    "type 1": g("Infinite interval of integration.", "$\\int_a^\\infty$ or $\\int_{-\\infty}^b$."),
    "type 2": g("Integrand unbounded at a point.", "A vertical asymptote inside or at an endpoint."),
    "p-integral": g("The benchmark $\\int_1^\\infty x^{-p}\\,dx$.", "Converges iff $p>1$."),
    "comparison test": g("Bound your integrand by a known one.", "Smaller than a convergent ⇒ converges; bigger than a divergent ⇒ diverges."),
    "split at the blowup": g("Break the integral at an interior singularity.", "Each piece must converge on its own.")
  },
  concepts: [
    cn(1, "Infinite intervals (Type 1)", "Replace the infinite bound by $t$ and take a limit: $\\int_a^\\infty f\\,dx=\\lim_{t\\to\\infty}\\int_a^t f\\,dx$. A finite limit means convergence.", ["Rewrite with a finite upper limit $t$.", "Integrate normally.", "Take the limit as $t\\to\\infty$."]),
    cn(2, "Unbounded integrands (Type 2)", "If $f$ blows up at an endpoint $c$, use $\\lim_{t\\to c}\\int_a^t f\\,dx$. If the blowup is interior, split there and require both halves to converge.", ["Locate the singularity.", "Approach it with a limit.", "Split at interior blowups; both pieces must converge."]),
    cn(3, "The $p$-test", "The benchmark $\\int_1^\\infty x^{-p}\\,dx$ converges exactly when $p>1$; $\\int_0^1 x^{-p}\\,dx$ converges when $p<1$. Memorize these thresholds.", ["Match your integral to a $p$-form.", "Apply the threshold.", "Conclude convergence or divergence."]),
    cn(4, "Comparison test", "If $0\\le f\\le g$ and $\\int g$ converges, so does $\\int f$; if $f\\ge g\\ge0$ and $\\int g$ diverges, so does $\\int f$. Compare to a known $p$-integral.", ["Bound $f$ above or below by a simpler $g$.", "Know whether $\\int g$ converges.", "Transfer the conclusion to $\\int f$."]),
    cn(5, "Evaluating exactly", "When it converges, compute the value: find the antiderivative, evaluate at $t$, and take the limit. Many give clean numbers like $1$ or $\\ln$-free constants.", ["Antidifferentiate.", "Evaluate the limit expression.", "Simplify to the finite value."])
  ],
  examples: [
    ex("Escape energy", "Work to move a rocket infinitely far from Earth.", "Gravity $\\propto1/r^2$ gives a convergent improper integral — finite escape energy."),
    ex("Probability tails", "A distribution stretching to infinity must total 1.", "Normalizing a density requires a convergent improper integral over all outcomes."),
    ex("Steady-state accumulation", "A decaying signal integrated over all time.", "Exponential decay $e^{-t}$ integrates to a finite total, converging.")
  ],
  videos: vids("improper integrals infinite limits convergence divergence", "improper integral p test comparison examples", "calculus 2 improper integrals worked problems"),
  problems: [
    pr("p01","easy","Evaluate $\\int_1^\\infty\\dfrac{1}{x^2}\\,dx$.","$1$",["$\\lim_{t\\to\\infty}[-1/x]_1^t$.","$=\\lim(-1/t+1)$.","$=1$ (converges)."],"$p=2>1$ ⇒ converges."),
    pr("p02","easy","Does $\\int_1^\\infty\\dfrac{1}{x}\\,dx$ converge?","No (diverges)",["$\\lim[\\ln x]_1^t=\\lim\\ln t$.","$\\to\\infty$.","Diverges."],"$p=1$ is the borderline — diverges."),
    pr("p03","medium","Evaluate $\\int_0^\\infty e^{-x}\\,dx$.","$1$",["$\\lim[-e^{-x}]_0^t$.","$=\\lim(-e^{-t}+1)$.","$=1$."],"Exponential decay converges."),
    pr("p04","medium","Does $\\int_1^\\infty\\dfrac{1}{x^{3/2}}\\,dx$ converge?","Yes",["$p=3/2>1$.","By the $p$-test it converges.","(Value $2$.)"],"Check $p$ against $1$."),
    pr("p05","medium","Evaluate $\\int_0^1\\dfrac{1}{\\sqrt{x}}\\,dx$.","$2$",["Type 2 at $0$: $\\lim_{t\\to0^+}[2\\sqrt x]_t^1$.","$=2-0$.","$=2$ (converges, $p=\\tfrac12<1$)."],"$\\int_0^1 x^{-p}$ converges for $p<1$."),
    pr("p06","hard","Use comparison: does $\\int_1^\\infty\\dfrac{1}{x^2+1}\\,dx$ converge?","Yes",["$\\dfrac{1}{x^2+1}\\le\\dfrac{1}{x^2}$.","$\\int_1^\\infty x^{-2}$ converges.","So does the smaller one."],"Compare to $1/x^2$."),
    pr("p07","hard","Evaluate $\\int_0^\\infty x e^{-x}\\,dx$.","$1$",["Parts: antiderivative $-e^{-x}(x+1)$.","$\\lim[-e^{-x}(x+1)]_0^t=0-(-1)$.","$=1$."],"Integrate by parts, then take the limit."),
    pr("p08","stretch","Does $\\int_2^\\infty\\dfrac{1}{x\\ln x}\\,dx$ converge?","No (diverges)",["$u=\\ln x$: $\\int\\frac{du}{u}=\\ln\\ln x$.","$\\to\\infty$.","Diverges."],"Substitute $u=\\ln x$.")
  ] },

{ id: "calc2-08-taylor-polynomials", title: "Taylor & Maclaurin Polynomials", chapter: "Vol. 2, Ch. 6.3", problems: [118,119,120,121,122,123,125,127],
  summary: "A Taylor polynomial approximates a function near $a$ using its derivatives there: $P_n(x)=\\sum_{k=0}^n\\dfrac{f^{(k)}(a)}{k!}(x-a)^k$. Centered at $0$ it's a Maclaurin polynomial. Higher degree means better local accuracy.",
  glossary: {
    "Taylor polynomial": g("A polynomial matching a function's derivatives at $a$.", "$P_n(x)=\\sum_{k=0}^n\\dfrac{f^{(k)}(a)}{k!}(x-a)^k$."),
    "Maclaurin polynomial": g("A Taylor polynomial centered at $0$.", "$\\sum\\dfrac{f^{(k)}(0)}{k!}x^k$."),
    "center": g("The point $a$ where derivatives are taken.", "Approximation is best near $a$."),
    "degree n": g("The highest power kept.", "More terms ⇒ better local fit."),
    "factorial": g("$k!=k(k-1)\\cdots1$ in the denominators.", "Scales each derivative term."),
    "remainder": g("The error $R_n=f-P_n$.", "Taylor's theorem bounds it."),
    "linear approximation": g("The degree-1 Taylor polynomial.", "The tangent line $f(a)+f'(a)(x-a)$."),
    "quadratic approximation": g("Degree-2 Taylor polynomial.", "Adds the curvature term $\\tfrac{f''(a)}{2}(x-a)^2$.")
  },
  concepts: [
    cn(1, "Matching derivatives", "The Taylor polynomial is built so that $P_n$ and its first $n$ derivatives equal $f$'s at $a$. The $k$-th term is $\\dfrac{f^{(k)}(a)}{k!}(x-a)^k$.", ["Compute $f(a),f'(a),\\ldots,f^{(n)}(a)$.", "Form each term $\\dfrac{f^{(k)}(a)}{k!}(x-a)^k$.", "Sum them for $P_n$."]),
    cn(2, "Maclaurin (center 0)", "Centered at $0$, the formula simplifies to $\\sum\\dfrac{f^{(k)}(0)}{k!}x^k$. The classics: $e^x$, $\\sin x$, $\\cos x$, and $\\frac{1}{1-x}$.", ["Evaluate derivatives at $0$.", "Use powers of $x$.", "Recognize the standard series patterns."]),
    cn(3, "Standard expansions", "$e^x=1+x+\\tfrac{x^2}{2!}+\\cdots$, $\\sin x=x-\\tfrac{x^3}{3!}+\\cdots$, $\\cos x=1-\\tfrac{x^2}{2!}+\\cdots$. Knowing these lets you build others by substitution.", ["Memorize $e^x,\\sin x,\\cos x$ series.", "Substitute to get related ones (e.g. $e^{-x^2}$).", "Truncate to the needed degree."]),
    cn(4, "Accuracy and remainder", "The error $R_n(x)=f(x)-P_n(x)$ shrinks as $n$ grows or $x$ nears $a$. Taylor's remainder gives a bound $\\dfrac{M}{(n+1)!}|x-a|^{n+1}$.", ["Estimate the max derivative $M$ on the interval.", "Apply the remainder bound.", "Choose $n$ to hit a target accuracy."]),
    cn(5, "Using polynomials to estimate", "Plug a value into $P_n$ to approximate $f$ — e.g. $e^{0.1}\\approx1+0.1+\\tfrac{0.01}{2}$. This is how calculators evaluate transcendental functions.", ["Pick the degree for the accuracy you need.", "Substitute the value.", "Add the terms."])
  ],
  examples: [
    ex("How calculators compute $\\sin$", "A calculator needs $\\sin(0.3)$ instantly.", "It sums a few Maclaurin terms — a polynomial the hardware can evaluate directly."),
    ex("Small-angle pendulum", "For tiny swings, $\\sin\\theta\\approx\\theta$.", "The first Taylor term linearizes the pendulum equation."),
    ex("Approximating $e$", "Estimate $e$ by hand.", "$e=e^1\\approx1+1+\\tfrac12+\\tfrac16+\\cdots$ from the Maclaurin polynomial.")
  ],
  videos: vids("taylor maclaurin polynomial derivatives factorial formula", "taylor polynomial e^x sin cos approximation examples", "calculus 2 taylor maclaurin polynomials worked problems"),
  problems: [
    pr("p01","easy","Find the degree-2 Maclaurin polynomial of $e^x$.","$1+x+\\tfrac{x^2}{2}$",["$f,f',f''=e^x$; at $0$ all equal $1$.","Terms $1,\\ x,\\ \\tfrac{x^2}{2}$.","$1+x+\\tfrac{x^2}{2}$."],"All derivatives of $e^x$ are $1$ at $0$."),
    pr("p02","easy","Find the degree-3 Maclaurin polynomial of $\\sin x$.","$x-\\tfrac{x^3}{6}$",["$\\sin$ series.","$x-\\tfrac{x^3}{3!}$.","$x-\\tfrac{x^3}{6}$."],"Odd powers only."),
    pr("p03","medium","Find the degree-2 Maclaurin polynomial of $\\cos x$.","$1-\\tfrac{x^2}{2}$",["$\\cos$ series.","$1-\\tfrac{x^2}{2!}$.","$1-\\tfrac{x^2}{2}$."],"Even powers only."),
    pr("p04","medium","Use it to estimate $e^{0.1}$ (degree 2).","$\\approx1.105$",["$1+0.1+\\tfrac{0.01}{2}$.","$=1.105$.","Close to $1.10517$."],"Plug $0.1$ into the polynomial."),
    pr("p05","medium","Find the degree-1 Taylor polynomial of $\\ln x$ at $a=1$.","$x-1$",["$f(1)=0$, $f'(1)=1$.","$0+1\\cdot(x-1)$.","$x-1$."],"Linear Taylor = tangent line."),
    pr("p06","hard","Find the degree-2 Taylor polynomial of $\\sqrt{x}$ at $a=4$.","$2+\\tfrac14(x-4)-\\tfrac{1}{64}(x-4)^2$",["$f=2$, $f'=\\tfrac14$, $f''=-\\tfrac{1}{32}$ at $4$.","Second term $\\tfrac{f''}{2}(x-4)^2$.","$2+\\tfrac14(x-4)-\\tfrac{1}{64}(x-4)^2$."],"Compute $f,f',f''$ at $4$."),
    pr("p07","hard","Find the Maclaurin polynomial (degree 4) of $e^{-x^2}$.","$1-x^2+\\tfrac{x^4}{2}$",["Substitute $-x^2$ into $e^u=1+u+\\tfrac{u^2}{2}$.","$1-x^2+\\tfrac{x^4}{2}$.","Done."],"Substitute into the $e^u$ series."),
    pr("p08","stretch","Estimate $\\cos(0.2)$ (degree 2).","$\\approx0.98$",["$1-\\tfrac{0.04}{2}$.","$=1-0.02$.","$\\approx0.98$."],"Use the $\\cos$ polynomial.")
  ] },

{ id: "calc2-09-sequences", title: "Sequences", chapter: "Vol. 2, Ch. 5.1", problems: [1,3,7,9,12,23,31,47],
  summary: "A sequence is an ordered list $a_1,a_2,\\ldots$; it converges if $\\lim_{n\\to\\infty}a_n=L$ exists. Limit laws, the squeeze theorem, and monotone-plus-bounded arguments determine convergence — the groundwork for infinite series.",
  glossary: {
    "sequence": g("An ordered list of numbers indexed by $n$.", "Written $\\{a_n\\}$; a function on the positive integers."),
    "converges": g("The terms approach a finite limit.", "$\\lim_{n\\to\\infty}a_n=L$ exists."),
    "diverges": g("No finite limit (grows, oscillates, etc.).", "$\\lim a_n$ is $\\pm\\infty$ or DNE."),
    "monotonic": g("Always increasing or always decreasing.", "$a_{n+1}\\ge a_n$ (or $\\le$) for all $n$."),
    "bounded": g("Trapped between fixed numbers.", "There's an $M$ with $|a_n|\\le M$."),
    "monotone convergence": g("Monotonic + bounded ⇒ convergent.", "A key existence theorem for limits."),
    "recursive sequence": g("Each term defined from previous ones.", "e.g. $a_{n+1}=\\tfrac12(a_n+2/a_n)$."),
    "squeeze for sequences": g("Trap $a_n$ between two sequences with equal limits.", "Then $a_n$ shares that limit.")
  },
  concepts: [
    cn(1, "Limits of sequences", "A sequence converges to $L$ if its terms get and stay arbitrarily close to $L$. Compute limits with the same tools as functions: divide by the highest power, use known limits.", ["Write $a_n$ as a function of $n$.", "Take $\\lim_{n\\to\\infty}$ using algebra or known limits.", "A finite result means convergence."]),
    cn(2, "Common limit forms", "Useful facts: $\\dfrac{1}{n^p}\\to0$ ($p>0$), $r^n\\to0$ if $|r|<1$, $\\sqrt[n]{n}\\to1$, and $\\left(1+\\tfrac{x}{n}\\right)^n\\to e^x$.", ["Recognize the standard form.", "Apply the known limit.", "Combine with limit laws."]),
    cn(3, "The squeeze theorem", "If $b_n\\le a_n\\le c_n$ and $b_n,c_n\\to L$, then $a_n\\to L$. Handy for terms with bounded oscillating factors like $\\dfrac{\\sin n}{n}$.", ["Bound $a_n$ above and below.", "Show both bounds share a limit.", "Conclude $a_n$ has that limit."]),
    cn(4, "Monotone and bounded", "A sequence that is monotonic and bounded must converge (even if you can't find the limit). This proves existence for recursive sequences.", ["Show the sequence is monotonic.", "Show it's bounded.", "Conclude it converges."]),
    cn(5, "Divergence", "Sequences diverge by growing without bound, or by oscillating (like $(-1)^n$) so no single limit exists. Recognizing divergence prevents wasted series tests later.", ["Check for unbounded growth.", "Check for persistent oscillation.", "Either ⇒ diverges."])
  ],
  examples: [
    ex("Repeated averaging", "Newton's method refines a guess each step.", "The iterates form a recursive sequence converging to the root."),
    ex("Drug half-life leftovers", "A dose halves each period.", "The remaining amount is a geometric sequence $a_n=a_0 r^n\\to0$."),
    ex("Digital sampling", "A signal sampled ever more finely.", "The sample values form a sequence whose limit is the true value.")
  ],
  videos: vids("sequences limit convergence divergence examples", "sequence limit laws squeeze monotone bounded", "calculus 2 sequences worked problems"),
  problems: [
    pr("p01","easy","Find $\\lim_{n\\to\\infty}\\dfrac{1}{n}$.","$0$",["Reciprocal of a growing number.","$\\to0$.","Converges to $0$."],"$1/n^p\\to0$."),
    pr("p02","easy","Find $\\lim_{n\\to\\infty}\\dfrac{3n+1}{n}$.","$3$",["$3+\\tfrac1n$.","$\\to3$.","Converges."],"Split the fraction."),
    pr("p03","easy","Does $a_n=(-1)^n$ converge?","No",["Terms alternate $1,-1,1,\\ldots$.","No single limit.","Diverges."],"Oscillation ⇒ divergence."),
    pr("p04","medium","Find $\\lim_{n\\to\\infty}\\dfrac{2n^2}{n^2+1}$.","$2$",["Divide by $n^2$: $\\dfrac{2}{1+1/n^2}$.","$\\to2$.","Converges."],"Divide by the highest power."),
    pr("p05","medium","Find $\\lim_{n\\to\\infty}\\left(\\tfrac12\\right)^n$.","$0$",["$|r|=\\tfrac12<1$.","$r^n\\to0$.","$=0$."],"Geometric with $|r|<1$."),
    pr("p06","medium","Find $\\lim_{n\\to\\infty}\\dfrac{\\sin n}{n}$.","$0$",["$-\\tfrac1n\\le\\dfrac{\\sin n}{n}\\le\\tfrac1n$.","Both bounds $\\to0$.","Squeeze ⇒ $0$."],"Squeeze with $\\pm1/n$."),
    pr("p07","hard","Find $\\lim_{n\\to\\infty}\\left(1+\\tfrac1n\\right)^n$.","$e$",["Standard limit.","$\\to e$.","$\\approx2.718$."],"The definition of $e$."),
    pr("p08","stretch","Find $\\lim_{n\\to\\infty}\\sqrt[n]{n}$.","$1$",["Take $\\ln$: $\\tfrac{\\ln n}{n}\\to0$.","So the sequence $\\to e^0$.","$=1$."],"Take a log and use L'Hôpital.")
  ] },

{ id: "calc2-10-series", title: "Infinite Series & Comparison Tests", chapter: "Vol. 2, Ch. 5.2–5.4", problems: [1,4,13,14,16,22,24,26],
  summary: "A series $\\sum a_n$ adds a sequence's terms; it converges if its partial sums approach a limit. Geometric and $p$-series are the benchmarks; the divergence test, integral test, and comparison tests decide the rest.",
  glossary: {
    "series": g("The sum of a sequence's terms.", "$\\sum_{n=1}^\\infty a_n=\\lim_{N\\to\\infty}\\sum_{n=1}^N a_n$."),
    "partial sum": g("The sum of the first $N$ terms.", "$S_N=a_1+\\cdots+a_N$; the series is $\\lim S_N$."),
    "geometric series": g("Constant ratio between terms.", "$\\sum ar^{n}$ converges to $\\dfrac{a}{1-r}$ iff $|r|<1$."),
    "p-series": g("$\\sum\\dfrac{1}{n^p}$.", "Converges iff $p>1$."),
    "divergence test": g("If terms don't go to 0, the series diverges.", "$\\lim a_n\\neq0\\Rightarrow$ diverges (not a convergence test)."),
    "integral test": g("Compare a positive decreasing series to an integral.", "$\\sum f(n)$ and $\\int f$ converge together."),
    "comparison test": g("Bound terms by a known series.", "Smaller than convergent ⇒ converges; bigger than divergent ⇒ diverges."),
    "limit comparison": g("Compare via the ratio of terms' limit.", "If $\\lim a_n/b_n$ is finite and positive, both do the same.")
  },
  concepts: [
    cn(1, "Series and partial sums", "A series converges when its partial sums $S_N$ approach a finite limit. Convergence is really a statement about the sequence of partial sums.", ["Form the partial sums $S_N$.", "Take $\\lim_{N\\to\\infty}S_N$.", "Finite ⇒ converges to that sum."]),
    cn(2, "Geometric and $p$-series", "The two benchmarks: geometric $\\sum ar^n$ converges to $\\dfrac{a}{1-r}$ iff $|r|<1$; the $p$-series $\\sum n^{-p}$ converges iff $p>1$ (the harmonic series $p=1$ diverges).", ["Identify geometric ($ar^n$) or $p$-series form.", "Check $|r|<1$ or $p>1$.", "For geometric, sum with $\\dfrac{a}{1-r}$."]),
    cn(3, "The divergence test", "If $\\lim a_n\\neq0$, the series diverges. But $\\lim a_n=0$ does NOT prove convergence — it's only a necessary condition (the harmonic series is the warning).", ["Compute $\\lim a_n$.", "Nonzero ⇒ diverges immediately.", "Zero ⇒ inconclusive; use another test."]),
    cn(4, "The integral test", "For positive, decreasing terms $a_n=f(n)$, the series and $\\int_1^\\infty f\\,dx$ converge together. It proves the $p$-series rule.", ["Confirm $f$ positive and decreasing.", "Evaluate $\\int_1^\\infty f\\,dx$.", "Series matches the integral's fate."]),
    cn(5, "Comparison tests", "Compare to a benchmark: if $0\\le a_n\\le b_n$ and $\\sum b_n$ converges, so does $\\sum a_n$. Limit comparison uses $\\lim a_n/b_n$ — finite and positive means they share behavior.", ["Pick a benchmark $b_n$ (geometric or $p$).", "Bound or take the ratio limit.", "Transfer convergence/divergence."])
  ],
  examples: [
    ex("A bouncing ball's total distance", "Each bounce reaches a fixed fraction of the last height.", "The total distance is a geometric series summing to a finite length."),
    ex("Repeating decimals", "$0.\\overline{3}$ as an exact fraction.", "A repeating decimal is a geometric series equal to $\\tfrac13$."),
    ex("Zeno's paradox", "Halving the remaining distance forever.", "$\\tfrac12+\\tfrac14+\\tfrac18+\\cdots=1$ — a convergent geometric series.")
  ],
  videos: vids("infinite series partial sums geometric p series", "divergence integral comparison test examples", "calculus 2 series convergence tests worked problems"),
  problems: [
    pr("p01","easy","Sum $\\sum_{n=0}^\\infty\\left(\\tfrac12\\right)^n$.","$2$",["Geometric $a=1$, $r=\\tfrac12$.","$\\dfrac{1}{1-\\tfrac12}$.","$=2$."],"$\\dfrac{a}{1-r}$."),
    pr("p02","easy","Does $\\sum\\dfrac{1}{n^2}$ converge?","Yes",["$p$-series with $p=2>1$.","Converges.","(Sum $\\pi^2/6$.)"],"$p>1$."),
    pr("p03","easy","Does $\\sum\\dfrac{1}{n}$ converge?","No",["Harmonic series, $p=1$.","Diverges.","Done."],"The famous divergent series."),
    pr("p04","medium","Does $\\sum\\dfrac{n}{n+1}$ converge?","No",["$\\lim a_n=1\\neq0$.","Divergence test.","Diverges."],"Terms don't go to 0."),
    pr("p05","medium","Sum $\\sum_{n=1}^\\infty\\left(\\tfrac13\\right)^n$.","$\\tfrac12$",["$a=\\tfrac13$, $r=\\tfrac13$.","$\\dfrac{1/3}{1-1/3}=\\dfrac{1/3}{2/3}$.","$=\\tfrac12$."],"Start index is $1$, so $a=r=\\tfrac13$."),
    pr("p06","medium","Does $\\sum\\dfrac{1}{n^3+1}$ converge (comparison)?","Yes",["$\\dfrac{1}{n^3+1}\\le\\dfrac{1}{n^3}$.","$\\sum n^{-3}$ converges.","So does it."],"Compare to $1/n^3$."),
    pr("p07","hard","Use the integral test on $\\sum\\dfrac{1}{n\\ln n}$.","Diverges",["$\\int_2^\\infty\\frac{dx}{x\\ln x}=\\ln\\ln x\\to\\infty$.","Integral diverges.","So does the series."],"Integrate with $u=\\ln x$."),
    pr("p08","stretch","Express $0.\\overline{3}$ as a fraction using a series.","$\\tfrac13$",["$0.3+0.03+\\cdots$, geometric $a=0.3$, $r=0.1$.","$\\dfrac{0.3}{0.9}$.","$=\\tfrac13$."],"Geometric with $r=0.1$.")
  ] },

{ id: "calc2-11-alternating-ratio", title: "Alternating, Ratio & Root Tests", chapter: "Vol. 2, Ch. 5.5–5.6", problems: [250,253,257,261,266,509,513,517],
  summary: "The alternating series test handles sign-flipping series; absolute convergence is stronger than conditional. The ratio and root tests examine the growth of $|a_n|$ and settle most series with factorials or exponentials.",
  glossary: {
    "alternating series": g("Signs flip term to term.", "$\\sum(-1)^n b_n$ with $b_n>0$."),
    "alternating series test": g("Converges if terms decrease to 0.", "$b_n\\downarrow0$ ⇒ $\\sum(-1)^n b_n$ converges."),
    "absolute convergence": g("$\\sum|a_n|$ converges.", "Implies the series itself converges — the strong kind."),
    "conditional convergence": g("Converges, but $\\sum|a_n|$ diverges.", "e.g. the alternating harmonic series."),
    "ratio test": g("Look at $\\lim|a_{n+1}/a_n|$.", "$<1$ converges (absolutely), $>1$ diverges, $=1$ inconclusive."),
    "root test": g("Look at $\\lim\\sqrt[n]{|a_n|}$.", "Same thresholds as the ratio test; good for $n$-th powers."),
    "error bound": g("Alternating series error is under the next term.", "$|S-S_N|\\le b_{N+1}$."),
    "factorial growth": g("$n!$ dominates exponentials.", "Ratio test shines when factorials appear.")
  },
  concepts: [
    cn(1, "The alternating series test", "If a series alternates sign and its magnitudes $b_n$ decrease to $0$, it converges. The error after $N$ terms is at most the first omitted term $b_{N+1}$.", ["Confirm the signs alternate.", "Confirm $b_n$ decreasing and $\\to0$.", "Conclude convergence; bound error by $b_{N+1}$."]),
    cn(2, "Absolute vs conditional", "If $\\sum|a_n|$ converges, the series converges absolutely (and unconditionally). If the series converges but $\\sum|a_n|$ diverges, it's conditional — order-sensitive.", ["Test $\\sum|a_n|$ first.", "Converges ⇒ absolute.", "If not, but the series still converges ⇒ conditional."]),
    cn(3, "The ratio test", "Compute $L=\\lim\\left|\\dfrac{a_{n+1}}{a_n}\\right|$. If $L<1$ it converges absolutely; $L>1$ (or $\\infty$) diverges; $L=1$ is inconclusive. Ideal for factorials and exponentials.", ["Form the ratio of consecutive terms.", "Take its limit $L$.", "Apply the $<1/>1/=1$ rule."]),
    cn(4, "The root test", "Compute $L=\\lim\\sqrt[n]{|a_n|}$ with the same thresholds. Use it when $a_n$ has an $n$-th power, like $\\left(\\tfrac{n}{n+1}\\right)^{n^2}$.", ["Take the $n$-th root of $|a_n|$.", "Compute its limit $L$.", "Same $<1/>1/=1$ conclusions."]),
    cn(5, "Choosing a test", "Factorials or products ⇒ ratio test; $n$-th powers ⇒ root test; simple sign flips ⇒ alternating test; otherwise comparison or integral. A quick scan picks the tool.", ["Scan the term's structure.", "Match to the most efficient test.", "Apply and conclude."])
  ],
  examples: [
    ex("Leibniz's formula for $\\pi$", "$\\pi/4=1-\\tfrac13+\\tfrac15-\\cdots$.", "This alternating series converges (conditionally) by the alternating series test."),
    ex("Truncation error control", "Approximate a value and bound the error.", "For an alternating series the error is at most the next term — a clean guarantee."),
    ex("Exponential series convergence", "Why $e^x=\\sum x^n/n!$ works for all $x$.", "The ratio test gives $L=0<1$ for every $x$ — converges everywhere.")
  ],
  videos: vids("alternating series test absolute conditional convergence", "ratio test root test factorial examples", "calculus 2 series ratio root alternating worked problems"),
  problems: [
    pr("p01","easy","Does $\\sum(-1)^n\\dfrac1n$ converge?","Yes (conditionally)",["Alternating, $b_n=\\tfrac1n\\downarrow0$.","Alternating test ⇒ converges.","$\\sum\\tfrac1n$ diverges ⇒ conditional."],"Alternating harmonic series."),
    pr("p02","easy","Apply the ratio test to $\\sum\\dfrac{1}{n!}$.","Converges",["$\\dfrac{a_{n+1}}{a_n}=\\dfrac{1}{n+1}\\to0$.","$L=0<1$.","Converges (to $e$)."],"Factorials shrink the ratio to 0."),
    pr("p03","medium","Apply the ratio test to $\\sum\\dfrac{2^n}{n!}$.","Converges",["$\\dfrac{2^{n+1}/(n+1)!}{2^n/n!}=\\dfrac{2}{n+1}\\to0$.","$L=0<1$.","Converges."],"$n!$ beats $2^n$."),
    pr("p04","medium","Apply the ratio test to $\\sum n\\left(\\tfrac12\\right)^n$.","Converges",["Ratio $\\to\\tfrac12<1$.","Converges absolutely.","Done."],"$L=\\tfrac12$."),
    pr("p05","medium","Is $\\sum\\dfrac{(-1)^n}{n^2}$ absolutely convergent?","Yes",["$\\sum\\tfrac{1}{n^2}$ converges ($p=2$).","So it's absolute.","Converges."],"Check $\\sum|a_n|$."),
    pr("p06","hard","Apply the ratio test to $\\sum\\dfrac{n!}{n^n}$.","Converges",["Ratio $\\to\\dfrac{1}{(1+1/n)^n}\\to\\tfrac1e<1$.","$L=1/e<1$.","Converges."],"Ratio limit is $1/e$."),
    pr("p07","hard","Apply the root test to $\\sum\\left(\\dfrac{n}{2n+1}\\right)^n$.","Converges",["$\\sqrt[n]{|a_n|}=\\dfrac{n}{2n+1}\\to\\tfrac12$.","$L=\\tfrac12<1$.","Converges."],"$n$-th power ⇒ root test."),
    pr("p08","stretch","How many terms of $\\sum\\dfrac{(-1)^n}{n}$ ensure error $<0.1$?","10 terms",["Error $\\le b_{N+1}=\\dfrac{1}{N+1}$.","$\\dfrac{1}{N+1}<0.1\\Rightarrow N+1>10$.","$N=10$."],"Alternating error $\\le$ next term.")
  ] },

{ id: "calc2-12-power-series", title: "Power & Taylor Series", chapter: "Vol. 2, Ch. 6.1, 6.3", problems: [13,15,17,19,21,140,145,151],
  summary: "A power series $\\sum c_n(x-a)^n$ converges on an interval set by its radius $R$ (found via the ratio test). Within $R$ it represents a function you can differentiate and integrate term by term; Taylor series extend the polynomial idea to infinitely many terms.",
  glossary: {
    "power series": g("A series in powers of $(x-a)$.", "$\\sum c_n(x-a)^n$; a function of $x$ where it converges."),
    "radius of convergence": g("Half-width of the interval where it converges.", "Found from the ratio/root test: $R$."),
    "interval of convergence": g("All $x$ for which the series converges.", "Center $\\pm R$, with endpoints checked separately."),
    "center a": g("The point the powers are measured from.", "Convergence is symmetric about $a$."),
    "term-by-term": g("Differentiate/integrate each term inside $R$.", "Legal within the radius of convergence."),
    "Taylor series": g("The infinite Taylor polynomial.", "$\\sum\\dfrac{f^{(n)}(a)}{n!}(x-a)^n$."),
    "geometric building block": g("$\\dfrac{1}{1-x}=\\sum x^n$ for $|x|<1$.", "A source series to manipulate into others."),
    "endpoint test": g("Checking convergence at $x=a\\pm R$.", "Use alternating/comparison at each endpoint.")
  },
  concepts: [
    cn(1, "Radius via the ratio test", "Apply the ratio test to $\\sum c_n(x-a)^n$ treating $x$ as fixed: convergence requires the limiting ratio $<1$, which solves to $|x-a|<R$.", ["Form $\\left|\\dfrac{c_{n+1}(x-a)^{n+1}}{c_n(x-a)^n}\\right|$.", "Take the limit and set $<1$.", "Read off $R$ from $|x-a|<R$."]),
    cn(2, "Interval and endpoints", "The series converges on $(a-R,a+R)$; the endpoints $x=a\\pm R$ must be tested individually (they can converge, diverge, or converge conditionally).", ["State the open interval from $R$.", "Substitute each endpoint.", "Test that numeric series separately."]),
    cn(3, "Building new series", "Start from $\\dfrac{1}{1-x}=\\sum x^n$ ($|x|<1$) and substitute or manipulate to get others (e.g. $\\dfrac{1}{1+x^2}$, then integrate for $\\arctan$).", ["Recognize a geometric-type base.", "Substitute to match your function.", "Adjust the interval accordingly."]),
    cn(4, "Term-by-term calculus", "Inside the radius, a power series can be differentiated and integrated term by term, producing new series with the same radius — a powerful way to find sums and antiderivatives.", ["Differentiate/integrate each term.", "Keep the same radius $R$.", "Re-index if needed."]),
    cn(5, "Taylor series representation", "Extending Taylor polynomials to infinitely many terms gives $f(x)=\\sum\\dfrac{f^{(n)}(a)}{n!}(x-a)^n$, valid where the remainder $\\to0$. The classics ($e^x,\\sin,\\cos$) converge for all $x$.", ["Compute the Taylor coefficients.", "Write the infinite series.", "State where it represents $f$ (its interval)."])
  ],
  examples: [
    ex("Representing functions in software", "A library needs $\\ln(1+x)$ for small $x$.", "Its power series $x-\\tfrac{x^2}{2}+\\cdots$ evaluates it term by term."),
    ex("Solving differential equations", "Some ODEs have no elementary solution.", "A power-series ansatz builds the solution coefficient by coefficient."),
    ex("Deriving $\\arctan$'s series", "Integrate the geometric series for $\\tfrac{1}{1+x^2}$.", "Term-by-term integration yields $\\arctan x=x-\\tfrac{x^3}{3}+\\cdots$.")
  ],
  videos: vids("power series radius interval of convergence ratio test", "power series term by term taylor series examples", "calculus 2 power taylor series worked problems"),
  problems: [
    pr("p01","easy","Find the radius of convergence of $\\sum\\dfrac{x^n}{n!}$.","$R=\\infty$",["Ratio $\\dfrac{|x|}{n+1}\\to0$ for all $x$.","Always $<1$.","$R=\\infty$."],"Factorials give infinite radius."),
    pr("p02","easy","Find the radius of convergence of $\\sum x^n$.","$R=1$",["Ratio $|x|<1$.","So $R=1$.","(Geometric.)"],"Geometric converges for $|x|<1$."),
    pr("p03","medium","Find the radius of $\\sum\\dfrac{x^n}{n}$.","$R=1$",["Ratio $\\dfrac{n}{n+1}|x|\\to|x|<1$.","$R=1$.","Done."],"The $1/n$ doesn't change the radius."),
    pr("p04","medium","Write $\\dfrac{1}{1-x}$ as a power series and give its interval.","$\\sum x^n,\\ |x|<1$",["Geometric series.","$\\sum_{n=0}^\\infty x^n$.","Converges for $|x|<1$."],"The fundamental power series."),
    pr("p05","medium","Find a series for $\\dfrac{1}{1+x^2}$.","$\\sum(-1)^n x^{2n}$",["Substitute $-x^2$ into $\\sum x^n$.","$\\sum(-x^2)^n=\\sum(-1)^n x^{2n}$.","$|x|<1$."],"Substitute $-x^2$."),
    pr("p06","medium","Find the interval of convergence of $\\sum\\dfrac{x^n}{n}$ (with endpoints).","$[-1,1)$",["$R=1$ ⇒ $(-1,1)$.","$x=1$: harmonic diverges; $x=-1$: alternating converges.","$[-1,1)$."],"Test both endpoints."),
    pr("p07","hard","Derive the series for $\\arctan x$ from $\\dfrac{1}{1+x^2}$.","$\\sum\\dfrac{(-1)^n x^{2n+1}}{2n+1}$",["Integrate $\\sum(-1)^n x^{2n}$ term by term.","$\\sum(-1)^n\\dfrac{x^{2n+1}}{2n+1}$.","$=\\arctan x$."],"Integrate the geometric-type series."),
    pr("p08","stretch","Find $R$ for $\\sum n! \\,x^n$.","$R=0$",["Ratio $(n+1)|x|\\to\\infty$ unless $x=0$.","Converges only at $x=0$.","$R=0$."],"Factorials in the numerator kill the radius.")
  ] },

{ id: "calc2-13-areas", title: "Areas Between Curves", chapter: "Vol. 2, Ch. 1.1, 2.1", problems: [1,3,5,7,11,15,19,23],
  summary: "The area between two curves is $\\int_a^b(\\text{top}-\\text{bottom})\\,dx$. Find the bounds from intersection points, integrate the height difference, and switch to $\\int(\\text{right}-\\text{left})\\,dy$ when horizontal strips are simpler.",
  glossary: {
    "area between curves": g("The region trapped between two graphs.", "$\\int_a^b (f-g)\\,dx$ with $f$ on top."),
    "top minus bottom": g("The height of a vertical strip.", "Upper curve value minus lower curve value."),
    "intersection points": g("Where the curves meet, setting the bounds.", "Solve $f(x)=g(x)$."),
    "vertical strips": g("Thin $dx$-wide rectangles.", "Height $f-g$; integrate in $x$."),
    "horizontal strips": g("Thin $dy$-wide rectangles.", "Width right$-$left; integrate in $y$."),
    "which is on top": g("The larger function over the interval.", "Test a sample point if unsure."),
    "signed vs geometric area": g("Geometric area uses top$-$bottom (always $\\ge0$).", "Different from a single signed integral."),
    "split the region": g("Break where the curves swap order.", "Integrate each piece with the correct top.")
  },
  concepts: [
    cn(1, "The height-difference integral", "Between $x=a$ and $x=b$, a vertical strip has height (top curve $-$ bottom curve). Integrating this height gives the area: $\\int_a^b (f-g)\\,dx$.", ["Identify the upper and lower curves.", "Height $=f(x)-g(x)$.", "Integrate over $[a,b]$."]),
    cn(2, "Finding the bounds", "The limits come from where the curves cross. Solve $f(x)=g(x)$ for the intersection $x$-values; those are $a$ and $b$.", ["Set $f(x)=g(x)$.", "Solve for the intersection points.", "Use the smallest and largest as bounds."]),
    cn(3, "Deciding which is on top", "Over the interval, one curve stays above. Test a sample $x$ between the intersections to see which value is larger, and put it first.", ["Pick a test point between crossings.", "Evaluate both curves there.", "Larger one is 'top'."]),
    cn(4, "Horizontal strips", "When curves are easier as $x=$ functions of $y$ (sideways parabolas, etc.), integrate right$-$left in $y$: $\\int_c^d(\\text{right}-\\text{left})\\,dy$.", ["Solve for $x$ in terms of $y$.", "Width $=$ right $-$ left.", "Integrate over the $y$-range."]),
    cn(5, "Regions that swap", "If the curves cross inside the interval, the top and bottom trade places. Split at the crossing and integrate each piece with its correct height.", ["Find all interior crossings.", "Split the interval there.", "Integrate each subregion separately."])
  ],
  examples: [
    ex("Profit between revenue and cost", "Revenue and cost curves versus quantity.", "The area between them over the profitable range represents total profit."),
    ex("Cross-section of a lens", "A lens bounded by two arcs.", "The area between the arcs gives the lens's cross-sectional area."),
    ex("Water between two levels", "A channel bounded above and below by curves.", "The between-curves integral gives the cross-sectional flow area.")
  ],
  videos: vids("area between two curves top minus bottom intersection", "area between curves vertical horizontal strips examples", "calculus 2 area between curves worked problems"),
  problems: [
    pr("p01","easy","Area between $y=x$ and $y=x^2$ from $0$ to $1$.","$\\tfrac16$",["Top $x$, bottom $x^2$.","$\\int_0^1(x-x^2)\\,dx=\\tfrac12-\\tfrac13$.","$=\\tfrac16$."],"Top minus bottom."),
    pr("p02","easy","Where do $y=x$ and $y=x^2$ intersect?","$x=0,1$",["$x=x^2$.","$x(1-x)=0$.","$x=0,1$."],"Set them equal."),
    pr("p03","medium","Area between $y=4-x^2$ and $y=0$.","$\\tfrac{32}{3}$",["Roots $x=\\pm2$.","$\\int_{-2}^2(4-x^2)\\,dx=8x-\\tfrac{x^3}{3}\\big|$... $=\\tfrac{32}{3}$.","Done."],"Integrate the parabola over $[-2,2]$."),
    pr("p04","medium","Area between $y=x^2$ and $y=2x$.","$\\tfrac43$",["Intersect at $0,2$; line on top.","$\\int_0^2(2x-x^2)\\,dx=x^2-\\tfrac{x^3}{3}\\big|_0^2$.","$4-\\tfrac83=\\tfrac43$."],"Line minus parabola."),
    pr("p05","medium","Which is on top between $y=x^2$ and $y=2x$ on $(0,2)$?","$y=2x$",["Test $x=1$: line $2$, parabola $1$.","Line larger.","$y=2x$ on top."],"Test a middle point."),
    pr("p06","hard","Area between $y=x^3$ and $y=x$ on $[0,1]$.","$\\tfrac14$",["On $(0,1)$, $x>x^3$.","$\\int_0^1(x-x^3)\\,dx=\\tfrac12-\\tfrac14$.","$=\\tfrac14$."],"$x$ is above $x^3$ there."),
    pr("p07","hard","Area between $x=y^2$ and $x=y+2$ (use $dy$).","$\\tfrac92$",["Intersect: $y^2=y+2\\Rightarrow y=-1,2$.","$\\int_{-1}^2((y+2)-y^2)\\,dy$.","$=\\tfrac92$."],"Horizontal strips: right minus left."),
    pr("p08","stretch","Area enclosed by $y=\\sin x$ and $y=\\cos x$ on $[0,\\pi/4]$.","$\\sqrt2-1$",["$\\cos\\ge\\sin$ there.","$\\int_0^{\\pi/4}(\\cos x-\\sin x)\\,dx=[\\sin x+\\cos x]_0^{\\pi/4}$.","$\\sqrt2-1$."],"Cosine is on top on $[0,\\pi/4]$.")
  ] },

{ id: "calc2-14-volumes", title: "Volumes & Arc Length", chapter: "Vol. 2, Ch. 2.2–2.4", problems: [58,74,98,120,140,165,171,191],
  summary: "Solids of revolution have volume by disks/washers $\\int\\pi(R^2-r^2)\\,dx$ or cylindrical shells $\\int2\\pi(\\text{radius})(\\text{height})\\,dx$. Arc length integrates $\\sqrt{1+(f')^2}$, and surface area adds a $2\\pi r$ factor.",
  glossary: {
    "solid of revolution": g("A shape made by spinning a region about a line.", "Volume via disks, washers, or shells."),
    "disk method": g("Slices perpendicular to the axis, no hole.", "$V=\\int\\pi R^2\\,dx$."),
    "washer method": g("Slices with a hole (region away from the axis).", "$V=\\int\\pi(R^2-r^2)\\,dx$."),
    "cylindrical shells": g("Nested thin cylinders parallel to the axis.", "$V=\\int 2\\pi(\\text{radius})(\\text{height})\\,dx$."),
    "axis of revolution": g("The line the region spins around.", "Sets the radius in each formula."),
    "arc length": g("The true length of a curve.", "$L=\\int_a^b\\sqrt{1+(f')^2}\\,dx$."),
    "surface area": g("Area of a surface of revolution.", "$S=\\int 2\\pi r\\sqrt{1+(f')^2}\\,dx$."),
    "representative slice": g("The generic thin piece you sum.", "Disk, washer, or shell — model it, then integrate.")
  },
  concepts: [
    cn(1, "Disks and washers", "Spin a region about an axis and slice perpendicular to it. A solid slice is a disk ($\\pi R^2$); a slice with a gap is a washer ($\\pi(R^2-r^2)$). Integrate along the axis.", ["Slice perpendicular to the axis.", "Outer radius $R$, inner radius $r$ (if any).", "$V=\\int\\pi(R^2-r^2)\\,dx$."]),
    cn(2, "Cylindrical shells", "Slice parallel to the axis into thin cylindrical shells of radius (distance to axis) and height (curve). Unrolled, each is a rectangle: $V=\\int 2\\pi(\\text{radius})(\\text{height})\\,dx$.", ["Identify each shell's radius and height.", "Shell volume $\\approx 2\\pi r\\,h\\,dx$.", "Integrate over the region."]),
    cn(3, "Choosing disks vs shells", "Match the slice to the geometry: if slices perpendicular to the axis are simple, use disks/washers; if parallel slices are simpler (or the axis is offset), use shells.", ["Sketch the region and axis.", "See which slicing avoids solving for the other variable.", "Pick disks/washers or shells accordingly."]),
    cn(4, "Arc length", "Sum tiny hypotenuses $\\sqrt{dx^2+dy^2}=\\sqrt{1+(f')^2}\\,dx$ along the curve: $L=\\int_a^b\\sqrt{1+(f'(x))^2}\\,dx$.", ["Compute $f'(x)$.", "Form $\\sqrt{1+(f')^2}$.", "Integrate over $[a,b]$."]),
    cn(5, "Surface area of revolution", "Spinning a curve sweeps a surface; each band has area $2\\pi r$ times the arc-length element: $S=\\int 2\\pi r\\sqrt{1+(f')^2}\\,dx$, with $r$ the distance to the axis.", ["Find the radius $r$ (distance to axis).", "Multiply the arc-length element by $2\\pi r$.", "Integrate."])
  ],
  examples: [
    ex("Volume of a wine barrel", "A curved profile spun into a solid.", "Disk/washer integration of the profile gives the barrel's volume."),
    ex("Length of a suspension cable", "A hanging cable follows a curve.", "Arc-length integration measures the true cable length for material estimates."),
    ex("Surface area of a dome", "A curve revolved into a dome shape.", "The surface-area integral gives how much material covers the dome.")
  ],
  videos: vids("volume solids of revolution disk washer shell method", "arc length surface area of revolution formula examples", "calculus 2 volumes arc length worked problems"),
  problems: [
    pr("p01","easy","Volume when $y=\\sqrt{x}$, $0\\le x\\le4$, is revolved about the $x$-axis (disks).","$8\\pi$",["$V=\\int_0^4\\pi(\\sqrt x)^2\\,dx=\\pi\\int_0^4 x\\,dx$.","$=\\pi\\cdot8$.","$8\\pi$."],"Disk radius is $\\sqrt x$."),
    pr("p02","easy","Volume when $y=x$, $0\\le x\\le1$, revolved about the $x$-axis.","$\\tfrac{\\pi}{3}$",["$V=\\pi\\int_0^1 x^2\\,dx$.","$=\\pi\\cdot\\tfrac13$.","$\\tfrac{\\pi}{3}$."],"Radius $=x$."),
    pr("p03","medium","Volume: region between $y=x$ and $y=x^2$ revolved about the $x$-axis (washers).","$\\tfrac{2\\pi}{15}$",["$V=\\pi\\int_0^1(x^2-x^4)\\,dx$.","$=\\pi(\\tfrac13-\\tfrac15)$.","$\\tfrac{2\\pi}{15}$."],"$R=x$, $r=x^2$."),
    pr("p04","medium","Shell volume: $y=x^2$, $0\\le x\\le2$, about the $y$-axis.","$8\\pi$",["$V=\\int_0^2 2\\pi x\\,(x^2)\\,dx=2\\pi\\int_0^2 x^3\\,dx$.","$=2\\pi\\cdot4$.","$8\\pi$."],"Shell: $2\\pi(\\text{radius})(\\text{height})$."),
    pr("p05","medium","Set up the arc length of $y=x^{3/2}$ on $[0,1]$.","$\\int_0^1\\sqrt{1+\\tfrac94 x}\\,dx$",["$f'=\\tfrac32 x^{1/2}$; $(f')^2=\\tfrac94 x$.","$\\sqrt{1+\\tfrac94 x}$.","Integrate $0$ to $1$."],"$L=\\int\\sqrt{1+(f')^2}$."),
    pr("p06","hard","Arc length of $y=\\tfrac23 x^{3/2}$ on $[0,3]$.","$\\tfrac{14}{3}$",["$f'=x^{1/2}$; $\\sqrt{1+x}$.","$\\int_0^3\\sqrt{1+x}\\,dx=\\tfrac23(1+x)^{3/2}\\big|_0^3$.","$\\tfrac23(8-1)=\\tfrac{14}{3}$."],"$(f')^2=x$ makes it integrable."),
    pr("p07","hard","Volume when $y=\\sqrt{x}$, $0\\le x\\le4$, revolved about the $y$-axis (shells).","$\\tfrac{128\\pi}{5}$",["$V=\\int_0^4 2\\pi x\\sqrt x\\,dx=2\\pi\\int_0^4 x^{3/2}\\,dx$.","$=2\\pi\\cdot\\tfrac25\\cdot32$.","$\\tfrac{128\\pi}{5}$."],"Shell radius $x$, height $\\sqrt x$."),
    pr("p08","stretch","Surface area when $y=x$, $0\\le x\\le1$, revolved about the $x$-axis.","$\\sqrt2\\,\\pi$",["$S=\\int_0^1 2\\pi x\\sqrt{1+1}\\,dx=2\\sqrt2\\,\\pi\\int_0^1 x\\,dx$.","$=2\\sqrt2\\,\\pi\\cdot\\tfrac12$.","$\\sqrt2\\,\\pi$."],"$r=x$, $\\sqrt{1+(f')^2}=\\sqrt2$.")
  ] }
];

function writeLessons(list) {
  for (const L of list) {
    const doc = { title: L.title, summary: L.summary, glossary: L.glossary, concept_sections: L.concepts, real_world_examples: L.examples, videos: L.videos, problems: L.problems };
    fs.writeFileSync(path.join(LDIR, L.id + ".json"), JSON.stringify(doc, null, 2) + "\n");
  }
}
module.exports = { LESSONS, writeLessons };
if (require.main === module) { writeLessons(LESSONS); console.log("wrote " + LESSONS.length + " calc2 lessons"); }
