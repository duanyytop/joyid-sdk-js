import { Hex } from '.'
import { Aggregator } from '../aggregator'
import { Collector } from '../collector'

export interface IndexerCell {
  blockNumber: CKBComponents.BlockNumber
  outPoint: CKBComponents.OutPoint
  output: CKBComponents.CellOutput
  outputData: Hex[]
  txIndex: Hex
}

export interface IndexerCapcity {
  blockNumber: CKBComponents.BlockNumber
  blockHash: CKBComponents.Hash
  capacity: Hex
}

export interface CollectResult {
  inputs: CKBComponents.CellInput[]
  capacity: bigint
}

export interface Service {
  collector: Collector
  aggregator: Aggregator
}
