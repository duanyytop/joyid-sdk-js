export const FEE = BigInt(6000)
export const MIN_CAPACITY = BigInt(62) * BigInt(100000000)
export const WITNESS_NATIVE_MODE = '01'
export const WITNESS_SUBKEY_MODE = '02'
export const WITNESS_SOCIAL_MODE = '03'
export const MODE_PUBKEY_SIG_LEN = (1 + 64 + 64) * 2

const TestnetInfo = {
  JoyIDLockScript: {
    codeHash: '0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac',
    hashType: 'type',
    args: '',
  } as CKBComponents.Script,

  JoyIDLockDep: {
    outPoint: { txHash: '0x069ae648ecc682caa52b1a6a5854ec3545a8513dd9681f452049a59be33465b0', index: '0x0' },
    depType: 'depGroup',
  } as CKBComponents.CellDep,

  CotaTypeScript: {
    codeHash: '0x89cd8003a0eaf8e65e0c31525b7d1d5c1becefd2ea75bb4cff87810ae37764d8',
    hashType: 'type',
    args: '0x',
  } as CKBComponents.Script,

  CotaTypeDep: {
    outPoint: { txHash: '0xd8c7396f955348bd74a8ed4398d896dad931977b7c1e3f117649765cd3d75b86', index: '0x0' },
    depType: 'depGroup',
  } as CKBComponents.CellDep,
}

const MainnetInfo = {
  JoyIDLockScript: {
    codeHash: '0x9302db6cc1344b81a5efee06962abcb40427ecfcbe69d471b01b2658ed948075',
    hashType: 'type',
    args: '',
  } as CKBComponents.Script,

  JoyIDLockDep: {
    outPoint: { txHash: '0xfa683440f605af7cc117755f8bcf6acec70fc4a69265602117810dfa41444159', index: '0x0' },
    depType: 'depGroup',
  } as CKBComponents.CellDep,

  CotaTypeScript: {
    codeHash: '0x1122a4fb54697cf2e6e3a96c9d80fd398a936559b90954c6e88eb7ba0cf652df',
    hashType: 'type',
    args: '0x',
  } as CKBComponents.Script,

  CotaTypeDep: {
    outPoint: { txHash: '0x875db3381ebe7a730676c110e1c0d78ae1bdd0c11beacb7db4db08e368c2cd95', index: '0x0' },
    depType: 'depGroup',
  } as CKBComponents.CellDep,
}

export const getJoyIDLockScript = (isMainnet = false) =>
  isMainnet ? MainnetInfo.JoyIDLockScript : TestnetInfo.JoyIDLockScript

export const getJoyIDCellDep = (isMainnet = false) => (isMainnet ? MainnetInfo.JoyIDLockDep : TestnetInfo.JoyIDLockDep)

export const getCotaTypeScript = (isMainnet = false) =>
  isMainnet ? MainnetInfo.CotaTypeScript : TestnetInfo.CotaTypeScript

export const getCotaCellDep = (isMainnet = false) => (isMainnet ? MainnetInfo.CotaTypeDep : TestnetInfo.CotaTypeDep)
