const BN = require('bn.js')
const { hexToBytes } = require('@nervosnetwork/ckb-sdk-utils')
const { sha256 } = require('ethers/lib/utils')
const Benchmark = require('benchmark')

var EC = require('elliptic').ec

// Create and initialize EC context
// (better do it once and reuse it)
var ec = new EC('p256')

// Generate keys
var key = ec.genKeyPair()
console.log('privateKey', JSON.stringify(key.getPrivate()))

console.log('publicKey', key.getPublic(false, 'hex'))

// Sign the message's hash (input must be an array, or a hex-string)
var msgHash = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
var signature = key.sign(msgHash)

console.log('publicKey X', key.getPublic().getX().toString('hex'))
console.log('publicKey Y', key.getPublic().getY().toString('hex'))

// Export DER encoded signature in Array
var derSign = signature.toDER('hex')

console.log('signature', JSON.stringify(signature))
console.log('signature', derSign)

// Verify signature
console.log('verify signature', key.verify(msgHash, derSign))
try {
    const pk = ec.recoverPubKey(msgHash, signature, signature.recoveryParam)
    console.log(`pubkey: `, pk.inspect())
} catch (error) {
    console.error(error)
}


const sha256Hash = (message) => {
    const hash = sha256(hexToBytes(`0x${message}`))
    return hash.substring(2)
}


/**
 * webAuthn test data
 auth data:  23fe91e9c1ffd5c6852d92111b0f8cf08aee5d17c2c4267a264f41456a7c48aa0500000000
 client data:  7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a224d7a4e695a444a684d6d4a685a6a67345a5445315a47466d4d324e6d4e6a6b774e4467774d44686a4e3259334f474979593249344e7a45314e7a4535595451355a546b335954526b4d325534596a46684d474d7a4d51222c226f726967696e223a2268747470733a2f2f6a6f7969642d6465762e76657263656c2e617070222c2263726f73734f726967696e223a66616c73657d
 pubkey:  c80a8a45fab222319de13f68a3683709195e14f0ec5354c1560b1d3864e3c7fa6662e6bab29e397ddf28621f16c2d8d1d3228f2fe2067841ab2faf439e3ed63f
 signature:  9a0a547ce48c263db3ee4dabab85c95b17e7b9d0452736e34e2ed4c9faa033d0150a1a7c9688e0fe2e5aa438f1c5901e53b4af6789422cd955401e9b1bf0effa
 */
const recoveryWebAuthn = () => {
    try {
        const authData = "23fe91e9c1ffd5c6852d92111b0f8cf08aee5d17c2c4267a264f41456a7c48aa0500000000"
        const clientData = "7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a224d7a4e695a444a684d6d4a685a6a67345a5445315a47466d4d324e6d4e6a6b774e4467774d44686a4e3259334f474979593249344e7a45314e7a4535595451355a546b335954526b4d325534596a46684d474d7a4d51222c226f726967696e223a2268747470733a2f2f6a6f7969642d6465762e76657263656c2e617070222c2263726f73734f726967696e223a66616c73657d"
        const message = hexToBytes(`0x${sha256Hash(`${authData}${sha256Hash(clientData)}`)}`)
        const signature = {
            r: new BN("9a0a547ce48c263db3ee4dabab85c95b17e7b9d0452736e34e2ed4c9faa033d0", 16),
            s: new BN("150a1a7c9688e0fe2e5aa438f1c5901e53b4af6789422cd955401e9b1bf0effa", 16),
            recoveryParam: 1,
        }
        const pk = ec.recoverPubKey(message, signature, signature.recoveryParam)
        // console.log(`pubkey: `, pk.inspect())
    } catch (error) {
        console.error(error)
    }
}

var suite = new Benchmark.Suite;
const start  = new Date().getTime();
suite.add('P256 pubkey recovery', function() {
    recoveryWebAuthn()
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run({ 'async': false });
const end  = new Date().getTime();

console.log(`Time-consuming: ${end - start} ms`)