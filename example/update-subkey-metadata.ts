import { addressFromPrivateKey, append0x, pubkeyFromPrivateKey } from '../src/utils'
import { updateSubkeyUnlockWithSubkey } from '../src/service/ext-subkey'
import { ExtSubKey, JoyIDInfo } from '../src/types'
import { blake160 } from '@nervosnetwork/ckb-sdk-utils'
import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// const ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9sfrkfah2cj79nyp7e6p283ualq8779rscnjmrj'

const EXIST_SUB_PRIVATE_KEY = '0x86f850ed0e871df5abb188355cd6fe00809063c6bdfd822f420f2d0a8a7c985d'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqxtqr7nemuyuq2dj6smff02mz64e3kv35vua0puz

// unlock with subkey mode and update new subkey
const run = async () => {
  const servicer = {
    collector: new Collector({
      ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
      ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
    }),
    aggregator: new Aggregator('http://127.0.0.1:3030'),
  }
  const address = addressFromPrivateKey(MAIN_PRIVATE_KEY)
  console.log('JOyID address: ', address)

  const newSubPrivateKey = '0x86f850ed0e871df5abb188355cd6fe00809063c6bdfd822f420f2d0a8a7c985d'
  const newSubPubkey = pubkeyFromPrivateKey(newSubPrivateKey)

  const subkeys: ExtSubKey[] = [
    {
      extData: 3,
      algIndex: 1,
      pubkeyHash: append0x(blake160(newSubPubkey, 'hex')),
    },
  ]

  const joyId: JoyIDInfo = {
    name: 'Dylan JoyID',
    description: 'Web3 Developer',
    avatar: 'https://i.loli.net/2021/04/29/IigbpOWP8fw9qDn.png',
    pubKey:
      '0x650e48cf029c8a04788c02d7d88bad7b62918714137d0cd486b5b3aff53d0c2baecabd8d23107933f85fdf13cd814a0ba3d1848329b0504d7134a88962e9bde3',
    credentialId: '0x459d12c09a65e58e22a9d8d6fa843c3d',
    alg: '0x01',
    frontEnd: 'https:://app.joy.id',
    cotaCellId: '0x0000000000000b6b',
    subKeys: [
      {
        pubKey:
          '0x86f850ed0e871df5abb188355cd6fe00809063c6bdfd822f420f2d0a8a7c985d',
        credentialId: '0x459d12c09a65e58e22a9d8d6fa843c3d',
        alg: '0x01',
        frontEnd: 'https:://app.joy.id',
      },
      {
        pubKey:
          '0x290e48cf029c8a04788c02d7d88bad7b62918714137d0cd486b5b3aff53d0c2baecabd8d23107933f85fdf13cd814a0ba3d1848329b0504d7134a88962e9bde3',
        credentialId: '0x369d12c09a65e58e22a9d8d6fa843c3d',
        alg: '0x01',
        frontEnd: 'https:://app.joy.id',
      },
    ],
  }

  const subkeyAlgIndex = 1

  await updateSubkeyUnlockWithSubkey(servicer, EXIST_SUB_PRIVATE_KEY, subkeyAlgIndex,  address, subkeys, joyId)
}

run()

