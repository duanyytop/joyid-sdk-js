import {
  addressToScript,
  blake160,
  bytesToHex,
  rawTransactionToHash,
  scriptToHash,
  serializeOutPoint,
  serializeScript,
  serializeWitnessArgs,
} from '@nervosnetwork/ckb-sdk-utils'
import {Aggregator, Collector, FEE, SequentialTransfer, SequentialTransferReq, Service, append0x, generateRegisterCotaTx, getAlwaysSuccessLock, getCotaCellDep, getCotaTypeScript} from "@nervina-labs/cota-sdk"
import signWitnesses from '@nervosnetwork/ckb-sdk-core/lib/signWitnesses'
import { SigAlg, addressFromPrivateKey, keyFromPrivate } from '../../src/utils'
import { WITNESS_NATIVE_MODE, WITNESS_NATIVE_PARTIAL_MODE, getJoyIDCellDep } from '../../src/constants'
import {signSecp256r1Tx}  from '../../src/signature/secp256r1' 

const REGISTRY_PRIVATE_KEY = '0xc5bd09c9b954559c70a77d68bde95369e2ce910556ddc20f739080cde3b62ef2'
const REGISTRY_ADDRESS = 'ckt1qyq0scej4vn0uka238m63azcel7cmcme7f2sxj5ska'
const MAIN_PRIVATE_KEY = '0x339b73e5359dfacb798ccf29e63ae5823371e61850a83b9400a68dc8bc4a28da'
const TRASNFER_ADDRESS = 'ckt1qyqp8ydxwz3p4vcmjwc2d7zqk4xhv707j80q4yrap2'

const secp256k1CellDep = (isMainnet: boolean): CKBComponents.CellDep => {
  if (isMainnet) {
    return {
      outPoint: {
        txHash: '0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c',
        index: '0x0',
      },
      depType: 'depGroup',
    }
  }
  return {
    outPoint: {
      txHash: '0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37',
      index: '0x0',
    },
    depType: 'depGroup',
  }
}

const service: Service = {
    collector: new Collector({
    ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
    ckbIndexerUrl: 'https://testnet.ckb.dev/rpc',
  }),
    aggregator: new Aggregator({
      registryUrl: 'https://cota.nervina.dev/registry-aggregator',
      cotaUrl: 'http://localhost:3030',
    }),
  }
const isMainnet = false

const ckb = service.collector.getCkb()
const mainKeyAddress = addressFromPrivateKey(MAIN_PRIVATE_KEY)
console.log("mainkey address: ", mainKeyAddress)
const cotaLock = addressToScript(mainKeyAddress)
const cotaLockScript = serializeScript(cotaLock)
let cotaType = getCotaTypeScript(isMainnet)
cotaType.args = bytesToHex(blake160(serializeScript(cotaLock)))

const withdrawLock = addressToScript(TRASNFER_ADDRESS)
const withdrawalLockHash = scriptToHash(withdrawLock)

// Register cota cell firstly
const generateRegistryTx = async () => {
  const provideCKBLock = addressToScript(REGISTRY_ADDRESS)
  const unregisteredCotaLock = addressToScript(mainKeyAddress)

  let rawTx = await generateRegisterCotaTx(service, [unregisteredCotaLock], provideCKBLock, FEE, isMainnet)
  rawTx.cellDeps.push(secp256k1CellDep(isMainnet))

  const registryLock = getAlwaysSuccessLock(isMainnet)

  let keyMap = new Map<string, string>()
  keyMap.set(scriptToHash(registryLock), '')
  keyMap.set(scriptToHash(provideCKBLock), REGISTRY_PRIVATE_KEY)

  const cells = rawTx.inputs.map((input, index) => ({
    outPoint: input.previousOutput,
    lock: index === 0 ? registryLock : provideCKBLock,
  }))

  const transactionHash = rawTransactionToHash(rawTx)

  const signedWitnesses = signWitnesses(keyMap)({
    transactionHash,
    witnesses: rawTx.witnesses,
    inputCells: cells,
    skipMissingKeys: true,
  })
  const signedTx = {
    ...rawTx,
    witnesses: signedWitnesses.map(witness => (typeof witness === 'string' ? witness : serializeWitnessArgs(witness))),
  }
  return { poolTxHash: transactionHash, signedTx }
}


// Transfer first cota nft with mainkey partial unlock
const COTA_CAPACITY = BigInt(150) * BigInt(100000000)
const generateFirstTransferTx = async (poolTxHash: string) => {
  const cotaCellOutPoint = {
    txHash: poolTxHash,
    index: '0x1',
  }
  let transfers: SequentialTransfer[] = [
    {
      withdrawalLockHash,
      transferOutPoint: append0x(serializeOutPoint(cotaCellOutPoint).slice(26)),
      cotaId: '0x003688bb1cba009d89dd3f1c8a6027a0c5851e86',
      tokenIndex: '0x0000003a',
      toLockScript: serializeScript(addressToScript(REGISTRY_ADDRESS)),
    },
  ]
  const transferReq1: SequentialTransferReq = {
    lockScript: cotaLockScript,
    transfers,
  }
  const realInputs = [
    {
      previousOutput: cotaCellOutPoint,
      since: '0x0',
    },
  ]

  const resp1 = await service.aggregator.generateSequentialTransferCotaSmt(transferReq1)

  const sigInputs = [
    {
      previousOutput: {
        txHash: `0x${resp1.smtRootHash}`,
        index: '0x0',
      },
      since: '0x0',
    },
  ]

  const outputCapacity = COTA_CAPACITY - FEE
  const output: CKBComponents.CellOutput = {
    lock: cotaLock,
    type: cotaType,
    capacity: `0x${outputCapacity.toString(16)}`
  }

  const outputs = [output]

  const cotaCellData = `0x02${resp1.smtRootHash}`

  const outputsData = [cotaCellData]
  const cellDeps = [getCotaCellDep(isMainnet), getJoyIDCellDep(isMainnet)]
  const headerDeps = [`0x${resp1.withdrawBlockHash}`]

  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps,
    inputs: sigInputs,
    outputs,
    outputsData,
    witnesses: [],
  } as any

  rawTx.witnesses = rawTx.inputs.map((_, i) =>
    i > 0 ? '0x' : { lock: '', inputType: `0x06${resp1.transferSmtEntry}`, outputType: '' },
  )
  const key = keyFromPrivate(MAIN_PRIVATE_KEY, SigAlg.Secp256r1)
  let signedTx = signSecp256r1Tx(key, rawTx, WITNESS_NATIVE_PARTIAL_MODE)
  signedTx.inputs = realInputs

  return {signedTx, transfers, outputCapacity}
}

// Transfer second cota nft with mainkey unlock
const generateSecondTransferTx = async (firstTxHash: string, transfers: SequentialTransfer[], outputCapacity: bigint) => {
  const cotaCellOutPoint = {
    txHash: firstTxHash,
    index: '0x0',
  }
  transfers.push(
    {
      withdrawalLockHash,
      transferOutPoint: append0x(serializeOutPoint(cotaCellOutPoint).slice(26)),
      cotaId: '0x003688bb1cba009d89dd3f1c8a6027a0c5851e86',
      tokenIndex: '0x0000003b',
      toLockScript: serializeScript(addressToScript(REGISTRY_ADDRESS)),
    })
  const transferReq2: SequentialTransferReq = {
    lockScript: cotaLockScript,
    transfers,
  }
  const inputs = [
    {
      previousOutput: cotaCellOutPoint,
      since: '0x0',
    },
  ]

  const resp2 = await service.aggregator.generateSequentialTransferCotaSmt(transferReq2)

  const output: CKBComponents.CellOutput = {
    lock: cotaLock,
    type: cotaType,
    capacity: `0x${(outputCapacity - FEE).toString(16)}`
  }

  const outputs = [output]

  const cotaCellData = `0x02${resp2.smtRootHash}`

  const outputsData = [cotaCellData]
  const cellDeps = [getCotaCellDep(isMainnet), getJoyIDCellDep(isMainnet)]
  const headerDeps = [`0x${resp2.withdrawBlockHash}`]

  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps,
    inputs,
    outputs,
    outputsData,
    witnesses: [],
  } as any

  rawTx.witnesses = rawTx.inputs.map((_, i) =>
    i > 0 ? '0x' : { lock: '', inputType: `0x06${resp2.transferSmtEntry}`, outputType: '' },
  )
  const key = keyFromPrivate(MAIN_PRIVATE_KEY, SigAlg.Secp256r1)
  const signedTx = signSecp256r1Tx(key, rawTx, WITNESS_NATIVE_MODE)

  return signedTx
}

const run = async () => {
  const { poolTxHash, signedTx } = await generateRegistryTx()
  const txHash1 = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Register cota cell tx hash: ${txHash1}`)

  setTimeout(async () => {
    const {signedTx, transfers, outputCapacity} = await generateFirstTransferTx(poolTxHash)
    const txHash2 = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
    console.info(`Transfer first cota cell tx hash: ${txHash2}`)

    setTimeout(async () => {
      const signedTx = await generateSecondTransferTx(txHash2, transfers, outputCapacity)
      const txHash3 = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
      console.info(`Transfer second cota cell tx hash: ${txHash3}`)
    }, 1000)

  }, 1000)
}

run()
