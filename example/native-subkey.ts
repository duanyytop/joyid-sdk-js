import { addressFromPrivateKey, append0x, pubkeyFromPrivateKey } from '../src/utils'
import {addExtensionSubkey} from '../src/service/ext-subkey'
import { ExtSubKey } from '../src/types'
import { blake160 } from '@nervosnetwork/ckb-sdk-utils'
import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// const ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqxh8tenxnx686mqh34wjs2hwjhenczg90c3e06au'

// unlock with native mode and add new subkey
const run = async () => {
  const servicer = {
    collector: new Collector({ ckbNodeUrl: 'https://testnet.ckb.dev/rpc', ckbIndexerUrl: 'https://testnet.ckb.dev/indexer' }), 
    aggregator: new Aggregator("http://127.0.0.1:3030")
  }
  const address = addressFromPrivateKey(MAIN_PRIVATE_KEY)
  console.log('from address: ', address)

  const subkeyPrivateKey = "0x7b9d3f2f356ead86d5f04fc90e8096d706247027c349ac75357094459d8724b9"
  const subkeyPubkey = pubkeyFromPrivateKey(subkeyPrivateKey)

  const subkeys: ExtSubKey[] = [{
    extData: 1,
    algIndex: 1,
    pubkeyHash: append0x(blake160(subkeyPubkey, 'hex'))
  }]
  await addExtensionSubkey(servicer, MAIN_PRIVATE_KEY, address, subkeys)
}

run()
