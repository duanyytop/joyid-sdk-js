import { FEE, getCotaTypeScript, getCotaCellDep, getJoyIDCellDep } from '../constants'
import { Hex, JoyIDInfo } from '../types'
import { append0x, keyFromPrivate, utf8ToHex } from '../utils'
import { addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import { Collector } from '../collector'
import { signTransaction } from '../signature'

const generateJoyIDMetadata = (joyIDInfo: JoyIDInfo): Hex => {
  const joyIDMeta = {
    id: 'CTMeta',
    ver: '1.0',
    metadata: {
      target: 'output#0',
      type: 'joy_id',
      data: {
        version: '0',
        ...joyIDInfo,
      },
    },
  }
  return append0x(utf8ToHex(JSON.stringify(joyIDMeta)))
}

export const generateJoyIDInfoTx = async (
  collector: Collector,
  mainPrivateKey: Hex,
  address: string,
  joyIDInfo: JoyIDInfo,
  fee = FEE,
  isMainnet = false,
) => {
  const cotaType = getCotaTypeScript(isMainnet)
  const cotaLock = addressToScript(address)
  const cotaCells = await collector.getCells(cotaLock, cotaType)
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
  outputs[0].capacity = `0x${(BigInt(outputs[0].capacity) - fee).toString(16)}`

  const cotaOutput = await collector.getLiveCell(cotaCell.outPoint)
  const outputsData = [cotaOutput.data?.content]
  const cellDeps = [getCotaCellDep(isMainnet), getJoyIDCellDep(isMainnet)]
  const rawTx: any = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData,
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, i) =>
    i > 0 ? '0x' : { lock: '', inputType: '', outputType: generateJoyIDMetadata(joyIDInfo) },
  )

  const key = keyFromPrivate(mainPrivateKey)
  const signedTx = signTransaction(key, rawTx)
  console.info(JSON.stringify(signedTx))

  let txHash = await collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Update joyId metadata tx has been sent with tx hash ${txHash}`)
  return txHash
}
