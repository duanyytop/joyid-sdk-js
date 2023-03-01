import { blake160, hexToBytes, scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import * as NodeRSA from 'node-rsa'
import { getJoyIDLockScript } from '../constants'
import { Address, Hex } from '../types'
import { append0x } from './hex'

export const pemToKey = (privateKeyPem: string): NodeRSA => {
    const key = new NodeRSA(privateKeyPem)
    key.setOptions({ signingScheme: 'pkcs1-sha256' })
    return key
}

export const exportPubKey = (key: NodeRSA) => {
    const pubkey: NodeRSA.KeyComponentsPublic = key.exportKey('components-public')

    if (typeof pubkey.e !== 'number') {
        throw Error('RSA public key e error')
    }
    const pubKeyE: number = pubkey.e
    const e = pubKeyE.toString(16).padStart(8, '0')
    const n = pubkey.n.slice(1)

    const eBuffer = Buffer.from(e, 'hex').reverse()
    const nBuffer = n.reverse()

    const pubKey = Buffer.concat([eBuffer, nBuffer])
    return pubKey.toString('hex')
}

export const addressFromPemKey = (privateKeyPem: string, isMainnet = false): Address => {
    const pubkey = append0x(exportPubKey(pemToKey(privateKeyPem)))
    const lock = {
      ...getJoyIDLockScript(isMainnet),
      args: `0x0003${blake160(hexToBytes(pubkey), 'hex')}`,
    }
    return scriptToAddress(lock, isMainnet)
  }

export const signRSAMessage = (key: NodeRSA, message: Hex) => {
    if (!message.startsWith('0x')) {
        throw new Error('Message format error')
    }
    const signature = key.sign(Buffer.from(message.replace('0x', ''), 'hex'), 'hex')

    verifyRSASignature(key, message, signature)

    return signature
}

export const verifyRSASignature = (key: NodeRSA, message: Hex, signature: Hex) => {
    if (!message.startsWith('0x')) {
        throw new Error('Message format error')
    }
    const result = key.verify(Buffer.from(message.replace('0x', ''), 'hex'), Buffer.from(signature.replace('0x', ''), 'hex'))
    console.log('RSA validate signature: ', result)
    return result
}