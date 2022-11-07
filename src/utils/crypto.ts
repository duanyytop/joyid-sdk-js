import { blake160, scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import {ec as EC} from 'elliptic'
import { getJoyIDLockScript } from '../constants'
import { Address, Hex } from "../types"
import { append0x } from './hex'

export const keyFromPrivate = (privateKey: Uint8Array | Hex): EC.KeyPair => {
  const ec = new EC('p256')
  return ec.keyFromPrivate(privateKey)
}

export const getPublicKey = (key: EC.KeyPair) => {
  return key.getPublic(false, 'hex').substring(2)
}

export const lockFromPubKey = (pubKey: Hex, isMainnet = false): CKBComponents.Script => {
  return {
    ...getJoyIDLockScript(isMainnet),
    args: `0x0001${blake160(pubKey, 'hex')}`,
  }
}

export const addressFromPubKey = (pubKey: Hex, isMainnet = false): Address => {
  return scriptToAddress(lockFromPubKey(append0x(pubKey), isMainnet))
}

export const addressFromPrivateKey = (privateKey: Uint8Array | Hex, isMainnet = false): Address => {
  const key = keyFromPrivate(privateKey)
  const pubKey = append0x(getPublicKey(key))
  return scriptToAddress(lockFromPubKey(pubKey, isMainnet), isMainnet)
}

export const pubkeyFromPrivateKey = (privateKey: Uint8Array | Hex) => {
  const key = keyFromPrivate(privateKey)
  const pubKey = append0x(getPublicKey(key))
  return pubKey
}