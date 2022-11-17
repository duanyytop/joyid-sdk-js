import { addressFromPrivateKey } from '../src/utils'
import { addExtensionSocial } from '../src/service/ext-social'
import { ExtSocial } from '../src/types'
import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'
import { addressToScript, serializeScript } from '@nervosnetwork/ckb-sdk-utils'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqxh8tenxnx686mqh34wjs2hwjhenczg90c3e06au

const FRIEND1_PRIVATE_KEY = '0xc5a991867f2406bfe6d17028bcc09492b4959ec55ef5812e5f5cf12b3529f7af'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqy4amdm2f533gyrre3vuv4styyt7rlln3sxvqp4s

const FRIEND2_PRIVATE_KEY = '0x00c0d02da53ebf3a26dfe5b17e09b5f107da19841aa3882e2a56cf84d4f22d1a'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq8ll46ahjas4w050sf92y9suhwq22369qurt5duz

const FRIEND3_PRIVATE_KEY = '0x6cb214ead13214df1c8ebdf14909152236430b8bb4271785994aeb1f32b92b04'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqygya2rhxguszwws30edsdwww39gr2t2e5hsqyuy

// unlock with native mode and add new social recovery config
const run = async () => {
  const servicer = {
    collector: new Collector({ ckbNodeUrl: 'https://testnet.ckb.dev/rpc', ckbIndexerUrl: 'https://testnet.ckb.dev/indexer' }), 
    aggregator: new Aggregator("http://127.0.0.1:3030")
  }

  const address = addressFromPrivateKey(MAIN_PRIVATE_KEY)

  const friend1 = serializeScript(addressToScript(addressFromPrivateKey(FRIEND1_PRIVATE_KEY)))
  const friend2 = serializeScript(addressToScript(addressFromPrivateKey(FRIEND2_PRIVATE_KEY)))
  const friend3 = serializeScript(addressToScript(addressFromPrivateKey(FRIEND3_PRIVATE_KEY)))

  const social: ExtSocial = {
    recoveryMode: 0,
    must: 2,
    total: 3,
    signers: [friend1, friend2, friend3]
  }
  await addExtensionSocial(servicer, MAIN_PRIVATE_KEY, address, social)
}

run()
