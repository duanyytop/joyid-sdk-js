import { Aggregator } from "../aggregator";
import { Collector } from "../collector";
import { Bytes, Hex, Byte32, Byte4, Byte2, Byte } from "./common";

export interface ExtSubKey {
    ext_data:    Byte4,
    alg_index:   Byte2,
    pubkey_hash: Hex,
}

export interface BaseReq {}
export interface BaseResp {}

export interface ExtSubkeyReq extends BaseReq {
    lockScript: Bytes,
    extAction: Byte,
    subkeys: ExtSubKey[],
}

export interface ExtSubkeyResp extends BaseResp {
    smtRootHash: Byte32
    extensionSmtEntry: Bytes
    blockNumber: bigint
}

export interface SubkeyUnlockReq extends BaseReq {
    lockScript: Bytes,
    pubkey_hash: Hex,
}

export interface SubkeyUnlockResp extends BaseResp {
    unlockEntry: Bytes
    blockNumber: bigint
}

export interface Servicer {
    collector: Collector
    aggregator: Aggregator
 }