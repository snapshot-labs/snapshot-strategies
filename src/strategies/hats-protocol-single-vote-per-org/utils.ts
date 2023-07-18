export function hatIdDecimalToHex(hatId) {
  return `0x` + BigInt(hatId).toString(16).padStart(64, `0`);
}

export function treeIdDecimalToHex(treeId) {
  return `0x` + treeId.toString(16).padStart(8, `0`);
}

export function hatIdHexToDecimal(hatId) {
  return BigInt(hatId);
}

export function treeIdHexToDecimal(treeId) {
  return parseInt(treeId, 16);
}

export function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

export function hatIdDecimalToIp(hatId) {
  const hexId = hatIdDecimalToHex(hatId);
  let ip = treeIdHexToDecimal(hexId.substring(0, 10)).toString();
  for (let i = 10; i < hexId.length; i += 4) {
    const domainAtLevel = hexId.substring(i, i + 4);
    if (domainAtLevel === `0000`) {
      break;
    }
    ip += `.` + parseInt(domainAtLevel, 16);
  }
  return ip;
}
