import { Aggregator } from '../aggregator'
import { Collector } from '../collector'
import { Bytes, Hex, Byte32, Byte4, Byte2, Byte } from './common'

export interface ExtSubKey {
  extData: Byte4
  algIndex: Byte2
  pubkeyHash: Hex
}

export interface ExtSocial {
  recoveryMode: Byte
  must: Byte
  total: Byte
  signers: Hex[]
}

export interface BaseReq {}
export interface BaseResp {}

export interface ExtSubkeyReq extends BaseReq {
  lockScript: Bytes
  extAction: Byte
  subkeys: ExtSubKey[]
}

export interface ExtSubkeyResp extends BaseResp {
  smtRootHash: Byte32
  extensionSmtEntry: Bytes
  blockNumber: bigint
}

export interface SubkeyUnlockReq extends BaseReq {
  lockScript: Bytes
  pubkeyHash: Hex
}

export interface SubkeyUnlockResp extends BaseResp {
  unlockEntry: Bytes
  blockNumber: bigint
}

export interface ExtSocialReq extends BaseReq {
  lockScript: Bytes
  extAction: Byte
  recoveryMode: Byte
  must: Byte
  total: Byte
  signers: Hex[]
}

export interface ExtSocialResp extends BaseResp {
  smtRootHash: Byte32
  extensionSmtEntry: Bytes
  blockNumber: bigint
}

export interface Servicer {
  collector: Collector
  aggregator: Aggregator
}
