import textParser from './text-parser';
import { ADeclaration, ADeclarationArgument, ADeclarationOption, AOutput, OMITTED } from './types';

export * from './types';
export { default as unstructuredParser } from './text-parser';
export * as simple from './simple';

const certain = <A>(array: Array<A>, min: number, max: number, test: (arg: A) => boolean): boolean => {
  let l = array.filter(test).length;
  return l >= min && l <= max;
};

export const Parser = (declaration: ADeclaration) => {
  let dArgs = <Array<ADeclarationArgument>>declaration.filter(a => a.$ === 'argument');
  let dOptions = <Array<ADeclarationOption>>declaration.filter(a => a.$ === 'option' || a.$ === 'flag');

  let rest = dArgs.some(a => a.rest);
  let dAfter = dArgs.slice(dArgs.findIndex(a => a.rest) + 1);

  dOptions.forEach(
    o => (
      (o.key = o.key.replace(RegExp(`[^a-zA-Z0-9${o.key.length > 1 ? '-' : ''}]`, 'g'), '')),
      o.alt !== null ? (o.alt = o.alt.replace(RegExp(`[^a-zA-Z0-9${o.alt.length > 1 ? '-' : ''}]`, 'g'), '')) : void 0
    )
  );

  {
    let invalid = dOptions.filter(o => !o.key.length || (o.alt ? !o.alt.length : false));

    if (invalid.length > 0) throw new Error(`Invalid option name(s)`);
  }
  if (!certain(dArgs, 0, 1, a => a.rest)) throw new Error('Too many REST arguments, can only have one');
  if (rest && dAfter.some(a => !a.required)) throw new Error('Optional arguments cannot follow rest arguments');
  if (dArgs.some(a => !a.required) && dArgs.slice(dArgs.findIndex(a => !a.required)).some(a => a.required))
    throw new Error('Required arguments cannot follow optional arguments');

  return async (inputText: string, ctx?: any) => {
    if (typeof inputText !== 'string') throw new TypeError('Input text must be a string!');

    let input = textParser(inputText);
    let args = input.args;
    let options = input.flags;

    let output: AOutput = {
      arguments: {
        ordered: Object.assign(Array<unknown>(), {
          _: Array<string>(),
        }),
        named: new Map<string, unknown>(),
      },
      options: new Map<string, unknown>(),
      flags: new Map<string, boolean>(),
      OMITTED,
    };

    let matches = true;

    for (let i in dArgs) {
      let a = dArgs[i];
      let ia: string | undefined;

      if (a.arg !== null && options.has(`+${a.arg}`)) {
        ia = <string>options.get(`+${a.arg}`);
      } else ia = args.shift();

      if (!ia) {
        if (a.required === undefined ? true : a.required) {
          matches = false;
          break;
        } else {
          output.arguments.ordered.push(OMITTED);
          break;
        }
      }

      if (a.rest) {
        let x = parseInt(i);

        let after: Array<string>;
        let v: Array<string>;

        if (dAfter.length) {
          after = args.slice(-dAfter.length);
          v = args.slice(x - 1, dArgs.findIndex(a => a.rest) + (args.length - x - dAfter.length));
        } else {
          after = args.slice(-dAfter.length);
          v = args.slice(x - 2, dArgs.findIndex(a => a.rest) + 2);
        }

        ia += ` ${v.join(' ')}`;
        if (ia.endsWith(' ')) ia = ia.slice(0, ia.length - 1);
        args = after;
      }

      let match = await a.matches(ia, ctx);

      if (!match) {
        matches = false;
        break;
      }

      let value = await a.calculate(ia, ctx);

      output.arguments.ordered.push(value);
      if (a.arg !== null) output.arguments.named.set(a.arg, value);
    }

    if (!rest) for (let a of args) output.arguments.ordered._.push(a);

    if (matches)
      dOptions.push(
        ...(<Array<ADeclarationOption>>dOptions.filter(o => o.alt)).map(o =>
          o.$ === 'flag'
            ? {
                $: o.$,
                key: <string>o.alt,
                alt: o.key,
              }
            : {
                $: o.$,
                key: <string>o.alt,
                alt: o.key,
                calculate: o.calculate,
                matches: o.matches,
              }
        )
      );

    for (let i in dOptions) {
      if (!matches) break;
      let o = dOptions[i];

      if (o.$ === 'flag') {
        let value = false;
        if (options.has(o.key) && typeof options.get(o.key) === 'boolean') value = <boolean>options.get(o.key);
        else if (o.alt !== null && options.has(o.alt) && typeof options.get(o.alt) === 'boolean')
          value = <boolean>options.get(o.alt);
        output.flags.set(o.key, value);
        if (o.alt !== null) output.flags.set(o.alt, value);
        continue;
      }

      if (!options.has(o.key) && (o.alt !== null ? !options.has(o.alt) : true)) {
        output.options.set(o.key, OMITTED);
        if (o.alt !== null) output.options.set(o.alt, OMITTED);
        break;
      }

      let str = <string>(options.get(o.key) ?? options.get(o.alt ?? ''));

      let match = await o.matches(str, ctx);

      if (!match) {
        matches = false;
        break;
      }

      let value = await o.calculate(str, ctx);

      output.options.set(o.key, value);
      if (o.alt !== null) output.options.set(o.alt, value);
    }

    return matches ? output : null;
  };
};
