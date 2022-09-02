var EC = require('elliptic').ec;

// Create and initialize EC context
// (better do it once and reuse it)
var ec = new EC('p256');

// Generate keys
var key = ec.genKeyPair();
console.log(JSON.stringify(key.getPrivate()))

console.log(key.getPublic(false, "hex"))

// Sign the message's hash (input must be an array, or a hex-string)
var msgHash = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
var signature = key.sign(msgHash);

console.log(signature.r.toString('hex'))
console.log(signature.s.toString('hex'))

// Export DER encoded signature in Array
var derSign = signature.toDER("hex");

console.log(JSON.stringify(signature))
console.log(derSign)

// Verify signature
console.log(key.verify(msgHash, derSign));

