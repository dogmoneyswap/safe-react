import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import multicall2 from './abi/multicall2.json'
import { Multicall2 } from 'src/types/contracts/multicall2'

export const MULTICALL2_ADDRESS: any = {
  10000: '0x3718e9C405D0bC779870355C34fb5624196A1cAA',
  10001: '0xAF15A45d934a83b95daCFEbaACCaED8cF97e8200',
}

/**
 * Creates a Contract instance of the getMulticallContractInstance contract
 * @param {Web3} web3
 * @param {ChainId} chainId
 */
export const getMulticallContractInstance = async (web3: Web3): Promise<Multicall2> => {
  const chainId = await web3.eth.getChainId()
  return new web3.eth.Contract(multicall2 as AbiItem[], MULTICALL2_ADDRESS[chainId]) as unknown as Multicall2
}

export const tryMulticall = async (web3: Web3, calls: any[], requireSuccess = false) => {
  const contract = await getMulticallContractInstance(web3)

  const callRequests = calls.map((call: any) => {
    const callData = call.encodeABI()
    return [call._parent._address, callData] as [string, string]
  })

  const returnData = await contract.methods.tryAggregate(requireSuccess, callRequests).call()

  return returnData.map(([success, hex], index: number) => {
    const types = calls[index]._method.outputs.map((o: any) =>
      o.internalType !== o.type && o.internalType !== undefined ? o : o.type,
    )

    let result = web3.eth.abi.decodeParameters(types, hex)

    delete result.__length__

    result = Object.values(result)

    return [success, result.length === 1 ? result[0] : result]
  })
}

export const multicall = async (web3: Web3, calls: any[]) => {
  const result = await tryMulticall(web3, calls, true)
  return result.map((val) => val[1])
}
