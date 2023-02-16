import * as NodeRSA from 'node-rsa'
import { Hex } from '../types'

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

export const signRsaMessage = (key: NodeRSA, message: Hex) => {
    if (!message.startsWith('0x')) {
        throw new Error('Message format error')
    }
    const signature = key.sign(Buffer.from(message.replace('0x', ''), 'hex'), 'hex')

    verifyRsaSignature(key, message, signature)

    return signature
}

export const verifyRsaSignature = (key: NodeRSA, message: Hex, signature: Hex) => {
    if (!message.startsWith('0x')) {
        throw new Error('Message format error')
    }
    const result = key.verify(Buffer.from(message.replace('0x', ''), 'hex'), Buffer.from(signature.replace('0x', ''), 'hex'))
    console.log('RSA validate signature: ', result)
    return result
}