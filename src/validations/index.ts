import basic from './basic';
import aave from './aave';
import nouns from './nouns';
import timeperiod from './timeperiod';
import passport from './passport';
import { readFileSync } from 'fs';
import path from 'path';

const validations = {
  basic,
  aave,
  nouns,
  timeperiod,
  passport
};

Object.keys(validations).forEach(function (validationName) {
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
  validations[validationName].examples = examples;
  validations[validationName].schema = schema;
  validations[validationName].about = about;
});

export default validations;
