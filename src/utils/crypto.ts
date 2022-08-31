import { blake160, scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import {ec as EC} from 'elliptic'
import { getJoyIDLockScript } from '../constants'
import { Address, Hex } from "../types"

export const keyFromPrivate = (privateKey: Uint8Array | Hex): EC.KeyPair => {
  const ec = new EC('p256')
  return ec.keyFromPrivate(privateKey)
}

export const getPublicKey = (key: EC.KeyPair) => {
  return key.getPublic(false, 'hex')
}

export const lockFromPubKey = (pubKey: Hex, isMainnet = true): CKBComponents.Script => {
  return {
    ...getJoyIDLockScript(isMainnet),
    args: blake160(pubKey, 'hex'),
  }
}

export const addressFromPubKey = (pubKey: Hex, isMainnet = true): Address => {
  return scriptToAddress(lockFromPubKey(pubKey, isMainnet))
}