import { sigHashAll } from '../src/signature/sighash'

const run = () => {
    const raw_tx: CKBComponents.RawTransactionToSign = {
        version: "0x00",
        cellDeps: [
            {
                outPoint: {
                    txHash: "0xba9f322c1c8ca59b72df1e2dfaca3eda7d9da33b10dd92b798ac48da231c3c34",
                    index: "0x0",
                },
                depType: "depGroup",
            }
        ],
        headerDeps: [],
        inputs: [
            {
                previousOutput: {
                    txHash: "0x05d13dc2deb9bd9448fb808bf21475212279420064470fbb1d076debf39c50a5",
                    index: "0x0",
                },
                since: "0x0",
            }
        ],
        outputs: [
            {
                capacity: "0x2540be400",
                lock: {
                    codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                    hashType: "type",
                    args: "0x3f1573b44218d4c12a91919a58a863be415a2bc3",
                }
            },
            {
                capacity: "0xe680009580",
                lock: {
                    codeHash: "0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac",
                    hashType: "type",
                    args: "0x0001e9e1559321abf8f8d2401bc35d10b3a039fa2084",
                }
            }
        ],
        outputsData: ["0x", "0x"],
        witnesses: [{
            lock: "0x",
            inputType: "0x",
            outputType: "0x",
        }]
    }

    // sighash_all = 57975bc34ea17ab238a56f2acd412f9a2d92b5698ebe2f92814348d25dcb9cab
    sigHashAll(raw_tx)
}

run()