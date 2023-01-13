import { Collector } from '../src/collector'
import { sendCKBFromEthK1Lock } from '../src/service/transfer'
import { addressFromPrivateKey, SigAlg } from '../src/utils'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// const ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqfjsplqwsm75nmmal39jth7k2n4v4t2nlvty4750'

const TO_ADDRESS = 'ckt1qyq897k5m53wxzup078jwkucvvsu8kzv55rqqm6glm'

const run = async () => {
  const collector = new Collector({
    ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
    ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
  })
  const fromAddress = addressFromPrivateKey(MAIN_PRIVATE_KEY, SigAlg.Secp256k1)
  console.log('from address: ', fromAddress)
  await sendCKBFromEthK1Lock(collector, MAIN_PRIVATE_KEY, fromAddress, TO_ADDRESS, BigInt(20000000000))
}

run()
