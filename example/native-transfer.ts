import { Collector } from '../src/collector'
import { sendCKBFromP256Lock } from '../src/service/transfer'
import { addressFromPrivateKey, pubkeyFromPrivateKey } from '../src/utils'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// const ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9sfrkfah2cj79nyp7e6p283ualq8779rscnjmrj'

const TO_ADDRESS = 'ckt1qyq897k5m53wxzup078jwkucvvsu8kzv55rqqm6glm'

const run = async () => {
  const collector = new Collector({
    ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
    ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
  })
  const fromAddress = addressFromPrivateKey(MAIN_PRIVATE_KEY)
  console.log('from address: ', fromAddress)
  await sendCKBFromP256Lock(collector, MAIN_PRIVATE_KEY, fromAddress, TO_ADDRESS, BigInt(20000000000))
}

run()
