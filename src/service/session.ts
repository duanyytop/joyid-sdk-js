import { addressToScript, blake160, serializeScript } from '@nervosnetwork/ckb-sdk-utils'
import * as NodeRSA from 'node-rsa'
import { Collector } from '../collector'
import { FEE, getJoyIDCellDep } from '../constants'
import { signSecp256k1SessionTx } from '../signature/secp256k1'
import { signSessionTx } from '../signature/secp256r1'
import { Address, Byte2, Capacity, Hex, Servicer, SubkeyUnlockReq } from '../types'
import { append0x, keccak160, keyFromPrivate, pubkeyFromPrivateKey, SigAlg } from '../utils'

export const sendCKBFromNativeSessionLock = async (
    collector: Collector,
    mainPrivateKey: Hex,
    sessionKey: NodeRSA,
    from: Address,
    to: Address,
    amount: Capacity,
    sigAlg = SigAlg.Secp256r1,
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
  
    const key = keyFromPrivate(mainPrivateKey, sigAlg)
    let signedTx
    if (sigAlg == SigAlg.Secp256k1) {
      signedTx = signSecp256k1SessionTx(key, sessionKey, rawTx)
    } else {
      signedTx = signSessionTx(key, sessionKey, rawTx)
    }
    console.info(JSON.stringify(signedTx))
  
    let txHash = await collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
    console.info(`sendCKBFromNativeSessionLock tx has been sent with tx hash ${txHash}`)
    return txHash
  }


  export const sendCKBFromSubkeySessionLock = async (
    servicer: Servicer,
    subPrivateKey: Hex,
    algIndex: Byte2,
    sessionKey: NodeRSA,
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
    const cellDeps = [getJoyIDCellDep(isMainnet)]

    const subPubkey = pubkeyFromPrivateKey(subPrivateKey, sigAlg)
    const req: SubkeyUnlockReq = {
      lockScript: serializeScript(fromLock),
      pubkeyHash: sigAlg == SigAlg.Secp256r1 ? append0x(blake160(subPubkey, 'hex')) : append0x(keccak160(subPubkey)),
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
    rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : { lock: '', inputType: '', outputType: append0x(unlockEntry)  }))
  
    const key = keyFromPrivate(subPrivateKey, sigAlg)
    const signedTx = await signSessionTx(key, sessionKey, rawTx)
    console.info(JSON.stringify(signedTx))
  
    let txHash = await servicer.collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
    console.info(`sendCKBFromP256NativeSessionLock tx has been sent with tx hash ${txHash}`)
    return txHash
  }