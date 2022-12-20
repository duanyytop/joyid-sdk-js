import { addressToScript, blake160, serializeScript } from '@nervosnetwork/ckb-sdk-utils'
import { FEE, getCotaTypeScript, getCotaCellDep, getJoyIDCellDep, WITNESS_SUBKEY_MODE } from '../constants'
import { signTransaction } from '../signature/secp256r1'
import { Address, ExtSubkeyReq, Hex, JoyIDInfo } from '../types'
import { ExtSubKey, Servicer, SubkeyUnlockReq } from '../types/joyid'
import { append0x, keyFromPrivate, pubkeyFromPrivateKey, toSnakeCase, utf8ToHex } from '../utils'

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

  const extAction = action == Action.Add ? 0xf0 : 0xf1
  const extSubkeyReq: ExtSubkeyReq = {
    lockScript: serializeScript(cotaLock),
    extAction,
    subkeys,
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
  joyId?: JoyIDInfo,
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

  const extSubkeyReq: ExtSubkeyReq = {
    lockScript: serializeScript(joyidLock),
    extAction: 0xf1,
    subkeys,
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
  if (joyId) {
    rawTx.witnesses.push(generateJoyIDMetadata(joyId))
  }
  const key = keyFromPrivate(subPrivateKey)
  const signedTx = signTransaction(key, rawTx, WITNESS_SUBKEY_MODE)
  console.info(JSON.stringify(signedTx))

  let txHash = await servicer.collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Update subkey with subkey unlock tx has been sent with tx hash ${txHash}`)
  return txHash
}

const generateJoyIDMetadata = (joyIDInfo: JoyIDInfo): Hex => {
  const joyIDMeta = {
    id: 'CTMeta',
    ver: '1.0',
    metadata: {
      target: 'output#0',
      type: 'joy_id',
      data: {
        version: '0',
        ...toSnakeCase(joyIDInfo),
      },
    },
  }
  return append0x(utf8ToHex(JSON.stringify(joyIDMeta)))
}

