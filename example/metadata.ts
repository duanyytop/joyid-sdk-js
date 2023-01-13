import { Collector } from '../src'
import { FEE, JoyIDInfo } from '../src'
import { generateJoyIDInfoTx } from '../src/service'

const FROM_PRIVATE_KEY = '0xc5a991867f2406bfe6d17028bcc09492b4959ec55ef5812e5f5cf12b3529f7af'
const FROM_ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqy4amdm2f533gyrre3vuv4styyt7rlln3sxvqp4s'

const run = async () => {
  const collector = new Collector({
    ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
    ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
  })
  const joyId: JoyIDInfo = {
    name: 'Dylan',
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
          '0x650e48cf029c8a04788c02d7d88bad7b62918714137d0cd486b5b3aff53d0c2baecabd8d23107933f85fdf13cd814a0ba3d1848329b0504d7134a88962e9bde3',
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
      {
        pubKey:
          '0x290e48cf029c8a04788c02d7d88bad7b62918714137d0cd486b5b3aff53d0c2baecabd8d23107933f85fdf13cd814a0ba3d1848329b0504d7134a88962e9bde3',
        credentialId: '0x369d12c09a65e58e22a9d8d6fa843c3d',
        alg: '0x01',
        frontEnd: 'https:://app.joy.id',
      },
    ],
  }

  await generateJoyIDInfoTx(collector, FROM_PRIVATE_KEY, FROM_ADDRESS, joyId, FEE, false)
}

run()
