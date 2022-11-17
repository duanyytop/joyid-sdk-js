import { addressToScript, blake160, serializeScript } from '@nervosnetwork/ckb-sdk-utils'
import { FEE, getCotaTypeScript, getJoyIDCellDep, WITNESS_SUBKEY_MODE } from '../constants'
import { signTransaction } from '../signature'
import { Address, Capacity, SubkeyUnlockReq, Hex } from '../types'
import { Servicer } from '../types/joyid'
import { append0x, keyFromPrivate, pubkeyFromPrivateKey } from '../utils'

export const sendCKBWithSubkeyUnlock = async (
  servicer: Servicer,
  subPrivateKey: Hex,
  from: Address,
  to: Address,
  amount: Capacity,
) => {
  const isMainnet = from.startsWith('ckb')
  const fromLock = addressToScript(from)
  const cells = await servicer.collector.getCells(fromLock)
  if (cells == undefined || cells.length == 0) {
    throw new Error('The from address has no live cells')
  }
  const cotaType = getCotaTypeScript(isMainnet)
  const cotaCells = await servicer.collector.getCells(fromLock, cotaType)
  if (!cotaCells || cotaCells.length === 0) {
    throw new Error("Cota cell doesn't exist")
  }
  const cotaCell = cotaCells[0]
  const cotaCellDep: CKBComponents.CellDep = {
    outPoint: cotaCell.outPoint,
    depType: 'code',
  }

  const { inputs, capacity: inputCapacity } = servicer.collector.collectInputs(cells, amount, FEE)

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
  const cellDeps = [cotaCellDep, getJoyIDCellDep(isMainnet)]

  const subPubkey = pubkeyFromPrivateKey(subPrivateKey)
  const req: SubkeyUnlockReq = {
    lockScript: serializeScript(fromLock),
    pubkeyHash: append0x(blake160(subPubkey, 'hex')),
  }

  const { unlockEntry } = await servicer.aggregator.generateSubkeyUnlockSmt(req)

  const rawTx: any = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: ['0x', '0x'],
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, i) =>
    i > 0 ? '0x' : { lock: '', inputType: '', outputType: append0x(unlockEntry) },
  )

  const key = keyFromPrivate(subPrivateKey)
  const signedTx = signTransaction(key, rawTx, WITNESS_SUBKEY_MODE)
  console.info(JSON.stringify(signedTx))

  let txHash = await servicer.collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`sendCKBWithSubkeyUnlock tx has been sent with tx hash ${txHash}`)

  return txHash
}
