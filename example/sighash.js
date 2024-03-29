const { keccak_256 } = require('js-sha3')

const message = '57975bc34ea17ab238a56f2acd412f9a2d92b5698ebe2f92814348d25dcb9cab'
const base64 = Buffer.from(message).toString('base64url')
console.log('base64', base64)
const sighashAll = Buffer.from(base64, 'utf8').toString('hex')
console.log('sighashAll', sighashAll)

const msg = '1270b9173d60f8f3ea3cd9e96f9f0ee28c6cf02d51bab0c29851c54d4f734f66029830d23d4260392187c2cd473e867d8c28c6d6f3a1252ebe5bbd3b9881cfde'
const hash = keccak_256.hex(msg)
console.log(keccak_256(msg))
console.log(hash)

const hasher = keccak_256.create()
hasher.update(msg)
console.log(hasher.hex())