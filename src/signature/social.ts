import {
    bytesToHex,
    hexToBytes,
    PERSONAL,
    rawTransactionToHash,
    serializeWitnessArgs,
    toUint64Le,
  } from '@nervosnetwork/ckb-sdk-utils'
  import blake2b from '@nervosnetwork/ckb-sdk-utils/lib/crypto/blake2b'
  import { Hex, Servicer, SocialFriend, SocialUnlockReq } from '../types'
  import { SOCIAL_LOCK_LEN } from '../constants'
import { sha256Hash, signSecp256r1Message } from './secp256r1'
import { append0x, keyFromPrivate, pemToKey, SigAlg, signRSAMessage } from '../utils'
import { signSecp256k1Message } from './secp256k1'


export const signSocialTx = async (
    servicer: Servicer,
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
    emptyWitness.lock = '0x03'
    const socialReq: SocialUnlockReq = {
      ...socialUnlockReq,
      friends: socialUnlockReq.friends.map((friend) => {
        if (friend.algIndex == 1) {
            const base64 = Buffer.from(message).toString('base64url')
            const sighashAll = Buffer.from(base64, 'utf8').toString('hex')
            const authData = '49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630162f9fb77'
            const clientData = `7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22${sighashAll}222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303030222c2263726f73734f726967696e223a66616c73657d`
            const clientDataHash = sha256Hash(clientData)
            const signData = `0x${authData}${clientDataHash}`
            const key = keyFromPrivate(friend.privateKey, SigAlg.Secp256r1)
            return {
                lockScript: friend.lockScript,
                pubkey: friend.pubkey,
                signature: signSecp256r1Message(key, signData),
                unlockMode: friend.unlockMode,
                algIndex: friend.algIndex,
                webAuthnMsg: `0x${authData}${clientData}`
              }
        } else if (friend.algIndex == 2) {
            const key = keyFromPrivate(friend.privateKey, SigAlg.Secp256k1)
            return {
                lockScript: friend.lockScript,
                pubkey: friend.pubkey,
                signature: signSecp256k1Message(key, append0x(message)),
                unlockMode: friend.unlockMode,
                algIndex: friend.algIndex,
              }
        } else {
            const key = pemToKey(friend.privateKey)
            return {
                lockScript: friend.lockScript,
                pubkey: friend.pubkey,
                signature: signRSAMessage(key, append0x(message)),
                unlockMode: friend.unlockMode,
                algIndex: friend.algIndex,
            }
        }}),
    }
  
    const { unlockEntry } = await servicer.aggregator.generateSocialUnlockSmt(socialReq)
    emptyWitness.outputType = `0x${unlockEntry}`
  
    const signedWitnesses = [serializeWitnessArgs(emptyWitness), ...witnessGroup.slice(1)]
  
    return {
      ...transaction,
      witnesses: signedWitnesses.map(witness => (typeof witness === 'string' ? witness : serializeWitnessArgs(witness))),
    }
  }