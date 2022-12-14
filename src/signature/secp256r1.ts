import {
  bytesToHex,
  hexToBytes,
  PERSONAL,
  rawTransactionToHash,
  serializeWitnessArgs,
  toUint64Le,
} from '@nervosnetwork/ckb-sdk-utils'
import { ec as EC } from 'elliptic'
import sha256 from 'fast-sha256'
import blake2b from '@nervosnetwork/ckb-sdk-utils/lib/crypto/blake2b'
import { append0x, getPublicKey, remove0x } from '../utils'
import { Hex, Servicer, SocialUnlockReq } from '../types'
import { SECP256R1_PUBKEY_SIG_LEN, SOCIAL_LOCK_LEN, WITNESS_NATIVE_MODE } from '../constants'

export const signTransaction = (
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
    lock: `0x${'0'.repeat(SECP256R1_PUBKEY_SIG_LEN)}`,
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

  const pubKey = getPublicKey(key)

  const authData = '49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630162f9fb77'
  const clientData = `7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22${sighashAll}222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303030222c2263726f73734f726967696e223a66616c73657d`

  const clientDataHash = sha256Hash(clientData)
  const signData = `0x${authData}${clientDataHash}`
  const signature = signMessage(key, signData)

  console.log('signature', signature)
  console.log('clientData', clientData)

  emptyWitness.lock = `0x${mode}${pubKey}${signature}${authData}${clientData}`

  const signedWitnesses = [serializeWitnessArgs(emptyWitness), ...witnessGroup.slice(1)]

  return {
    ...transaction,
    witnesses: signedWitnesses.map(witness => (typeof witness === 'string' ? witness : serializeWitnessArgs(witness))),
  }
}

export const signMessage = (key: EC.KeyPair, message: Hex) => {
  if (!message.startsWith('0x')) {
    throw new Error('Message format error')
  }

  const msg = sha256(hexToBytes(message))
  const sig = key.sign(msg)
  let result = key.verify(msg, sig)
  console.log('validate signature: ', result)

  const fmtR = sig.r.toString(16).padStart(64, '0')
  const fmtS = sig.s.toString(16).padStart(64, '0')
  return `${fmtR}${fmtS}`
}

const sha256Hash = (message: Hex): Hex => {
  let hash = sha256(hexToBytes(append0x(message)))
  return remove0x(bytesToHex(hash))
}

export const signSocialTx = async (
  servicer: Servicer,
  keys: EC.KeyPair[],
  socialMsg: Hex,
  socialUnlockReq: SocialUnlockReq,
  transaction: CKBComponents.RawTransactionToSign,
): Promise<CKBComponents.RawTransaction> => {
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
    lock: `0x${'0'.repeat(SOCIAL_LOCK_LEN)}`,
    outputType: '0x',
  }

  const serializedEmptyWitnessBytes = hexToBytes(serializeWitnessArgs(emptyWitness))
  const serializedEmptyWitnessSize = serializedEmptyWitnessBytes.length

  let hasher = blake2b(32, null, null, PERSONAL)
  hasher.update(hexToBytes(socialMsg))
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

  const authData = '49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630162f9fb77'
  const clientData = `7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22${sighashAll}222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303030222c2263726f73734f726967696e223a66616c73657d`

  console.log('clientData', clientData)
  emptyWitness.lock = `0x03${authData}${clientData}`


  const clientDataHash = sha256Hash(clientData)
  const signData = `0x${authData}${clientDataHash}`

  const socialReq: SocialUnlockReq = {
    ...socialUnlockReq,
    friends: socialUnlockReq.friends.map((friend, index) => {
      return {
        lockScript: friend.lockScript,
        pubkey: friend.pubkey,
        signature: signMessage(keys[index], signData),
        unlockMode: friend.unlockMode,
        algIndex: friend.algIndex,
      }
    }),
  }

  const { unlockEntry } = await servicer.aggregator.generateSocialUnlockSmt(socialReq)
  emptyWitness.outputType = `0x${unlockEntry}`

  const signedWitnesses = [serializeWitnessArgs(emptyWitness), ...witnessGroup.slice(1)]

  return {
    ...transaction,
    witnesses: signedWitnesses.map(witness => (typeof witness === 'string' ? witness : serializeWitnessArgs(witness))),
  }
}
