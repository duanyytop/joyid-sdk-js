import { addressFromPrivateKey } from '../src/utils'
import { addExtensionSocial, updateExtensionSocial } from '../src/service/ext-social'
import { ExtSocial } from '../src/types'
import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'
import { addressToScript, serializeScript } from '@nervosnetwork/ckb-sdk-utils'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9sfrkfah2cj79nyp7e6p283ualq8779rscnjmrj

const FRIEND1_PRIVATE_KEY = '0xc5a991867f2406bfe6d17028bcc09492b4959ec55ef5812e5f5cf12b3529f7af'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq8250t2ye0eyy9nsvqd9v8vr4u2ykjda7qzkfwqs

const FRIEND2_PRIVATE_KEY = '0x00c0d02da53ebf3a26dfe5b17e09b5f107da19841aa3882e2a56cf84d4f22d1a'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqxwdy6ater88zs4lwve84mugnalk5dw9jq7zl9nt

const FRIEND3_PRIVATE_KEY = '0x6cb214ead13214df1c8ebdf14909152236430b8bb4271785994aeb1f32b92b04'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9u5cvdq4ac7wga7drf7p5d407vu0x64mulcptkx

const FRIEND4_PRIVATE_KEY = '0xd7d8106165aa18acf855fe3521d0c733ec6ad5afae2e1ff06687a0e790d02910'
//ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqx647vu0qp89npn9zvpwr33q5agwgfjr85svsmug

// unlock with native mode and add new social recovery config
const run = async () => {
  const servicer = {
    collector: new Collector({
      ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
      ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
    }),
    aggregator: new Aggregator('http://127.0.0.1:3030'),
  }

  const address = addressFromPrivateKey(MAIN_PRIVATE_KEY)

  const friend1 = serializeScript(addressToScript(addressFromPrivateKey(FRIEND1_PRIVATE_KEY)))
  const friend2 = serializeScript(addressToScript(addressFromPrivateKey(FRIEND2_PRIVATE_KEY)))
  const friend3 = serializeScript(addressToScript(addressFromPrivateKey(FRIEND3_PRIVATE_KEY)))
  const friend4 = serializeScript(addressToScript(addressFromPrivateKey(FRIEND4_PRIVATE_KEY)))

  const social: ExtSocial = {
    recoveryMode: 0,
    must: 2,
    total: 4,
    signers: [friend1, friend2, friend3, friend4],
  }
  await updateExtensionSocial(servicer, MAIN_PRIVATE_KEY, address, social)
}

run()
