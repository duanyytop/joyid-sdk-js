import {
  bytesToHex,
  hexToBytes,
  PERSONAL,
  rawTransactionToHash,
  serializeWitnessArgs,
  toUint64Le,
} from '@nervosnetwork/ckb-sdk-utils'
import * as NodeRSA from 'node-rsa'
import blake2b from '@nervosnetwork/ckb-sdk-utils/lib/crypto/blake2b'
import { blake256, exportPubKey, signRSAMessage } from '../utils'
import { RSA2048_PUBKEY_SIG_LEN, WITNESS_NATIVE_MODE, WITNESS_NATIVE_SESSION_MODE } from '../constants'
import { sha256Hash } from './secp256r1'

export const signRSATx = (
  key: NodeRSA,
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
    lock: `0x${'0'.repeat(RSA2048_PUBKEY_SIG_LEN)}`,
  }

  const serializedEmptyWitnessBytes = hexToBytes(serializeWitnessArgs(emptyWitness))
  const serializedEmptyWitnessSize = serializedEmptyWitnessBytes.length

  const hasher = blake2b(32, null, null, PERSONAL)
  hasher.update(hexToBytes(transactionHash))
  hasher.update(hexToBytes(toUint64Le(`0x${serializedEmptyWitnessSize.toString(16)}`)))
  hasher.update(serializedEmptyWitnessBytes)

  witnessGroup.slice(1).forEach(w => {
    const bytes = hexToBytes(typeof w === 'string' ? w : serializeWitnessArgs(w))
    hasher.update(hexToBytes(toUint64Le(`0x${bytes.length.toString(16)}`)))
    hasher.update(bytes)
  })

  const message = `${hasher.digest('hex')}`
  console.log('message', message)

  const base64 = Buffer.from(message).toString('base64url')
  const sighashAll = Buffer.from(base64, 'utf8').toString('hex')

  const pubKey = exportPubKey(key)

  const authData = '49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630162f9fb77'
  const clientData = `7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22${sighashAll}222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303030222c2263726f73734f726967696e223a66616c73657d`

  const clientDataHash = sha256Hash(clientData)
  const signData = `0x${authData}${clientDataHash}`
  const signature = signRSAMessage(key, signData)

  emptyWitness.lock = `0x${mode}${pubKey}${signature}${authData}${clientData}`

  const signedWitnesses = [serializeWitnessArgs(emptyWitness), ...witnessGroup.slice(1)]

  return {
    ...transaction,
    witnesses: signedWitnesses.map(witness => (typeof witness === 'string' ? witness : serializeWitnessArgs(witness))),
  }
}


export const signRSASessionTx = (
  key: NodeRSA,
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

  const hasher = blake2b(32, null, null, PERSONAL)
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
  const sessionMessage = `${blake256(`0x${sessionVer}${sessionPubkey}`)}`

  const base64 = Buffer.from(sessionMessage).toString('base64url')
  const sighashAll = Buffer.from(base64, 'utf8').toString('hex')

  const pubKey = exportPubKey(key)

  const authData = '49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630162f9fb77'
  const clientData = `7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22${sighashAll}222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303030222c2263726f73734f726967696e223a66616c73657d`

  const clientDataHash = sha256Hash(clientData)
  const signData = `0x${authData}${clientDataHash}`
  const attestation = signRSAMessage(key, signData)

  emptyWitness.lock = `0x${mode}${sessionPubkey}${signature}${pubKey}${sessionVer}${attestation}${authData}${clientData}`

  const signedWitnesses = [serializeWitnessArgs(emptyWitness), ...witnessGroup.slice(1)]

  return {
    ...transaction,
    witnesses: signedWitnesses.map(witness => (typeof witness === 'string' ? witness : serializeWitnessArgs(witness))),
  }
}
