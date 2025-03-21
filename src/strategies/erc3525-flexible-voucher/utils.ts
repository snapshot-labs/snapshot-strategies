const oneDaySeconds = 86400;

export const maturitiesCoefficient = (
  latestStartTime: number,
  terms: Array<any>
) => {
  const nowData = Date.parse(new Date().toString()) / 1000;
  const difference =
    latestStartTime + terms[terms.length - 1].toNumber() - nowData;

  if (difference <= 0) {
    return 1;
  } else if (difference > 0 && difference <= 90 * oneDaySeconds) {
    return 1.1;
  } else if (
    difference > 90 * oneDaySeconds &&
    difference <= 183 * oneDaySeconds
  ) {
    return 1.2;
  } else if (
    difference > 183 * oneDaySeconds &&
    difference <= 365 * oneDaySeconds
  ) {
    return 1.5;
  } else {
    return 2;
  }
};

export const claimCoefficient = (claimType: number) => {
  if (claimType == 0) {
    return 1.2;
  } else if (claimType == 1) {
    return 2;
  } else if (claimType == 2) {
    return 1.5;
  } else {
    return 1;
  }
};
