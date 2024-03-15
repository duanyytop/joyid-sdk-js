import { addressFromPrivateKey, append0x, keccak160, pubkeyFromPrivateKey, SigAlg } from '../src/utils'
import { addExtensionSubkey } from '../src/service/ext-subkey'
import { ExtSubKey } from '../src/types'
import { blake160 } from '@nervosnetwork/ckb-sdk-utils'
import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// const ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqfjsplqwsm75nmmal39jth7k2n4v4t2nlvty4750'

// unlock with native mode and add new subkey
const run = async () => {
  const servicer = {
    collector: new Collector({
      ckbNodeUrl: 'http://127.0.0.1:8114',
      ckbIndexerUrl: 'http://127.0.0.1:8114',
    }),
    aggregator: new Aggregator('http://127.0.0.1:3030'),
  }
  const address = addressFromPrivateKey(MAIN_PRIVATE_KEY, SigAlg.Secp256k1)
  console.log('from address: ', address)

  const subkeyPrivateKey = '0x7b9d3f2f356ead86d5f04fc90e8096d706247027c349ac75357094459d8724b9'
  // ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqfljw7rywcdunzjxjtagdfz3rfv6hc0keuwev6rf
  const subkeyPubkey = pubkeyFromPrivateKey(subkeyPrivateKey, SigAlg.Secp256k1)

  const subkeys: ExtSubKey[] = [
    {
      extData: 5,
      algIndex: 2,
      pubkeyHash: append0x(keccak160(subkeyPubkey)),
    },
  ]
  await addExtensionSubkey(servicer, MAIN_PRIVATE_KEY, address, subkeys, SigAlg.Secp256k1)
}

run()
