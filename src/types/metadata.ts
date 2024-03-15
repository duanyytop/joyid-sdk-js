import { Hex } from './common'

export interface SubKeyInfo {
  pubKey: Hex
  credentialId: Hex
  alg: Hex
  frontEnd: string
  deviceName?: string
  deviceType?: string
}

export interface JoyIDInfo {
  name: string
  description?: string
  avatar?: string
  extension?: string
  pubKey: Hex
  credentialId: Hex
  alg: Hex
  frontEnd?: string
  deviceName?: string
  deviceType?: string
  cotaCellId?: Hex
  subKeys?: SubKeyInfo[]
}
