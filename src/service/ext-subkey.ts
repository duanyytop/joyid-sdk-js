import { addressToScript, blake160, serializeScript } from '@nervosnetwork/ckb-sdk-utils'
import { FEE, getCotaTypeScript, getCotaCellDep, getJoyIDCellDep, WITNESS_SUBKEY_MODE } from '../constants'
import { signTransaction } from '../signature'
import { Address, ExtSubkeyReq, Hex } from '../types'
import { ExtSubKey, Servicer, SubkeyUnlockReq } from '../types/joyid'
import { append0x, keyFromPrivate, pubkeyFromPrivateKey } from '../utils'

export enum Action {
  Add,
  Update,
}

const execExtensionSubkey = async (
  servicer: Servicer,
  mainPrivateKey: Hex,
  address: Address,
  subkeys: ExtSubKey[],
  action: Action,
) => {
  const isMainnet = address.startsWith('ckb')
  let cotaLock = addressToScript(address)
  const cotaType = getCotaTypeScript(isMainnet)
  const cotaCells = await servicer.collector.getCells(cotaLock, cotaType)
  if (!cotaCells || cotaCells.length === 0) {
    throw new Error("Cota cell doesn't exist")
  }
  const cotaCell = cotaCells[0]
  const inputs = [
    {
      previousOutput: cotaCell.outPoint,
      since: '0x0',
    },
  ]

  const outputs = [cotaCell.output]
  outputs[0].capacity = `0x${(BigInt(outputs[0].capacity) - FEE).toString(16)}`

  const subkeyBuf = subkeys.map((subkey: ExtSubKey) => {
    return {
      ...subkey,
      ext_data: subkey.extData.toString(),
      alg_index: subkey.algIndex.toString(),
    }
  })

  const extAction = action == Action.Add ? (0xf0).toString() : (0xf1).toString()
  const extSubkeyReq: ExtSubkeyReq = {
    lockScript: serializeScript(cotaLock),
    extAction,
    subkeys: subkeyBuf,
  }

  const { smtRootHash, extensionSmtEntry } = await servicer.aggregator.generateExtSubkeySmt(extSubkeyReq)
  const cotaCellData = `0x02${smtRootHash}`

  const outputsData = [cotaCellData]
  const cellDeps = [getCotaCellDep(isMainnet), getJoyIDCellDep(isMainnet)]

  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData,
    witnesses: [],
  } as any

  const prefix = action == Action.Add ? '0xF0' : '0xF1'
  rawTx.witnesses = rawTx.inputs.map((_, i) =>
    i > 0 ? '0x' : { lock: '', inputType: `${prefix}${extensionSmtEntry}`, outputType: '' },
  )
  const key = keyFromPrivate(mainPrivateKey)
  const signedTx = signTransaction(key, rawTx)
  console.info(JSON.stringify(signedTx))

  let txHash = await servicer.collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Extension subkey tx has been sent with tx hash ${txHash}`)
  return txHash
}

export const addExtensionSubkey = async (
  servicer: Servicer,
  mainPrivateKey: Hex,
  from: Address,
  subkeys: ExtSubKey[],
) => await execExtensionSubkey(servicer, mainPrivateKey, from, subkeys, Action.Add)

export const updateExtensionSubkey = async (
  servicer: Servicer,
  mainPrivateKey: Hex,
  address: Address,
  subkeys: ExtSubKey[],
) => await execExtensionSubkey(servicer, mainPrivateKey, address, subkeys, Action.Update)

export const updateSubkeyUnlockWithSubkey = async (
  servicer: Servicer,
  subPrivateKey: Hex,
  address: Address,
  subkeys: ExtSubKey[],
) => {
  const isMainnet = address.startsWith('ckb')
  let joyidLock = addressToScript(address)
  const cotaType = getCotaTypeScript(isMainnet)
  const cotaCells = await servicer.collector.getCells(joyidLock, cotaType)
  if (!cotaCells || cotaCells.length === 0) {
    throw new Error("Cota cell doesn't exist")
  }
  const cotaCell = cotaCells[0]
  const joyidCotaCellDep: CKBComponents.CellDep = {
    outPoint: cotaCell.outPoint,
    depType: 'code',
  }
  const inputs = [
    {
      previousOutput: cotaCell.outPoint,
      since: '0x0',
    },
  ]

  const outputs = [cotaCell.output]
  outputs[0].capacity = `0x${(BigInt(outputs[0].capacity) - FEE).toString(16)}`

  const subkeyBuf = subkeys.map((subkey: ExtSubKey) => {
    return {
      ...subkey,
      ext_data: subkey.extData.toString(),
      alg_index: subkey.algIndex.toString(),
    }
  })

  const extSubkeyReq: ExtSubkeyReq = {
    lockScript: serializeScript(joyidLock),
    extAction: (0xf1).toString(),
    subkeys: subkeyBuf,
  }

  const { smtRootHash, extensionSmtEntry } = await servicer.aggregator.generateExtSubkeySmt(extSubkeyReq)
  const cotaCellData = `0x02${smtRootHash}`

  const outputsData = [cotaCellData]
  const cellDeps = [joyidCotaCellDep, getCotaCellDep(isMainnet), getJoyIDCellDep(isMainnet)]

  const subPubkey = pubkeyFromPrivateKey(subPrivateKey)
  const req: SubkeyUnlockReq = {
    lockScript: serializeScript(joyidLock),
    pubkeyHash: append0x(blake160(subPubkey, 'hex')),
  }

  const { unlockEntry } = await servicer.aggregator.generateSubkeyUnlockSmt(req)

  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData,
    witnesses: [],
  } as any

  rawTx.witnesses = rawTx.inputs.map((_, i) =>
    i > 0 ? '0x' : { lock: '', inputType: `0xF1${extensionSmtEntry}`, outputType: append0x(unlockEntry) },
  )
  const key = keyFromPrivate(subPrivateKey)
  const signedTx = signTransaction(key, rawTx, WITNESS_SUBKEY_MODE)
  console.info(JSON.stringify(signedTx))

  let txHash = await servicer.collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Update subkey with subkey unlock tx has been sent with tx hash ${txHash}`)
  return txHash
}
