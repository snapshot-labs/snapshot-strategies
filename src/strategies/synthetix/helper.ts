import { BigNumber } from '@ethersproject/bignumber';

const HIGH_PRECISE_UNIT = 1e27;
const MED_PRECISE_UNIT = 1e18;
const SCALING_FACTOR = 1e5;

export const DebtCacheABI = [
  'function currentDebt() view returns (uint256 debt, bool anyRateIsInvalid)'
];

export const SynthetixStateABI = [
  'function lastDebtLedgerEntry() view returns (uint256)'
];

export type SNXHoldersResult = {
  snxholders: {
    id: string;
    initialDebtOwnership: BigNumber;
    debtEntryAtIndex: BigNumber;
  }[];
};

export function returnGraphParams(
  snapshot: number | string,
  addresses: string[]
) {
  return {
    snxholders: {
      __args: {
        where: {
          id_in: addresses.map((address: string) => address.toLowerCase())
        },
        first: 1000,
        block: {
          number: snapshot
        }
      },
      id: true,
      initialDebtOwnership: true,
      debtEntryAtIndex: true
    }
  };
}

export const debtL1 = async (
  initialDebtOwnership: BigNumber,
  debtEntryAtIndex: BigNumber,
  totalL1Debt: number,
  scaledTotalL2Debt: number,
  lastDebtLedgerEntry: BigNumber,
  isQuadratic: boolean
) => {
  const currentDebtOwnershipPercent =
    (Number(lastDebtLedgerEntry) / Number(debtEntryAtIndex)) *
    Number(initialDebtOwnership);

  const highPrecisionBalance =
    totalL1Debt *
    MED_PRECISE_UNIT *
    (currentDebtOwnershipPercent / HIGH_PRECISE_UNIT);

  const currentDebtBalance = highPrecisionBalance / MED_PRECISE_UNIT;

  const totalDebtInSystem = totalL1Debt + scaledTotalL2Debt;

  const ownershipPercentOfTotalDebt = currentDebtBalance / totalDebtInSystem;

  const scaledWeighting = ownershipPercentOfTotalDebt * SCALING_FACTOR;

  return isQuadratic ? Math.sqrt(scaledWeighting) : scaledWeighting;
};

export const debtL2 = async (
  initialDebtOwnership: BigNumber,
  debtEntryAtIndex: BigNumber,
  totalL1Debt: number,
  scaledTotalL2Debt: number,
  lastDebtLedgerEntryL2: number,
  isQuadratic: boolean
) => {
  const currentDebtOwnershipPercent =
    (Number(lastDebtLedgerEntryL2) / Number(debtEntryAtIndex)) *
    Number(initialDebtOwnership);

  const highPrecisionBalance =
    totalL1Debt *
    MED_PRECISE_UNIT *
    (currentDebtOwnershipPercent / HIGH_PRECISE_UNIT);

  const currentDebtBalance = highPrecisionBalance / MED_PRECISE_UNIT;

  const totalDebtInSystem = totalL1Debt + scaledTotalL2Debt;

  const ownershipPercentOfTotalDebt = currentDebtBalance / totalDebtInSystem;

  const scaledWeighting = ownershipPercentOfTotalDebt * SCALING_FACTOR;

  return isQuadratic ? Math.sqrt(scaledWeighting) : scaledWeighting;
};
