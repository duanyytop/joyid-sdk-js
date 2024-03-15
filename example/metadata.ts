import { Collector } from '../src'
import { FEE, JoyIDInfo } from '../src'
import { generateJoyIDInfoTx } from '../src/service'

const FROM_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
const FROM_ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9sfrkfah2cj79nyp7e6p283ualq8779rscnjmrj'

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
    deviceName: "Chrome on Windows",
    deviceType: "PC",
    cotaCellId: '0x0000000000000b6b',
    subKeys: [
      {
        pubKey:
          '0x124e48cf029c8a04788c02d7d88bad7b62918714137d0cd486b5b3aff53d0c2baecabd8d23107933f85fdf13cd814a0ba3d1848329b0504d7134a88962e9bde3',
        credentialId: '0x459d12c09a65e58e22a9d8d6fa843c3d',
        alg: '0x01',
        frontEnd: 'https:://app.joy.id',
        deviceName: "Firefox on Windows",
        deviceType: "PC",
      },
      {
        pubKey:
          '0x340e48cf029c8a04788c02d7d88bad7b62918714137d0cd486b5b3aff53d0c2baecabd8d23107933f85fdf13cd814a0ba3d1848329b0504d7134a88962e9bde8',
        credentialId: '0x369d12c09a65e58e22a9d8d6fa843c3d',
        alg: '0x01',
        frontEnd: 'https:://app.joy.id',
        deviceName: "Chrome on Windows",
        deviceType: "PC",
      },
      {
        pubKey:
          '0x560e48cf029c8a04788c02d7d88bad7b62918714137d0cd486b5b3aff53d0c2baecabd8d23107933f85fdf13cd814a0ba3d1848329b0504d7134a88962e9bde4',
        credentialId: '0x369d12c09a65e58e22a9d8d6fa843c3d',
        alg: '0x01',
        frontEnd: 'https:://app.joy.id',
        deviceName: "Safari on iOS",
        deviceType: "Mobile",
      },
    ],
  }

  await generateJoyIDInfoTx(collector, FROM_PRIVATE_KEY, FROM_ADDRESS, joyId, FEE, false)
}

run()
