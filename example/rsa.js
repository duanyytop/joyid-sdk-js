const NodeRSA = require('node-rsa');
const {exportPubKey} = require('../lib/utils/rsa')
const { sha256 } = require('ethers/lib/utils')


const RSA_TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6HH82NIk1cm+OGE1mvNewjM4wJjwmI4lfctbY+6+5LGw9qfJ6jQX0/na8eSBQPnhooiTIqxNHKTarP5q9Ca4wih9ns4qOT6o9U00fsx4fgTLNArdVAETuhpbxgnfCnMZ/H7ktoacKVQQYArU1GGiWCSAgB47QOBW6dJlXlfPFSe29nIEPc+mm+UXW2xq/iZfxY9f92ALvMw84hoQv7CmpkAi1qw/8n+DD03ruxBZz0FI7fxgqY/vrKXqFu/0n7H2jAokTGKZHGUHwPNvLrDJ0P7Y1+h2/C1Y8n40EiEf+TutSWfhTUwnU5Rz82m4IMThSqxrj6QN2QXJ49wB56XObAgMBAAECggEAQaED8RL0oZ7RnNuQC98i9lSo7wzEoDRe4IRIJCsY6+Uw5EvWQIYTaDIFn+/cx79HyaoH66V8PldXumrK/8d2oBJNAc4r2YRZRZfm9fs9b6GpTucazEQ0iqJ2fwLhhYSwcKq4q9E57OhO8cKesPMDCol8RR81KtLkQqSUYHD2DgcpINaL1SFZNn9RcrOs53Ma1b27WOt+TivUDOLsAt9AvtVuzr5S2jUjnLVvNngGbmamotfuhDYAV9SzeYiwFOpfPnsw+4Lq7egWVXGfUZcR962xxzjvDaGuNUsif8rcTMxKl9aywYWfPNMUByeCmspbf+eWqp11VHWevrDVfyxQEQKBgQD5Ba6uzKb25dS3lkU3acigKHFKk5JXtSdraO0cEEcYHCqVJFBUBW3zZ0eMFQkFY4WJFJDGIy11A9w3LVvd3PbT2Hm/H5zXgzIAhCGS4YLmcBVn3Zrg8HHdlYxknUaJ57JjQceAtQ/RcidMdcGdx6IX+4sOTv99qEpyXT8Yn0OZ6wKBgQC/U4jEfXD8qMGGpcZFqoFl7Wsgfb37RkBGv7WTxSbvwTmAQqTRTjZSQSWH0oiPqnxu9LYtVr9JIh8P6T3TbeoO31O1DqbPYclmWQx4v9HkOygDdtIpHGt91kmktnGfbi0DSUdaAwzLhmPWAiRokOy5wFdVsdEagvS+cz5/UBLxEQKBgQDelXCtN6op2AcJzhyySjCUz3FsWnmdQgQpItGFmxsg9tQtGRdf8rZzsSYnlQnKMknC3IoHQJw6Eqg8/aM2rXJGqyEvb39OtyrzgSdNVZsehKLtgwwT8Xeluy2RJW9OhrZRuBMt/SlVafashjj44d8GFsYVlRETbWCV1rk2Ne1D3wKBgEsscTJy7y/2xoM3I15ADjOUQ2EyxrCx+5NQw/FZp2DQlN02UjgC+Qj8m9hv+kQogle+Qs4xpVsA0x+XTzmBmFNboDIlnZkiHNXf6yyOgdOhAqnJx+1rQzjgN3NGVAKGcZ0275gIVsCo/xUZJmEHgFvDnQ0IntZB2hPyh/3R4n9hAoGBAIZZHGa9X8PzspJUjyuvn2k/HQIj8hsymtCJPbzTc4NSqlIj2EfrN07WhoaT81bfZ4NGMgIE/2UCbk4iUJNJUJrg8UHQscIXJajd4pBESbVcPgPH2nbNpW5qKDrL5fWA4AGjoWqeGnnb1aUPMllS1rbjVdnb3RzVblre6V4lGNaD
-----END PRIVATE KEY-----`
const rsaSignVerify = () => {
    const key = new NodeRSA(RSA_TEST_PRIVATE_KEY);
    // const pubkey = key.exportKey('components-public');
    // console.log(pubkey.n.slice(1).toString('hex'));
    // console.log(pubkey.e);
    const pubkey = exportPubKey(key)
    // 010001009b73e97900f77872417603e9e31aab523831086edafc1ce5d4095353f85952eb4efe4788048d9f3c560bbf1dfa35b63f7432accbdb3cf0411947a618138902a37dec27fdbb857a29ebfb632a187f3b52d07316c4ee7ad3c3e09ffc0fabb50890a929ec2f8486380f33ef02d8fdd763f19789bf1adbd645f9a6e9730f819cbded49c5f395579974ba1538d08e0720200996681835b5021804550aa7a12db91f7fc69cc27782f19686ee440055b702cd32811f1eb31f4d533daa4f8e8ab3671f8a30ae09bd9a3fab36294713abc824a268783e502079bc76fef4058d7af2a93d6c2cb9affbd8d6725f8923263c2630ce8cb0d7bc664d188e6f72358934367f1cba
    console.log(pubkey)

    const message = "bf23720fff6daca1cc7b564703cd98b3fc8b7440a9c0d08a516c7dc08c4c7449"
    const signature = key.sign(Buffer.from(message, 'hex'), 'hex')
    console.log('signature: ', signature)


    const e = Buffer.from(pubkey.substring(0, 8), 'hex').reverse()
    const n = Buffer.from(pubkey.substring(8), 'hex').reverse()
    const verifyKey = new NodeRSA()
    verifyKey.importKey({ e, n }, 'components-public')
    verifyKey.setOptions({ signingScheme: 'pkcs1-sha256' })

    const result = verifyKey.verify(
        Buffer.from(message, 'hex'),
        Buffer.from(signature, 'hex')
    )
    console.log("RSA verify: ", result)
}


const sha256Hash = (message) => {
    const hash = sha256(Buffer.from(message, 'hex'), 'hex')
    return hash.substring(2)
}

const rsaVerify = () => {
    const message =
        "b6c062a17d8a430d9413ffc10a1e1d3389943ceadd8a5c5fed23804ebf1308ca05000000047b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a2255326c6e6269423061476c7a49475a76636942745a51222c226f726967696e223a2268747470733a2f2f6a6f7969642d6170702d6769742d666561742d72656d6f76652d6e616d652d6e657276696e612e76657263656c2e617070222c2263726f73734f726967696e223a66616c73657d";
    const authData = message.substring(0, 74);
    const clientData = message.substring(74);
    var msg = `${authData}${sha256Hash(clientData)}`
    console.log('msg: ', msg)

    const signature = '53c39ed6c5f28a8676f9cfbbc35d872f884b8e3b55167eada6a67200d3bc3e3d68b71b450b9a072ba482d0755f10d9eb63533351f135c58059bc9c64e68a94f8ddac84a728d5150ae6193fb110316b5d917c04d180c47ad7bc7119af683150a674b6022efbe94f32bd66b273e1e3b16b74a5a45d41a9f40e9ec05c0bfb9fc6848007819f4ebc19992aac2096f1d3df458f8ce60bd5cd81c6a986d757cd4dbcaa294c699c4025cb168cfd01c8740cacbd2c849776f427385ff9a226f046443e80629cfe88677a448993d9f63f15e1eb42aace5cde8120a4dc334b9d46e3f4386825c4fb1de9ffa9e10696b43784ed710ca8a2d516cd4bbc6eb8350bcb2b546b33'

    const pubkey = '01000100990405b0583fe4cb88f43e6997231f7598ee435eab83392b0afd172ffd29d69b5d30e740a892317eca46802527575ea87cb2a309a6d48f473332c64d08c6c0147a9bfa1c09b1f993ebab6885c29163d483a7564814ffca07928676e20b13317ae856588a1933e3e44f4a09d4c4754a9a85e5ebf6528d1c83c6ebdf716bc80ddc016d597c466d34471a1fc2c8918915e93d1aef4c92b2317b8cff8789f00633b552bba6ad09090a834ca552bebda7af1615d3900de2868c2a99159c73a6401073ce0780a4a27bc648c7b2d3e572412e7bf9dcc89824b48db16a0211b97c950b78dd52545c41f48b1f36ba7bf562d0a5518ec8ff707a94adc2ebe0770b364bc8b5'
    const e = Buffer.from(pubkey.substring(0, 6), 'hex').reverse()
    const n = Buffer.from(pubkey.substring(8), 'hex').reverse()
    const verifyKey = new NodeRSA()
    verifyKey.importKey({ e, n }, 'components-public')
    verifyKey.setOptions({ signingScheme: 'pkcs1-sha256' })

    const result = verifyKey.verify(
        Buffer.from(msg, 'hex'),
        Buffer.from(signature, 'hex')
    )
    console.log("RSA verify: ", result)
}

rsaVerify()


