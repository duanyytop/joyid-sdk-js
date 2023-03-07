import { addressFromPemKey, addressFromPrivateKey, SigAlg } from '../src/utils'
import { addExtensionSocial, updateExtensionSocial } from '../src/service/ext-social'
import { ExtSocial } from '../src/types'
import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'
import { addressToScript, serializeScript } from '@nervosnetwork/ckb-sdk-utils'

const MAIN_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq9sfrkfah2cj79nyp7e6p283ualq8779rscnjmrj

// secp256r1
const FRIEND1_PRIVATE_KEY = '0xc5a991867f2406bfe6d17028bcc09492b4959ec55ef5812e5f5cf12b3529f7af'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq8250t2ye0eyy9nsvqd9v8vr4u2ykjda7qzkfwqs

// secp256k1
const FRIEND2_PRIVATE_KEY = '0x4271c23380932c74a041b4f56779e5ef60e808a127825875f906260f1f657761'
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqfjsplqwsm75nmmal39jth7k2n4v4t2nlvty4750

// rsa2048
const FRIEND3_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2BbnAeCcYCWUf
F93Gf74LcJSxDPgttyAxe3SdEtSWVpb7IqeWeqr64EHiDld9NusW5gRc7FeYdhG3
jlGbqOvVPBNZuQGFJzZ7hBUJgbd1oQf9Sd2MS0VPW/cODCAGo0UZPmN8PAR+XfYy
ZsnpkuEobfb7vumOSGFTUXR5rA9LKyYtFAs6mWNNQ4pZm+M4iH7IMmy55/tqxAIq
EiKiaZArkCk0J0VxA5WMrVfSjwfGiXw3rvrw4RNgUWLNhFeGN8lRqDt4tVRgqw7g
Zpe5xvMTXrC2uLyuGR2SQjj6TMSY1IzZdebIXvXH1CqzMFpZeLsLZGXJ7DUQIX9U
wc6ftmcjAgMBAAECggEAS2nO3lvJkq9dyoaYV2PYiKPRrxMZBdO/zlCAbY1+L3Vb
o1vlxDY5fayJD0/y1ol42ClfeGJhHmUYjQy1agEQCG4V9E/uvcyTyZPdJW2tZVpc
1YeTd0s+QZVwI81JPYbKm51aGYBCOlrSpGoq0I+OorIAqKed21nInPz7/WcYhQL9
4alJdZ3eNHR+F9UYL5ZA9qY969sNLTzYiHrFjwaocTXHRPzqMxYKsl/LvykOlZLh
8A9niPFSKVIP7GRBrfPCf6EW3ig0+uq/lZLN5bHIAipDh6B/30H3LVPzW6NjUtcg
b/mOI+KzMtiPlEcIJEJxWUAbqk7PtxOpqiqHY+sjRQKBgQDlPR5c8O63zF4PvZDS
Eud39ynEXBJ/pLMLDO6qo+vH5p3u3QKO414ex9GNK45A2EBOLcBxjExsUN2aLKcO
UCMTqwgCFDgieX+HCjbwX+VReCXbPOsQXb5w1bWTFiOJMqWlP2lpZpHXArd9+qnD
Pmhf6M6u0jN9WdQ4daOu2iz9/QKBgQDLRYdZvH6lgQzTw7hcxOQnt547LWMg0Rx5
f5qmjqzaYKKEYesLJx3lwRGICGwMldg7+DQXsdFuQQJ5Essd+xk1EdowYHeaSovP
yjVo8OHYoUbulY4c2f0wk/9UzFfROJMa9NQc0skztHWVZs9rXFbloRan7jCY66qy
6nx9oBxznwKBgF4NwoxtifQ9VIZux6F5giDVdvyKrkhSwecRykaW9OFSvI/JfAg2
P2Kvp0mdikMOtuucl+2+m4iBcTqVgYE83fdu391CgHmckfdM+JeNMOBJRHb8OpG/
dKiE9ne/yJq8/fub1dsZ61JlWfXFR6vEyjw3n71YnymaFpmHor3V5EndAoGAZ81i
uA2M8wF6xm1NKXqWND4NPJUJ6QlALD9gfyue04nDlCzYtYJNPzWfuULrwmWG3eD6
4Rq6Iz5pf+B7/xxqG/K45Dlu+kiVKxBMxAE2o8SAD3gp8UvUgskg+3G6aqokXQCn
jOyLOK8v2JJ+24l1CqB/jFQTVxQJwIID/rcTsGsCgYAyAxp35Mqk720dItGsTpQ3
pTQ1kpjksDPq2p3T/G/ojhJIyRyqPnvrytJjTbED9oEA150+IWw5E05RfIcn9tDg
+jMICgNdjOFoEYPEsYdnR/T906kXMqAcGFDguQrVVr20U6scW3dXS8TXOw3/xUX0
+D5xeVBcZFflqR3zh+/QAw==
-----END PRIVATE KEY-----
`
// ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq03dwzcucjtl5qcg72kxx9euah4avhq3dvsstzgn

const FRIEND4_PRIVATE_KEY = '0xd7d8106165aa18acf855fe3521d0c733ec6ad5afae2e1ff06687a0e790d02910'
//ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqx647vu0qp89npn9zvpwr33q5agwgfjr85svsmug

// unlock with native mode and add new social recovery config
const run = async () => {
  const servicer = {
    collector: new Collector({
      ckbNodeUrl: 'http://127.0.0.1:8114',
      ckbIndexerUrl: 'http://127.0.0.1:8114',
    }),
    aggregator: new Aggregator('http://127.0.0.1:3030'),
  }

  const address = addressFromPrivateKey(MAIN_PRIVATE_KEY)

  const friend1 = serializeScript(addressToScript(addressFromPrivateKey(FRIEND1_PRIVATE_KEY, SigAlg.Secp256r1)))
  const friend2 = serializeScript(addressToScript(addressFromPrivateKey(FRIEND2_PRIVATE_KEY, SigAlg.Secp256k1)))
  const friend3 = serializeScript(addressToScript(addressFromPemKey(FRIEND3_PRIVATE_KEY)))
  const friend4 = serializeScript(addressToScript(addressFromPrivateKey(FRIEND4_PRIVATE_KEY, SigAlg.Secp256r1)))

  const social: ExtSocial = {
    recoveryMode: 0,
    must: 3,
    total: 4,
    signers: [friend1, friend2, friend3, friend4],
  }
  await updateExtensionSocial(servicer, MAIN_PRIVATE_KEY, address, social)
}

run()
