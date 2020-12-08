import * as p from '.';

const booleanParses = {
  // True
  true: true,
  '1': true,
  yes: true,
  yep: true,
  yup: true,
  y: true,

  // False
  false: false,
  '0': false,
  no: false,
  nope: false,
  nah: false,
  n: false,
};

const parseNumber = (s: string): null | number => {
  let parsed = parseFloat(s);
  return parsed !== parsed ? null : parsed;
};

const parseBoolean = (value: string): boolean | null =>
  value in booleanParses ? booleanParses[<keyof typeof booleanParses>value] : null;

export const number = (
  required: boolean = true,
  arg: string | null = null,
  rest: boolean = false
): p.ADeclarationArgument => ({
  $: 'argument',
  required,
  arg,
  rest,
  matches: (input: string) => parseNumber(input) !== null,
  calculate: parseNumber,
});

export const boolean = (
  required: boolean = true,
  arg: string | null = null,
  rest: boolean = false
): p.ADeclarationArgument => ({
  $: 'argument',
  required,
  arg,
  rest,
  matches: (input: string) => parseBoolean(input) !== null,
  calculate: parseBoolean,
});

export const string = (
  required: boolean = true,
  arg: string | null = null,
  rest: boolean = false
): p.ADeclarationArgument => ({
  $: 'argument',
  required,
  arg,
  rest,
  matches: () => true,
  calculate: input => input,
});

export const numberOption = (key: string, alt: string | null = null): p.ADeclarationOption => ({
  $: 'option',
  key,
  alt,
  matches: (input: string) => parseNumber(input) !== null,
  calculate: parseNumber,
});

export const booleanOption = (key: string, alt: string | null = null): p.ADeclarationOption => ({
  $: 'option',
  key,
  alt,
  matches: (input: string) => parseBoolean(input) !== null,
  calculate: parseBoolean,
});

export const stringOption = (key: string, alt: string | null = null): p.ADeclarationOption => ({
  $: 'option',
  key,
  alt,
  matches: () => true,
  calculate: (input: string) => input,
});

export const flag = (key: string, alt: string | null = null): p.ADeclarationOption => ({
  $: 'flag',
  key,
  alt,
});
