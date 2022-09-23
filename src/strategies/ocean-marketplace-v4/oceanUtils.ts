export function verifyResultsLength(
  result: number,
  expectedResults: number,
  type: string
): void {
  if (result === expectedResults) {
    console.log(
      `>>> SUCCESS: ${type} result:[${result}] match expected results:[${expectedResults}] - length`
    );
  } else {
    console.error(
      `>>> ERROR: ${type} result:[${result}] do not match expected results:[${expectedResults}] - length`
    );
  }
}

export function verifyResults(
  result: string,
  expectedResults: string,
  type: string
): void {
  if (result === expectedResults) {
    console.log(
      `>>> SUCCESS: ${type} result:[${result}] match expected results:[${expectedResults}]`
    );
  } else {
    console.error(
      `>>> ERROR: ${type} result:[${result}] do not match expected results:[${expectedResults}]`
    );
  }
}
