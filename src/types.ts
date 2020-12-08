export type ADeclarationArgument = {
  $: 'argument';
  arg: string | null;
  required: boolean;
  rest: boolean;
  matches: (input: string, ctx: any) => boolean | Promise<boolean>;
  calculate: (input: string, ctx: any) => unknown;
};

export type ADeclarationOption =
  | {
      $: 'flag';
      key: string;
      alt: string | null;
    }
  | {
      $: 'option';
      key: string;
      alt: string | null;
      matches: (input: string, ctx: any) => boolean | Promise<boolean>;
      calculate: (input: string, ctx: any) => unknown;
    };

export type ADeclaration = Array<ADeclarationArgument | ADeclarationOption>;

export type AOutput = {
  arguments: {
    ordered: Array<unknown | OMITTED> & {
      _: Array<string>;
    };
    named: Map<string, unknown | OMITTED>;
  };
  options: Map<string, unknown | OMITTED>;
  flags: Map<string, boolean>;
  OMITTED: OMITTED;
} | null;

export type OMITTED = typeof OMITTED;
export const OMITTED: unique symbol = Symbol('OMITTED');
