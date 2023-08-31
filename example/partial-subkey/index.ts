import {
  addressToScript,
  blake160,
  bytesToHex,
  rawTransactionToHash,
  scriptToHash,
  serializeScript,
  serializeWitnessArgs,
} from '@nervosnetwork/ckb-sdk-utils'
import {Aggregator as CotaAggregator, Collector, FEE, Service, append0x, generateRegisterCotaTx, getAlwaysSuccessLock, getCotaCellDep, getCotaTypeScript} from "@nervina-labs/cota-sdk"
import signWitnesses from '@nervosnetwork/ckb-sdk-core/lib/signWitnesses'
import { SigAlg, addressFromPrivateKey, keyFromPrivate } from '../../src/utils'
import { ExtSubkeyReq } from '../../src/types'
import { WITNESS_NATIVE_PARTIAL_MODE, getJoyIDCellDep } from '../../src/constants'
import { Aggregator as JoyidAggregator } from '../../src/aggregator'
import {signSecp256r1Tx}  from '../../src/signature/secp256r1' 

const TEST_PRIVATE_KEY = '0xc5bd09c9b954559c70a77d68bde95369e2ce910556ddc20f739080cde3b62ef2'
const TEST_ADDRESS = 'ckt1qyq0scej4vn0uka238m63azcel7cmcme7f2sxj5ska'
const MAIN_PRIVATE_KEY = '0x46db078dcd57712695ef9a992add54aba12def98966ac072356226d7b98facf6'
const SUB_PUB_KEY = '0x7b9d3f2f356ead86d5f04fc90e8096d706247027c349ac75357094459d8724b9'

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

const collector = new Collector({
    ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
    ckbIndexerUrl: 'https://testnet.ckb.dev/rpc',
  })
const isMainnet = false

const ckb = collector.getCkb()
const mainKeyAddress = addressFromPrivateKey(MAIN_PRIVATE_KEY)
const cotaLock = addressToScript(mainKeyAddress)
let cotaType = getCotaTypeScript(isMainnet)
cotaType.args = bytesToHex(blake160(serializeScript(cotaLock)))

const generateRegistryTx = async () => {
  const provideCKBLock = addressToScript(TEST_ADDRESS)
  const unregisteredCotaLock = addressToScript(mainKeyAddress)

  const service: Service = {
    collector,
    aggregator: new CotaAggregator({
      registryUrl: 'https://cota.nervina.dev/registry-aggregator',
      cotaUrl: 'http://localhost:3030',
    }),
  }

  let rawTx = await generateRegisterCotaTx(service, [unregisteredCotaLock], provideCKBLock, FEE, isMainnet)
  rawTx.cellDeps.push(secp256k1CellDep(isMainnet))

  const registryLock = getAlwaysSuccessLock(isMainnet)

  let keyMap = new Map<string, string>()
  keyMap.set(scriptToHash(registryLock), '')
  keyMap.set(scriptToHash(provideCKBLock), TEST_PRIVATE_KEY)

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


const COTA_CAPACITY = BigInt(150) * BigInt(100000000)
const generateAddingSubkeyTx = async (poolTxHash: string) => {
  const extSubkeyReq: ExtSubkeyReq = {
    lockScript: serializeScript(cotaLock),
    extAction: 0xf0,
    subkeys: [
      {
        extData: 2,
        algIndex: 1,
        pubkeyHash: append0x(blake160(SUB_PUB_KEY, 'hex')),
      },
    ],
  }
  const realInputs = [
    {
      previousOutput: {
        txHash: poolTxHash,
        index: '0x1',
      },
      since: '0x0',
    },
  ]

  const service = {
    collector,
    aggregator: new JoyidAggregator('http://localhost:3030'),
  }
  const { smtRootHash, extensionSmtEntry } = await service.aggregator.generateAddingSubkeySmt(extSubkeyReq)
  const sigInputs = [
    {
      previousOutput: {
        txHash: `0x${smtRootHash}`,
        index: '0x0',
      },
      since: '0x0',
    },
  ]

  const output: CKBComponents.CellOutput = {
    lock: cotaLock,
    type: cotaType,
    capacity: `0x${(COTA_CAPACITY - FEE).toString(16)}`
  }

  const outputs = [output]

  const cotaCellData = `0x02${smtRootHash}`

  const outputsData = [cotaCellData]
  const cellDeps = [getCotaCellDep(isMainnet), getJoyIDCellDep(isMainnet)]

  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs: sigInputs,
    outputs,
    outputsData,
    witnesses: [],
  } as any

  rawTx.witnesses = rawTx.inputs.map((_, i) =>
    i > 0 ? '0x' : { lock: '', inputType: `0xF0${extensionSmtEntry}`, outputType: '' },
  )
  const key = keyFromPrivate(MAIN_PRIVATE_KEY, SigAlg.Secp256r1)
  let signedTx = signSecp256r1Tx(key, rawTx, WITNESS_NATIVE_PARTIAL_MODE)
  signedTx.inputs = realInputs

  console.log("signed tx", JSON.stringify(signedTx))

  return signedTx
}

const run = async () => {
  const { poolTxHash, signedTx } = await generateRegistryTx()
  const txHash1 = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Register cota cell tx hash: ${txHash1}`)

  setTimeout(async () => {
    const signedTx2 = await generateAddingSubkeyTx(poolTxHash)
    const txHash2 = await ckb.rpc.sendTransaction(signedTx2, 'passthrough')
    console.info(`Add suubkey to cota cell tx hash: ${txHash2}`)
  }, 1000)
}

run()
