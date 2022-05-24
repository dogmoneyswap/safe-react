import { MasterChef } from 'src/types/contracts/MasterChef'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import masterChef from './abi/masterChef.json'

/**
 * Creates a Contract instance of the getMasterChefContractInstance contract
 * @param {Web3} web3
 * @param {ChainId} chainId
 */
export const getMasterChefContractInstance = async (web3: Web3, address: string): Promise<MasterChef> => {
  return new web3.eth.Contract(masterChef as AbiItem[], address) as unknown as MasterChef
}
