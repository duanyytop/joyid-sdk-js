const {addressFromPrivateKey, SigAlg} = require('../lib/utils/crypto')

const privateKey = '0xd7d8106165aa18acf855fe3521d0c733ec6ad5afae2e1ff06687a0e790d02910'
const r1Address = addressFromPrivateKey(privateKey)
console.log('r1Address: ', r1Address)


const k1Address = addressFromPrivateKey(privateKey, SigAlg.Secp256k1)
console.log('k1Address: ', k1Address)