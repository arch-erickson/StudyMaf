#!/usr/bin/env node
/* Seed College Algebra (MAT 1275): 14 lesson JSONs at full PHYS-1442 depth.
 * Source: CityTech MAT 1275 outline + College Algebra & Trigonometry / Intermediate
 * Algebra 2e (OpenStax). Diagrams added by tools/build-math-diagrams.js.
 * Run: node tools/seed-algebra.js */
"use strict";
const fs = require("fs"), path = require("path");
const LDIR = path.resolve(__dirname, "..", "data", "lessons");
const g = (plain, in_class) => ({ plain, in_class });
const cn = (level, heading, explanation, math_steps) => ({ level, heading, explanation, math_steps });
const ex = (title, scenario, how_the_math_applies) => ({ title, scenario, how_the_math_applies });
const pr = (id, difficulty, prompt, correct_answer, solution_steps, hint) => ({ id, difficulty, prompt, correct_answer, solution_steps, hint });
const vids = (a, b, c) => ({ concept_query: a, math_query: b, combined_query: c });

const LESSONS = [
{ id: "alg-01-arithmetic", title: "Arithmetic & Order of Operations", chapter: "Ch. 1.1", problems: [1,2,3,4,5,6,7,8],
  summary: "Real-number arithmetic — signed integers, fractions, and the order of operations (PEMDAS) — is the foundation for all of algebra. Master signs, common denominators, and the operation hierarchy so later manipulations stay error-free.",
  glossary: {
    "integer": g("A whole number, positive, negative, or zero.", "$\\ldots,-2,-1,0,1,2,\\ldots$"),
    "absolute value": g("Distance from zero, always nonnegative.", "$|-4|=4$; strips the sign."),
    "order of operations": g("The agreed sequence for evaluating expressions.", "PEMDAS: parentheses, exponents, multiply/divide, add/subtract."),
    "fraction": g("A ratio of two integers, part over whole.", "$\\tfrac{a}{b}$ with $b\\neq0$."),
    "common denominator": g("A shared bottom needed to add fractions.", "Use the least common multiple of the denominators."),
    "reciprocal": g("The flip of a fraction; multiply to divide.", "$\\tfrac{a}{b}\\div\\tfrac{c}{d}=\\tfrac{a}{b}\\cdot\\tfrac{d}{c}$."),
    "signed number": g("A number carrying a $+$ or $-$.", "Same signs add; different signs subtract."),
    "expression": g("A combination of numbers, variables, and operations.", "Evaluated by the order of operations.")
  },
  concepts: [
    cn(1, "Signed-number arithmetic", "Adding numbers with the same sign adds magnitudes and keeps the sign; different signs subtract and take the larger's sign. Subtracting is adding the opposite; a product/quotient is negative only with an odd number of negatives.", ["Same signs: add magnitudes, keep sign.", "Different signs: subtract, keep the bigger's sign.", "Products: count the negatives — odd ⇒ negative."]),
    cn(2, "Absolute value", "The absolute value $|x|$ is the distance from $0$, so it's never negative. It appears in distance and error contexts and in solving $|x|=a$.", ["Drop the sign to get the magnitude.", "$|x|=a$ means $x=a$ or $x=-a$.", "Distance between $a,b$ is $|a-b|$."]),
    cn(3, "Fractions", "To add or subtract, get a common denominator; to multiply, multiply straight across; to divide, multiply by the reciprocal. Always reduce to lowest terms.", ["Add/subtract: common denominator, then combine tops.", "Multiply: across the top and bottom.", "Divide: multiply by the reciprocal; simplify."]),
    cn(4, "Order of operations", "Evaluate in the order PEMDAS: parentheses first, then exponents, then multiplication and division left to right, then addition and subtraction left to right.", ["Do grouping symbols first.", "Then exponents.", "Then ×/÷, then +/−, each left to right."]),
    cn(5, "Evaluating expressions", "Substitute values for variables, then apply the order of operations carefully — especially with negative substitutions and exponents on negatives.", ["Replace variables with their values (use parentheses).", "Follow PEMDAS.", "Watch signs, e.g. $(-2)^2=4$ vs $-2^2=-4$."])
  ],
  examples: [
    ex("Splitting a bill with tip", "Divide a total plus tip among friends.", "Order of operations decides whether you add the tip before or after dividing — the grouping matters."),
    ex("Temperature swings", "Overnight the temperature drops below zero.", "Signed-number subtraction finds the change: $|-5-8|=13$ degrees of swing."),
    ex("Scaling a recipe", "Make two-thirds of a recipe.", "Multiplying each fractional amount by $\\tfrac23$ uses fraction multiplication.")
  ],
  videos: vids("order of operations pemdas signed numbers explained", "adding subtracting multiplying dividing fractions examples", "college algebra real number arithmetic worked problems"),
  problems: [
    pr("p01","easy","Evaluate $-3+7$.","$4$",["Different signs, subtract.","$7-3=4$, keep the $+$.","$4$."],"Larger magnitude keeps its sign."),
    pr("p02","easy","Evaluate $2+3\\cdot4$.","$14$",["Multiply first.","$3\\cdot4=12$.","$2+12=14$."],"PEMDAS: × before +."),
    pr("p03","easy","Evaluate $|-6|$.","$6$",["Distance from zero.","$6$.","Done."],"Drop the sign."),
    pr("p04","medium","Evaluate $\\tfrac12+\\tfrac13$.","$\\tfrac56$",["Common denominator 6.","$\\tfrac36+\\tfrac26$.","$\\tfrac56$."],"LCD is 6."),
    pr("p05","medium","Evaluate $(2+3)^2-4$.","$21$",["Parentheses: $5$.","$5^2=25$.","$25-4=21$."],"Parentheses, then exponent."),
    pr("p06","medium","Evaluate $\\tfrac23\\div\\tfrac49$.","$\\tfrac32$",["Multiply by the reciprocal.","$\\tfrac23\\cdot\\tfrac94=\\tfrac{18}{12}$.","$\\tfrac32$."],"Divide = multiply by the flip."),
    pr("p07","hard","Evaluate $-2^2+(-2)^2$.","$0$",["$-2^2=-4$ (exponent before sign).","$(-2)^2=4$.","$-4+4=0$."],"Parentheses change the sign's fate."),
    pr("p08","hard","Evaluate $3-2(5-8)$.","$9$",["Inside: $5-8=-3$.","$-2(-3)=6$.","$3+6=9$."],"Do the grouping first.")
  ] },

{ id: "alg-02-exponents-polynomials", title: "Exponents & Polynomial Operations", chapter: "Ch. 1.1–1.2", problems: [1,2,3,4,5,6,7,8],
  summary: "Exponent laws let you multiply, divide, and raise powers, and handle zero and negatives. Polynomials add, subtract, and multiply term by term — including the FOIL pattern and special products like $(a\\pm b)^2$ and $(a+b)(a-b)$.",
  glossary: {
    "exponent": g("How many times to multiply the base by itself.", "$a^n$; laws combine like bases."),
    "product rule (exponents)": g("Multiply same bases by adding exponents.", "$a^m a^n=a^{m+n}$."),
    "quotient rule (exponents)": g("Divide same bases by subtracting exponents.", "$a^m/a^n=a^{m-n}$."),
    "power rule (exponents)": g("Raise a power to a power by multiplying.", "$(a^m)^n=a^{mn}$."),
    "zero exponent": g("Any nonzero base to the zero is 1.", "$a^0=1$."),
    "negative exponent": g("Reciprocal of the positive power.", "$a^{-n}=\\dfrac{1}{a^n}$."),
    "polynomial": g("A sum of terms $c\\,x^k$ with whole-number exponents.", "Add/subtract like terms; multiply by distribution."),
    "FOIL": g("First-Outer-Inner-Last for multiplying two binomials.", "$(a+b)(c+d)=ac+ad+bc+bd$.")
  },
  concepts: [
    cn(1, "Exponent laws", "Combine like bases: add exponents to multiply, subtract to divide, multiply to raise a power to a power. These three rules cover most simplification.", ["$a^m a^n=a^{m+n}$.", "$a^m/a^n=a^{m-n}$.", "$(a^m)^n=a^{mn}$."]),
    cn(2, "Zero and negative exponents", "A zero exponent gives $1$; a negative exponent means reciprocal. Rewrite negatives as positives by moving the factor across the fraction bar.", ["$a^0=1$ for $a\\neq0$.", "$a^{-n}=1/a^n$.", "Move a factor to the other side of the bar to flip the sign."]),
    cn(3, "Adding and subtracting polynomials", "Combine only like terms — same variable and exponent. Line them up and add coefficients; distribute a leading minus carefully.", ["Identify like terms.", "Add/subtract their coefficients.", "Distribute any subtraction across all terms."]),
    cn(4, "Multiplying polynomials", "Distribute every term of one factor over every term of the other. For two binomials this is FOIL; for larger ones, be systematic.", ["Multiply each term by each term.", "Use FOIL for binomials.", "Collect like terms."]),
    cn(5, "Special products", "Memorize $(a+b)^2=a^2+2ab+b^2$, $(a-b)^2=a^2-2ab+b^2$, and $(a+b)(a-b)=a^2-b^2$. They speed up expansion and later factoring.", ["Square of a sum: middle term $2ab$.", "Square of a difference: middle term $-2ab$.", "Product of conjugates: $a^2-b^2$ (no middle)."])
  ],
  examples: [
    ex("Scientific notation", "Very large or small measurements.", "Exponent laws multiply and divide numbers written as $c\\times10^n$."),
    ex("Compound area", "A square garden's side is a binomial length.", "Its area $(x+3)^2$ expands with the square-of-a-sum special product."),
    ex("Computer storage doubling", "Capacity doubles each generation.", "Powers of two and the product rule track total growth $2^m\\cdot2^n=2^{m+n}$.")
  ],
  videos: vids("exponent rules product quotient power zero negative", "multiplying polynomials FOIL special products examples", "college algebra exponents polynomials worked problems"),
  problems: [
    pr("p01","easy","Simplify $x^3\\cdot x^4$.","$x^7$",["Add exponents.","$x^{3+4}$.","$x^7$."],"Same base ⇒ add exponents."),
    pr("p02","easy","Simplify $\\dfrac{x^5}{x^2}$.","$x^3$",["Subtract exponents.","$x^{5-2}$.","$x^3$."],"Divide ⇒ subtract."),
    pr("p03","easy","Simplify $(x^2)^3$.","$x^6$",["Multiply exponents.","$x^{2\\cdot3}$.","$x^6$."],"Power of a power."),
    pr("p04","easy","Simplify $2^{-3}$.","$\\tfrac18$",["Reciprocal of $2^3$.","$1/8$.","$\\tfrac18$."],"Negative ⇒ reciprocal."),
    pr("p05","medium","Expand $(x+3)(x-2)$.","$x^2+x-6$",["FOIL.","$x^2-2x+3x-6$.","$x^2+x-6$."],"First-Outer-Inner-Last."),
    pr("p06","medium","Expand $(x+4)^2$.","$x^2+8x+16$",["Square of a sum.","$x^2+2(4)x+16$.","$x^2+8x+16$."],"Middle term is $2ab$."),
    pr("p07","medium","Expand $(x+5)(x-5)$.","$x^2-25$",["Conjugates.","$x^2-25$.","No middle term."],"Difference of squares."),
    pr("p08","hard","Subtract $(3x^2-2x+1)-(x^2+4x-3)$.","$2x^2-6x+4$",["Distribute the minus.","$3x^2-2x+1-x^2-4x+3$.","$2x^2-6x+4$."],"Distribute the subtraction to every term.")
  ] },

{ id: "alg-03-factoring", title: "Factoring Polynomials", chapter: "Ch. 1.2", problems: [1,2,3,4,5,6,7,8],
  summary: "Factoring reverses multiplication: pull out the GCF, factor by grouping, factor trinomials, and recognize special forms (difference of squares, perfect-square trinomials, sum/difference of cubes). Factoring is the key to solving polynomial equations.",
  glossary: {
    "factor": g("A multiplied piece of an expression.", "Factoring writes a polynomial as a product."),
    "GCF": g("Greatest common factor of all terms.", "Pull it out first, always."),
    "grouping": g("Factoring four-term polynomials in pairs.", "Group, factor each pair, then factor the shared binomial."),
    "trinomial": g("A three-term polynomial like $x^2+bx+c$.", "Find factors of $c$ that add to $b$."),
    "difference of squares": g("$a^2-b^2$ factors to conjugates.", "$a^2-b^2=(a+b)(a-b)$."),
    "perfect-square trinomial": g("A trinomial that's a squared binomial.", "$a^2\\pm2ab+b^2=(a\\pm b)^2$."),
    "sum/difference of cubes": g("Special cubic factorizations.", "$a^3\\pm b^3=(a\\pm b)(a^2\\mp ab+b^2)$."),
    "leading coefficient": g("The number in front of the highest power.", "Affects the trinomial method (a≠1 needs AC method)."),
  },
  concepts: [
    cn(1, "Greatest common factor", "Always factor out the GCF first — the largest monomial dividing every term. It simplifies whatever technique comes next.", ["Find the largest common numeric and variable factor.", "Divide it out of every term.", "Write GCF × remaining polynomial."]),
    cn(2, "Factoring by grouping", "For four terms, group into two pairs, factor each pair, and if a common binomial appears, factor it out.", ["Group the terms in pairs.", "Factor the GCF from each pair.", "Factor out the shared binomial."]),
    cn(3, "Trinomials $x^2+bx+c$", "Find two numbers that multiply to $c$ and add to $b$; they give the binomial factors $(x+p)(x+q)$. When the leading coefficient isn't 1, use the AC method.", ["List factor pairs of $c$.", "Pick the pair summing to $b$.", "Write $(x+p)(x+q)$."]),
    cn(4, "Special forms", "Recognize $a^2-b^2=(a+b)(a-b)$, perfect squares $a^2\\pm2ab+b^2=(a\\pm b)^2$, and cubes $a^3\\pm b^3$. Spotting these skips trial and error.", ["Check for a difference of squares.", "Check for a perfect-square pattern.", "Check for sum/difference of cubes."]),
    cn(5, "A general strategy", "Factor completely: GCF first, then match a special form, then trinomial or grouping, and finally check that each factor is fully factored.", ["Pull out the GCF.", "Try special forms, then trinomial/grouping.", "Factor every piece until prime."])
  ],
  examples: [
    ex("Solving by the zero-product rule", "An equation set to zero.", "Factoring turns $x^2-5x+6=0$ into $(x-2)(x-3)=0$, revealing the roots."),
    ex("Simplifying a rational expression", "Reduce a fraction of polynomials.", "Factoring top and bottom lets common factors cancel."),
    ex("Optimizing dimensions", "Area expressions in design.", "Factoring an area polynomial exposes the dimensions that make it zero or maximal.")
  ],
  videos: vids("factoring GCF grouping trinomials explained", "difference of squares perfect square cubes factoring examples", "college algebra factoring polynomials worked problems"),
  problems: [
    pr("p01","easy","Factor $6x^2+9x$.","$3x(2x+3)$",["GCF is $3x$.","$3x(2x+3)$.","Done."],"Pull out the GCF."),
    pr("p02","easy","Factor $x^2-9$.","$(x+3)(x-3)$",["Difference of squares.","$a=x$, $b=3$.","$(x+3)(x-3)$."],"$a^2-b^2$."),
    pr("p03","easy","Factor $x^2+5x+6$.","$(x+2)(x+3)$",["Product 6, sum 5.","$2$ and $3$.","$(x+2)(x+3)$."],"Two numbers: multiply to 6, add to 5."),
    pr("p04","medium","Factor $x^2-7x+12$.","$(x-3)(x-4)$",["Product 12, sum $-7$.","$-3,-4$.","$(x-3)(x-4)$."],"Both negative here."),
    pr("p05","medium","Factor $x^2+6x+9$.","$(x+3)^2$",["Perfect-square trinomial.","$a=x$, $b=3$.","$(x+3)^2$."],"Middle $=2ab$ signals a perfect square."),
    pr("p06","medium","Factor by grouping $x^3+2x^2+3x+6$.","$(x^2+3)(x+2)$",["Group: $x^2(x+2)+3(x+2)$.","Common $(x+2)$.","$(x^2+3)(x+2)$."],"Group in pairs."),
    pr("p07","hard","Factor $2x^2+7x+3$.","$(2x+1)(x+3)$",["AC method: $2\\cdot3=6$, split $7=6+1$.","$2x^2+6x+x+3=2x(x+3)+1(x+3)$.","$(2x+1)(x+3)$."],"Use the AC method for $a\\neq1$."),
    pr("p08","hard","Factor $x^3-8$.","$(x-2)(x^2+2x+4)$",["Difference of cubes, $b=2$.","$(x-2)(x^2+2x+4)$.","Done."],"$a^3-b^3=(a-b)(a^2+ab+b^2)$.")
  ] },

{ id: "alg-04-rational-expressions", title: "Rational Expressions", chapter: "Ch. 1.3", problems: [1,2,3,4,5,6,7,8],
  summary: "A rational expression is a fraction of polynomials. Simplify by factoring and cancelling; multiply/divide as with fractions; add/subtract over a common denominator. Watch for excluded values that make a denominator zero.",
  glossary: {
    "rational expression": g("A ratio of two polynomials.", "$\\dfrac{P(x)}{Q(x)}$ with $Q\\neq0$."),
    "excluded value": g("An $x$ that makes a denominator zero.", "Not allowed in the domain."),
    "simplify": g("Cancel common factors after factoring.", "Only cancel factors, never terms."),
    "common denominator": g("A shared bottom to add/subtract fractions.", "Least common multiple of the denominators."),
    "complex fraction": g("A fraction with fractions inside.", "Clear by multiplying by the LCD of the inner fractions."),
    "least common denominator": g("Smallest expression all denominators divide.", "Built from each distinct factor to its highest power."),
    "reciprocal (division)": g("Divide by multiplying by the flip.", "$\\dfrac{A}{B}\\div\\dfrac{C}{D}=\\dfrac{A}{B}\\cdot\\dfrac{D}{C}$."),
    "cancel factors": g("Remove a factor common to top and bottom.", "e.g. $\\dfrac{(x-2)(x+1)}{(x-2)}=x+1$.")
  },
  concepts: [
    cn(1, "Simplifying", "Factor numerator and denominator, then cancel factors they share. Note the excluded values before you cancel — they stay excluded.", ["Factor top and bottom.", "Cancel common factors.", "State excluded values (where the original bottom was 0)."]),
    cn(2, "Multiplying and dividing", "Multiply straight across (factor and cancel first to keep it small). Divide by multiplying by the reciprocal.", ["Factor everything.", "Cancel across the product.", "For division, flip the second fraction first."]),
    cn(3, "Common denominators", "To add or subtract, build the least common denominator from each distinct factor at its highest power, rewrite each fraction, then combine numerators.", ["Find the LCD from the factored denominators.", "Rewrite each fraction over the LCD.", "Combine the numerators; simplify."]),
    cn(4, "Complex fractions", "A fraction containing fractions clears by multiplying top and bottom by the LCD of the inner fractions, collapsing it to a single ratio.", ["Find the LCD of the small fractions.", "Multiply numerator and denominator by it.", "Simplify the result."]),
    cn(5, "Excluded values and domain", "Any $x$ making an original denominator zero is excluded, even if it cancels. Always list these restrictions with the answer.", ["Set each original denominator to zero.", "Those $x$ are excluded.", "Keep them out of the domain of the simplified form."])
  ],
  examples: [
    ex("Combining work rates", "Two workers finish a job at different speeds.", "Their combined rate adds rational expressions $\\tfrac1a+\\tfrac1b$ over a common denominator."),
    ex("Average speed round trip", "Different speeds out and back.", "The average uses a rational expression that simplifies with a common denominator."),
    ex("Mixing concentrations", "Blending two solutions.", "The resulting concentration is a rational expression in the amounts mixed.")
  ],
  videos: vids("simplify rational expressions factor cancel excluded values", "add subtract multiply divide rational expressions examples", "college algebra rational expressions worked problems"),
  problems: [
    pr("p01","easy","Simplify $\\dfrac{x^2-4}{x-2}$.","$x+2,\\ x\\neq2$",["Factor: $\\dfrac{(x-2)(x+2)}{x-2}$.","Cancel $(x-2)$.","$x+2$, excluding $x=2$."],"Factor then cancel; note the exclusion."),
    pr("p02","easy","State the excluded value of $\\dfrac{1}{x-5}$.","$x=5$",["Denominator zero.","$x-5=0$.","$x=5$."],"Set the denominator to zero."),
    pr("p03","medium","Multiply $\\dfrac{x}{x+1}\\cdot\\dfrac{x+1}{x-2}$.","$\\dfrac{x}{x-2}$",["Cancel $(x+1)$.","$\\dfrac{x}{x-2}$.","Done."],"Cancel before multiplying."),
    pr("p04","medium","Divide $\\dfrac{x}{2}\\div\\dfrac{x}{4}$.","$2$",["Flip: $\\dfrac{x}{2}\\cdot\\dfrac{4}{x}$.","$\\dfrac{4}{2}$.","$2$."],"Multiply by the reciprocal."),
    pr("p05","medium","Add $\\dfrac{1}{x}+\\dfrac{1}{x+1}$.","$\\dfrac{2x+1}{x(x+1)}$",["LCD $x(x+1)$.","$\\dfrac{(x+1)+x}{x(x+1)}$.","$\\dfrac{2x+1}{x(x+1)}$."],"Common denominator first."),
    pr("p06","medium","Simplify $\\dfrac{x^2-x-6}{x^2-9}$.","$\\dfrac{x+2}{x+3},\\ x\\neq\\pm3$",["Factor: $\\dfrac{(x-3)(x+2)}{(x-3)(x+3)}$.","Cancel $(x-3)$.","$\\dfrac{x+2}{x+3}$."],"Factor top and bottom."),
    pr("p07","hard","Subtract $\\dfrac{2}{x-1}-\\dfrac{1}{x+1}$.","$\\dfrac{x+3}{(x-1)(x+1)}$",["LCD $(x-1)(x+1)$.","$\\dfrac{2(x+1)-(x-1)}{(x-1)(x+1)}$.","$\\dfrac{x+3}{(x-1)(x+1)}$."],"Distribute the subtraction in the numerator."),
    pr("p08","hard","Simplify the complex fraction $\\dfrac{\\tfrac1x+1}{\\tfrac1x}$.","$1+x$",["Multiply top and bottom by $x$.","$\\dfrac{1+x}{1}$.","$1+x$."],"Multiply by the inner LCD $x$.")
  ] },

{ id: "alg-05-radicals-complex", title: "Radicals & Complex Numbers", chapter: "Ch. 1.4", problems: [1,2,3,4,5,6,7,8],
  summary: "Radicals simplify by pulling out perfect-power factors; you add like radicals, multiply with the product rule, and rationalize denominators. When a square root of a negative appears, complex numbers with $i=\\sqrt{-1}$ extend the number system.",
  glossary: {
    "radical": g("A root expression like $\\sqrt{x}$ or $\\sqrt[3]{x}$.", "Index shows which root; simplify by extracting perfect powers."),
    "radicand": g("The quantity under the radical.", "Factor it to find perfect-power pieces."),
    "rationalize": g("Clear a radical from a denominator.", "Multiply by a form of 1 (the radical or a conjugate)."),
    "conjugate": g("$a-b\\sqrt{c}$ pairs with $a+b\\sqrt{c}$.", "Their product removes the radical: $a^2-b^2c$."),
    "imaginary unit": g("$i$, defined by $i^2=-1$.", "$\\sqrt{-1}=i$; makes negative roots meaningful."),
    "complex number": g("A number $a+bi$ with real and imaginary parts.", "Combine like terms; use $i^2=-1$."),
    "like radicals": g("Radicals with the same index and radicand.", "Only these can be added/subtracted."),
    "product rule (radicals)": g("$\\sqrt{ab}=\\sqrt a\\,\\sqrt b$.", "Splits a radicand to extract perfect squares.")
  },
  concepts: [
    cn(1, "Simplifying radicals", "Factor the radicand and pull out perfect-power factors: $\\sqrt{50}=\\sqrt{25\\cdot2}=5\\sqrt2$. For higher roots, extract groups matching the index.", ["Factor out the largest perfect power.", "Take its root outside.", "Leave the rest inside."]),
    cn(2, "Operating on radicals", "Add or subtract only like radicals (same index and radicand). Multiply with $\\sqrt a\\,\\sqrt b=\\sqrt{ab}$, then simplify.", ["Simplify each radical first.", "Add/subtract like radicals by their coefficients.", "Multiply radicands together, then simplify."]),
    cn(3, "Rationalizing denominators", "Remove a radical from the bottom by multiplying by it (single term) or by the conjugate (a sum/difference), which uses the difference-of-squares to clear the root.", ["Single radical: multiply top and bottom by that radical.", "Binomial: multiply by the conjugate.", "Simplify the cleared expression."]),
    cn(4, "The imaginary unit", "Define $i=\\sqrt{-1}$, so $i^2=-1$. Then $\\sqrt{-9}=3i$, and higher powers cycle $i,-1,-i,1$.", ["Write $\\sqrt{-a}=\\sqrt{a}\\,i$.", "Replace $i^2$ with $-1$.", "Reduce $i^n$ using the 4-cycle."]),
    cn(5, "Complex arithmetic", "Add/subtract real and imaginary parts separately; multiply with FOIL using $i^2=-1$; divide by multiplying by the complex conjugate.", ["Add: combine real with real, imaginary with imaginary.", "Multiply: FOIL, then apply $i^2=-1$.", "Divide: multiply by the conjugate $a-bi$."])
  ],
  examples: [
    ex("Diagonal of a screen", "A TV's diagonal from width and height.", "The Pythagorean theorem gives a radical like $\\sqrt{w^2+h^2}$ to simplify."),
    ex("AC circuit impedance", "Resistance and reactance combine.", "Impedance is a complex number $R+iX$; its magnitude uses $\\sqrt{R^2+X^2}$."),
    ex("Signal phase", "Waves described by real and imaginary parts.", "Complex numbers encode amplitude and phase compactly.")
  ],
  videos: vids("simplify radicals product rule rationalize denominator", "complex numbers i imaginary unit add multiply examples", "college algebra radicals complex numbers worked problems"),
  problems: [
    pr("p01","easy","Simplify $\\sqrt{50}$.","$5\\sqrt2$",["$50=25\\cdot2$.","$\\sqrt{25}=5$.","$5\\sqrt2$."],"Pull out the perfect square."),
    pr("p02","easy","Simplify $\\sqrt{-16}$.","$4i$",["$\\sqrt{16}\\cdot\\sqrt{-1}$.","$4i$.","Done."],"$\\sqrt{-1}=i$."),
    pr("p03","easy","Add $2\\sqrt3+5\\sqrt3$.","$7\\sqrt3$",["Like radicals.","Add coefficients.","$7\\sqrt3$."],"Same radicand ⇒ add."),
    pr("p04","medium","Multiply $\\sqrt6\\cdot\\sqrt{10}$.","$2\\sqrt{15}$",["$\\sqrt{60}$.","$=\\sqrt{4\\cdot15}$.","$2\\sqrt{15}$."],"Multiply radicands, then simplify."),
    pr("p05","medium","Rationalize $\\dfrac{1}{\\sqrt2}$.","$\\dfrac{\\sqrt2}{2}$",["Multiply by $\\sqrt2/\\sqrt2$.","$\\dfrac{\\sqrt2}{2}$.","Done."],"Multiply by the radical over itself."),
    pr("p06","medium","Simplify $(2+3i)+(4-i)$.","$6+2i$",["Real: $2+4$; imaginary: $3-1$.","$6+2i$.","Done."],"Combine like parts."),
    pr("p07","hard","Multiply $(2+i)(3-2i)$.","$8-i$",["FOIL: $6-4i+3i-2i^2$.","$6-i+2$ (since $i^2=-1$).","$8-i$."],"Use $i^2=-1$."),
    pr("p08","hard","Rationalize $\\dfrac{1}{2-\\sqrt3}$.","$2+\\sqrt3$",["Multiply by the conjugate $2+\\sqrt3$.","Denominator $4-3=1$.","$2+\\sqrt3$."],"Use the conjugate to clear the root.")
  ] },

{ id: "alg-06-linear-equations", title: "Linear Equations & Inequalities", chapter: "Ch. 2.1", problems: [1,2,3,4,5,6,7,8],
  summary: "A linear equation has the variable to the first power. Solve by isolating it with inverse operations; solve inequalities the same way but flip the sign when multiplying or dividing by a negative. Word problems translate into linear equations.",
  glossary: {
    "linear equation": g("An equation with the variable to the first power.", "$ax+b=c$; one solution (usually)."),
    "inverse operation": g("The operation that undoes another.", "Subtract to undo add, divide to undo multiply."),
    "isolate the variable": g("Get the variable alone on one side.", "Apply inverse operations to both sides."),
    "inequality": g("A statement with $<,\\le,>,\\ge$.", "Solutions form a range, not a single number."),
    "flip the inequality": g("Reverse $<$↔$>$ when multiplying/dividing by a negative.", "Essential rule for inequalities."),
    "literal equation": g("A formula solved for one of its letters.", "Isolate the desired variable symbolically."),
    "solution set": g("All values that satisfy the equation/inequality.", "For linear inequalities, an interval."),
    "translate": g("Turn words into an equation.", "Map phrases like 'is', 'more than' to symbols.")
  },
  concepts: [
    cn(1, "Solving linear equations", "Undo operations in reverse order to isolate the variable: clear parentheses and fractions, combine like terms, then move variable terms to one side and constants to the other.", ["Simplify each side (distribute, combine).", "Get variable terms together, constants together.", "Divide by the coefficient."]),
    cn(2, "Equations with fractions", "Multiply every term by the LCD to clear fractions, turning the equation into an integer-coefficient one that's easier to solve.", ["Find the LCD of all fractions.", "Multiply every term by it.", "Solve the resulting equation."]),
    cn(3, "Literal equations", "To solve a formula for a chosen variable, treat the others as constants and isolate it with the same inverse-operation steps.", ["Pick the target variable.", "Move everything else away using inverse operations.", "Divide out its coefficient."]),
    cn(4, "Linear inequalities", "Solve like equations, but reverse the inequality symbol whenever you multiply or divide both sides by a negative. The answer is an interval.", ["Isolate the variable as usual.", "Flip the sign if you multiply/divide by a negative.", "Write the solution as an interval."]),
    cn(5, "Word problems", "Translate the words into an equation: name the unknown, express relationships as symbols, solve, and check the answer against the story.", ["Define the variable.", "Write the equation from the relationships.", "Solve and verify in context."])
  ],
  examples: [
    ex("Budgeting to a target", "Save a fixed amount to reach a goal.", "A linear equation solves for how many weeks of saving are needed."),
    ex("Break-even point", "Cost equals revenue.", "Setting a linear cost equal to a linear revenue and solving finds the break-even quantity."),
    ex("Temperature conversion", "Convert between Celsius and Fahrenheit.", "The literal equation $F=\\tfrac95 C+32$ is solved for either variable.")
  ],
  videos: vids("solving linear equations isolate variable steps", "linear inequalities flip sign word problems examples", "college algebra linear equations worked problems"),
  problems: [
    pr("p01","easy","Solve $2x+3=11$.","$x=4$",["Subtract 3: $2x=8$.","Divide by 2.","$x=4$."],"Undo add, then multiply."),
    pr("p02","easy","Solve $5x=20$.","$x=4$",["Divide by 5.","$x=4$.","Done."],"Divide by the coefficient."),
    pr("p03","medium","Solve $3(x-2)=12$.","$x=6$",["Distribute or divide first: $x-2=4$.","$x=6$.","Done."],"Handle the parentheses."),
    pr("p04","medium","Solve $\\tfrac{x}{2}+1=4$.","$x=6$",["Subtract 1: $\\tfrac{x}{2}=3$.","Multiply by 2.","$x=6$."],"Undo the fraction last."),
    pr("p05","medium","Solve $2x+5=x-3$.","$x=-8$",["Subtract $x$: $x+5=-3$.","Subtract 5.","$x=-8$."],"Collect variable terms on one side."),
    pr("p06","medium","Solve the inequality $-2x>6$.","$x<-3$",["Divide by $-2$, flip the sign.","$x<-3$.","Done."],"Flip when dividing by a negative."),
    pr("p07","hard","Solve $ax+b=c$ for $x$.","$x=\\dfrac{c-b}{a}$",["Subtract $b$.","Divide by $a$.","$x=\\dfrac{c-b}{a}$."],"Treat $a,b,c$ as constants."),
    pr("p08","hard","A number tripled and increased by 4 is 19. Find it.","$5$",["$3x+4=19$.","$3x=15$.","$x=5$."],"Translate then solve.")
  ] },

{ id: "alg-07-quadratic-equations", title: "Quadratic Equations", chapter: "Ch. 2.2", problems: [1,2,3,4,5,6,7,8],
  summary: "A quadratic $ax^2+bx+c=0$ can be solved by factoring (zero-product), the square-root property, completing the square, or the quadratic formula $x=\\dfrac{-b\\pm\\sqrt{b^2-4ac}}{2a}$. The discriminant $b^2-4ac$ tells how many real solutions exist.",
  glossary: {
    "quadratic equation": g("A degree-2 equation $ax^2+bx+c=0$.", "Up to two solutions."),
    "zero-product property": g("A product is zero only if a factor is zero.", "Factor, then set each factor to 0."),
    "square-root property": g("Solve $x^2=k$ by taking $\\pm\\sqrt{k}$.", "$x=\\pm\\sqrt k$."),
    "completing the square": g("Rewriting to a perfect-square form.", "Add $(b/2)^2$ to both sides."),
    "quadratic formula": g("The solution formula for any quadratic.", "$x=\\dfrac{-b\\pm\\sqrt{b^2-4ac}}{2a}$."),
    "discriminant": g("The $b^2-4ac$ under the radical.", "$>0$ two real, $=0$ one, $<0$ two complex."),
    "vertex": g("The turning point of the parabola.", "At $x=-b/(2a)$; the max or min."),
    "roots": g("The solutions — where the parabola meets the $x$-axis.", "Also called zeros.")
  },
  concepts: [
    cn(1, "Solving by factoring", "If the quadratic factors, set it to zero, factor, and apply the zero-product property: each factor equal to zero gives a solution.", ["Write it as $=0$.", "Factor the quadratic.", "Set each factor to 0 and solve."]),
    cn(2, "The square-root property", "For $x^2=k$ (or $(x-h)^2=k$), take the square root of both sides, remembering the $\\pm$: $x=\\pm\\sqrt k$.", ["Isolate the squared term.", "Take $\\pm\\sqrt{\\ }$ of both sides.", "Solve for $x$."]),
    cn(3, "Completing the square", "Turn $x^2+bx$ into a perfect square by adding $(b/2)^2$ to both sides, then use the square-root property. This also derives the quadratic formula.", ["Move the constant across.", "Add $(b/2)^2$ to both sides.", "Factor the perfect square and take roots."]),
    cn(4, "The quadratic formula", "For any $ax^2+bx+c=0$, $x=\\dfrac{-b\\pm\\sqrt{b^2-4ac}}{2a}$. It always works — plug in $a,b,c$ carefully with signs.", ["Identify $a,b,c$.", "Compute the discriminant $b^2-4ac$.", "Apply the formula and simplify."]),
    cn(5, "The discriminant", "The sign of $b^2-4ac$ tells the solution count: positive ⇒ two real, zero ⇒ one (repeated), negative ⇒ two complex.", ["Compute $b^2-4ac$.", "$>0$: two real; $=0$: one; $<0$: complex.", "Interpret before fully solving."])
  ],
  examples: [
    ex("Projectile height", "A ball's height is quadratic in time.", "Setting height to zero and solving finds when it lands — a quadratic equation."),
    ex("Maximizing area", "A fixed fence enclosing the most area.", "The area is a quadratic; its vertex gives the optimal dimensions."),
    ex("Golden-ratio design", "A pleasing rectangle proportion.", "The defining proportion leads to a quadratic solved by the formula.")
  ],
  videos: vids("solving quadratic equations factoring square root property", "completing the square quadratic formula discriminant examples", "college algebra quadratic equations worked problems"),
  problems: [
    pr("p01","easy","Solve $x^2-9=0$.","$x=\\pm3$",["$x^2=9$.","$x=\\pm\\sqrt9$.","$\\pm3$."],"Square-root property."),
    pr("p02","easy","Solve $x^2-5x+6=0$.","$x=2,3$",["Factor $(x-2)(x-3)=0$.","Each factor 0.","$x=2,3$."],"Zero-product property."),
    pr("p03","medium","Solve $x^2+4x=0$.","$x=0,-4$",["Factor $x(x+4)=0$.","$x=0$ or $x=-4$.","Done."],"Factor out $x$."),
    pr("p04","medium","Solve $(x-3)^2=16$.","$x=7,-1$",["$x-3=\\pm4$.","$x=7$ or $x=-1$.","Done."],"Square-root property with $\\pm$."),
    pr("p05","medium","Use the formula: $x^2+2x-3=0$.","$x=1,-3$",["$a=1,b=2,c=-3$; disc $=16$.","$x=\\dfrac{-2\\pm4}{2}$.","$1,-3$."],"Plug into the quadratic formula."),
    pr("p06","medium","Find the discriminant of $x^2+x+1=0$ and the solution type.","$-3$; two complex",["$b^2-4ac=1-4$.","$=-3<0$.","Two complex solutions."],"Sign of $b^2-4ac$."),
    pr("p07","hard","Solve by completing the square: $x^2+6x+5=0$.","$x=-1,-5$",["$x^2+6x=-5$; add 9.","$(x+3)^2=4$; $x+3=\\pm2$.","$x=-1,-5$."],"Add $(6/2)^2=9$."),
    pr("p08","hard","Solve $2x^2-4x-1=0$ (formula).","$x=\\dfrac{2\\pm\\sqrt6}{2}$",["$a=2,b=-4,c=-1$; disc $=24$.","$x=\\dfrac{4\\pm\\sqrt{24}}{4}=\\dfrac{4\\pm2\\sqrt6}{4}$.","$\\dfrac{2\\pm\\sqrt6}{2}$."],"Simplify the radical carefully.")
  ] },

{ id: "alg-08-polynomial-rational-equations", title: "Polynomial & Rational Equations", chapter: "Ch. 2.3–2.4", problems: [1,2,3,4,5,6,7,8],
  summary: "Higher-degree polynomial equations solve by factoring to zero-product form. Rational equations clear denominators by multiplying by the LCD, then solve — but you must reject any solution that makes an original denominator zero (extraneous).",
  glossary: {
    "polynomial equation": g("A polynomial set equal to zero.", "Degree $n$ can have up to $n$ real roots."),
    "zero-product property": g("A product is 0 iff a factor is 0.", "Solve each factor after full factoring."),
    "rational equation": g("An equation containing rational expressions.", "Clear denominators with the LCD."),
    "LCD (equations)": g("Least common denominator to multiply through by.", "Removes all fractions from the equation."),
    "extraneous solution": g("A candidate that fails in the original equation.", "Usually makes a denominator zero — reject it."),
    "factor completely": g("Reduce a polynomial to prime factors.", "Reveals every root via zero-product."),
    "degree and roots": g("A degree-$n$ polynomial has $\\le n$ roots.", "Counting multiplicity, exactly $n$ (over the complexes)."),
    "check solutions": g("Verify each candidate in the original.", "Especially crucial for rational equations.")
  },
  concepts: [
    cn(1, "Higher-degree by factoring", "Set the polynomial to zero, factor completely (GCF, grouping, special forms), and apply the zero-product property to each factor.", ["Write it as $=0$.", "Factor fully.", "Solve each factor $=0$."]),
    cn(2, "Equations reducible to quadratic", "Some equations become quadratic with a substitution (e.g. $u=x^2$ in $x^4-5x^2+4=0$). Solve for $u$, then back-substitute.", ["Spot the quadratic pattern in a new variable.", "Substitute $u$ and solve the quadratic.", "Back-substitute and solve for $x$."]),
    cn(3, "Clearing rational equations", "Multiply every term by the LCD to remove denominators, turning the equation into a polynomial one you can solve.", ["Find the LCD of all denominators.", "Multiply each term by it.", "Solve the resulting polynomial equation."]),
    cn(4, "Extraneous solutions", "Multiplying by the LCD can introduce false solutions. Check each candidate in the original: reject any that makes a denominator zero.", ["List the excluded values first.", "Solve the cleared equation.", "Discard candidates equal to an excluded value."]),
    cn(5, "Verifying and counting", "A degree-$n$ polynomial has at most $n$ real roots. Verify solutions and note repeated roots (multiplicity) where the graph touches without crossing.", ["Count expected roots by degree.", "Verify each in the original.", "Note multiplicities."])
  ],
  examples: [
    ex("Concentration reaching a target", "Mixing to hit a desired strength.", "The balance equation is rational; clearing denominators solves for the amount to add."),
    ex("Shared task time", "Two pumps drain a tank together.", "$\\tfrac1a+\\tfrac1b=\\tfrac1t$ is a rational equation solved for the combined time."),
    ex("Designing a box", "Volume as a cubic in one dimension.", "Setting the volume polynomial to a target and factoring gives the dimension.")
  ],
  videos: vids("polynomial equations factoring zero product higher degree", "rational equations LCD extraneous solutions examples", "college algebra polynomial rational equations worked problems"),
  problems: [
    pr("p01","easy","Solve $x^3-4x=0$.","$x=0,\\pm2$",["Factor $x(x^2-4)=x(x-2)(x+2)$.","Each factor 0.","$x=0,2,-2$."],"GCF then difference of squares."),
    pr("p02","easy","Solve $(x-1)(x+2)(x-3)=0$.","$x=1,-2,3$",["Zero-product.","Each factor 0.","$1,-2,3$."],"Set each factor to zero."),
    pr("p03","medium","Solve $x^4-5x^2+4=0$.","$x=\\pm1,\\pm2$",["Let $u=x^2$: $u^2-5u+4=0\\Rightarrow u=1,4$.","$x^2=1$ or $x^2=4$.","$x=\\pm1,\\pm2$."],"Substitute $u=x^2$."),
    pr("p04","medium","Solve $\\dfrac{1}{x}+\\dfrac{1}{2}=\\dfrac{3}{4}$.","$x=4$",["LCD $4x$: $4+2x=3x$.","$x=4$.","Check: allowed."],"Multiply through by $4x$."),
    pr("p05","medium","Solve $\\dfrac{x}{x-1}=2$.","$x=2$",["Multiply by $x-1$: $x=2(x-1)$.","$x=2x-2\\Rightarrow x=2$.","Check: $x\\neq1$ ✓."],"Clear the denominator, then check."),
    pr("p06","hard","Solve $\\dfrac{1}{x-2}=\\dfrac{x}{x-2}$ and check.","$x=1$",["Multiply by $x-2$: $1=x$.","Candidate $x=1$ (not 2).","Valid; $x=1$."],"Exclude $x=2$ first."),
    pr("p07","hard","Solve $\\dfrac{2}{x}+\\dfrac{3}{x+1}=\\dfrac{5}{2}$ (leading step).","clear by LCD $2x(x+1)$",["LCD is $2x(x+1)$.","$4(x+1)+6x=5x(x+1)$.","Solve the quadratic, then check."],"Multiply every term by the LCD."),
    pr("p08","hard","Why is $x=3$ extraneous for $\\dfrac{1}{x-3}=\\dfrac{2}{x-3}$?","It makes a denominator 0",["$x=3$ zeros the denominators.","Undefined in the original.","Reject it."],"Excluded values can't be solutions.")
  ] },

{ id: "alg-09-radical-equations", title: "Radical Equations", chapter: "Ch. 2.5", problems: [1,2,3,4,5,6,7,8],
  summary: "Solve an equation with a variable under a radical by isolating the radical and raising both sides to the matching power. Squaring can introduce extraneous solutions, so every candidate must be checked in the original equation.",
  glossary: {
    "radical equation": g("An equation with the variable under a root.", "Isolate the radical, then power both sides."),
    "isolate the radical": g("Get the root alone before powering up.", "Essential first step."),
    "square both sides": g("Raise to the power that cancels the root.", "Squaring for square roots, cubing for cube roots."),
    "extraneous root": g("A candidate that fails the original.", "Introduced by squaring; must be discarded."),
    "index": g("The root's degree (2, 3, …).", "Raise both sides to this power to clear it."),
    "check required": g("Always verify in the original equation.", "Squaring can create false solutions."),
    "two radicals": g("Equations with more than one root.", "Isolate one, square, isolate the other, square again."),
    "domain restriction": g("Radicands of even roots must be $\\ge0$.", "Limits which solutions are possible.")
  },
  concepts: [
    cn(1, "Isolate then power", "Get the radical by itself, then raise both sides to the index's power to remove it. For a square root, square both sides.", ["Move everything else to the other side.", "Raise both sides to the index power.", "Solve the resulting equation."]),
    cn(2, "Checking for extraneous roots", "Squaring can create solutions that don't satisfy the original. Substitute each candidate back and keep only those that work.", ["Solve to get candidates.", "Plug each into the original.", "Discard any that fail."]),
    cn(3, "Two radicals", "When two radicals appear, isolate one and square, then isolate the remaining radical and square again to eliminate both.", ["Isolate one radical; square.", "Isolate the second radical; square.", "Solve and check."]),
    cn(4, "Higher-index roots", "For a cube root, cube both sides; for an $n$-th root, raise to the $n$-th power. Odd roots don't create extraneous solutions the way even roots can, but checking is still wise.", ["Match the power to the index.", "Clear the radical.", "Solve, then verify."]),
    cn(5, "Domain awareness", "Even roots require nonnegative radicands, and a square root outputs a nonnegative value — so an equation like $\\sqrt{x}=-2$ has no solution.", ["Note radicand $\\ge0$ for even roots.", "A principal root can't equal a negative.", "Rule out impossible cases early."])
  ],
  examples: [
    ex("Pendulum period", "Period depends on the square root of length.", "Solving $T=2\\pi\\sqrt{L/g}$ for $L$ squares both sides — a radical equation."),
    ex("Distance and speed", "Time from a square-root relationship.", "Free-fall time $t=\\sqrt{2h/g}$ inverts by squaring."),
    ex("Skid-mark speed estimate", "Police estimate speed from skid length.", "The speed formula involves a square root; solving for length squares it.")
  ],
  videos: vids("radical equations isolate square both sides check", "solving radical equations two radicals extraneous examples", "college algebra radical equations worked problems"),
  problems: [
    pr("p01","easy","Solve $\\sqrt{x}=5$.","$x=25$",["Square both sides.","$x=25$.","Check: $\\sqrt{25}=5$ ✓."],"Square to undo the root."),
    pr("p02","easy","Solve $\\sqrt{x+1}=3$.","$x=8$",["Square: $x+1=9$.","$x=8$.","Check ✓."],"Isolate then square."),
    pr("p03","medium","Solve $\\sqrt{2x-1}=3$.","$x=5$",["Square: $2x-1=9$.","$2x=10$.","$x=5$ ✓."],"Square both sides."),
    pr("p04","medium","Solve $\\sqrt{x}=-2$.","No solution",["A principal root is $\\ge0$.","Can't equal $-2$.","No solution."],"Roots aren't negative."),
    pr("p05","medium","Solve $\\sqrt{x+6}=x$.","$x=3$",["Square: $x+6=x^2$.","$x^2-x-6=0\\Rightarrow x=3,-2$.","Check: $x=3$ works, $x=-2$ extraneous."],"Check both candidates."),
    pr("p06","hard","Solve $\\sqrt[3]{x-1}=2$.","$x=9$",["Cube both sides.","$x-1=8$.","$x=9$."],"Cube for a cube root."),
    pr("p07","hard","Solve $\\sqrt{x+7}-1=x$.","$x=2$",["Isolate: $\\sqrt{x+7}=x+1$; square.","$x+7=x^2+2x+1\\Rightarrow x^2+x-6=0$.","$x=2$ ($x=-3$ extraneous)."],"Move the constant, then square."),
    pr("p08","hard","Which solution of $\\sqrt{x+2}=x$ is extraneous?","$x=-1$",["Square: $x^2-x-2=0\\Rightarrow x=2,-1$.","$x=-1$: $\\sqrt{1}=1\\neq-1$.","Reject $x=-1$."],"Test each in the original.")
  ] },

{ id: "alg-10-lines", title: "Lines: Slope & Equations", chapter: "Ch. 3.1", problems: [1,2,3,4,5,6,7,8],
  summary: "A line's slope $m=\\dfrac{\\Delta y}{\\Delta x}$ measures steepness. Write lines in slope-intercept $y=mx+b$ or point-slope $y-y_1=m(x-x_1)$ form. Parallel lines share a slope; perpendicular slopes are negative reciprocals.",
  glossary: {
    "slope": g("Rise over run — steepness of a line.", "$m=\\dfrac{y_2-y_1}{x_2-x_1}$."),
    "y-intercept": g("Where the line crosses the $y$-axis.", "The $b$ in $y=mx+b$; $x=0$ there."),
    "slope-intercept form": g("$y=mx+b$.", "Reads off slope and intercept directly."),
    "point-slope form": g("$y-y_1=m(x-x_1)$.", "Build a line from a point and a slope."),
    "parallel lines": g("Lines that never meet — same slope.", "$m_1=m_2$."),
    "perpendicular lines": g("Lines meeting at a right angle.", "Slopes are negative reciprocals: $m_1 m_2=-1$."),
    "x-intercept": g("Where the line crosses the $x$-axis.", "Set $y=0$ and solve."),
    "horizontal/vertical": g("Zero slope vs undefined slope.", "$y=c$ (flat) and $x=c$ (vertical).")
  },
  concepts: [
    cn(1, "Slope", "Slope is the ratio of vertical change to horizontal change between two points: $m=\\dfrac{y_2-y_1}{x_2-x_1}$. Positive rises, negative falls, zero is flat, undefined is vertical.", ["Pick two points.", "Compute rise $\\div$ run.", "Interpret the sign and size."]),
    cn(2, "Slope-intercept form", "$y=mx+b$ shows the slope $m$ and $y$-intercept $b$ at a glance — the easiest form for graphing and reading behavior.", ["Solve the equation for $y$.", "Read $m$ (coefficient) and $b$ (constant).", "Plot $b$, then use $m$ to step."]),
    cn(3, "Point-slope form", "Given a point $(x_1,y_1)$ and slope $m$, write $y-y_1=m(x-x_1)$. Convert to slope-intercept if desired.", ["Insert the point and slope.", "Simplify.", "Rearrange to $y=mx+b$ if needed."]),
    cn(4, "Parallel and perpendicular", "Parallel lines share the same slope; perpendicular lines have slopes that are negative reciprocals ($m$ and $-1/m$).", ["Parallel: match the slope.", "Perpendicular: flip and negate the slope.", "Use with a point to build the line."]),
    cn(5, "Finding a line from two points", "Compute the slope from the two points, then use point-slope with either point to get the equation.", ["Find $m$ from the two points.", "Apply point-slope with one point.", "Simplify."])
  ],
  examples: [
    ex("Cost with a flat fee", "A plan charges a base fee plus per-unit cost.", "Total cost is linear: $y=mx+b$, with $b$ the fee and $m$ the rate."),
    ex("Road grade", "A highway sign shows a percent grade.", "Grade is slope — rise over run — expressed as a percentage."),
    ex("Depreciation", "An asset loses value at a steady rate.", "Its value is a line with negative slope; the intercept is the purchase price.")
  ],
  videos: vids("slope formula slope intercept form graphing lines", "point slope parallel perpendicular lines examples", "college algebra lines slope equations worked problems"),
  problems: [
    pr("p01","easy","Find the slope through $(1,2)$ and $(4,8)$.","$2$",["$m=\\dfrac{8-2}{4-1}$.","$=\\dfrac63$.","$2$."],"Rise over run."),
    pr("p02","easy","Give the slope and $y$-intercept of $y=3x-4$.","$m=3,\\ b=-4$",["Slope-intercept form.","$m=3$, $b=-4$.","Done."],"Read off $y=mx+b$."),
    pr("p03","medium","Write the line with slope $2$ through $(1,3)$.","$y=2x+1$",["Point-slope: $y-3=2(x-1)$.","$y=2x+1$.","Done."],"Use point-slope, then simplify."),
    pr("p04","medium","Find the line through $(0,2)$ and $(2,6)$.","$y=2x+2$",["$m=\\dfrac{6-2}{2-0}=2$.","$b=2$ (from $(0,2)$).","$y=2x+2$."],"Slope, then intercept."),
    pr("p05","medium","What slope is perpendicular to $m=\\tfrac23$?","$-\\tfrac32$",["Negative reciprocal.","Flip and negate.","$-\\tfrac32$."],"$m_1 m_2=-1$."),
    pr("p06","medium","Find the $x$-intercept of $y=2x-6$.","$x=3$",["Set $y=0$: $0=2x-6$.","$x=3$.","Done."],"Set $y=0$."),
    pr("p07","hard","Line parallel to $y=3x+1$ through $(2,1)$.","$y=3x-5$",["Same slope $3$; point-slope $y-1=3(x-2)$.","$y=3x-5$.","Done."],"Parallel ⇒ same slope."),
    pr("p08","hard","Line perpendicular to $y=\\tfrac12 x$ through $(4,0)$.","$y=-2x+8$",["Perp slope $-2$; $y-0=-2(x-4)$.","$y=-2x+8$.","Done."],"Negative reciprocal slope.")
  ] },

{ id: "alg-11-conics", title: "Circles & Parabolas", chapter: "Ch. 3.2", problems: [1,2,3,4,5,6,7,8],
  summary: "A circle of radius $r$ centered at $(h,k)$ is $(x-h)^2+(y-k)^2=r^2$. A parabola $y=a(x-h)^2+k$ opens up or down with vertex $(h,k)$. Completing the square converts general equations to these standard forms.",
  glossary: {
    "circle": g("All points a fixed distance from a center.", "$(x-h)^2+(y-k)^2=r^2$."),
    "center and radius": g("The circle's middle point and its size.", "$(h,k)$ and $r$ from standard form."),
    "parabola": g("A U-shaped curve, graph of a quadratic.", "$y=a(x-h)^2+k$ with vertex $(h,k)$."),
    "vertex": g("The turning point of a parabola.", "Max if it opens down, min if up."),
    "axis of symmetry": g("The vertical line through the vertex.", "$x=h$; the parabola mirrors across it."),
    "standard form": g("The clean form revealing key features.", "Circle: center-radius; parabola: vertex form."),
    "completing the square": g("Converting general to standard form.", "Group and add $(b/2)^2$ to build squares."),
    "opens up/down": g("Direction a parabola faces.", "$a>0$ up (min), $a<0$ down (max).")
  },
  concepts: [
    cn(1, "The circle equation", "A circle centered at $(h,k)$ with radius $r$ is $(x-h)^2+(y-k)^2=r^2$. Read the center and radius straight from this form.", ["Match to $(x-h)^2+(y-k)^2=r^2$.", "Center is $(h,k)$.", "Radius is $\\sqrt{r^2}$."]),
    cn(2, "General to standard (circle)", "From $x^2+y^2+Dx+Ey+F=0$, complete the square in $x$ and in $y$ to recover the center and radius.", ["Group $x$-terms and $y$-terms.", "Complete each square.", "Rewrite as center-radius form."]),
    cn(3, "The parabola in vertex form", "$y=a(x-h)^2+k$ has vertex $(h,k)$ and axis $x=h$; $a$ sets width and direction (up if $a>0$).", ["Read the vertex $(h,k)$.", "Direction from the sign of $a$.", "Axis of symmetry $x=h$."]),
    cn(4, "Finding the vertex from $y=ax^2+bx+c$", "The vertex is at $x=-\\dfrac{b}{2a}$; plug in to get $y$. Or complete the square to reach vertex form.", ["Compute $x=-b/(2a)$.", "Evaluate $y$ there.", "That point is the vertex."]),
    cn(5, "Graphing conics", "Plot the center/vertex, use the radius or a few symmetric points, and sketch. Symmetry cuts the work in half.", ["Plot the key point (center or vertex).", "Add symmetric points.", "Draw the smooth curve."])
  ],
  examples: [
    ex("GPS trilateration", "Distance from towers locates a phone.", "Each 'within range $r$ of a tower' is a circle; intersections pin the position."),
    ex("Satellite dish shape", "A dish focuses signals to one point.", "Its cross-section is a parabola, whose vertex form places the focus."),
    ex("Projectile arc", "A thrown ball traces a curve.", "The path is a parabola; the vertex is the peak height.")
  ],
  videos: vids("circle equation center radius standard form", "parabola vertex form axis of symmetry completing the square", "college algebra circles parabolas conics worked problems"),
  problems: [
    pr("p01","easy","Center and radius of $(x-2)^2+(y+3)^2=16$.","Center $(2,-3)$, $r=4$",["Match standard form.","$h=2,k=-3$, $r^2=16$.","$r=4$."],"Signs flip inside the squares."),
    pr("p02","easy","Equation of a circle centered at origin, radius 5.","$x^2+y^2=25$",["$(x-0)^2+(y-0)^2=5^2$.","$x^2+y^2=25$.","Done."],"$h=k=0$."),
    pr("p03","medium","Vertex of $y=(x-1)^2+4$.","$(1,4)$",["Vertex form.","$h=1,k=4$.","$(1,4)$."],"Read $(h,k)$."),
    pr("p04","medium","Vertex of $y=x^2-6x+5$.","$(3,-4)$",["$x=-b/(2a)=3$.","$y=9-18+5=-4$.","$(3,-4)$."],"$x=-b/(2a)$, then find $y$."),
    pr("p05","medium","Does $y=-2(x+1)^2+3$ open up or down?","Down (max at $(-1,3)$)",["$a=-2<0$.","Opens down.","Vertex is a max."],"Sign of $a$."),
    pr("p06","hard","Find the center/radius of $x^2+y^2-4x+6y-3=0$.","Center $(2,-3)$, $r=4$",["Complete squares: $(x-2)^2+(y+3)^2=3+4+9$.","$=16$.","Center $(2,-3)$, $r=4$."],"Complete the square in $x$ and $y$."),
    pr("p07","hard","Write $y=x^2+4x+1$ in vertex form.","$y=(x+2)^2-3$",["Complete the square: $x^2+4x+4-4+1$.","$(x+2)^2-3$.","Done."],"Add and subtract $(4/2)^2=4$."),
    pr("p08","hard","Axis of symmetry of $y=2x^2-8x+1$.","$x=2$",["$x=-b/(2a)=8/4$.","$=2$.","$x=2$."],"Axis is $x=-b/(2a)$.")
  ] },

{ id: "alg-12-systems", title: "Systems of Equations", chapter: "Ch. 3.3", problems: [1,2,3,4,5,6,7,8],
  summary: "A system asks for values satisfying several equations at once. Solve linear systems by substitution or elimination; nonlinear systems (a line and a circle) by substitution. A system has one solution, none (parallel), or infinitely many (same line).",
  glossary: {
    "system of equations": g("Two or more equations solved together.", "A solution satisfies all of them."),
    "substitution": g("Solve one equation for a variable, plug into the other.", "Reduces to a single-variable equation."),
    "elimination": g("Add/subtract equations to cancel a variable.", "Scale first so coefficients match."),
    "consistent": g("Has at least one solution.", "Independent (one) or dependent (infinite)."),
    "inconsistent": g("No solution — equations contradict.", "Parallel lines; elimination gives a false statement."),
    "dependent": g("Infinitely many solutions — same line.", "Elimination gives $0=0$."),
    "nonlinear system": g("At least one non-line (circle, parabola).", "Usually solved by substitution."),
    "point of intersection": g("Where the graphs meet — the solution.", "Coordinates satisfying every equation.")
  },
  concepts: [
    cn(1, "Substitution", "Solve one equation for a variable, substitute into the other, solve the single-variable equation, then back-substitute for the second variable.", ["Isolate a variable in one equation.", "Substitute into the other.", "Solve, then back-substitute."]),
    cn(2, "Elimination", "Scale the equations so one variable's coefficients are opposites, add to cancel it, solve for the remaining variable, then back-substitute.", ["Multiply to align coefficients.", "Add to eliminate one variable.", "Solve and back-substitute."]),
    cn(3, "Number of solutions", "One intersection ⇒ one solution; parallel lines ⇒ none (inconsistent); identical lines ⇒ infinitely many (dependent). Elimination reveals which via $0=0$ or $0=c$.", ["Attempt to solve.", "$0=c$ (false) ⇒ no solution.", "$0=0$ ⇒ infinitely many."]),
    cn(4, "Nonlinear systems", "For a line and a conic, substitute the line into the conic to get a quadratic; its solutions give the intersection points (0, 1, or 2).", ["Solve the linear equation for one variable.", "Substitute into the nonlinear one.", "Solve the resulting quadratic."]),
    cn(5, "Word problems with systems", "Mixture, rate, and money problems often need two equations. Define two variables, write two relationships, and solve the system.", ["Name two unknowns.", "Write two equations from the conditions.", "Solve by substitution or elimination."])
  ],
  examples: [
    ex("Ticket sales mix", "Adult and child tickets total a known count and revenue.", "Two equations in two unknowns solve for how many of each sold."),
    ex("Break-even with two costs", "Two plans priced differently.", "Setting the plans equal is a system whose solution is the crossover point."),
    ex("Blending investments", "Split money between two rates.", "A system in the two amounts matches a target total and interest.")
  ],
  videos: vids("systems of equations substitution elimination method", "systems solutions consistent inconsistent nonlinear examples", "college algebra systems of equations worked problems"),
  problems: [
    pr("p01","easy","Solve $y=2x$, $x+y=6$.","$(2,4)$",["Substitute: $x+2x=6$.","$x=2$, $y=4$.","$(2,4)$."],"Substitute the first into the second."),
    pr("p02","easy","Solve $x+y=5$, $x-y=1$.","$(3,2)$",["Add: $2x=6\\Rightarrow x=3$.","$y=2$.","$(3,2)$."],"Elimination by adding."),
    pr("p03","medium","Solve $2x+y=7$, $x-y=2$.","$(3,1)$",["Add: $3x=9\\Rightarrow x=3$.","$y=1$.","$(3,1)$."],"Add to cancel $y$."),
    pr("p04","medium","Solve $3x+2y=12$, $x=2$.","$(2,3)$",["Substitute $x=2$: $6+2y=12$.","$y=3$.","$(2,3)$."],"Plug in the known value."),
    pr("p05","medium","How many solutions: $y=2x+1$, $y=2x-3$?","None (parallel)",["Same slope, different intercept.","Parallel lines.","No solution."],"Equal slopes, unequal intercepts."),
    pr("p06","hard","Solve $y=x^2$, $y=x+2$.","$(2,4)$ and $(-1,1)$",["$x^2=x+2\\Rightarrow x^2-x-2=0$.","$x=2,-1$.","$(2,4),(-1,1)$."],"Substitute the line into the parabola."),
    pr("p07","hard","Solve $2x+3y=13$, $3x-y=3$ (elimination).","$(2,3)$",["From the 2nd, $y=3x-3$; substitute: $2x+9x-9=13$.","$11x=22\\Rightarrow x=2$, $y=3$.","$(2,3)$."],"Solve one for $y$, then substitute."),
    pr("p08","hard","A line $y=x$ meets circle $x^2+y^2=8$ where?","$(2,2)$ and $(-2,-2)$",["Substitute: $2x^2=8\\Rightarrow x^2=4$.","$x=\\pm2$, $y=x$.","$(2,2),(-2,-2)$."],"Put $y=x$ into the circle.")
  ] },

{ id: "alg-13-right-triangle-trig", title: "Right-Triangle Trig & the Unit Circle", chapter: "Ch. 4.1", problems: [1,2,3,4,5,6,7,8],
  summary: "Trig ratios sine, cosine, and tangent relate a right triangle's angles to its sides (SOH-CAH-TOA). The unit circle extends these to all angles, with coordinates $(\\cos\\theta,\\sin\\theta)$ and special angles $30^\\circ,45^\\circ,60^\\circ$ giving exact values.",
  glossary: {
    "sine": g("Opposite over hypotenuse in a right triangle.", "$\\sin\\theta=\\dfrac{\\text{opp}}{\\text{hyp}}$."),
    "cosine": g("Adjacent over hypotenuse.", "$\\cos\\theta=\\dfrac{\\text{adj}}{\\text{hyp}}$."),
    "tangent": g("Opposite over adjacent.", "$\\tan\\theta=\\dfrac{\\text{opp}}{\\text{adj}}=\\dfrac{\\sin}{\\cos}$."),
    "SOH-CAH-TOA": g("Memory aid for the three ratios.", "Sine-Opp-Hyp, Cos-Adj-Hyp, Tan-Opp-Adj."),
    "unit circle": g("A circle of radius 1 centered at the origin.", "A point at angle $\\theta$ is $(\\cos\\theta,\\sin\\theta)$."),
    "special angles": g("$30^\\circ,45^\\circ,60^\\circ$ with exact values.", "From the 30-60-90 and 45-45-90 triangles."),
    "radian": g("An angle measure based on arc length.", "$180^\\circ=\\pi$ radians."),
    "reference angle": g("The acute angle to the $x$-axis.", "Gives the magnitude of trig values in any quadrant.")
  },
  concepts: [
    cn(1, "The three ratios", "In a right triangle, sine, cosine, and tangent are fixed ratios of the sides for a given acute angle — SOH-CAH-TOA. They let you find unknown sides or angles.", ["Label opposite, adjacent, hypotenuse relative to the angle.", "Pick the ratio with your known and unknown sides.", "Solve for the unknown."]),
    cn(2, "Solving right triangles", "Given an angle and a side, use a trig ratio to find another side; given two sides, use an inverse trig function to find the angle.", ["Choose the ratio linking known and unknown.", "Set up and solve the equation.", "Use $\\sin^{-1}$, etc., for angles."]),
    cn(3, "Special right triangles", "The 45-45-90 triangle has sides $1:1:\\sqrt2$; the 30-60-90 has $1:\\sqrt3:2$. These give exact trig values for $30^\\circ,45^\\circ,60^\\circ$.", ["Recall the side ratios.", "Read off exact sine/cosine.", "e.g. $\\sin30^\\circ=\\tfrac12$, $\\cos45^\\circ=\\tfrac{\\sqrt2}{2}$."]),
    cn(4, "The unit circle", "On the unit circle, the point at angle $\\theta$ has coordinates $(\\cos\\theta,\\sin\\theta)$. This defines sine and cosine for every angle, positive or negative.", ["Place the angle from the positive $x$-axis.", "The point's coordinates are $(\\cos\\theta,\\sin\\theta)$.", "Signs follow the quadrant."]),
    cn(5, "Radians and reference angles", "Convert degrees and radians with $180^\\circ=\\pi$. In any quadrant, the reference angle gives the value's size; the quadrant gives the sign.", ["Convert using $\\pi=180^\\circ$.", "Find the reference angle to the $x$-axis.", "Apply the quadrant sign."])
  ],
  examples: [
    ex("Height of a building", "Measure an angle of elevation from a distance.", "$\\tan\\theta=\\dfrac{\\text{height}}{\\text{distance}}$ solves for the height."),
    ex("Ramp angle", "A wheelchair ramp's rise and run.", "The angle satisfies $\\sin\\theta=\\dfrac{\\text{rise}}{\\text{length}}$."),
    ex("Ferris wheel height", "A rider's height as the wheel turns.", "Height varies as $\\sin\\theta$ around the circle — the unit-circle idea.")
  ],
  videos: vids("right triangle trigonometry SOH CAH TOA ratios", "unit circle special angles reference angle examples", "college algebra trigonometry right triangle unit circle problems"),
  problems: [
    pr("p01","easy","In a right triangle, opp $=3$, hyp $=5$. Find $\\sin\\theta$.","$\\tfrac35$",["$\\sin=\\text{opp}/\\text{hyp}$.","$3/5$.","$\\tfrac35$."],"SOH."),
    pr("p02","easy","Find $\\cos60^\\circ$.","$\\tfrac12$",["30-60-90 triangle.","adj/hyp $=1/2$.","$\\tfrac12$."],"Special angle."),
    pr("p03","easy","Find $\\tan45^\\circ$.","$1$",["45-45-90: opp $=$ adj.","$1/1$.","$1$."],"Equal legs."),
    pr("p04","medium","opp $=4$, adj $=3$. Find the hypotenuse and $\\sin\\theta$.","hyp $=5$, $\\sin=\\tfrac45$",["$\\sqrt{16+9}=5$.","$\\sin=4/5$.","Done."],"Pythagorean theorem first."),
    pr("p05","medium","Find $\\sin30^\\circ$ and $\\cos30^\\circ$.","$\\tfrac12,\\ \\tfrac{\\sqrt3}{2}$",["30-60-90 sides $1:\\sqrt3:2$.","$\\sin30=1/2$, $\\cos30=\\sqrt3/2$.","Done."],"Use the special triangle."),
    pr("p06","medium","Convert $90^\\circ$ to radians.","$\\tfrac{\\pi}{2}$",["$180^\\circ=\\pi$.","$90^\\circ=\\pi/2$.","Done."],"Scale by $\\pi/180$."),
    pr("p07","hard","A 20-ft ladder leans at $60^\\circ$. How high does it reach?","$10\\sqrt3\\approx17.3$ ft",["Height $=20\\sin60^\\circ$.","$=20\\cdot\\tfrac{\\sqrt3}{2}$.","$10\\sqrt3$ ft."],"$\\sin60^\\circ=\\sqrt3/2$."),
    pr("p08","hard","On the unit circle, what point is at $\\theta=180^\\circ$?","$(-1,0)$",["$(\\cos180^\\circ,\\sin180^\\circ)$.","$=(-1,0)$.","Done."],"Coordinates are $(\\cos,\\sin)$.")
  ] },

{ id: "alg-14-exp-log", title: "Exponential & Logarithmic Expressions", chapter: "Ch. 4.3", problems: [1,2,3,4,5,6,7,8],
  summary: "Exponential expressions $a^x$ grow or decay by a constant factor; logarithms invert them: $\\log_a x=y$ means $a^y=x$. The log laws turn products, quotients, and powers into sums, differences, and multiples, and let you solve exponential equations.",
  glossary: {
    "exponential expression": g("A constant raised to a variable power.", "$a^x$; grows if $a>1$, decays if $0<a<1$."),
    "logarithm": g("The inverse of an exponential.", "$\\log_a x=y\\iff a^y=x$."),
    "common log": g("Base-10 logarithm.", "$\\log x=\\log_{10}x$."),
    "natural log": g("Base-$e$ logarithm.", "$\\ln x=\\log_e x$."),
    "product law": g("Log of a product is a sum of logs.", "$\\log(MN)=\\log M+\\log N$."),
    "quotient law": g("Log of a quotient is a difference.", "$\\log\\tfrac{M}{N}=\\log M-\\log N$."),
    "power law": g("Log of a power pulls the exponent out.", "$\\log M^p=p\\log M$."),
    "change of base": g("Rewrite a log in another base.", "$\\log_a x=\\dfrac{\\ln x}{\\ln a}$.")
  },
  concepts: [
    cn(1, "Exponential expressions", "$a^x$ multiplies by $a$ each time $x$ increases by 1 — growth if $a>1$, decay if $0<a<1$. The base sets the rate; the exponent sets how many steps.", ["Identify the base $a$.", "Growth if $a>1$, decay if $a<1$.", "Evaluate by repeated multiplication or exponent laws."]),
    cn(2, "Logarithms as inverses", "$\\log_a x=y$ asks 'what power of $a$ gives $x$?' It undoes the exponential: $a^{\\log_a x}=x$ and $\\log_a(a^x)=x$.", ["Rewrite $\\log_a x=y$ as $a^y=x$.", "Evaluate simple logs by inspection.", "Use inverses to cancel matching bases."]),
    cn(3, "The log laws", "Products become sums, quotients become differences, and powers become coefficients: $\\log(MN)=\\log M+\\log N$, $\\log\\tfrac{M}{N}=\\log M-\\log N$, $\\log M^p=p\\log M$.", ["Expand products/quotients into sums/differences.", "Pull exponents to the front.", "Combine or condense as needed."]),
    cn(4, "Change of base", "To evaluate $\\log_a x$ on a calculator, use $\\log_a x=\\dfrac{\\ln x}{\\ln a}$ (or with $\\log_{10}$). It also rewrites logs into a common base.", ["Pick a convenient base ($e$ or 10).", "Write $\\dfrac{\\ln x}{\\ln a}$.", "Evaluate numerically."]),
    cn(5, "Solving exponential equations", "Take a logarithm of both sides to bring the variable exponent down, then solve the resulting linear equation.", ["Isolate the exponential.", "Take $\\ln$ (or $\\log$) of both sides.", "Use the power law to free the exponent, then solve."])
  ],
  examples: [
    ex("Compound interest", "Money grows by a fixed percent each year.", "Balance is exponential $P(1+r)^t$; logs solve for the time to reach a goal."),
    ex("pH of a solution", "Acidity on a logarithmic scale.", "$\\text{pH}=-\\log[\\text{H}^+]$ uses the common logarithm."),
    ex("Carbon dating", "Radioactive decay measures age.", "The remaining fraction is exponential; a logarithm recovers the elapsed time.")
  ],
  videos: vids("exponential expressions logarithm definition inverse", "log laws product quotient power change of base examples", "college algebra exponential logarithmic expressions worked problems"),
  problems: [
    pr("p01","easy","Evaluate $\\log_2 8$.","$3$",["$2^?=8$.","$2^3=8$.","$3$."],"What power of 2 is 8?"),
    pr("p02","easy","Evaluate $\\log_{10}1000$.","$3$",["$10^3=1000$.","$3$.","Done."],"Powers of 10."),
    pr("p03","easy","Rewrite $\\log_5 25=2$ in exponential form.","$5^2=25$",["$\\log_a x=y\\iff a^y=x$.","$5^2=25$.","Done."],"Definition of a log."),
    pr("p04","medium","Expand $\\log(xy)$.","$\\log x+\\log y$",["Product law.","$\\log x+\\log y$.","Done."],"Product ⇒ sum."),
    pr("p05","medium","Expand $\\log\\dfrac{x^2}{y}$.","$2\\log x-\\log y$",["Quotient then power law.","$\\log x^2-\\log y$.","$2\\log x-\\log y$."],"Combine quotient and power laws."),
    pr("p06","medium","Evaluate $\\ln e^3$.","$3$",["$\\ln$ and $e$ are inverses.","$\\ln e^3=3$.","Done."],"Inverse cancels."),
    pr("p07","hard","Solve $2^x=16$.","$x=4$",["$16=2^4$.","So $x=4$.","Or take $\\log_2$."],"Match the bases."),
    pr("p08","hard","Solve $e^x=10$ (to 2 dp).","$x=\\ln 10\\approx2.30$",["Take $\\ln$ of both sides.","$x=\\ln10$.","$\\approx2.30$."],"Take the natural log.")
  ] }
];

function writeLessons(list) {
  for (const L of list) {
    const doc = { title: L.title, summary: L.summary, glossary: L.glossary, concept_sections: L.concepts, real_world_examples: L.examples, videos: L.videos, problems: L.problems };
    fs.writeFileSync(path.join(LDIR, L.id + ".json"), JSON.stringify(doc, null, 2) + "\n");
  }
}
module.exports = { LESSONS, writeLessons };
if (require.main === module) { writeLessons(LESSONS); console.log("wrote " + LESSONS.length + " algebra lessons"); }
