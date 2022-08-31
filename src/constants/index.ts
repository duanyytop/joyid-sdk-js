export const FEE = BigInt(30000)
export const MIN_CAPACITY = BigInt(62) * BigInt(100000000)

const TestnetInfo = {
  JoyIDLockScript: {
    codeHash: '0x9302db6cc1344b81a5efee06962abcb40427ecfcbe69d471b01b2658ed948075',
    hashType: 'type',
    args: '',
  } as CKBComponents.Script,

  JoyIDLockDep: {
    outPoint: { txHash: '0xfa683440f605af7cc117755f8bcf6acec70fc4a69265602117810dfa41444159', index: '0x0' },
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
}

export const getJoyIDLockScript = (isMainnet = false) =>
  isMainnet ? MainnetInfo.JoyIDLockScript : TestnetInfo.JoyIDLockScript

export const getJoyIDCellDep = (isMainnet = false) => (isMainnet ? MainnetInfo.JoyIDLockDep : TestnetInfo.JoyIDLockDep)
