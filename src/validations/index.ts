import { readFileSync } from 'fs';
import path from 'path';
import basic from './basic';
import passportGated from './passport-gated';
import arbitrum from './arbitrum';
import karmaEasAttestation from './karma-eas-attestation';

// Типизация для validationInstance и структуры данных
interface ValidationInstance {
  id: string;
  github: string;
  version: string;
  title: string;
  description: string;
  proposalValidationOnly: boolean;
  votingValidationOnly: boolean;
}

interface ValidationData {
  validation: any;
  examples: any | null;
  schema: any | null;
  about: string;
  id: string;
  github: string;
  version: string;
  title: string;
  description: string;
  proposalValidationOnly: boolean;
  votingValidationOnly: boolean;
}

const validationClasses = {
  basic,
  'passport-gated': passportGated,
  arbitrum: arbitrum,
  'karma-eas-attestation': karmaEasAttestation
};

const validations: { [key: string]: ValidationData } = {};

Object.keys(validationClasses).forEach((validationName) => {
  let examples = null;
  let schema = null;
  let about = '';

  try {
    examples = JSON.parse(
      readFileSync(path.join(__dirname, validationName, 'examples.json'), 'utf8')
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
  const validationInstance: ValidationInstance = new validationClass();

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
