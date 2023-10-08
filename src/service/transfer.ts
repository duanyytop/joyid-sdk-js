import { addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import { Collector } from '../collector'
import { FEE, getJoyIDCellDep } from '../constants'
import { signRSATx } from '../signature/rsa2048'
import { generateSighashAll, signSecp256k1Tx } from '../signature/secp256k1'
import { signSecp256r1Tx } from '../signature/secp256r1'
import { Address, Capacity, Hex } from '../types'
import { keyFromPrivate, pemToKey, SigAlg } from '../utils'

export const sendCKBFromP256Lock = async (
  collector: Collector,
  mainPrivateKey: Hex,
  from: Address,
  to: Address,
  amount: Capacity,
) => {
  const isMainnet = from.startsWith('ckb')
  const fromLock = addressToScript(from)
  const cells = await collector.getCells(fromLock)
  if (cells == undefined || cells.length == 0) {
    throw new Error('The from address has no live cells')
  }
  const { inputs, capacity: inputCapacity } = collector.collectInputs(cells, amount, FEE)

  const toLock = addressToScript(to)
  let outputs: CKBComponents.CellOutput[] = []
  if (inputCapacity + FEE === amount) {
    outputs.push(
      {
        capacity: `0x${inputCapacity.toString(16)}`,
        lock: toLock,
      },
    )
  } else {
    outputs.push(
      {
        capacity: `0x${amount.toString(16)}`,
        lock: toLock,
      },
    )
    const changeCapacity = inputCapacity - FEE - amount
    outputs.push({
      capacity: `0x${changeCapacity.toString(16)}`,
      lock: fromLock,
    })
  }
  const cellDeps = [getJoyIDCellDep(isMainnet)]

  const rawTx: any = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: outputs.map(_o => '0x'),
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : { lock: '', inputType: '', outputType: '' }))

  const key = keyFromPrivate(mainPrivateKey, SigAlg.Secp256r1)
  const signedTx = signSecp256r1Tx(key, rawTx)
  console.info(JSON.stringify(signedTx))

  let txHash = await collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`sendCKBFromP256Lock tx has been sent with tx hash ${txHash}`)
  return txHash
}


export const sendCKBFromEthK1Lock = async (
  collector: Collector,
  mainPrivateKey: Hex,
  from: Address,
  to: Address,
  amount: Capacity,
) => {
  const isMainnet = from.startsWith('ckb')
  const fromLock = addressToScript(from)
  const cells = await collector.getCells(fromLock)
  if (cells == undefined || cells.length == 0) {
    throw new Error('The from address has no live cells')
  }
  const { inputs, capacity: inputCapacity } = collector.collectInputs(cells, amount, FEE)

  const toLock = addressToScript(to)
  let outputs: CKBComponents.CellOutput[] = []
  if (inputCapacity + FEE === amount) {
    outputs.push(
      {
        capacity: `0x${inputCapacity.toString(16)}`,
        lock: toLock,
      },
    )
  } else {
    outputs.push(
      {
        capacity: `0x${amount.toString(16)}`,
        lock: toLock,
      },
    )
    const changeCapacity = inputCapacity - FEE - amount
    outputs.push({
      capacity: `0x${changeCapacity.toString(16)}`,
      lock: fromLock,
    })
  }
  const cellDeps = [getJoyIDCellDep(isMainnet)]

  const rawTx: any = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: outputs.map(_o => '0x'),
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : { lock: '', inputType: '', outputType: '' }))

  const key = keyFromPrivate(mainPrivateKey, SigAlg.Secp256k1)
  const signedTx = signSecp256k1Tx(key, rawTx)
  console.info(JSON.stringify(signedTx))

  let txHash = await collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`sendCKBFromEthK1Lock tx has been sent with tx hash ${txHash}`)
  return txHash
}


export const generateSecp256k1Tx = async (
  collector: Collector,
  from: Address,
  to: Address,
  amount: Capacity,
) => {
  const isMainnet = from.startsWith('ckb')
  const fromLock = addressToScript(from)
  const cells = await collector.getCells(fromLock)
  if (cells == undefined || cells.length == 0) {
    throw new Error('The from address has no live cells')
  }
  const { inputs, capacity: inputCapacity } = collector.collectInputs(cells, amount, FEE)

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

  const rawTx: any = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: ['0x', '0x'],
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : { lock: '', inputType: '', outputType: '' }))
  const sighashAll = generateSighashAll(rawTx)
  return [rawTx, sighashAll]
}

export const sendCKBFromRSALock = async (
  collector: Collector,
  mainPrivateKey: Hex,
  from: Address,
  to: Address,
  amount: Capacity,
) => {
  const isMainnet = from.startsWith('ckb')
  const fromLock = addressToScript(from)
  const cells = await collector.getCells(fromLock)
  if (cells == undefined || cells.length == 0) {
    throw new Error('The from address has no live cells')
  }
  const { inputs, capacity: inputCapacity } = collector.collectInputs(cells, amount, FEE)

  const toLock = addressToScript(to)
  let outputs: CKBComponents.CellOutput[] = []
  if (inputCapacity + FEE === amount) {
    outputs.push(
      {
        capacity: `0x${inputCapacity.toString(16)}`,
        lock: toLock,
      },
    )
  } else {
    outputs.push(
      {
        capacity: `0x${amount.toString(16)}`,
        lock: toLock,
      },
    )
    const changeCapacity = inputCapacity - FEE - amount
    outputs.push({
      capacity: `0x${changeCapacity.toString(16)}`,
      lock: fromLock,
    })
  }
  const cellDeps = [getJoyIDCellDep(isMainnet)]

  const rawTx: any = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: outputs.map(_o => '0x'),
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : { lock: '', inputType: '', outputType: '' }))

  const key = pemToKey(mainPrivateKey)
  const signedTx = signRSATx(key, rawTx)
  console.info(JSON.stringify(signedTx))

  let txHash = await collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`sendCKBFromRSALock tx has been sent with tx hash ${txHash}`)
  return txHash
}
