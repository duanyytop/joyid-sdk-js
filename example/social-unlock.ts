import { addressFromPrivateKey, append0x, pubkeyFromPrivateKey } from '../src/utils'
import { socialUnlockTx } from '../src/service/social'
import { ExtSocial, ExtSubKey, SocialFriend } from '../src/types'
import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'
import { addressToScript, blake160, blake2b, scriptToHash, serializeScript } from '@nervosnetwork/ckb-sdk-utils'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqxh8tenxnx686mqh34wjs2hwjhenczg90c3e06au
const MAIN_NEW_SUB_PRIVATE_KEY = '0xb1649d08186366204397fe4348cb3f70508fb33d6fd4eca6405c503ed83dd713'


const FRIEND1_PRIVATE_KEY = '0xc5a991867f2406bfe6d17028bcc09492b4959ec55ef5812e5f5cf12b3529f7af'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqy4amdm2f533gyrre3vuv4styyt7rlln3sxvqp4s
const FRIEND1_SUBKEY_PRIVATE_KEY = '0x7b9d3f2f356ead86d5f04fc90e8096d706247027c349ac75357094459d8724b9'


const FRIEND2_PRIVATE_KEY = '0x00c0d02da53ebf3a26dfe5b17e09b5f107da19841aa3882e2a56cf84d4f22d1a'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq8ll46ahjas4w050sf92y9suhwq22369qurt5duz

const FRIEND3_PRIVATE_KEY = '0x6cb214ead13214df1c8ebdf14909152236430b8bb4271785994aeb1f32b92b04'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqygya2rhxguszwws30edsdwww39gr2t2e5hsqyuy

const FRIEND4_PRIVATE_KEY = '0xd7d8106165aa18acf855fe3521d0c733ec6ad5afae2e1ff06687a0e790d02910'

// unlock with native mode and add new social recovery config
const run = async () => {
  const servicer = {
    collector: new Collector({
      ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
      ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
    }),
    aggregator: new Aggregator('http://127.0.0.1:3030'),
  }

  const ownerAddress = addressFromPrivateKey(MAIN_PRIVATE_KEY)
  console.log('owner lock hash', scriptToHash(addressToScript(ownerAddress)))
  const newSubPubkey = pubkeyFromPrivateKey(MAIN_NEW_SUB_PRIVATE_KEY)

  const friend1Address = addressFromPrivateKey(FRIEND1_PRIVATE_KEY)
  const friend1SubPubkey = pubkeyFromPrivateKey(FRIEND1_SUBKEY_PRIVATE_KEY)
  const friend1Lock = serializeScript(addressToScript(friend1Address))

  const friend2Address = addressFromPrivateKey(FRIEND2_PRIVATE_KEY)
  const friend2Pubkey = pubkeyFromPrivateKey(FRIEND2_PRIVATE_KEY)
  const friend2Lock = serializeScript(addressToScript(friend2Address))

  const friends: SocialFriend[] = [
    {
      lockScript: friend1Lock,
      pubkey: friend1SubPubkey,
      unlockMode: 2,
      algIndex: 1,
      privateKey: FRIEND1_SUBKEY_PRIVATE_KEY,
      address: friend1Address,
    },
    {
      lockScript: friend2Lock,
      pubkey: friend2Pubkey,
      unlockMode: 1,
      algIndex: 1,
      privateKey: FRIEND2_PRIVATE_KEY,
      address: friend2Address,
    },
  ]

  const subkey: ExtSubKey = {
    extData: 3,
    algIndex: 1,
    pubkeyHash: append0x(blake160(newSubPubkey, 'hex')),
  }
  await socialUnlockTx(servicer, ownerAddress, friends, subkey)
}

run()
