import { addressToScript, serializeOutPoint, serializeScript } from '@nervosnetwork/ckb-sdk-utils'
import { FEE, getCotaCellDep, getCotaTypeScript, getJoyIDCellDep } from '../constants'
import { signSocialTx } from '../signature/secp256r1'
import { Address } from '../types'
import { ExtSubKey, ExtSubkeyReq, Servicer, SocialFriend, SocialUnlockReq } from '../types/joyid'
import { keyFromPrivate, remove0x, u16ToBe } from '../utils'

export const socialUnlockTx = async (
  servicer: Servicer,
  owner: Address,
  friends: SocialFriend[],
  subkey: ExtSubKey,
  fee = FEE,
) => {
  const isMainnet = owner.startsWith('ckb')
  const ownerLock = addressToScript(owner)
  const cotaType = getCotaTypeScript(isMainnet)
  const ownerCotaCells = await servicer.collector.getCells(ownerLock, cotaType)
  if (!ownerCotaCells || ownerCotaCells.length === 0) {
    throw new Error("Cota cell doesn't exist")
  }
  const ownerCotaCell = ownerCotaCells[0]
  const socialMsg = `${serializeOutPoint(ownerCotaCell.outPoint)}${u16ToBe(subkey.algIndex as number)}${remove0x(
    subkey.pubkeyHash,
  )}`
  const inputs = [
    {
      previousOutput: ownerCotaCell.outPoint,
      since: '0x0',
    },
  ]

  let cellDeps = []
  for await (const friend of friends) {
    if (friend.unlockMode != 1 && friend.unlockMode != 2) {
      throw new Error('Social unlock mode error')
    }
    const friendLock = addressToScript(friend.address)
    // mainkey
    if (friend.unlockMode == 1) {
      const friendCells = await servicer.collector.getCells(friendLock)
      if (friendCells == undefined || friendCells.length == 0) {
        throw new Error('The friend address has no live cells')
      }
      const friendCellDep: CKBComponents.CellDep = {
        outPoint: friendCells[0].outPoint,
        depType: 'code',
      }
      cellDeps.push(friendCellDep)
    } else {
      const friendCells = await servicer.collector.getCells(friendLock, cotaType)
      if (!friendCells || friendCells.length === 0) {
        throw new Error("The friend's cota cell doesn't exist")
      }
      const friendCellDep: CKBComponents.CellDep = {
        outPoint: friendCells[0].outPoint,
        depType: 'code',
      }
      cellDeps.push(friendCellDep)
    }
  }
  cellDeps.push(getJoyIDCellDep(isMainnet))
  cellDeps.push(getCotaCellDep(isMainnet))

  const outputs = [ownerCotaCell.output]
  outputs[0].capacity = `0x${(BigInt(outputs[0].capacity) - fee).toString(16)}`

  const extSubkeyReq: ExtSubkeyReq = {
    lockScript: serializeScript(ownerLock),
    extAction: 0xf0,
    subkeys: [subkey],
  }

  const { smtRootHash, extensionSmtEntry } = await servicer.aggregator.generateExtSubkeySmt(extSubkeyReq)
  const cotaCellData = `0x02${smtRootHash}`
  const outputsData = [cotaCellData]

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
    i > 0 ? '0x' : { lock: '', inputType: `0xF0${extensionSmtEntry}`, outputType: '0x' },
  )

  const socialUnlockReq: SocialUnlockReq = {
    lockScript: serializeScript(ownerLock),
    friends,
  }

  const keys = friends.map(friend => keyFromPrivate(friend.privateKey))
  const signedTx = await signSocialTx(servicer, keys, socialMsg, socialUnlockReq, rawTx)
  console.info(JSON.stringify(signedTx))

  let cycles = await servicer.collector.getCkb().rpc.dryRunTransaction(signedTx)
  console.info(`Cycles: ${JSON.stringify(cycles)}`)

  let txHash = await servicer.collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Social recovery unlock tx has been sent with tx hash ${txHash}`)

  return txHash
}
