import {
    hexToBytes,
    rawTransactionToHash,
    serializeWitnessArgs,
    toUint64Le,
  } from '@nervosnetwork/ckb-sdk-utils'
  import { ec as EC } from 'elliptic'
  import { getSecp256k1PubkeyHash} from '../utils'
  import { Hex, } from '../types'
  import { SECP256K1_PUBKEY_SIG_LEN, WITNESS_NATIVE_MODE } from '../constants'
import { keccak_256 } from 'js-sha3'

  // personal hash, ethereum prefix  \u0019Ethereum Signed Message:\n32
  const PERSONAL_SIGN_ETH_PREFIX = [
    0x19, 0x45, 0x74, 0x68, 0x65, 0x72, 0x65, 0x75, 0x6d, 0x20, 0x53, 0x69, 0x67, 0x6e, 0x65, 0x64,
    0x20, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x3a, 0x0a, 0x33, 0x32,
  ]
  
  export const signSecp256k1Tx = (
    key: EC.KeyPair,
    transaction: CKBComponents.RawTransactionToSign,
    mode = WITNESS_NATIVE_MODE,
  ): CKBComponents.RawTransaction => {
    if (!key) throw new Error('Private key or address object')
  
    const witnessGroup = transaction.witnesses
  
    if (!witnessGroup.length) {
      throw new Error('WitnessGroup cannot be empty')
    }
    if (typeof witnessGroup[0] !== 'object') {
      throw new Error('The first witness in the group should be type of WitnessArgs')
    }
  
    const transactionHash = rawTransactionToHash(transaction)
  
    const emptyWitness = {
      ...witnessGroup[0],
      lock: `0x${'0'.repeat(SECP256K1_PUBKEY_SIG_LEN)}`,
    }
  
    const serializedEmptyWitnessBytes = hexToBytes(serializeWitnessArgs(emptyWitness))
    const serializedEmptyWitnessSize = serializedEmptyWitnessBytes.length
  
    const hasher = keccak_256.create()
    hasher.update(hexToBytes(transactionHash))
    hasher.update(hexToBytes(toUint64Le(`0x${serializedEmptyWitnessSize.toString(16)}`)))
    hasher.update(serializedEmptyWitnessBytes)
  
    witnessGroup.slice(1).forEach(w => {
      const bytes = hexToBytes(typeof w === 'string' ? w : serializeWitnessArgs(w))
      hasher.update(hexToBytes(toUint64Le(`0x${bytes.length.toString(16)}`)))
      hasher.update(bytes)
    })
    const sighash = hasher.array()

    const keccaker = keccak_256.create()
    keccaker.update(PERSONAL_SIGN_ETH_PREFIX)
    keccaker.update(sighash)
    const message = `0x${keccaker.hex()}`

    // console.log("hash", ethers.utils.hashMessage(sighash))

    const pubkeyHash = getSecp256k1PubkeyHash(key)
    const signature = signMessage(key, message)

    emptyWitness.lock = `0x${mode}${pubkeyHash}${signature}`
  
    const signedWitnesses = [serializeWitnessArgs(emptyWitness), ...witnessGroup.slice(1)]
  
    return {
      ...transaction,
      witnesses: signedWitnesses.map(witness => (typeof witness === 'string' ? witness : serializeWitnessArgs(witness))),
    }
  }

  export const generateSighashAll = (
    transaction: CKBComponents.RawTransactionToSign,
  ): string => {
    const witnessGroup = transaction.witnesses
  
    if (!witnessGroup.length) {
      throw new Error('WitnessGroup cannot be empty')
    }
    if (typeof witnessGroup[0] !== 'object') {
      throw new Error('The first witness in the group should be type of WitnessArgs')
    }
  
    const transactionHash = rawTransactionToHash(transaction)
  
    const emptyWitness = {
      ...witnessGroup[0],
      lock: `0x${'0'.repeat(SECP256K1_PUBKEY_SIG_LEN)}`,
    }
  
    const serializedEmptyWitnessBytes = hexToBytes(serializeWitnessArgs(emptyWitness))
    const serializedEmptyWitnessSize = serializedEmptyWitnessBytes.length
  
    const hasher = keccak_256.create()
    hasher.update(hexToBytes(transactionHash))
    hasher.update(hexToBytes(toUint64Le(`0x${serializedEmptyWitnessSize.toString(16)}`)))
    hasher.update(serializedEmptyWitnessBytes)
  
    witnessGroup.slice(1).forEach(w => {
      const bytes = hexToBytes(typeof w === 'string' ? w : serializeWitnessArgs(w))
      hasher.update(hexToBytes(toUint64Le(`0x${bytes.length.toString(16)}`)))
      hasher.update(bytes)
    })
  
    return hasher.hex()
  }
  
  export const signMessage = (key: EC.KeyPair, message: Hex) => {
    const msg = hexToBytes(message)
    const { r, s, recoveryParam } = key.sign(msg, {
      canonical: true,
    })
    // console.log('secp256k1 signature verify result: ', key.verify(msg, { r, s, recoveryParam }))
    const fmtR = r.toString(16).padStart(64, '0')
    const fmtS = s.toString(16).padStart(64, '0')
    return `${fmtR}${fmtS}0${recoveryParam}`
  }
  
  