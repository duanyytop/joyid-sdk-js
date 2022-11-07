import axios from 'axios'
import { toCamelcase, toSnakeCase } from '../utils/case-parser'
import {
  BaseReq,
  ExtSubkeyReq,
  BaseResp,
  ExtSubkeyResp,
  SubkeyUnlockReq,
  SubkeyUnlockResp,
} from '../types/joyid'

export class Aggregator {
  private url: string

  constructor(url: string ) {
    this.url = url
  }

  private async baseRPC(method: string, req: BaseReq | undefined, url = this.url): Promise<BaseResp | undefined> {
    let payload = {
      id: payloadId(),
      jsonrpc: '2.0',
      method,
      params: req ? toSnakeCase(req) : null,
    }
    const body = JSON.stringify(payload, null, '')
    console.log(body)
    try {
      let response = (
        await axios({
          method: 'post',
          url,
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 3000000,
          data: body,
        })
      ).data
      if (response.error) {
        console.error(response)
      } else {
        return toCamelcase(response.result)
      }
    } catch (error) {
      console.error('error', error)
    }
  }


  async generateExtSubkeySmt(extension: ExtSubkeyReq): Promise<ExtSubkeyResp> {
    return (await this.baseRPC('generate_extension_subkey_smt', extension)) as Promise<ExtSubkeyResp>
  }

  async generateSubkeyUnlockSmt(extension: SubkeyUnlockReq): Promise<SubkeyUnlockResp> {
    return (await this.baseRPC('generate_subkey_unlock_smt', extension)) as Promise<SubkeyUnlockResp>
  }
}



const payloadId = () => Date.now()
