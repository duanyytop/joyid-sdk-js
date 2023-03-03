import { addressToScript, serializeScript } from '@nervosnetwork/ckb-sdk-utils'
import { FEE, getCotaTypeScript, getCotaCellDep, getJoyIDCellDep } from '../constants'
import { signSecp256r1Tx } from '../signature/secp256r1'
import { Address, Hex } from '../types'
import { ExtSocial, ExtSocialReq, Servicer } from '../types/joyid'
import { keyFromPrivate } from '../utils'

enum Action {
  Add,
  Update,
}

const execExtensionSocial = async (
  servicer: Servicer,
  mainPrivateKey: Hex,
  address: Address,
  social: ExtSocial,
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
  const extSocialReq: ExtSocialReq = {
    lockScript: serializeScript(cotaLock),
    extAction,
    recoveryMode: social.recoveryMode,
    must: social.must,
    total: social.total,
    signers: social.signers,
  }

  const { smtRootHash, extensionSmtEntry } = await servicer.aggregator.generateExtSocialSmt(extSocialReq)
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
  const signedTx = signSecp256r1Tx(key, rawTx)
  console.info(JSON.stringify(signedTx))

  let txHash = await servicer.collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Extension social tx has been sent with tx hash ${txHash}`)
  return txHash
}

export const addExtensionSocial = async (servicer: Servicer, mainPrivateKey: Hex, from: Address, social: ExtSocial) =>
  await execExtensionSocial(servicer, mainPrivateKey, from, social, Action.Add)

export const updateExtensionSocial = async (
  servicer: Servicer,
  mainPrivateKey: Hex,
  address: Address,
  social: ExtSocial,
) => await execExtensionSocial(servicer, mainPrivateKey, address, social, Action.Update)
