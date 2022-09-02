import { addressToScript } from "@nervosnetwork/ckb-sdk-utils";
import { Collector } from "../collector";
import { FEE, getJoyIDCellDep } from "../constants";
import { signTransaction } from "../signature";
import { Address, Capacity, Hex } from "../types";
import { keyFromPrivate } from "../utils";

export const sendCKBFromP256Lock = async (collector: Collector, fromPrivateKey: Hex, from: Address, to: Address, amount: Capacity) => {
  const isMainnet = from.startsWith("ckb")
  const fromLock = addressToScript(from)
  const cells = await collector.getCells(fromLock)
  const {inputs, capacity: inputCapacity} = collector.collectInputs(cells, amount, FEE)

  const toLock = addressToScript(to)
  let outputs: CKBComponents.CellOutput[] = [
    {
      capacity: `0x${amount.toString(16)}`,
      lock: toLock,
    },
  ]
  const changeCapacity = inputCapacity - FEE - amount
  outputs.push({
    capacity: `0x${changeCapacity.toString(16)}`,
    lock: fromLock,
  })
  const cellDeps = [getJoyIDCellDep(isMainnet)]

   const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: ['0x', '0x'],
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : { lock: '', inputType: '', outputType: '' }))

  const key = keyFromPrivate(fromPrivateKey)
  const signedTx = signTransaction(key, rawTx)
  console.info(JSON.stringify(signedTx))
  
  let txHash = await collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`sendCKBFromP256Lock tx has been sent with tx hash ${txHash}`)
  return txHash
}