import { UniswapV2Pair } from 'src/types/contracts/uniswap-v2-pair'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import uniswapPair from './abi/uniswap-v2-pair.json'

/**
 * Creates a Contract instance of the getUniswapV2PairContractInstance contract
 * @param {Web3} web3
 * @param {string} address
 */
export const getUniswapV2PairContractInstance = (web3: Web3, address: string): UniswapV2Pair => {
  return new web3.eth.Contract(uniswapPair as AbiItem[], address) as unknown as UniswapV2Pair
}
