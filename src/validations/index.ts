import { readFileSync } from 'fs';
import path from 'path';
import basic from './basic';
import aave from './aave';
import nouns from './nouns';
import timeperiod from './timeperiod';
import passportGated from './passport-gated';
import passportWeighted from './passport-weighted';

const validationClasses = {
  basic,
  aave,
  nouns,
  timeperiod,
  'passport-gated': passportGated,
  'passport-weighted': passportWeighted
};

const validations = {};
Object.keys(validationClasses).forEach(function (validationName) {
  let examples = null;
  let schema = null;
  let about = '';

  try {
    examples = JSON.parse(
      readFileSync(
        path.join(__dirname, validationName, 'examples.json'),
        'utf8'
      )
    );
  } catch (error) {
    examples = null;
  }

  try {
    schema = JSON.parse(
      readFileSync(path.join(__dirname, validationName, 'schema.json'), 'utf8')
    );
  } catch (error) {
    schema = null;
  }

  try {
    about = readFileSync(
      path.join(__dirname, validationName, 'README.md'),
      'utf8'
    );
  } catch (error) {
    about = '';
  }
  validations[validationName] = {
    validation: validationClasses[validationName],
    examples,
    schema,
    about
  };
});

export default validations;
