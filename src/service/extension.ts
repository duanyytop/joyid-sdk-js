import { addressToScript, serializeScript } from '@nervosnetwork/ckb-sdk-utils'
import { FEE, getCotaTypeScript, getCotaCellDep, getJoyIDCellDep } from '../constants'
import { signTransaction } from '../signature'
import { Address, ExtSubkeyReq, Hex } from '../types'
import { ExtSubKey, Servicer } from '../types/joyid'
import { keyFromPrivate } from '../utils'

enum Action {
  Add,
  Update
}

const execExtensionSubkey = async (
  servicer: Servicer, 
  fromPrivateKey: Hex, 
  from: Address,
  subkeys: ExtSubKey[],
  action: Action,
) => {
  const isMainnet = from.startsWith("ckb")
  let cotaLock = addressToScript(from)
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
      ext_data: subkey.ext_data.toString(),
      alg_index: subkey.alg_index.toString(),
    }
  })

  const extAction = action == Action.Add ? 0xF0.toString() : 0xF1.toString()
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
  const key = keyFromPrivate(fromPrivateKey)
  const signedTx = signTransaction(key, rawTx)
  console.info(JSON.stringify(signedTx))

  let txHash = await servicer.collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Extension subkey tx has been sent with tx hash ${txHash}`)
  return txHash
}


export const addExtensionSubkey = async (
  servicer: Servicer, 
  fromPrivateKey: Hex, 
  from: Address,
  subkeys: ExtSubKey[],
) => await execExtensionSubkey(servicer, fromPrivateKey, from, subkeys, Action.Add)


export const updateExtensionSubkey = async (
  servicer: Servicer, 
  fromPrivateKey: Hex, 
  from: Address,
  subkeys: ExtSubKey[],
) => await execExtensionSubkey(servicer, fromPrivateKey, from, subkeys, Action.Update)