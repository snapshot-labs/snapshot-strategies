//Utility Functions
function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

function hatIdDecimalToHex(hatId) {
  return `0x` + BigInt(hatId).toString(16).padStart(64, `0`);
}
//End Utility Functions

//This was the initial attempt at achieving the desired result: Get all hats under an admin hat.
//This functionality works and achieves the desired result, however this is not scalable.
//The final implementation will consists of several viewHat() smart contract calls that cannot
//be grouped into a multicall, as every call is dependent on each preceeding call's results.
//Therefore there is no path forward here.

//Recursively returns all hats under a single admin hat. This implementation in its current state does not actually
//touch the blockchain, however it simulates what the results would be.
//@adminHatHex: The admin hat to get the child hats from
//@numOfHats: the number of hats found in the admin hat.
//@depthLeft: This is not depedant on the function to work. However prevents a stack overflow error
//           by exiting out of the function if it goes too far down
//@currentLevel: the relative level of the observed admin hat
function getHats(adminHatHex, numOfHats, depthLeft = 10, currentLevel = 0) {
  //if (too far in depths, save the execution and return, meanwhile logging a message)
  if (depthLeft <= 0) {
    console.log(`Returned from the depths!`);
    return;
  }

  //subtract from depth
  depthLeft--;
  //increase current level
  currentLevel++;

  //again, since this is simulated, then this recursive function will run indefnitely
  //So we are simulating that the first admin hat at level 1 has 5 hats under it.
  //The hats on level 2 have 1 hat under them
  //The hats on level 3 have 0 hats - the condition that ends the recursiveness
  if (currentLevel === 2) {
    numOfHats = 1;
  }
  if (currentLevel > 2) {
    numOfHats = 0;
  }

  //We are dealing with number to hexadecimal conversion
  //Following the Hats Protocol Standard, the first 8 digits in a hex refer to the
  //top hat. Plus, in this case we add 2 as the util functions account for '0x'.
  //Then each subsequent hat in the tree has 4 digits allocated to it.
  //So doing simple math: level * 4, we can calculate which digit to change accordingly
  const charIndex = 9 + currentLevel * 4;

  //these two functions are commented out as they would be the solution
  //to getting this to work on chain
  //let adminHat = hadIdHexToDecimal(adminHatHex);
  //const numOfHats = viewHat(adminHat).lastHatId;
  for (let i = 1; i <= numOfHats; i++) {
    //store the child hat in hex form to a variable.
    const childHatHex = setCharAt(adminHatHex, charIndex, i);
    //push it to an array
    childArray.push(childHatHex);
    //get the child hat's children.
    getHats(childHatHex, numOfHats, depthLeft, currentLevel);
  }
}

//main admin hat
const cabinTophat = `53919893334301279589334030174039261347274288845081144962207220498432`;
//in hex format
const cabinTophatHex = hatIdDecimalToHex(cabinTophat);

const childArray = [cabinTophatHex];
//in a non simulated environment, we would need to call to the blockchain
getHats(cabinTophatHex, 5 /* viewHat(cabinTophatHex).lastHatId */);
console.log(childArray);
