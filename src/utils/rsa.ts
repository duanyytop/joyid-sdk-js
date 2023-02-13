import * as NodeRSA from 'node-rsa'
import { Hex } from '../types'

export const pemToKey = (privateKeyPem: string): NodeRSA => {
    const key = new NodeRSA(privateKeyPem)
    key.setOptions({ signingScheme: 'pkcs1-sha256' })
    return key
}

export const exportPubKey = async (privateKey: NodeRSA) => {
    const data: NodeRSA.KeyComponentsPublic = await privateKey.exportKey('components-private')

    if (typeof data.e !== 'number') {
        throw Error('RSA public key e error')
    }
    const pubKeyE: number = data.e
    const e = pubKeyE.toString(16).padStart(8, '0')
    const n = data.n.slice(1)

    const eBuffer = Buffer.from(e, 'hex').reverse()
    const nBuffer = n.reverse()

    const pubKey = Buffer.concat([eBuffer, nBuffer])
    return `0x${pubKey.toString('hex')}`
}

export const signRsaMessage = (key: NodeRSA, message: Hex) => {
    if (!message.startsWith('0x')) {
        throw new Error('Message format error')
    }
    const signature = key.sign(Buffer.from(message.replace('0x', ''), 'hex'), 'hex')

    return signature
}