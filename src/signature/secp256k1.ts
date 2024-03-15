import {
  blake2b,
    hexToBytes,
    PERSONAL,
    rawTransactionToHash,
    serializeWitnessArgs,
    toUint64Le,
  } from '@nervosnetwork/ckb-sdk-utils'
  import { ec as EC } from 'elliptic'
  import { blake256, exportPubKey, getSecp256k1PubkeyHash, signRSAMessage} from '../utils'
  import { Hex, } from '../types'
  import { SECP256K1_PUBKEY_SIG_LEN, WITNESS_NATIVE_MODE, WITNESS_NATIVE_SESSION_MODE } from '../constants'
import { keccak_256 } from 'js-sha3'
import NodeRSA = require('node-rsa')

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
    const message = calcEthPersonalHash(sighash)

    // console.log("hash", ethers.utils.hashMessage(sighash))

    const pubkeyHash = getSecp256k1PubkeyHash(key)
    const signature = signSecp256k1Message(key, message)

    emptyWitness.lock = `0x${mode}${pubkeyHash}${signature}`
  
    const signedWitnesses = [serializeWitnessArgs(emptyWitness), ...witnessGroup.slice(1)]
  
    return {
      ...transaction,
      witnesses: signedWitnesses.map(witness => (typeof witness === 'string' ? witness : serializeWitnessArgs(witness))),
    }
  }

  export const calcEthPersonalHash = (sighash: number[]): Hex => {
    const keccaker = keccak_256.create()
    keccaker.update(PERSONAL_SIGN_ETH_PREFIX)
    keccaker.update(sighash)
    return `0x${keccaker.hex()}`
  }

  export const signSecp256k1SessionTx = (
    key: EC.KeyPair,
    sessionKey: NodeRSA,
    transaction: CKBComponents.RawTransactionToSign,
    mode = WITNESS_NATIVE_SESSION_MODE,
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
      lock: '0x',
    }
  
    const serializedEmptyWitnessBytes = hexToBytes(serializeWitnessArgs(emptyWitness))
    const serializedEmptyWitnessSize = serializedEmptyWitnessBytes.length
  
    let hasher = blake2b(32, null, null, PERSONAL)
    hasher.update(hexToBytes(transactionHash))
    hasher.update(hexToBytes(toUint64Le(`0x${serializedEmptyWitnessSize.toString(16)}`)))
    hasher.update(serializedEmptyWitnessBytes)
  
    witnessGroup.slice(1).forEach(w => {
      const bytes = hexToBytes(typeof w === 'string' ? w : serializeWitnessArgs(w))
      hasher.update(hexToBytes(toUint64Le(`0x${bytes.length.toString(16)}`)))
      hasher.update(bytes)
    })
    const message = `0x${hasher.digest('hex')}`
    if (sessionKey.getKeySize() !== 2048) {
      throw new Error('RSA key size error')
    }
    const signature = signRSAMessage(sessionKey, message)

    // Build sessoin message and attestation with secp256r1
    const sessionVer = '00'
    const sessionPubkey = exportPubKey(sessionKey)
    const sessionMessage = blake256(`0x${sessionVer}${sessionPubkey}`)
    const keccaker = keccak_256.create()
    keccaker.update(PERSONAL_SIGN_ETH_PREFIX)
    keccaker.update(hexToBytes(`0x${sessionMessage}`))
    const attestationMessage = `0x${keccaker.hex()}`
    
    const pubkeyHash = getSecp256k1PubkeyHash(key)
    const attestation = signSecp256k1Message(key, attestationMessage)

    emptyWitness.lock = `0x${mode}${sessionPubkey}${signature}${pubkeyHash}${sessionVer}${attestation}`

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
  
  export const signSecp256k1Message = (key: EC.KeyPair, message: Hex) => {
    const msg = hexToBytes(message)
    const { r, s, recoveryParam } = key.sign(msg, {
      canonical: true,
    })
    // console.log('secp256k1 signature verify result: ', key.verify(msg, { r, s, recoveryParam }))
    const fmtR = r.toString(16).padStart(64, '0')
    const fmtS = s.toString(16).padStart(64, '0')
    return `${fmtR}${fmtS}0${recoveryParam}`
  }
  
  