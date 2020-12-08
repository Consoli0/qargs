import { conditions } from '@consolio/utils';
import * as doken from 'doken';

const parse = doken.createTokenizer<
  | 'quotedShortFlag'
  | 'valueShortFlag'
  | 'shortFlag'
  | 'quotedLongFlag'
  | 'valueLongFlag'
  | 'longFlag'
  | 'argument'
  | 'quotedArgument',
  { flag: string; value: string | boolean } | string
>({
  rules: [
    // Short Flags //
    doken.regexRule('quotedShortFlag', /-([a-zA-Z0-9+]{1})=(?<!\\)["']((?:[^"']|\\"|\\')*)(?<!\\)["']/y, {
      lineBreaks: true,
      value: (match: RegExpExecArray) => ({ flag: match[1], value: match[2] }),
    }),
    doken.regexRule('valueShortFlag', /-([a-zA-Z0-9+]{1})=([^ ]+)/y, {
      value: (match: RegExpExecArray) => ({ flag: match[1], value: match[2] }),
    }),
    doken.regexRule('shortFlag', /-(!?)([a-zA-Z0-9]{1})/y, {
      value: (match: RegExpExecArray) => ({ flag: match[2], value: match[1] !== '!' }),
    }),

    // Long Flags //
    doken.regexRule('quotedLongFlag', /--([a-zA-Z0-9-+]+)=(?<!\\)["']((?:[^"']|\\"|\\')*)(?<!\\)["']/y, {
      lineBreaks: true,
      value: (match: RegExpExecArray) => ({ flag: match[1], value: match[2] }),
    }),
    doken.regexRule('valueLongFlag', /--([a-zA-Z0-9-+]+)=([^ ]+)/y, {
      value: (match: RegExpExecArray) => ({ flag: match[1], value: match[2] }),
    }),
    doken.regexRule('longFlag', /--(!?)([a-zA-Z0-9-]+)/y, {
      value: (match: RegExpExecArray) => ({ flag: match[2], value: match[1] !== '!' }),
    }),

    // Arguments //
    doken.regexRule('argument', /[^"' ]+/y, {
      condition: (match: RegExpExecArray) => !/['"]/.test(match[0]),
    }),
    doken.regexRule('quotedArgument', /(?<!\\)["']((?:[^"']|\\"|\\')*)(?<!\\)["']/y, {
      lineBreaks: true,
      value: (match: RegExpMatchArray) => match[1],
    }),
  ],
  strategy: 'first',
});

export default (
  message: string
): {
  success: boolean;
  args: Array<string>;
  flags: Map<string, string | boolean>;
} => {
  let ret: {
    success: boolean;
    args: Array<string>;
    flags: Map<string, string | boolean>;
  } = {
    success: true,
    args: [],
    flags: new Map<string, string | boolean>(),
  };

  for (let token of parse(message)) {
    if (conditions.oneOf(token.type, ['argument', 'quotedArgument'])) ret.args.push((<string>token.value).trim());
    else if (
      conditions.oneOf(token.type, [
        'shortFlag',
        'valueShortFlag',
        'quotedShortFlag',
        'longFlag',
        'valueLongFlag',
        'quotedLongFlag',
      ])
    )
      ret.flags.set(
        (<{ flag: string; value: string | boolean }>token.value).flag,
        (<{ flag: string; value: string | boolean }>token.value).value
      );
  }

  return ret;
};
