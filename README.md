## <sup>q</sup>args

<sup>_Structure those arguments_</sup>

---

## Info

qargs is an argument verifier and parser, it supports required arguments, optional arguments, rest arguments, arguments after rest arguments, named arguments, unordered named arguments, options, flags, and negated flags.

## Usage

qargs is intended to be flexible, so it can parse custom types aas the user wishes.

You can find the simple library in `src/simple.ts`, if you don't wish to see the simple lib, but wish to use it, you can use it by importing it.

Ok, here we go, I'm assuming you're starting out with the simple library, for the below examples, the following code is prepended, but not visible in the code blocks:

```ts
import * as q from 'qargs'; // TypeScript, ESM
// OR
const q = require('qargs'); // CommonJS (Node.JS Default)

const s = q.simple;
```

## Arguments

<details>
<summary>Required Arguments</summary>

```ts
const parse = q.Parser([s.string(), s.number()]);

console.log(parse('hello 5').arguments.ordered); // > [ 'hello', 5 ] // There will probably be a "_: []" in there if you log it, ignore it for now, we'll cover it in the Unused Arguments section, i'll omit it in my examples
console.log(parse('"hello there" 5').arguments.ordered); // > [ 'hello there', 5 ]
console.log(parse("'hi there' 5").arguments.ordered); // > [ 'hi there', 5 ]
console.log(parse('hi')); // > null // Second argument (number) missing
console.log(parse('hi there')); // > null // Second argument (number) is not a number
```

We've created a parser that takes a string, then takes a number.

</details>

<details>
<summary>Optional Arguments</summary>

What if you want someone to be able to optionally enter something else?

```ts
const parse = q.Parser([s.string(), s.number(), s.boolean(false)]); // The first argument to the argument functions of the simple library specifies whether it's required

console.log(parse('hello 5 yep').arguments.ordered); // > [ 'hello', 5, true ]
console.log(parse('hi 8 false').arguments.ordered); // > [ 'hi', 8, false ]
console.log(parse('huh 2').arguments.ordered); // > [ 'huh', 2, Symbol(OMITTED) ]
console.log(parse('huh 2').arguments.ordered[2] === q.OMITTED); // > true
```

Any optional argument that is not given will be `Symbol(OMITTED)`, this symbol is exported.

Keep in mind that required arguments cannot follow optional arguments:

```ts
const parse = q.Parser([s.string(), s.number(false), s.boolean()]); // Error!
```

</details>

<details>
<summary>Rest Arguments</summary>

For the sake of examples, lets say you're writing a mute command for a chatbot, and you want a `reason` argument, but don't want people to have to surround it in quotes, use a rest argument!

```ts
const parse = q.Parser([s.string(), s.number(), s.string(true, null, true)]); // For now, ignore the null argument, we'll cover that in the Named Arguments section

console.log(parse('@BadPerson 10 constantly spitting profanities').arguments.ordered); // > [ '@BadPerson', 10, 'constantly spitting profanities' ]
```

You see that you don't have to put quotes for the reason, no matter the length, it will always not require quotes!

</details>

<details>
<summary>Arguments after Rest Arguments</summary>

Lets say you want to take a string, any amount of words, then a boolean, with arguments after rest arguments, the parser counts from the back aswell.

```ts
const parse = q.Parser([s.string(), s.string(true, null, true), s.boolean()]); // For now, ignore the null argument, we'll cover that in the Named Arguments section

console.log(parse('hello how are you? true').arguments.ordered); // > [ 'hello', 'how are you?', true ]
```

Keep in mind that you cannot put optional arguments after rest arguments, otherwise, how is the parser supposed to know if it's part of the rest argument or the optional argument?

</details>

<details>
<summary>Named Arguments</summary>

Named arguments are a bit special, they allow you to specify arguments by name, they don't have to be in order, the parser automatically resolves them.
To use a named argument, add a plus after `-` or `--`, then add the name of the argument.

```ts
const parse = q.Parser([s.string(true, 'named1'), s.number(true, 'named2'), s.boolean(true, 'named3')]);

console.log(parse('hello 5 true').arguments); // > { ordered: [ 'hello', 5, true, _: [] ], named: Map(3) { 'named1' => 'hello', 'named2' => 5, 'named3' => true } }
console.log(parse('hello 5 --+named3=true').arguments); // > { ordered: [ 'hello', 5, true, _: [] ], named: Map(3) { 'named1' => 'hello', 'named2' => 5, 'named3' => true } }
console.log(parse('hello true --+named2=5').arguments); // > { ordered: [ 'hello', 5, true, _: [] ], named: Map(3) { 'named1' => 'hello', 'named2' => 5, 'named3' => true } }
// Notice that we specify arguments out of order (1, 3, 2(named)), but the parser still orders them correctly
```

</details>

## Custom Arguments

Want more than just simple types?
The functions that the `simple` library expose are actually just creating an object, you can make your own functions/objects!

```ts
const parse = q.Parser([
  {
    $: 'argument',
    required: true,
    arg: null,
    rest: false,
    matches: (input: string) => !!JSON.parse(input),
    calculate: JSON.parse,
  },
  {
    $: 'option',
    key: 'hello',
    alt: 'hi',
    matches: (input: string) => !isNaN(parseInt(input)),
    calculate: parseInt,
  },
  {
    $: 'flag',
    key: 'yes',
    alt: 'y',
  },
]);
```
