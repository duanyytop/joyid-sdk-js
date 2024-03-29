import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'
import { addressFromPrivateKey, pubkeyFromPrivateKey, SigAlg } from '../src/utils'
import { sendCKBWithSubkeyUnlock } from '../src/service/subkey'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// const ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqfjsplqwsm75nmmal39jth7k2n4v4t2nlvty4750'

const SUB_PRIVATE_KEY = '0x7b9d3f2f356ead86d5f04fc90e8096d706247027c349ac75357094459d8724b9'

const TO_ADDRESS = 'ckt1qyq897k5m53wxzup078jwkucvvsu8kzv55rqqm6glm'

// unlock with subkey and transfer ckb to another address
const run = async () => {
  const servicer = {
    collector: new Collector({
      ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
      ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
    }),
    aggregator: new Aggregator('https://cota.nervina.dev/aggregator'),
  }
  const fromAddress = addressFromPrivateKey(MAIN_PRIVATE_KEY, SigAlg.Secp256k1)
  console.log('from address: ', fromAddress)

  const subPubkey = pubkeyFromPrivateKey(SUB_PRIVATE_KEY, SigAlg.Secp256k1)
  console.log('subkey pubkey: ', subPubkey)

  const subkeyAlgIndex = 2

  await sendCKBWithSubkeyUnlock(servicer, SUB_PRIVATE_KEY, subkeyAlgIndex, fromAddress, TO_ADDRESS, BigInt(20000000000), SigAlg.Secp256k1)
}

run()
