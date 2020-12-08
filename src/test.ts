import { expect } from 'chai';
import { Parser, simple as s, OMITTED } from '.';
import { func } from '@consolio/utils';

describe('Parser', () => {
  describe('Errors', () => {
    it('Should not allow required arguments after optional arguments', done => {
      expect(func.prepare(Parser, [s.string(false), s.string()])).to.throw();

      return done();
    });

    it('Should not allow optional arguments after rest argument', done => {
      expect(func.prepare(Parser, [s.string(true, null, true), s.string(false)])).to.throw();

      return done();
    });

    it('Should not allow multiple rest arguments', done => {
      expect(func.prepare(Parser, [s.string(true, null, true), s.string(true, null, true)])).to.throw();
      return done();
    });
  });

  describe('Arguments', () => {
    describe('Required / optional', () => {
      it('Should properly parse required arguments', async done => {
        let p = Parser([s.number(), s.string()]);

        let v = await p('1 hello');
        expect(v).to.not.be.null;
        expect(v?.arguments.ordered[0]).to.be.a('number');
        expect(v?.arguments.ordered[1]).to.be.a('string');

        return done();
      });

      it('Should properly parse optional arguments', async done => {
        let p = Parser([s.number(), s.string(false)]);

        let v = await p('1 hello');
        expect(v).to.not.be.null;
        expect(v?.arguments.ordered[0]).to.be.a('number');
        expect(v?.arguments.ordered[1]).to.be.a('string');

        v = await p('1');
        expect(v).to.not.be.null;
        expect(v?.arguments.ordered[0]).to.be.a('number');
        expect(v?.arguments.ordered[1]).to.equal(OMITTED);

        return done();
      });
    });

    describe('Unused arguments', () => {
      it('Should insert unused arguments into the proper place', async done => {
        let p = Parser([s.number(), s.string()]);

        let v = await p('1 hello hi');
        expect(v).to.not.be.null;
        expect(v?.arguments.ordered[0]).to.be.a('number');
        expect(v?.arguments.ordered[1]).to.be.a('string');
        expect(v?.arguments.ordered._[0]).to.be.a('string');

        return done();
      });
    });

    describe('Named arguments', () => {
      it('Should properly parse named arguments', async done => {
        let p = Parser([s.number(), s.string(true, 'test')]);

        let v = await p('1 hello');
        expect(v).to.not.be.null;
        expect(v?.arguments.ordered[0]).to.be.a('number');
        expect(v?.arguments.ordered[1]).to.be.a('string');
        expect(v?.arguments.named.get('test')).to.be.a('string');

        v = await p('1 --+test=hello');
        expect(v).to.not.be.null;
        expect(v?.arguments.ordered[0]).to.be.a('number');
        expect(v?.arguments.ordered[1]).to.be.a('string');
        expect(v?.arguments.named.get('test')).to.be.a('string');

        return done();
      });

      it('Should properly parse out of order named arguments', async done => {
        let p = Parser([s.number(), s.string(true, 'test'), s.boolean()]);

        let v = await p('1 hello true');
        expect(v).to.not.be.null;
        expect(v?.arguments.ordered[0]).to.be.a('number');
        expect(v?.arguments.ordered[1]).to.be.a('string');
        expect(v?.arguments.ordered[2]).to.be.a('boolean');
        expect(v?.arguments.named.get('test')).to.be.a('string');

        v = await p('1 true --+test=hello');
        expect(v).to.not.be.null;
        expect(v?.arguments.ordered[0]).to.be.a('number');
        expect(v?.arguments.ordered[1]).to.be.a('string');
        expect(v?.arguments.ordered[2]).to.be.a('boolean');
        expect(v?.arguments.named.get('test')).to.be.a('string');

        return done();
      });
    });

    describe('Rest arguments', () => {
      it('Should properly parse rest arguments', async done => {
        let p = Parser([s.number(), s.boolean(), s.string(true, null, true)]);

        let v = await p('1 true hello there dear friendo :wave:');
        expect(v).to.not.be.null;
        expect(v?.arguments.ordered[0]).to.be.a('number');
        expect(v?.arguments.ordered[1]).to.be.a('boolean');
        expect(v?.arguments.ordered[2]).to.be.a('string').and.equal('hello there dear friendo :wave:');

        return done();
      });

      it('Should properly parse arguments after rest arguments', async done => {
        let p = Parser([s.number(), s.string(true, null, true), s.number(), s.boolean(), s.boolean()]);

        let v = await p('1 hello there how are you today? 1 true true');
        expect(v).to.not.be.null;
        expect(v?.arguments.ordered[0]).to.be.a('number');
        expect(v?.arguments.ordered[1]).to.be.a('string').and.equal('hello there how are you today?');
        expect(v?.arguments.ordered[2]).to.be.a('number');
        expect(v?.arguments.ordered[3]).to.be.a('boolean');
        expect(v?.arguments.ordered[4]).to.be.a('boolean');

        return done();
      });
    });
  });

  describe('Options / flags', () => {
    describe('Options', () => {
      it('Should properly parse options', async done => {
        let p = Parser([s.stringOption('hello', 'hi'), s.numberOption('yo')]);

        let v = await p('--hello=hi -yo=5');
        expect(v).to.not.be.null;
        expect(v?.options.get('hello')).to.be.a('string');
        expect(v?.options.get('hi')).to.be.a('string');
        expect(v?.options.get('yo')).to.equal(5);

        v = await p('--hi=hello');
        expect(v).to.not.be.null;
        expect(v?.options.get('hello')).to.be.a('string');
        expect(v?.options.get('hi')).to.be.a('string');
        expect(v?.options.get('yo')).to.equal(OMITTED);

        return done();
      });
    });

    describe('Flags', () => {
      it('Should properly parse flags', async done => {
        let p = Parser([s.flag('yes', 'y')]);

        let v = await p('--yes');
        expect(v).to.not.be.null;
        expect(v?.flags.get('yes')).to.be.true;
        expect(v?.flags.get('y')).to.be.true;

        v = await p('-y');
        expect(v).to.not.be.null;
        expect(v?.flags.get('yes')).to.be.true;
        expect(v?.flags.get('y')).to.be.true;

        v = await p('');
        expect(v).to.not.be.null;
        expect(v?.flags.get('yes')).to.be.false;
        expect(v?.flags.get('y')).to.be.false;

        return done();
      });

      it('Should properly parse inverted flags', async done => {
        let p = Parser([s.flag('yes', 'y')]);

        let v = await p('--!yes');
        expect(v).to.not.be.null;
        expect(v?.flags.get('yes')).to.be.false;
        expect(v?.flags.get('y')).to.be.false;

        v = await p('-!y');
        expect(v).to.not.be.null;
        expect(v?.flags.get('yes')).to.be.false;
        expect(v?.flags.get('y')).to.be.false;

        return done();
      });
    });
  });
});
