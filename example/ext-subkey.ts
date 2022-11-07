import { addressFromPrivateKey, append0x, pubkeyFromPrivateKey } from '../src/utils'
import {addExtensionSubkey} from '../src/service/extension'
import { ExtSubKey } from '../src/types'
import { blake160 } from '@nervosnetwork/ckb-sdk-utils'
import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'

const FROM_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// const FROM_ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqxh8tenxnx686mqh34wjs2hwjhenczg90c3e06au'

// unlock with native mode and add new subkey
const run = async () => {
  const servicer = {
    collector: new Collector({ ckbNodeUrl: 'https://testnet.ckb.dev/rpc', ckbIndexerUrl: 'https://testnet.ckb.dev/indexer' }), 
    aggregator: new Aggregator("http://127.0.0.1:3030")
  }
  const fromAddress = addressFromPrivateKey(FROM_PRIVATE_KEY)
  console.log('from address: ', fromAddress)

  const subkeyPrivateKey = "0x7b9d3f2f356ead86d5f04fc90e8096d706247027c349ac75357094459d8724b9"
  const subkeyPubkey = pubkeyFromPrivateKey(subkeyPrivateKey)

  // subkey address:  ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqxj8ne5hhgd0fr0htvyskqc935zkejs09c5ugqw6
  const subkeyAddress = addressFromPrivateKey(subkeyPrivateKey)
  console.log('subkey address: ', subkeyAddress)
  const subkeys: ExtSubKey[] = [{
    ext_data: 1,
    alg_index: 1,
    pubkey_hash: append0x(blake160(subkeyPubkey, 'hex'))
  }]
  await addExtensionSubkey(servicer, FROM_PRIVATE_KEY, fromAddress, subkeys)
}

run()
