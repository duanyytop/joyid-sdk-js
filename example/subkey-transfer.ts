import { ExtSubKey } from '../src/types'
import { blake160 } from '@nervosnetwork/ckb-sdk-utils'
import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'
import { addressFromPrivateKey, append0x, pubkeyFromPrivateKey } from '../src/utils'
import { sendCKBWithSubkeyUnlock } from '../src/service/subkey'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// const ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9sfrkfah2cj79nyp7e6p283ualq8779rscnjmrj'

const SUB_PRIVATE_KEY = '0x7b9d3f2f356ead86d5f04fc90e8096d706247027c349ac75357094459d8724b9'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq8tv475fc6j26u67ghme8zea433ujf3ftqqhxzdc

const TO_ADDRESS = 'ckt1qyq897k5m53wxzup078jwkucvvsu8kzv55rqqm6glm'

// unlock with subkey and transfer ckb to another address
const run = async () => {
  const servicer = {
    collector: new Collector({
      ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
      ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
    }),
    aggregator: new Aggregator('http://127.0.0.1:3030'),
  }
  const fromAddress = addressFromPrivateKey(MAIN_PRIVATE_KEY)
  console.log('from address: ', fromAddress)

  const subPubkey = pubkeyFromPrivateKey(SUB_PRIVATE_KEY)
  console.log('subkey pubkey: ', subPubkey)

  const subkeyAlgIndex = 1

  await sendCKBWithSubkeyUnlock(servicer, SUB_PRIVATE_KEY, subkeyAlgIndex, fromAddress, TO_ADDRESS, BigInt(20000000000))
}

run()
