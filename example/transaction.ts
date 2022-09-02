import { Collector } from '../src/collector'
import { sendCKBFromP256Lock } from '../src/service'
import { addressFromPrivateKey } from '../src/utils'

const FROM_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
const TO_ADDRESS = 'ckt1qyq897k5m53wxzup078jwkucvvsu8kzv55rqqm6glm'

const run = async () => {
  const collector= new Collector({ ckbNodeUrl: 'https://testnet.ckb.dev/rpc', ckbIndexerUrl: 'https://testnet.ckb.dev/indexer' })
  const from_address = addressFromPrivateKey(FROM_PRIVATE_KEY)
  console.log('from address: ', from_address)
  await sendCKBFromP256Lock(collector, FROM_PRIVATE_KEY, from_address, TO_ADDRESS, BigInt(20000000000))
}

run()
