import {
  hexToBytes,
  PERSONAL,
  rawTransactionToHash,
  serializeWitnessArgs,
  toUint64Le,
} from '@nervosnetwork/ckb-sdk-utils'
import {ec as EC} from 'elliptic'
import blake2b from '@nervosnetwork/ckb-sdk-utils/lib/crypto/blake2b'
import { remove0x } from '../utils'
import { Hex } from '../types'
import { MODE_PUBKEY_LEN, SIGNATURE_LEN, WITNESS_NATIVE_MODE } from '../constants'

export const signTransaction = async (key: EC.KeyPair, transaction: CKBComponents.RawTransactionToSign) => {
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
    lock: `0x${witnessGroup[0].lock.substring(0, MODE_PUBKEY_LEN)}${'0'.repeat(SIGNATURE_LEN)}`,
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

  const message = `0x${hash.digest('hex')}`
  const mode = WITNESS_NATIVE_MODE
  const pubKey = remove0x(key.getPublic(false, 'hex'))
  emptyWitness.lock = `0x${mode}${pubKey}${signMessage(key, message)}`

  console.log(emptyWitness.lock)

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
  const signature = key.sign(Buffer.from(message.replace('0x', ''), 'hex'), 'hex')

  return signature
}