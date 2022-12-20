const {addressFromPrivateKey} = require('../lib/utils/crypto')

const privateKey = '0xd7d8106165aa18acf855fe3521d0c733ec6ad5afae2e1ff06687a0e790d02910'
const address = addressFromPrivateKey(privateKey)
console.log('address: ', address)