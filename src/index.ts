import 'dotenv/config';
import strategies from './strategies';
import validations from './validations';
import utils from './utils';
import { Protocol } from './types';

export const DEFAULT_SUPPORTED_PROTOCOLS: Protocol[] = ['evm'];
export const MAX_STRATEGIES_LENGTH = 8;

export default {
  strategies,
  validations,
  utils
};
