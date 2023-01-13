import { blake160, hexToBytes, scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { ec as EC } from 'elliptic'
import { keccak_256 } from 'js-sha3'
import { getJoyIDLockScript } from '../constants'
import { Address, Hex } from '../types'
import { append0x, remove0x } from './hex'

export enum SigAlg {
  Secp256r1,
  Secp256k1
}

export const keyFromPrivate = (privateKey: Uint8Array | Hex, sigAlg = SigAlg.Secp256r1): EC.KeyPair => {
  const privkey = typeof privateKey == 'string' ? remove0x(privateKey) : privateKey
  if (sigAlg == SigAlg.Secp256k1) {
    const ec = new EC('secp256k1')
    return ec.keyFromPrivate(privkey)
  }
  const ec = new EC('p256')
  return ec.keyFromPrivate(privkey)
}

// uncompressed pubkey without 0x
export const getPublicKey = (key: EC.KeyPair) => key.getPublic(false, 'hex').substring(2)

export const getSecp256k1PubkeyHash = (key: EC.KeyPair) => keccak160(`0x${getPublicKey(key)}`)

export const addressFromPrivateKey = (privateKey: Uint8Array | Hex, sigAlg = SigAlg.Secp256r1, isMainnet = false): Address => {
  const pubkey = append0x(getPublicKey(keyFromPrivate(privateKey, sigAlg)))
  const lock = {
    ...getJoyIDLockScript(isMainnet),
    args: sigAlg == SigAlg.Secp256r1 ? `0x0001${blake160(hexToBytes(pubkey), 'hex')}` : `0x0002${keccak160(pubkey)}`,
  }
  return scriptToAddress(lock, isMainnet)
}

export const pubkeyFromPrivateKey = (privateKey: Uint8Array | Hex, sigAlg = SigAlg.Secp256r1, ) => {
  return append0x(getPublicKey(keyFromPrivate(privateKey, sigAlg)))
}


export const keccak160 = (message: Hex): Hex => {
  const msg = hexToBytes(message)
  return keccak_256(msg).substring(24)
}