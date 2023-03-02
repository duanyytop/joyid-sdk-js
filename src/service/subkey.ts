import { addressToScript, blake160, serializeScript } from '@nervosnetwork/ckb-sdk-utils'
import { FEE, getCotaTypeScript, getJoyIDCellDep, WITNESS_SUBKEY_MODE } from '../constants'
import { signRSATx } from '../signature/rsa2048'
import { signSecp256k1Tx } from '../signature/secp256k1'
import { signTransaction } from '../signature/secp256r1'
import { Address, Capacity, SubkeyUnlockReq, Hex, Byte2 } from '../types'
import { Servicer } from '../types/joyid'
import { append0x, exportPubKey, keccak160, keyFromPrivate, pemToKey, pubkeyFromPrivateKey, SigAlg } from '../utils'

export const sendCKBWithSubkeyUnlock = async (
  servicer: Servicer,
  subPrivateKey: Hex,
  algIndex: Byte2,
  from: Address,
  to: Address,
  amount: Capacity,
  sigAlg = SigAlg.Secp256r1,
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

  let pubkeyHash: Hex
  if (sigAlg == SigAlg.RSA2048) {
    const subPubkey = `0x${exportPubKey(pemToKey(subPrivateKey))}`
    pubkeyHash = append0x(blake160(subPubkey, 'hex'))
  } else {
    const subPubkey = pubkeyFromPrivateKey(subPrivateKey, sigAlg)
    pubkeyHash = sigAlg == SigAlg.Secp256r1 ? append0x(blake160(subPubkey, 'hex')) : append0x(keccak160(subPubkey))
  }
  const req: SubkeyUnlockReq = {
    lockScript: serializeScript(fromLock),
    pubkeyHash,
    algIndex,
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

  let signedTx: CKBComponents.RawTransaction
  if (sigAlg == SigAlg.RSA2048) {
    const key = pemToKey(subPrivateKey)
    signedTx = signRSATx(key, rawTx, WITNESS_SUBKEY_MODE)
  } else {
    const key = keyFromPrivate(subPrivateKey, sigAlg)
    signedTx = sigAlg == SigAlg.Secp256r1 ? signTransaction(key, rawTx, WITNESS_SUBKEY_MODE) : signSecp256k1Tx(key, rawTx, WITNESS_SUBKEY_MODE)
  }
  console.info(JSON.stringify(signedTx))

  let txHash = await servicer.collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`sendCKBWithSubkeyUnlock tx has been sent with tx hash ${txHash}`)

  return txHash
}
