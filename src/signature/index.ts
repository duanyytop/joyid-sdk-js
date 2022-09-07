import {
  bytesToHex,
  hexToBytes,
  PERSONAL,
  rawTransactionToHash,
  serializeWitnessArgs,
  toUint64Le,
} from '@nervosnetwork/ckb-sdk-utils'
import {ec as EC} from 'elliptic'
import sha256 from "fast-sha256";
import blake2b from '@nervosnetwork/ckb-sdk-utils/lib/crypto/blake2b'
import { append0x, getPublicKey, remove0x } from '../utils'
import { Hex } from '../types'
import { MODE_PUBKEY_SIG_LEN, WITNESS_NATIVE_MODE } from '../constants'

export const signTransaction = (key: EC.KeyPair, transaction: CKBComponents.RawTransactionToSign): CKBComponents.RawTransaction => {
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
    lock: `0x${'0'.repeat(MODE_PUBKEY_SIG_LEN)}`,
  }

  const serializedEmptyWitnessBytes = hexToBytes(serializeWitnessArgs(emptyWitness))
  const serializedEmptyWitnessSize = serializedEmptyWitnessBytes.length

  const hash = blake2b(32, null, null, PERSONAL)
  hash.update(hexToBytes(transactionHash))
  hash.update(hexToBytes(toUint64Le(`0x${serializedEmptyWitnessSize.toString(16)}`)))
  hash.update(serializedEmptyWitnessBytes)

  witnessGroup.slice(1).forEach(w => {
    const bytes = hexToBytes(typeof w === 'string' ? w : serializeWitnessArgs(w))
    hash.update(hexToBytes(toUint64Le(`0x${bytes.length.toString(16)}`)))
    hash.update(bytes)
  })

  const message = `${hash.digest('hex')}`
  const mode = WITNESS_NATIVE_MODE
  const pubKey = getPublicKey(key)

  const authData ="49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630162f9fb77"
  const clientData = `7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22${message}222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303030222c2263726f73734f726967696e223a66616c73657d`

  const clientDataHash = sha256Hash(clientData);
  const signData = `0x${authData}${clientDataHash}`
  const signature = signMessage(key, signData)

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

  const signature = `${paddingSig(sig.r.toString('hex'))}${paddingSig(sig.s.toString('hex'))}`

  return signature
}

const sha256Hash = (message: Hex): Hex => {
  let hash = sha256(hexToBytes(append0x(message)))
  return remove0x(bytesToHex(hash))
}

const paddingSig = (sig: Hex): Hex => {
  return sig.length == 63 ? `0${sig}` : sig
}