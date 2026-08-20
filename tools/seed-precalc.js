#!/usr/bin/env node
/* Seed Precalculus (MAT 1375): 14 lesson JSONs at full PHYS-1442 depth.
 * Source: CityTech MAT 1375 outline + OpenStax/Tradler-Carley Precalculus.
 * Diagrams added by tools/build-sci-diagrams.js. Run: node tools/seed-precalc.js */
"use strict";
const fs = require("fs"), path = require("path");
const LDIR = path.resolve(__dirname, "..", "data", "lessons");
const g = (plain, in_class) => ({ plain, in_class });
const cn = (level, heading, explanation, math_steps) => ({ level, heading, explanation, math_steps });
const ex = (title, scenario, how_the_math_applies) => ({ title, scenario, how_the_math_applies });
const pr = (id, difficulty, prompt, correct_answer, solution_steps, hint) => ({ id, difficulty, prompt, correct_answer, solution_steps, hint });
const vids = (a, b, c) => ({ concept_query: a, math_query: b, combined_query: c });

const LESSONS = [
{ id: "precalc-01-functions", title: "Numbers & Functions", chapter: "Ch. 1", problems: [1,2,3,4,5,6,7,8],
  summary: "A function assigns exactly one output to each input. Functions are described by tables, formulas, graphs, or words, and live on a domain of allowed inputs. Interval notation names sets of real numbers compactly.",
  glossary: {
    "function": g("A rule giving exactly one output per input.", "Passes the vertical line test on a graph."),
    "domain": g("The set of allowed inputs.", "Exclude values causing division by zero or even roots of negatives."),
    "range": g("The set of possible outputs.", "All $y$-values the function actually takes."),
    "independent variable": g("The input, usually $x$.", "You choose it freely within the domain."),
    "dependent variable": g("The output, usually $y$ or $f(x)$.", "Determined by the input."),
    "interval notation": g("A compact way to write a set of numbers.", "$[a,b]$ includes ends; $(a,b)$ excludes them."),
    "vertical line test": g("A graph is a function if no vertical line hits it twice.", "Ensures one output per input."),
    "relation": g("Any pairing of inputs and outputs.", "A function is a special relation.")
  },
  concepts: [
    cn(1, "What a function is", "A function assigns each input exactly one output. The same input can't produce two different outputs — that's the defining rule.", ["Check each input has one output.", "Two outputs for one input ⇒ not a function.", "On a graph, use the vertical line test."]),
    cn(2, "Four representations", "Functions appear as tables, formulas, graphs, and verbal descriptions. Being fluent in translating among them is essential.", ["Read the function from any form.", "Convert between table, formula, graph, words.", "Pick the most useful representation."]),
    cn(3, "Domain and range", "The domain is the set of valid inputs; the range is the set of resulting outputs. Exclude inputs that break the formula (zero denominators, negative even-roots).", ["Find inputs that break the rule.", "Exclude them from the domain.", "Determine the outputs for the range."]),
    cn(4, "Interval notation", "Write sets of numbers as intervals: brackets include an endpoint, parentheses exclude it, and $\\infty$ always gets a parenthesis.", ["Brackets $[\\,]$ include endpoints.", "Parentheses $(\\,)$ exclude them.", "Combine pieces with $\\cup$."]),
    cn(5, "The vertical line test", "A graph represents a function exactly when no vertical line crosses it more than once — guaranteeing one output per input.", ["Scan vertical lines across the graph.", "More than one hit ⇒ not a function.", "One hit everywhere ⇒ a function."])
  ],
  examples: [
    ex("A vending machine", "Each button gives one item.", "It's a function: one input (button) maps to one output (snack)."),
    ex("A pricing table", "Weight determines shipping cost.", "The table defines a function of weight; interval notation gives the weight brackets."),
    ex("A thermometer reading", "Time determines temperature.", "Temperature is a function of time — one value at each instant.")
  ],
  videos: vids("what is a function domain range vertical line test", "interval notation functions representations examples", "precalculus functions introduction worked problems"),
  problems: [
    pr("p01","easy","Is $\\{(1,2),(3,4),(1,5)\\}$ a function?","No",["Input $1$ maps to $2$ and $5$.","Two outputs for one input.","Not a function."],"Check for repeated inputs."),
    pr("p02","easy","Find the domain of $f(x)=\\dfrac{1}{x-3}$.","$x\\neq3$",["Denominator zero at $x=3$.","Exclude it.","$x\\neq3$."],"Set the denominator to zero."),
    pr("p03","easy","Write $-2\\le x<5$ in interval notation.","$[-2,5)$",["$-2$ included, $5$ excluded.","Bracket then parenthesis.","$[-2,5)$."],"Brackets include, parentheses exclude."),
    pr("p04","medium","Find the domain of $f(x)=\\sqrt{x-4}$.","$x\\ge4$ i.e. $[4,\\infty)$",["Need $x-4\\ge0$.","$x\\ge4$.","$[4,\\infty)$."],"Even roots need nonnegative inside."),
    pr("p05","medium","If $f(x)=3x-1$, find $f(4)$.","$11$",["Substitute $x=4$.","$3(4)-1$.","$11$."],"Plug in the input."),
    pr("p06","medium","Does the vertical line test pass for a circle $x^2+y^2=4$?","No (not a function)",["A vertical line hits it twice.","Two outputs per input.","Not a function."],"A circle fails the test."),
    pr("p07","hard","Find the domain of $f(x)=\\dfrac{\\sqrt{x}}{x-2}$.","$x\\ge0,\\ x\\neq2$",["Need $x\\ge0$ (root) and $x\\neq2$ (denominator).","Combine.","$[0,2)\\cup(2,\\infty)$."],"Combine both restrictions.")
  ] },

{ id: "precalc-02-function-formulas", title: "Functions via Formulas", chapter: "Ch. 2", problems: [1,2,3,4,5,6,7,8],
  summary: "Function notation $f(x)$ evaluates and combines formulas. Evaluating at expressions, and computing the difference quotient $\\dfrac{f(x+h)-f(x)}{h}$, prepares the ground for calculus and reveals average rates of change.",
  glossary: {
    "function notation": g("Writing outputs as $f(x)$.", "$f(3)$ means the output when the input is 3."),
    "evaluate": g("Substitute a value and simplify.", "Replace $x$ everywhere, then compute."),
    "difference quotient": g("Average rate of change formula.", "$\\dfrac{f(x+h)-f(x)}{h}$."),
    "average rate of change": g("Slope between two points on a graph.", "$\\dfrac{f(b)-f(a)}{b-a}$."),
    "piecewise function": g("Different formulas on different intervals.", "Choose the branch matching the input."),
    "input expression": g("Plugging an expression (not just a number) into $f$.", "e.g. $f(x+2)$ or $f(2x)$."),
    "linear function": g("A function with a constant rate of change.", "$f(x)=mx+b$; graph is a line."),
    "constant function": g("Same output for every input.", "$f(x)=c$; a horizontal line.")
  },
  concepts: [
    cn(1, "Function notation", "$f(x)$ names the output for input $x$. To evaluate $f(a)$, substitute $a$ for every $x$ and simplify.", ["Replace each $x$ with the input.", "Simplify carefully with signs.", "The result is the output."]),
    cn(2, "Evaluating at expressions", "You can input whole expressions: $f(x+h)$ means replace $x$ with $(x+h)$ throughout, keeping parentheses to avoid sign errors.", ["Substitute the expression in parentheses.", "Expand carefully.", "Simplify."]),
    cn(3, "Average rate of change", "Between $x=a$ and $x=b$, the average rate is $\\dfrac{f(b)-f(a)}{b-a}$ — the slope of the secant line.", ["Compute $f(a)$ and $f(b)$.", "Divide the output change by the input change.", "That's the secant slope."]),
    cn(4, "The difference quotient", "$\\dfrac{f(x+h)-f(x)}{h}$ generalizes the average rate over a small step $h$. Simplifying it (canceling $h$) is the key precalculus-to-calculus skill.", ["Compute $f(x+h)$.", "Subtract $f(x)$ and divide by $h$.", "Simplify until $h$ cancels."]),
    cn(5, "Piecewise functions", "A piecewise function uses different rules on different intervals. To evaluate, first find which interval the input lies in, then use that branch.", ["Locate the input's interval.", "Use the matching formula.", "Evaluate there."])
  ],
  examples: [
    ex("A cell phone plan", "Cost jumps after a data cap.", "The bill is a piecewise function: one rate below the cap, another above."),
    ex("Average speed of a trip", "Distance over two time points.", "The average rate of change of position gives the trip's average speed."),
    ex("Slope of a hill", "Rise over run between two markers.", "The difference quotient measures the average steepness between points.")
  ],
  videos: vids("function notation evaluate difference quotient", "difference quotient average rate of change examples", "precalculus function notation worked problems"),
  problems: [
    pr("p01","easy","If $f(x)=x^2+1$, find $f(3)$.","$10$",["$3^2+1$.","$=9+1$.","$10$."],"Substitute 3."),
    pr("p02","easy","If $f(x)=2x-5$, find $f(0)$.","$-5$",["$2(0)-5$.","$=-5$.","Done."],"Plug in 0."),
    pr("p03","medium","If $f(x)=x^2$, find $f(x+1)$.","$x^2+2x+1$",["$(x+1)^2$.","$=x^2+2x+1$.","Done."],"Substitute $(x+1)$ and expand."),
    pr("p04","medium","Average rate of change of $f(x)=x^2$ on $[1,3]$.","$4$",["$\\dfrac{9-1}{3-1}$.","$=8/2$.","$4$."],"$\\dfrac{f(b)-f(a)}{b-a}$."),
    pr("p05","medium","Simplify the difference quotient for $f(x)=3x$.","$3$",["$\\dfrac{3(x+h)-3x}{h}=\\dfrac{3h}{h}$.","$=3$.","Done."],"The $h$ cancels."),
    pr("p06","hard","Difference quotient for $f(x)=x^2$.","$2x+h$",["$\\dfrac{(x+h)^2-x^2}{h}=\\dfrac{2xh+h^2}{h}$.","$=2x+h$.","Done."],"Expand and cancel $h$."),
    pr("p07","hard","For $f(x)=\\{2x\\ (x<0);\\ x^2\\ (x\\ge0)\\}$, find $f(-3)$ and $f(2)$.","$-6$ and $4$",["$-3<0$: $2(-3)=-6$.","$2\\ge0$: $2^2=4$.","$-6,\\ 4$."],"Pick the right branch.")
  ] },

{ id: "precalc-03-function-graphs", title: "Functions via Graphs", chapter: "Ch. 3", problems: [1,2,3,4,5,6,7,8],
  summary: "A graph shows a function's behavior at a glance: intercepts, increasing/decreasing intervals, maxima/minima, and symmetry (even or odd). Reading these features connects the picture to the formula.",
  glossary: {
    "x-intercept": g("Where the graph crosses the x-axis.", "Set $y=0$ and solve; a zero of the function."),
    "y-intercept": g("Where the graph crosses the y-axis.", "The value $f(0)$."),
    "increasing": g("Rising as $x$ grows.", "Graph goes up left-to-right there."),
    "decreasing": g("Falling as $x$ grows.", "Graph goes down left-to-right."),
    "even function": g("Symmetric about the y-axis.", "$f(-x)=f(x)$."),
    "odd function": g("Symmetric about the origin.", "$f(-x)=-f(x)$."),
    "maximum/minimum": g("Highest or lowest points.", "Local peaks and valleys."),
    "zero of a function": g("An input where output is 0.", "Same as an x-intercept.")
  },
  concepts: [
    cn(1, "Intercepts", "The x-intercepts are where $f(x)=0$ (the zeros); the y-intercept is $f(0)$. They anchor a sketch.", ["Set $y=0$ for x-intercepts.", "Compute $f(0)$ for the y-intercept.", "Plot these first."]),
    cn(2, "Increasing and decreasing", "A function increases where the graph rises left to right and decreases where it falls. Describe these as intervals of $x$.", ["Scan left to right.", "Rising ⇒ increasing; falling ⇒ decreasing.", "Report the $x$-intervals."]),
    cn(3, "Maxima and minima", "Local maxima are peaks, local minima are valleys — where the graph turns from rising to falling or vice versa.", ["Find turning points.", "Peak ⇒ local max; valley ⇒ local min.", "Note the $x$ and $y$ values."]),
    cn(4, "Even and odd symmetry", "Even functions mirror across the y-axis ($f(-x)=f(x)$); odd functions have 180° rotational symmetry about the origin ($f(-x)=-f(x)$).", ["Compute $f(-x)$.", "Equals $f(x)$ ⇒ even; equals $-f(x)$ ⇒ odd.", "Neither ⇒ no symmetry."]),
    cn(5, "Reading a graph", "Combine intercepts, intervals of increase/decrease, extrema, and symmetry to describe or reconstruct a function from its picture.", ["List intercepts and extrema.", "Note increasing/decreasing intervals.", "Check symmetry."])
  ],
  examples: [
    ex("A stock chart", "Price rises and falls over time.", "Increasing/decreasing intervals and peaks/valleys describe the trend."),
    ex("A projectile's height graph", "Height vs time is a downward parabola.", "The maximum marks the peak; the x-intercepts are launch and landing."),
    ex("A symmetric bridge arch", "The arch mirrors left and right.", "It models an even function, symmetric about its center line.")
  ],
  videos: vids("reading graphs intercepts increasing decreasing even odd", "even odd functions symmetry maxima minima examples", "precalculus graphs of functions worked problems"),
  problems: [
    pr("p01","easy","Find the y-intercept of $f(x)=x^2-4$.","$-4$",["$f(0)=0-4$.","$=-4$.","Done."],"Compute $f(0)$."),
    pr("p02","easy","Find the x-intercepts of $f(x)=x^2-9$.","$x=\\pm3$",["$x^2-9=0$.","$x=\\pm3$.","Done."],"Set $y=0$."),
    pr("p03","medium","Is $f(x)=x^2$ even, odd, or neither?","Even",["$f(-x)=(-x)^2=x^2=f(x)$.","Symmetric about y-axis.","Even."],"Check $f(-x)$."),
    pr("p04","medium","Is $f(x)=x^3$ even, odd, or neither?","Odd",["$f(-x)=-x^3=-f(x)$.","Origin symmetry.","Odd."],"Compare to $-f(x)$."),
    pr("p05","medium","Where is $f(x)=x^2$ decreasing?","$x<0$",["Left of the vertex it falls.","$x<0$.","Done."],"Look left of the vertex."),
    pr("p06","hard","Is $f(x)=x^3-x$ even, odd, or neither?","Odd",["$f(-x)=-x^3+x=-(x^3-x)$.","$=-f(x)$.","Odd."],"Test $f(-x)=-f(x)$."),
    pr("p07","hard","A parabola opens up with vertex $(2,-1)$. Is that a max or min, and its value?","Minimum, $-1$",["Opens up ⇒ vertex is lowest.","Minimum value $-1$.","At $x=2$."],"Upward parabola has a minimum.")
  ] },

{ id: "precalc-04-transformations", title: "Transformations of Functions", chapter: "Ch. 4", problems: [1,2,3,4,5,6,7,8],
  summary: "Starting from toolkit functions, shifts, reflections, and stretches build new graphs. $f(x)+k$ shifts up, $f(x-h)$ shifts right, $-f(x)$ reflects over the x-axis, and $af(x)$ stretches vertically — a fast way to graph without plotting many points.",
  glossary: {
    "toolkit functions": g("Basic parent graphs.", "$x$, $x^2$, $x^3$, $\\sqrt{x}$, $|x|$, $1/x$."),
    "vertical shift": g("Moving a graph up or down.", "$f(x)+k$: up for $k>0$."),
    "horizontal shift": g("Moving left or right.", "$f(x-h)$: right for $h>0$ (opposite of the sign)."),
    "reflection": g("Flipping over an axis.", "$-f(x)$ over x-axis; $f(-x)$ over y-axis."),
    "vertical stretch": g("Scaling heights by a factor.", "$af(x)$: stretch if $a>1$, compress if $0<a<1$."),
    "horizontal stretch": g("Scaling widths.", "$f(bx)$: compress if $b>1$."),
    "order of transformations": g("Apply inside-then-outside carefully.", "Horizontal first, then vertical, watching signs."),
    "parent function": g("The base graph before transforming.", "Transformations modify it.")
  },
  concepts: [
    cn(1, "Toolkit functions", "Memorize the shapes of the parent functions ($x$, $x^2$, $x^3$, $\\sqrt{x}$, $|x|$, $1/x$). Transformations reshape these familiar graphs.", ["Know each parent's shape.", "Identify which parent a formula comes from.", "Transform from there."]),
    cn(2, "Vertical shifts and stretches", "$f(x)+k$ moves the graph up ($k>0$) or down; $af(x)$ stretches it vertically (|a|>1) or compresses it, and reflects over the x-axis if $a<0$.", ["Add $k$ to shift up/down.", "Multiply by $a$ to stretch/compress.", "Negative $a$ flips vertically."]),
    cn(3, "Horizontal shifts and stretches", "$f(x-h)$ shifts right by $h$ (note the opposite sign); $f(bx)$ compresses horizontally by $b$, and $f(-x)$ reflects over the y-axis.", ["$x-h$ shifts right by $h$.", "$bx$ compresses by factor $b$.", "$-x$ reflects over the y-axis."]),
    cn(4, "Reflections", "A minus outside the function ($-f$) flips it over the x-axis; a minus inside ($f(-x)$) flips it over the y-axis.", ["Outside minus ⇒ x-axis flip.", "Inside minus ⇒ y-axis flip.", "Combine with shifts as needed."]),
    cn(5, "Combining transformations", "Apply them in order: horizontal changes (inside the function) first, then vertical (outside). Track the vertex or a key point through each step.", ["Handle inside (horizontal) changes first.", "Then outside (vertical) changes.", "Follow a reference point through."])
  ],
  examples: [
    ex("Adjusting a thermostat schedule", "Shift every temperature setpoint up 2°.", "Adding a constant is a vertical shift of the schedule function."),
    ex("Rescaling a graph for a report", "Double the height of a trend for emphasis.", "A vertical stretch $af(x)$ scales the values."),
    ex("Mirror-image design", "A logo reflects across a line.", "Reflection $f(-x)$ or $-f(x)$ produces the mirrored graph.")
  ],
  videos: vids("function transformations shifts reflections stretches", "graph transformations vertical horizontal examples", "precalculus transformations of functions worked problems"),
  problems: [
    pr("p01","easy","How does $f(x)+3$ transform the graph of $f$?","Shifts up 3",["Adding outside.","Moves up.","By 3."],"Outside +k shifts vertically."),
    pr("p02","easy","How does $f(x-2)$ transform the graph?","Shifts right 2",["Inside $x-2$.","Opposite sign ⇒ right.","By 2."],"Inside shift is opposite."),
    pr("p03","medium","Describe $-f(x)$.","Reflection over the x-axis",["Minus outside.","Flips vertically.","Over the x-axis."],"Outside minus flips over x-axis."),
    pr("p04","medium","Describe $2f(x)$.","Vertical stretch by 2",["Multiply outputs by 2.","Taller graph.","Stretch factor 2."],"Outside factor stretches vertically."),
    pr("p05","medium","The vertex of $y=x^2$ is $(0,0)$. Find it for $y=(x-3)^2+1$.","$(3,1)$",["Right 3, up 1.","Vertex moves.","$(3,1)$."],"Shift the vertex accordingly."),
    pr("p06","hard","Describe the graph of $y=-(x+2)^2-3$ from $y=x^2$.","Left 2, reflect over x-axis, down 3",["Inside $+2$ ⇒ left 2.","Minus ⇒ flip.","$-3$ ⇒ down 3."],"Combine the transformations."),
    pr("p07","hard","Find the vertex of $y=2(x-1)^2+5$.","$(1,5)$",["Right 1, up 5 (stretch doesn't move vertex).","Vertex $(1,5)$.","Done."],"Stretch keeps the vertex fixed.")
  ] },

{ id: "precalc-05-operations", title: "Operations & Composition of Functions", chapter: "Ch. 5", problems: [1,2,3,4,5,6,7,8],
  summary: "Functions combine by addition, subtraction, multiplication, and division, and by composition $f(g(x))$ — feeding one function's output into another. Composition's domain excludes inputs that break either function.",
  glossary: {
    "sum/difference of functions": g("Add or subtract outputs.", "$(f\\pm g)(x)=f(x)\\pm g(x)$."),
    "product/quotient": g("Multiply or divide outputs.", "$(fg)(x)=f(x)g(x)$; watch zero denominators."),
    "composition": g("Feed one function into another.", "$(f\\circ g)(x)=f(g(x))$."),
    "inner function": g("The one evaluated first in a composition.", "$g$ in $f(g(x))$."),
    "outer function": g("Applied to the inner's output.", "$f$ in $f(g(x))$."),
    "composition domain": g("Inputs valid for the whole composition.", "Must work in $g$ and then in $f$."),
    "decompose": g("Write a function as a composition.", "Identify inner and outer pieces."),
    "order matters": g("$f\\circ g\\neq g\\circ f$ in general.", "Composition is not commutative.")
  },
  concepts: [
    cn(1, "Arithmetic of functions", "Combine functions pointwise: $(f\\pm g)(x)=f(x)\\pm g(x)$, $(fg)(x)=f(x)g(x)$, $(f/g)(x)=f(x)/g(x)$ where $g(x)\\neq0$.", ["Evaluate each function.", "Combine the outputs.", "Exclude zeros of the denominator for quotients."]),
    cn(2, "Composition", "$(f\\circ g)(x)=f(g(x))$: evaluate $g$ first, then apply $f$ to that result. Substitute $g(x)$ everywhere $f$ has an $x$.", ["Compute the inner value $g(x)$.", "Substitute it into $f$.", "Simplify."]),
    cn(3, "Order matters", "In general $f\\circ g\\neq g\\circ f$ — composition isn't commutative, so keep the order straight.", ["Identify which is inner and outer.", "Compose in the stated order.", "Don't assume they're equal."]),
    cn(4, "Domain of a composition", "An input must be valid for $g$ and yield a value valid for $f$. Exclude inputs that break either step.", ["Require $x$ in the domain of $g$.", "Require $g(x)$ in the domain of $f$.", "Intersect the restrictions."]),
    cn(5, "Decomposing functions", "To use the chain rule later, practice writing a complicated function as $f(g(x))$ — naming a natural inner piece.", ["Spot a natural 'inside' expression.", "Call it $g(x)$.", "The rest is $f$."])
  ],
  examples: [
    ex("Discount then tax", "A price gets a discount, then tax added.", "Applying one function after another is composition — order changes the result."),
    ex("Unit conversion chain", "Feet → inches → centimeters.", "Chaining conversions composes the individual conversion functions."),
    ex("Total revenue model", "Revenue = price × quantity, each a function.", "Multiplying two functions builds the revenue function.")
  ],
  videos: vids("operations on functions composition f(g(x))", "function composition domain decompose examples", "precalculus function operations worked problems"),
  problems: [
    pr("p01","easy","If $f(x)=x+2$ and $g(x)=3x$, find $(f+g)(1)$.","$6$",["$f(1)+g(1)=3+3$.","$=6$.","Done."],"Add the outputs."),
    pr("p02","easy","With those functions, find $(f\\circ g)(1)$.","$5$",["$g(1)=3$; $f(3)=5$.","$=5$.","Done."],"Inner first."),
    pr("p03","medium","If $f(x)=x^2$ and $g(x)=x+1$, find $f(g(x))$.","$(x+1)^2$",["Substitute $g$ into $f$.","$(x+1)^2$.","Done."],"Replace $x$ in $f$ with $g(x)$."),
    pr("p04","medium","With the same functions, find $g(f(x))$.","$x^2+1$",["$f(x)=x^2$; then $g$: $x^2+1$.","Done.","Order differs from p03."],"Compose the other way."),
    pr("p05","medium","If $f(x)=2x$ and $g(x)=x-3$, find $(fg)(4)$.","$8$",["$f(4)=8$, $g(4)=1$.","$8\\times1$.","$8$."],"Multiply outputs."),
    pr("p06","hard","If $f(x)=\\sqrt{x}$ and $g(x)=x-4$, find the domain of $f(g(x))$.","$x\\ge4$",["Need $g(x)\\ge0$: $x-4\\ge0$.","$x\\ge4$.","$[4,\\infty)$."],"The inside of the root must be $\\ge0$."),
    pr("p07","hard","Decompose $h(x)=\\sqrt{x^2+1}$ as $f(g(x))$.","$f(u)=\\sqrt{u},\\ g(x)=x^2+1$",["Inner: $x^2+1$.","Outer: $\\sqrt{\\ }$.","$f(u)=\\sqrt u$, $g=x^2+1$."],"Name the inside as $g$.")
  ] },

{ id: "precalc-06-inverse", title: "Inverse Functions", chapter: "Ch. 6", problems: [1,2,3,4,5,6,7,8],
  summary: "An inverse function undoes another: if $f$ sends $a$ to $b$, then $f^{-1}$ sends $b$ back to $a$. A function has an inverse only if it's one-to-one (passes the horizontal line test); their graphs mirror across $y=x$.",
  glossary: {
    "inverse function": g("Undoes the original function.", "$f^{-1}(f(x))=x$."),
    "one-to-one": g("Each output comes from a single input.", "Required for an inverse."),
    "horizontal line test": g("No horizontal line hits the graph twice.", "Confirms one-to-one."),
    "swap x and y": g("The algebra for finding an inverse.", "Solve $x=f(y)$ for $y$."),
    "reflection over y=x": g("Inverse graphs mirror across this line.", "Points $(a,b)$ become $(b,a)$."),
    "domain/range swap": g("Inverse's domain is the original's range.", "And vice versa."),
    "restricting the domain": g("Limiting inputs to make a function invertible.", "e.g. $x\\ge0$ for $x^2$."),
    "composition check": g("Verify with $f(f^{-1}(x))=x$.", "Confirms a correct inverse.")
  },
  concepts: [
    cn(1, "What an inverse does", "The inverse reverses the mapping: $f^{-1}$ takes outputs back to inputs, so $f^{-1}(f(x))=x$ and $f(f^{-1}(x))=x$.", ["The inverse undoes $f$.", "$f^{-1}(f(x))=x$.", "Composing them returns $x$."]),
    cn(2, "One-to-one functions", "Only one-to-one functions (each output from a unique input) have inverses. The horizontal line test checks this on a graph.", ["Check each output has one input.", "Use the horizontal line test.", "Fails ⇒ no inverse (unless you restrict)."]),
    cn(3, "Finding an inverse algebraically", "Write $y=f(x)$, swap $x$ and $y$, then solve for $y$: that's $f^{-1}(x)$.", ["Set $y=f(x)$.", "Swap $x$ and $y$.", "Solve for $y$."]),
    cn(4, "Graphs and domains", "Inverse graphs are reflections across $y=x$; the inverse's domain and range are the original's range and domain, swapped.", ["Reflect the graph over $y=x$.", "Domain and range swap.", "Points $(a,b)\\to(b,a)$."]),
    cn(5, "Restricting the domain", "Functions that aren't one-to-one (like $x^2$) become invertible on a restricted domain (like $x\\ge0$), giving a valid inverse there.", ["Restrict to a one-to-one piece.", "Find the inverse on it.", "State the restricted domain."])
  ],
  examples: [
    ex("Encoding and decoding", "A cipher scrambles a message; decoding unscrambles it.", "Decoding is the inverse function of encoding."),
    ex("Celsius and Fahrenheit", "Convert one temperature scale to the other and back.", "The two conversions are inverse functions."),
    ex("Solving for time from distance", "Distance is a function of time; invert to get time.", "The inverse expresses time in terms of distance.")
  ],
  videos: vids("inverse functions one to one horizontal line test", "finding inverse function swap solve reflection examples", "precalculus inverse functions worked problems"),
  problems: [
    pr("p01","easy","Find the inverse of $f(x)=x+5$.","$f^{-1}(x)=x-5$",["Swap and solve: $x=y+5$.","$y=x-5$.","Done."],"Undo the addition."),
    pr("p02","easy","Find the inverse of $f(x)=2x$.","$f^{-1}(x)=x/2$",["$x=2y$.","$y=x/2$.","Done."],"Undo the multiplication."),
    pr("p03","medium","Find the inverse of $f(x)=3x-1$.","$f^{-1}(x)=\\dfrac{x+1}{3}$",["$x=3y-1$.","$y=(x+1)/3$.","Done."],"Swap, then solve for $y$."),
    pr("p04","medium","Does $f(x)=x^2$ (all reals) have an inverse?","No (not one-to-one)",["Horizontal line hits twice.","Not one-to-one.","No inverse unless restricted."],"Apply the horizontal line test."),
    pr("p05","medium","If $f(3)=7$, what is $f^{-1}(7)$?","$3$",["Inverse reverses the pair.","$(3,7)\\to(7,3)$.","$3$."],"Swap the coordinates."),
    pr("p06","hard","Find the inverse of $f(x)=\\dfrac{x+2}{x-1}$.","$f^{-1}(x)=\\dfrac{x+2}{x-1}$",["$x(y-1)=y+2$; $xy-x=y+2$.","$y(x-1)=x+2$; $y=\\dfrac{x+2}{x-1}$.","Self-inverse here."],"Solve $x=f(y)$ for $y$."),
    pr("p07","hard","Find the inverse of $f(x)=\\sqrt{x-1}$, $x\\ge1$.","$f^{-1}(x)=x^2+1,\\ x\\ge0$",["$x=\\sqrt{y-1}$; square: $x^2=y-1$.","$y=x^2+1$.","Domain $x\\ge0$."],"Square both sides, note the domain.")
  ] },

{ id: "precalc-07-poly-division", title: "Dividing Polynomials", chapter: "Ch. 7", problems: [1,2,3,4,5,6,7,8],
  summary: "Polynomial long division (and the shortcut, synthetic division) rewrites $P(x)/D(x)$ as a quotient plus a remainder. The Remainder Theorem says the remainder when dividing by $x-a$ is $P(a)$, and the Factor Theorem links zero remainders to factors.",
  glossary: {
    "polynomial long division": g("Dividing polynomials like long division of numbers.", "Gives a quotient and remainder."),
    "synthetic division": g("A shortcut for dividing by $x-a$.", "Uses only coefficients."),
    "quotient": g("The main result of the division.", "Plus a remainder over the divisor."),
    "remainder": g("What's left after dividing.", "Degree less than the divisor's."),
    "Remainder Theorem": g("Remainder of $P(x)\\div(x-a)$ is $P(a)$.", "A fast way to evaluate."),
    "Factor Theorem": g("$x-a$ is a factor iff $P(a)=0$.", "Links roots and factors."),
    "divisor": g("The polynomial you divide by.", "$D(x)$ in $P/D$."),
    "degree": g("Highest power in a polynomial.", "The quotient's degree is deg P − deg D.")
  },
  concepts: [
    cn(1, "Long division of polynomials", "Divide the leading terms, multiply back, subtract, and bring down — just like numerical long division — until the remainder's degree is below the divisor's.", ["Divide leading terms for the next quotient term.", "Multiply and subtract.", "Repeat until the remainder is low-degree."]),
    cn(2, "Synthetic division", "When dividing by $x-a$, synthetic division uses only the coefficients and $a$ — faster and less error-prone than long division.", ["Write the coefficients and $a$.", "Bring down, multiply by $a$, add.", "The last number is the remainder."]),
    cn(3, "The Remainder Theorem", "The remainder of $P(x)\\div(x-a)$ is exactly $P(a)$ — so you can evaluate a polynomial by dividing (or vice versa).", ["Divide by $x-a$.", "The remainder equals $P(a)$.", "Use it to evaluate quickly."]),
    cn(4, "The Factor Theorem", "$x-a$ is a factor of $P$ exactly when $P(a)=0$. A zero remainder means you've found a factor and a root.", ["Compute $P(a)$.", "Zero ⇒ $x-a$ is a factor.", "Nonzero ⇒ not a factor."]),
    cn(5, "Writing the result", "Express the division as $P(x)=D(x)\\cdot Q(x)+R(x)$, or $\\dfrac{P}{D}=Q+\\dfrac{R}{D}$ — useful for graphing and integration later.", ["Assemble quotient and remainder.", "Write $P=DQ+R$.", "Or $P/D=Q+R/D$."])
  ],
  examples: [
    ex("Simplifying a rational expression", "Reduce an improper polynomial fraction.", "Division rewrites it as a polynomial plus a proper remainder — easier to analyze."),
    ex("Testing a suspected root", "Is $x=2$ a root of a cubic?", "The Remainder Theorem: evaluate $P(2)$; zero means yes."),
    ex("Factoring a cubic", "Break a cubic into linear factors.", "Find one root, divide it out, then factor the remaining quadratic.")
  ],
  videos: vids("polynomial long division synthetic division", "remainder theorem factor theorem examples", "precalculus dividing polynomials worked problems"),
  problems: [
    pr("p01","easy","Divide $x^2+3x+2$ by $x+1$.","$x+2$",["$(x+1)(x+2)=x^2+3x+2$.","Quotient $x+2$, remainder 0.","$x+2$."],"It factors evenly."),
    pr("p02","easy","Use the Remainder Theorem: remainder of $P(x)=x^2+1$ divided by $x-2$.","$5$",["$P(2)=4+1$.","$=5$.","Remainder 5."],"Remainder $=P(a)$."),
    pr("p03","medium","Is $x-3$ a factor of $P(x)=x^2-9$?","Yes",["$P(3)=9-9=0$.","Zero remainder.","Factor."],"Check $P(3)$."),
    pr("p04","medium","Divide $x^2-5x+6$ by $x-2$.","$x-3$",["$(x-2)(x-3)=x^2-5x+6$.","Quotient $x-3$.","Remainder 0."],"Factor and match."),
    pr("p05","medium","Remainder of $x^3-2x+1$ divided by $x-1$.","$0$",["$P(1)=1-2+1$.","$=0$.","So $x-1$ is a factor."],"Evaluate $P(1)$."),
    pr("p06","hard","Divide $2x^2+3x-2$ by $x+2$.","$2x-1$",["$(x+2)(2x-1)=2x^2+3x-2$.","Quotient $2x-1$.","Remainder 0."],"Check by multiplying back."),
    pr("p07","hard","Given $x=2$ is a root of $x^3-3x^2+4$, factor it.","$(x-2)(x^2-x-2)=(x-2)^2(x+1)$",["Divide by $x-2$: quotient $x^2-x-2$.","Factor that: $(x-2)(x+1)$.","$(x-2)^2(x+1)$."],"Divide out $x-2$, then factor.")
  ] },

{ id: "precalc-08-poly-graphs", title: "Graphing Polynomials", chapter: "Ch. 8", problems: [1,2,3,4,5,6,7,8],
  summary: "A polynomial's graph is set by its degree and leading coefficient (end behavior), its real zeros (x-intercepts), and the multiplicity of each zero (cross vs touch). Together these sketch the curve's overall shape.",
  glossary: {
    "degree": g("Highest power in the polynomial.", "Sets the number of turns and end behavior."),
    "leading coefficient": g("Coefficient of the highest power.", "Its sign controls the end behavior."),
    "end behavior": g("What the graph does as $x\\to\\pm\\infty$.", "Determined by degree and leading coefficient."),
    "zero (root)": g("Where the polynomial equals 0.", "An x-intercept of the graph."),
    "multiplicity": g("How many times a factor repeats.", "Odd ⇒ crosses; even ⇒ touches."),
    "turning point": g("A local max or min.", "At most degree − 1 of them."),
    "cross vs touch": g("How the graph meets the x-axis at a zero.", "Odd multiplicity crosses, even touches."),
    "y-intercept": g("The value at $x=0$.", "The constant term.")
  },
  concepts: [
    cn(1, "End behavior", "The degree and leading coefficient set the ends: even degree sends both ends the same way, odd degree opposite ways; a positive leading coefficient lifts the right end.", ["Look at the degree (even/odd).", "Look at the leading coefficient's sign.", "Determine both ends."]),
    cn(2, "Zeros and factors", "Real zeros are x-intercepts, found by setting the factored polynomial to zero. Each factor $(x-a)$ gives a zero at $a$.", ["Factor the polynomial.", "Set each factor to zero.", "Those are the x-intercepts."]),
    cn(3, "Multiplicity", "A zero's multiplicity (the power of its factor) tells how the graph behaves there: odd multiplicity crosses the axis, even multiplicity touches and turns back.", ["Read each factor's power.", "Odd ⇒ crosses.", "Even ⇒ touches (bounces)."]),
    cn(4, "Turning points", "A degree-$n$ polynomial has at most $n-1$ turning points. Between consecutive zeros the graph must turn.", ["Count possible turns: up to $n-1$.", "The graph turns between zeros.", "Use this to shape the sketch."]),
    cn(5, "Putting it together", "Combine end behavior, x-intercepts with their multiplicities, and the y-intercept to sketch the full curve.", ["Plot intercepts (with cross/touch).", "Draw the ends from end behavior.", "Connect smoothly with turns."])
  ],
  examples: [
    ex("Modeling a trend that reverses", "Data rises, dips, then rises again.", "A cubic's shape (odd degree) captures a reversing trend."),
    ex("Design curves", "A smooth curve passes through set points.", "Polynomial graphs interpolate points with controllable turns."),
    ex("Predicting long-run behavior", "What happens for very large inputs?", "End behavior from degree and leading coefficient forecasts the extremes.")
  ],
  videos: vids("graphing polynomials end behavior zeros multiplicity", "polynomial graph multiplicity turning points examples", "precalculus graphing polynomials worked problems"),
  problems: [
    pr("p01","easy","End behavior of $f(x)=x^2$: both ends go?","Up",["Even degree, positive lead.","Both ends up.","Done."],"Even degree ⇒ ends match."),
    pr("p02","easy","How many x-intercepts does $f(x)=(x-1)(x+2)$ have?","$2$",["Zeros at $1$ and $-2$.","Two intercepts.","Done."],"One per distinct factor."),
    pr("p03","medium","At the zero of $(x-3)^2$, does the graph cross or touch?","Touch",["Multiplicity 2 (even).","Touches and turns.","Touch."],"Even multiplicity touches."),
    pr("p04","medium","End behavior of $f(x)=-x^3$: as $x\\to\\infty$, $y\\to$?","$-\\infty$",["Odd degree, negative lead.","Right end goes down.","$-\\infty$."],"Negative lead flips the ends."),
    pr("p05","medium","Max number of turning points for a degree-4 polynomial?","$3$",["At most $n-1$.","$4-1$.","$3$."],"$n-1$ turning points."),
    pr("p06","hard","At the zero of $(x+1)^3$, cross or touch?","Cross",["Multiplicity 3 (odd).","Crosses (with a flattening).","Cross."],"Odd multiplicity crosses."),
    pr("p07","hard","Find the y-intercept of $f(x)=(x-2)(x+1)(x-3)$.","$6$",["$f(0)=(-2)(1)(-3)$.","$=6$.","Done."],"Evaluate at $x=0$.")
  ] },

{ id: "precalc-09-poly-roots", title: "Roots of Polynomials", chapter: "Ch. 9", problems: [1,2,3,4,5,6,7,8],
  summary: "Finding all roots uses the Rational Root Theorem to list candidates, synthetic division to peel off factors, and the quadratic formula for what remains. The Fundamental Theorem guarantees $n$ roots (counting complex ones and multiplicity) for a degree-$n$ polynomial.",
  glossary: {
    "root/zero": g("A value where the polynomial is 0.", "$P(r)=0$."),
    "Rational Root Theorem": g("Lists possible rational roots.", "$\\pm\\dfrac{\\text{factor of constant}}{\\text{factor of lead}}$."),
    "Fundamental Theorem of Algebra": g("A degree-$n$ polynomial has $n$ complex roots.", "Counting multiplicity."),
    "complex roots": g("Roots involving $i$.", "Come in conjugate pairs for real coefficients."),
    "conjugate pair": g("$a+bi$ and $a-bi$ together.", "Both are roots if one is (real coefficients)."),
    "multiplicity": g("How many times a root repeats.", "Sum of multiplicities equals the degree."),
    "depressed polynomial": g("What's left after dividing out a root.", "Lower degree; solve it next."),
    "factored form": g("The polynomial written as a product of factors.", "Reveals all roots.")
  },
  concepts: [
    cn(1, "The Fundamental Theorem", "A degree-$n$ polynomial has exactly $n$ roots in the complex numbers, counting multiplicity. Real ones are x-intercepts; others come in complex conjugate pairs.", ["Count expected roots by degree.", "Some may be complex.", "Complex roots pair as conjugates."]),
    cn(2, "The Rational Root Theorem", "Possible rational roots are $\\pm\\dfrac{p}{q}$ where $p$ divides the constant term and $q$ divides the leading coefficient. Test these candidates.", ["List factors of the constant and leading coefficient.", "Form all $\\pm p/q$.", "Test with the Remainder Theorem."]),
    cn(3, "Peeling off roots", "Once a root $r$ is found, divide by $(x-r)$ to get a lower-degree 'depressed' polynomial, then repeat or solve it directly.", ["Confirm a root by $P(r)=0$.", "Divide out $(x-r)$.", "Solve the remaining polynomial."]),
    cn(4, "Complex conjugate roots", "For real-coefficient polynomials, complex roots always occur in conjugate pairs $a\\pm bi$. Finding one gives its partner for free.", ["A complex root implies its conjugate.", "They multiply to a real quadratic.", "Account for both."]),
    cn(5, "Full factorization", "Combine all roots (real and complex, with multiplicity) to write the polynomial as a product of linear (and irreducible quadratic) factors.", ["Collect every root.", "Write $(x-r)$ factors.", "Include multiplicity and quadratic factors."])
  ],
  examples: [
    ex("Solving a design equation", "A volume equation is a cubic.", "The Rational Root Theorem finds a workable dimension, then the rest solves as a quadratic."),
    ex("Signal frequencies", "Roots of a characteristic polynomial.", "Complex conjugate roots correspond to oscillating behavior."),
    ex("Break-even analysis", "Profit is a polynomial set to zero.", "Its real roots are the break-even quantities.")
  ],
  videos: vids("rational root theorem fundamental theorem of algebra", "finding polynomial roots synthetic division complex examples", "precalculus roots of polynomials worked problems"),
  problems: [
    pr("p01","easy","How many roots (with multiplicity) does a degree-3 polynomial have?","$3$",["Fundamental Theorem.","Degree 3.","$3$ roots."],"Count equals the degree."),
    pr("p02","easy","List possible rational roots of $x^2-5x+6$.","$\\pm1,\\pm2,\\pm3,\\pm6$",["Factors of 6 over factors of 1.","$\\pm1,2,3,6$.","Test these."],"$p/q$ with $p\\mid6$, $q\\mid1$."),
    pr("p03","medium","Find the roots of $x^2-5x+6$.","$x=2,3$",["Factor $(x-2)(x-3)$.","Roots $2,3$.","Both rational."],"Factor the quadratic."),
    pr("p04","medium","If $2+i$ is a root of a real polynomial, name another root.","$2-i$",["Complex roots pair as conjugates.","$2-i$.","Done."],"Conjugate pair."),
    pr("p05","medium","Given $x=1$ is a root of $x^3-1$, find the depressed polynomial.","$x^2+x+1$",["Divide $x^3-1$ by $x-1$.","$x^2+x+1$.","Done."],"Synthetic division by $x-1$."),
    pr("p06","hard","Find all roots of $x^3-1=0$.","$1,\\ \\dfrac{-1\\pm\\sqrt3\\,i}{2}$",["$x=1$; then $x^2+x+1=0$.","Quadratic formula gives complex pair.","$\\dfrac{-1\\pm\\sqrt3 i}{2}$."],"Solve the quadratic factor."),
    pr("p07","hard","A cubic has roots $2, 2, -1$. Write it (leading coefficient 1).","$(x-2)^2(x+1)$",["Repeated root at 2, single at $-1$.","$(x-2)^2(x+1)$.","Done."],"Include the multiplicity.")
  ] },

{ id: "precalc-10-rational", title: "Rational Functions", chapter: "Ch. 10", problems: [1,2,3,4,5,6,7,8],
  summary: "A rational function is a ratio of polynomials. Its domain excludes zeros of the denominator; those give vertical asymptotes or holes. End behavior (from the degrees) gives horizontal or slant asymptotes, and factoring reveals intercepts.",
  glossary: {
    "rational function": g("A ratio of two polynomials.", "$R(x)=P(x)/Q(x)$."),
    "vertical asymptote": g("A line the graph shoots along.", "Where $Q=0$ but $P\\neq0$."),
    "hole": g("A removable gap in the graph.", "Where a factor cancels top and bottom."),
    "horizontal asymptote": g("A level the graph approaches far out.", "From comparing degrees."),
    "slant asymptote": g("A diagonal end-behavior line.", "When the top's degree is one more than the bottom's."),
    "x-intercept": g("Where the numerator is zero.", "Provided the denominator isn't."),
    "domain (rational)": g("All inputs except zeros of the denominator.", "Excludes vertical asymptotes and holes."),
    "end behavior (rational)": g("Behavior as $x\\to\\pm\\infty$.", "Set by the leading terms.")
  },
  concepts: [
    cn(1, "Domain and vertical asymptotes", "The domain excludes zeros of the denominator. At those points you get a vertical asymptote (if the numerator isn't also zero there) or a hole (if a factor cancels).", ["Set the denominator to zero.", "If the factor cancels ⇒ hole.", "Otherwise ⇒ vertical asymptote."]),
    cn(2, "Horizontal asymptotes", "Compare degrees: bottom bigger ⇒ $y=0$; equal ⇒ ratio of leading coefficients; top bigger ⇒ no horizontal asymptote (possibly a slant).", ["Compare numerator and denominator degrees.", "Apply the degree rule.", "Read off the horizontal asymptote (if any)."]),
    cn(3, "Slant asymptotes", "When the numerator's degree is exactly one more than the denominator's, long division gives a linear quotient — the slant asymptote.", ["Confirm the degree difference is 1.", "Do polynomial division.", "The linear quotient is the slant asymptote."]),
    cn(4, "Intercepts", "The x-intercepts are zeros of the numerator (where the denominator isn't zero); the y-intercept is $R(0)$.", ["Set the numerator to zero for x-intercepts.", "Exclude any that zero the denominator.", "Compute $R(0)$ for the y-intercept."]),
    cn(5, "Sketching", "Combine domain restrictions, asymptotes (vertical, horizontal/slant), holes, and intercepts to sketch the graph piece by piece.", ["Draw asymptotes as guides.", "Plot intercepts and holes.", "Sketch each branch toward the asymptotes."])
  ],
  examples: [
    ex("Average cost per unit", "Total cost divided by quantity.", "Average cost is a rational function with a horizontal asymptote — the minimum long-run cost."),
    ex("Concentration over time", "A drug's concentration decays.", "A rational model has a horizontal asymptote at zero as time grows."),
    ex("Lens and focal length", "The thin-lens equation is rational.", "Solving it involves rational-function manipulation and excluded values.")
  ],
  videos: vids("rational functions vertical horizontal asymptotes holes", "rational function slant asymptote intercepts examples", "precalculus rational functions worked problems"),
  problems: [
    pr("p01","easy","Vertical asymptote of $R(x)=\\dfrac{1}{x-4}$.","$x=4$",["Denominator zero at 4.","Numerator nonzero.","$x=4$."],"Where the bottom is zero."),
    pr("p02","easy","Horizontal asymptote of $R(x)=\\dfrac{3x}{x+2}$.","$y=3$",["Equal degrees.","Ratio $3/1$.","$y=3$."],"Compare leading coefficients."),
    pr("p03","medium","Horizontal asymptote of $R(x)=\\dfrac{2x}{x^2+1}$.","$y=0$",["Bottom degree bigger.","$y=0$.","Done."],"Bottom degree larger ⇒ $y=0$."),
    pr("p04","medium","Find the hole of $R(x)=\\dfrac{(x-1)(x+2)}{x-1}$.","$x=1$",["$(x-1)$ cancels.","Hole where it did.","$x=1$."],"Cancelling factor gives a hole."),
    pr("p05","medium","x-intercept of $R(x)=\\dfrac{x-5}{x+2}$.","$x=5$",["Numerator zero at 5.","Denominator nonzero.","$x=5$."],"Set the numerator to zero."),
    pr("p06","hard","Does $R(x)=\\dfrac{x^2+1}{x}$ have a slant asymptote? Give it.","Yes, $y=x$",["Degree top = bottom + 1.","Divide: $x+1/x$.","Slant $y=x$."],"Top degree one more ⇒ divide."),
    pr("p07","hard","Domain of $R(x)=\\dfrac{x}{x^2-4}$.","$x\\neq\\pm2$",["$x^2-4=0$ at $\\pm2$.","Exclude them.","$x\\neq\\pm2$."],"Zeros of the denominator.")
  ] },

{ id: "precalc-11-asymptotes", title: "Discontinuities & Asymptotes", chapter: "Ch. 11", problems: [1,2,3,4,5,6,7,8],
  summary: "Rational and related functions have discontinuities: removable holes (canceling factors) and infinite discontinuities (vertical asymptotes). End behavior gives horizontal or slant asymptotes. Understanding these previews limits in calculus.",
  glossary: {
    "discontinuity": g("A break in the graph.", "Removable (hole) or infinite (asymptote)."),
    "removable discontinuity": g("A hole that could be 'plugged'.", "From a cancelling factor."),
    "infinite discontinuity": g("The function blows up.", "A vertical asymptote."),
    "vertical asymptote": g("A line the graph races along to $\\pm\\infty$.", "Non-cancelling denominator zero."),
    "horizontal asymptote": g("A far-out level the graph nears.", "From degree comparison."),
    "slant asymptote": g("A diagonal end-behavior line.", "Top degree one more than bottom."),
    "end behavior": g("Behavior as $x\\to\\pm\\infty$.", "Set by leading terms."),
    "limit (informal)": g("The value a function approaches.", "Formalized in calculus.")
  },
  concepts: [
    cn(1, "Removable vs infinite", "A factor that cancels top and bottom leaves a hole (removable); a denominator zero that doesn't cancel gives a vertical asymptote (infinite).", ["Factor numerator and denominator.", "Cancelling factor ⇒ hole.", "Remaining denominator zero ⇒ asymptote."]),
    cn(2, "Vertical asymptotes", "Near a vertical asymptote the function shoots to $+\\infty$ or $-\\infty$. Check the sign on each side to draw the branches.", ["Find non-cancelling denominator zeros.", "Test the sign on each side.", "Draw branches to $\\pm\\infty$."]),
    cn(3, "Horizontal asymptotes", "For large $|x|$, a rational function levels off according to the degree comparison — the horizontal asymptote (or none).", ["Compare degrees.", "Apply the rule ($0$, coefficient ratio, or none).", "Draw the horizontal guide."]),
    cn(4, "Slant asymptotes", "If the top's degree exceeds the bottom's by one, dividing gives a line the graph approaches diagonally.", ["Check degree difference is 1.", "Divide to get the linear quotient.", "That line is the slant asymptote."]),
    cn(5, "A preview of limits", "These behaviors describe what a function approaches near a point or at infinity — exactly the idea of a limit, which calculus makes precise.", ["Describe behavior near holes and asymptotes.", "Describe end behavior.", "This is limit thinking."])
  ],
  examples: [
    ex("Signal clipping", "Output saturates at a ceiling.", "A horizontal asymptote models the maximum the signal approaches."),
    ex("Population carrying capacity", "Growth levels off at a limit.", "The horizontal asymptote is the environment's carrying capacity."),
    ex("A resonance blow-up", "Response spikes near a critical frequency.", "A vertical asymptote models the runaway response.")
  ],
  videos: vids("removable infinite discontinuity asymptotes rational", "vertical horizontal slant asymptote end behavior examples", "precalculus asymptotes discontinuities worked problems"),
  problems: [
    pr("p01","easy","What kind of discontinuity does $\\dfrac{x-2}{x-2}$ have at $x=2$?","Removable (hole)",["Factor cancels.","Leaves a hole.","Removable."],"Cancelling ⇒ hole."),
    pr("p02","easy","Vertical asymptote of $\\dfrac{1}{x+3}$?","$x=-3$",["Denominator zero at $-3$.","Doesn't cancel.","$x=-3$."],"Non-cancelling denominator zero."),
    pr("p03","medium","Horizontal asymptote of $\\dfrac{5x^2}{x^2-1}$?","$y=5$",["Equal degrees.","Ratio $5/1$.","$y=5$."],"Compare leading coefficients."),
    pr("p04","medium","As $x\\to\\infty$, what does $\\dfrac{2x+1}{x}$ approach?","$2$",["Divide: $2+1/x$.","$\\to2$.","$y=2$."],"End behavior."),
    pr("p05","medium","Does $\\dfrac{(x-1)(x+2)}{(x-1)}$ have an asymptote or a hole at $x=1$?","Hole",["$(x-1)$ cancels.","Hole at $x=1$.","Not an asymptote."],"Cancelling factor ⇒ hole."),
    pr("p06","hard","Slant asymptote of $\\dfrac{x^2-1}{x}$?","$y=x$",["Divide: $x-1/x$.","As $x\\to\\infty$, $\\to x$.","$y=x$."],"Top degree one more ⇒ divide."),
    pr("p07","hard","Near $x=0^+$, does $\\dfrac1x\\to+\\infty$ or $-\\infty$?","$+\\infty$",["Small positive $x$ ⇒ large positive $1/x$.","$\\to+\\infty$.","Done."],"Test the sign just right of 0.")
  ] },

{ id: "precalc-12-inequalities", title: "Polynomial & Rational Inequalities", chapter: "Ch. 12", problems: [1,2,3,4,5,6,7,8],
  summary: "To solve $P(x)>0$ or $R(x)\\le0$, find where the expression is zero or undefined, split the number line into intervals, and test the sign in each. The solution is the union of intervals with the correct sign.",
  glossary: {
    "inequality": g("A statement with $<,\\le,>,\\ge$.", "Solutions form intervals, not single points."),
    "critical values": g("Where the expression is 0 or undefined.", "They split the number line."),
    "sign chart": g("A number line marked with the sign on each interval.", "Reveals where the inequality holds."),
    "test point": g("A value picked to check an interval's sign.", "Its sign applies to the whole interval."),
    "boundary included?": g("Whether endpoints satisfy $\\le/\\ge$.", "Included for $\\le/\\ge$, excluded for $</>$ and where undefined."),
    "rational inequality": g("An inequality with a fraction.", "Include denominator zeros as critical values (excluded)."),
    "union of intervals": g("Combining solution pieces.", "Joined with $\\cup$."),
    "strict vs non-strict": g("$</>$ vs $\\le/\\ge$.", "Determines open vs closed endpoints.")
  },
  concepts: [
    cn(1, "Find the critical values", "Locate where the expression equals zero (from the numerator) and where it's undefined (denominator zeros). These are the only places the sign can change.", ["Set the numerator to zero.", "Set the denominator to zero (rational).", "Mark all on a number line."]),
    cn(2, "Build a sign chart", "The critical values split the line into intervals. Pick a test point in each and record whether the expression is positive or negative there.", ["Divide the line at critical values.", "Test one point per interval.", "Record + or −."]),
    cn(3, "Read the solution", "Select the intervals whose sign matches the inequality. Union them for the answer.", ["Match the required sign.", "Collect those intervals.", "Join with $\\cup$."]),
    cn(4, "Handle the boundaries", "For $\\le$ or $\\ge$, include zeros of the numerator; always exclude denominator zeros (undefined). Strict inequalities exclude all zeros.", ["Include numerator zeros for $\\le/\\ge$.", "Always exclude denominator zeros.", "Strict ⇒ exclude all boundaries."]),
    cn(5, "Rational inequalities", "Move everything to one side and combine into a single fraction first — never multiply across by a variable expression whose sign is unknown.", ["Get 0 on one side.", "Combine into one fraction.", "Then make the sign chart."])
  ],
  examples: [
    ex("Profit above a target", "Profit must exceed a threshold.", "A polynomial inequality gives the range of quantities that clear the target."),
    ex("Safe dosage range", "Concentration must stay within limits.", "A rational inequality yields the acceptable interval."),
    ex("Structural load limits", "Stress must stay below a maximum.", "Solving an inequality gives the allowable range of a parameter.")
  ],
  videos: vids("polynomial rational inequalities sign chart", "solving inequalities test point intervals examples", "precalculus inequalities worked problems"),
  problems: [
    pr("p01","easy","Solve $x-3>0$.","$x>3$",["Add 3.","$x>3$.","$(3,\\infty)$."],"Isolate $x$."),
    pr("p02","easy","Critical values of $(x-1)(x+2)$.","$x=1,-2$",["Set each factor to zero.","$1$ and $-2$.","Done."],"Zeros of the factors."),
    pr("p03","medium","Solve $(x-1)(x+2)>0$.","$x<-2$ or $x>1$",["Sign chart: + outside the roots.","Test points confirm.","$(-\\infty,-2)\\cup(1,\\infty)$."],"Positive outside the roots."),
    pr("p04","medium","Solve $x^2-4\\le0$.","$-2\\le x\\le2$",["Roots $\\pm2$; parabola $\\le0$ between them.","$[-2,2]$.","Done."],"Between the roots for $\\le0$."),
    pr("p05","medium","Solve $\\dfrac{1}{x-2}>0$.","$x>2$",["Positive when $x-2>0$.","$x>2$.","Exclude 2."],"Fraction positive when denominator positive."),
    pr("p06","hard","Solve $\\dfrac{x-1}{x+2}\\ge0$.","$x<-2$ or $x\\ge1$",["Critical: $1$ (zero), $-2$ (undefined).","Sign chart: + outside, include $1$, exclude $-2$.","$(-\\infty,-2)\\cup[1,\\infty)$."],"Include the numerator zero, exclude the denominator zero."),
    pr("p07","hard","Solve $x^2-x-6<0$.","$-2<x<3$",["Factor $(x-3)(x+2)$; roots $3,-2$.","Negative between them.","$(-2,3)$."],"Between the roots for $<0$.")
  ] },

{ id: "precalc-13-exponential", title: "Exponential Functions", chapter: "Ch. 13", problems: [1,2,3,4,5,6,7,8],
  summary: "An exponential function $f(x)=a\\cdot b^x$ multiplies by a constant factor each step — growth if $b>1$, decay if $0<b<1$. Its graph has a horizontal asymptote, and the natural base $e$ models continuous growth.",
  glossary: {
    "exponential function": g("A constant base raised to a variable power.", "$f(x)=a\\,b^x$."),
    "growth factor": g("The base $b>1$ multiplying each step.", "Percent growth $=b-1$."),
    "decay factor": g("A base $0<b<1$.", "The quantity shrinks each step."),
    "base e": g("Euler's number $\\approx2.718$.", "The base for continuous growth."),
    "horizontal asymptote": g("The level the graph approaches.", "Usually $y=0$ for $a\\,b^x$."),
    "initial value": g("The output at $x=0$.", "The coefficient $a$."),
    "continuous growth": g("Growth compounding every instant.", "$A=Pe^{rt}$."),
    "doubling time": g("Time to double under growth.", "From $b^t=2$.")
  },
  concepts: [
    cn(1, "Exponential form", "$f(x)=a\\,b^x$ starts at $a$ (when $x=0$) and multiplies by $b$ for each unit increase in $x$. The base sets growth or decay.", ["Identify $a$ (initial) and $b$ (base).", "Growth if $b>1$, decay if $0<b<1$.", "Each step multiplies by $b$."]),
    cn(2, "Growth vs decay", "For $b>1$ the function grows; for $0<b<1$ it decays toward zero. The percent change per step is $b-1$.", ["Compare $b$ to 1.", "Growth or decay accordingly.", "Percent change $=(b-1)\\times100\\%$."]),
    cn(3, "Graphs and asymptotes", "Exponential graphs rise or fall steeply and flatten toward a horizontal asymptote (typically $y=0$), never crossing it.", ["Plot the initial value $a$.", "Curve steepens on one side.", "Approaches the asymptote on the other."]),
    cn(4, "The natural base $e$", "Continuous growth uses base $e\\approx2.718$: $A=Pe^{rt}$. It arises whenever growth compounds every instant.", ["Use $A=Pe^{rt}$ for continuous growth.", "$r$ is the rate, $t$ the time.", "$e$ is the continuous-compounding base."]),
    cn(5, "Modeling with exponentials", "Fit $a$ from the initial amount and $b$ (or $r$) from the growth rate; solve for time or amount as needed.", ["Set $a$ from the start value.", "Set $b$ or $r$ from the rate.", "Solve for the unknown quantity or time."])
  ],
  examples: [
    ex("Compound interest", "Savings grow at a fixed annual rate.", "Balance is exponential; continuous compounding uses $Pe^{rt}$."),
    ex("Radioactive decay", "A sample loses a fixed fraction per period.", "The amount follows an exponential decay with $0<b<1$."),
    ex("Viral spread", "Cases multiply early in an outbreak.", "Early growth is exponential until limits kick in.")
  ],
  videos: vids("exponential functions growth decay base e", "exponential function graph asymptote modeling examples", "precalculus exponential functions worked problems"),
  problems: [
    pr("p01","easy","For $f(x)=2^x$, find $f(3)$.","$8$",["$2^3$.","$=8$.","Done."],"Evaluate the power."),
    pr("p02","easy","Is $f(x)=3(0.5)^x$ growth or decay?","Decay",["Base $0.5<1$.","Shrinks each step.","Decay."],"Base below 1 ⇒ decay."),
    pr("p03","medium","For $f(x)=5\\cdot2^x$, find the initial value.","$5$",["$f(0)=5\\cdot1$.","$=5$.","The coefficient."],"Initial value is $a$."),
    pr("p04","medium","A population triples each year, starting at 100. Write the model.","$P=100\\cdot3^t$",["$a=100$, $b=3$.","$P=100(3^t)$.","Done."],"$a\\,b^t$ with $b=3$."),
    pr("p05","medium","What is the horizontal asymptote of $f(x)=2^x$?","$y=0$",["As $x\\to-\\infty$, $2^x\\to0$.","Asymptote $y=0$.","Done."],"Exponentials flatten to 0."),
    pr("p06","hard","$500$ grows continuously at $4\\%$. Find the amount after $10$ years.","$\\approx746$",["$A=500e^{0.04(10)}=500e^{0.4}$.","$e^{0.4}\\approx1.492$.","$\\approx746$."],"$A=Pe^{rt}$."),
    pr("p07","hard","A quantity halves every $5$ years. What fraction remains after $15$ years?","$1/8$",["$15/5=3$ half-lives.","$(1/2)^3$.","$1/8$."],"Count the half-lives.")
  ] },

{ id: "precalc-14-logarithmic", title: "Logarithmic Functions", chapter: "Ch. 13", problems: [1,2,3,4,5,6,7,8],
  summary: "A logarithm inverts an exponential: $\\log_b x=y$ means $b^y=x$. The log laws convert products, quotients, and powers into sums, differences, and multiples, and taking a log solves exponential equations for the unknown exponent.",
  glossary: {
    "logarithm": g("The inverse of an exponential.", "$\\log_b x=y\\iff b^y=x$."),
    "common log": g("Base-10 logarithm.", "$\\log x$."),
    "natural log": g("Base-$e$ logarithm.", "$\\ln x$."),
    "product law": g("Log of a product is a sum.", "$\\log(MN)=\\log M+\\log N$."),
    "quotient law": g("Log of a quotient is a difference.", "$\\log(M/N)=\\log M-\\log N$."),
    "power law": g("Log of a power pulls the exponent out.", "$\\log M^p=p\\log M$."),
    "change of base": g("Rewrite a log in another base.", "$\\log_b x=\\dfrac{\\ln x}{\\ln b}$."),
    "log-exponential inverse": g("They undo each other.", "$b^{\\log_b x}=x$, $\\log_b(b^x)=x$.")
  },
  concepts: [
    cn(1, "Logarithms as inverses", "$\\log_b x$ answers 'what power of $b$ gives $x$?'. It undoes the exponential, so $b^{\\log_b x}=x$.", ["Rewrite $\\log_b x=y$ as $b^y=x$.", "Evaluate simple logs by inspection.", "Use it to invert exponentials."]),
    cn(2, "Common and natural logs", "$\\log$ means base 10; $\\ln$ means base $e$. Calculators provide both, and change-of-base handles any other base.", ["$\\log=\\log_{10}$; $\\ln=\\log_e$.", "Use the matching calculator key.", "Change base with $\\dfrac{\\ln x}{\\ln b}$."]),
    cn(3, "The log laws", "Products become sums, quotients differences, and powers coefficients: $\\log(MN)=\\log M+\\log N$, etc. Use them to expand or condense.", ["Expand products/quotients.", "Pull exponents to the front.", "Condense back when needed."]),
    cn(4, "Solving exponential equations", "Take a logarithm of both sides to bring a variable exponent down, then solve the resulting linear equation.", ["Isolate the exponential.", "Take $\\log$ or $\\ln$ of both sides.", "Use the power law and solve."]),
    cn(5, "Solving logarithmic equations", "Condense to a single log, rewrite in exponential form, and solve — then check for extraneous solutions (logs need positive arguments).", ["Combine into one log.", "Rewrite as an exponential.", "Solve and discard non-positive arguments."])
  ],
  examples: [
    ex("The Richter scale", "Earthquake magnitude is logarithmic.", "Each unit is a tenfold energy increase — a base-10 logarithm."),
    ex("Sound in decibels", "Loudness uses a log scale.", "Decibels are $10\\log$ of an intensity ratio."),
    ex("Solving for time in growth", "How long until an investment doubles?", "Taking a log of $b^t=2$ solves for the time $t$.")
  ],
  videos: vids("logarithm definition inverse of exponential log laws", "log laws solving exponential logarithmic equations examples", "precalculus logarithmic functions worked problems"),
  problems: [
    pr("p01","easy","Evaluate $\\log_2 16$.","$4$",["$2^4=16$.","$4$.","Done."],"What power of 2 is 16?"),
    pr("p02","easy","Evaluate $\\log_{10} 100$.","$2$",["$10^2=100$.","$2$.","Done."],"Powers of 10."),
    pr("p03","easy","Rewrite $\\log_3 81=4$ in exponential form.","$3^4=81$",["$\\log_b x=y\\iff b^y=x$.","$3^4=81$.","Done."],"Definition of a log."),
    pr("p04","medium","Expand $\\log(x^3 y)$.","$3\\log x+\\log y$",["Power then product law.","$3\\log x+\\log y$.","Done."],"Combine power and product laws."),
    pr("p05","medium","Evaluate $\\ln e^5$.","$5$",["Inverses cancel.","$\\ln e^5=5$.","Done."],"$\\ln$ undoes $e$."),
    pr("p06","hard","Solve $3^x=81$.","$x=4$",["$81=3^4$.","$x=4$.","Or take $\\log_3$."],"Match the bases."),
    pr("p07","hard","Solve $2e^{x}=14$.","$x=\\ln 7\\approx1.95$",["$e^x=7$.","$x=\\ln7$.","$\\approx1.95$."],"Isolate the exponential, then take $\\ln$.")
  ] }
];

function writeLessons(list) {
  for (const L of list) {
    const doc = { title: L.title, summary: L.summary, glossary: L.glossary, concept_sections: L.concepts, real_world_examples: L.examples, videos: L.videos, problems: L.problems };
    fs.writeFileSync(path.join(LDIR, L.id + ".json"), JSON.stringify(doc, null, 2) + "\n");
  }
}
module.exports = { LESSONS, writeLessons };
if (require.main === module) { writeLessons(LESSONS); console.log("wrote " + LESSONS.length + " precalc lessons"); }
