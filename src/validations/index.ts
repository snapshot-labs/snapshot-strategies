import { readFileSync } from 'fs';
import path from 'path';
import basic from './basic';
import passportGated from './passport-gated';
import passportWeighted from './passport-weighted';
import arbitrum from './arbitrum';

const validationClasses = {
  basic,
  'passport-gated': passportGated,
  'passport-weighted': passportWeighted,
  arbitrum: arbitrum
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

  const validationClass = validationClasses[validationName];
  const validationInstance = new validationClass();

  validations[validationName] = {
    validation: validationClass,
    examples,
    schema,
    about,
    id: validationInstance.id,
    github: validationInstance.github,
    version: validationInstance.version,
    title: validationInstance.title,
    description: validationInstance.description,
    proposalValidationOnly: validationInstance.proposalValidationOnly,
    votingValidationOnly: validationInstance.votingValidationOnly
  };
});

export default validations;
