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

export const getPublicKey = (key: EC.KeyPair) => key.getPublic(false, 'hex').substring(2)

const lockFromPubKey = (pubKey: Hex, sigAlg = SigAlg.Secp256r1, isMainnet = false): CKBComponents.Script => {
  if (sigAlg == SigAlg.Secp256k1) {
    return {
      ...getJoyIDLockScript(isMainnet),
      args: `0x0002${keccak160(pubKey)}`,
    }
  } 
  return {
    ...getJoyIDLockScript(isMainnet),
    args: `0x0001${blake160(hexToBytes(pubKey), 'hex')}`,
  }
}

export const addressFromPrivateKey = (privateKey: Uint8Array | Hex, sigAlg = SigAlg.Secp256r1, isMainnet = false): Address => {
  const pubkey = append0x(getPublicKey(keyFromPrivate(privateKey, sigAlg)))
  console.log(pubkey)
  const lock = lockFromPubKey(pubkey, sigAlg, isMainnet)
  console.log(lock)
  return scriptToAddress(lock, isMainnet)
}

export const pubkeyFromPrivateKey = (privateKey: Uint8Array | Hex, sigAlg = SigAlg.Secp256r1, ) => {
  return append0x(getPublicKey(keyFromPrivate(privateKey, sigAlg)))
}


export const keccak160 = (message: Hex): Hex => {
  const msg = hexToBytes(message)
  return keccak_256(msg).substring(24)
}