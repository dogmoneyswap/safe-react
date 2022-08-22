import { SafeBalanceResponse, TokenInfo, TokenType } from '@gnosis.pm/safe-react-gateway-sdk'
import BigNumber from 'bignumber.js'
import { List } from 'immutable'
import { useState, useEffect } from 'react'
import { getMasterChefContractInstance } from 'src/logic/contracts/masterChefContract'
import { multicall } from 'src/logic/contracts/multicallContract'
import { getUniswapV2PairContractInstance } from 'src/logic/contracts/uniswapV2PairContract'
import useSafeAddress from 'src/logic/currentSession/hooks/useSafeAddress'
import { getWeb3ReadOnly } from 'src/logic/wallets/getWeb3'
import { humanReadableValue } from '../../utils/humanReadableValue'
import { makeToken, Token } from '../model/token'
import { getERC20TokenContract } from './fetchTokens'

const tokenInfoCache = {}
export const getTokenInfo = async (address: string): Promise<TokenInfo> => {
  if (!tokenInfoCache[address]) {
    const web3 = getWeb3ReadOnly()
    const erc20Contract = getERC20TokenContract(address)
    const result = await multicall(web3, [
      erc20Contract.methods.decimals(),
      erc20Contract.methods.name(),
      erc20Contract.methods.symbol(),
    ])
    const tokenInfo = {
      type: TokenType.ERC20,
      address: address,
      decimals: parseInt(result[0]),
      name: result[1],
      symbol: result[2],
      logoUri: `https://assets.safe.dogmoney.money/tokens/logos/${address}.png`,
    } as TokenInfo
    tokenInfoCache[address] = tokenInfo
  }
  return tokenInfoCache[address]
}

const lpTokenInfoCache = {}
export const getLpTokenInfo = async (address: string): Promise<any> => {
  if (!lpTokenInfoCache[address]) {
    const web3 = getWeb3ReadOnly()
    const contract = getUniswapV2PairContractInstance(web3, address)
    const lpTokenInfo = await multicall(web3, [
      contract.methods.token0(),
      contract.methods.token1(),
      contract.methods.getReserves(),
      contract.methods.totalSupply(),
    ])
    lpTokenInfoCache[address] = lpTokenInfo
  }
  return JSON.parse(JSON.stringify(lpTokenInfoCache[address]))
}

const nonLpTokens: Array<string> = []
// modifies tokens in-place
export const fetchLpTokenInfo = async (tokenCurrenciesBalances: SafeBalanceResponse) => {
  const filteredTokens = tokenCurrenciesBalances.items.filter((token) => !nonLpTokens.includes(token.tokenInfo.address))
  const results = await Promise.allSettled(
    filteredTokens.map(async (token) => {
      const lpTokenInfo = await getLpTokenInfo(token.tokenInfo.address)
      return await Promise.all([
        token.tokenInfo.address,
        getTokenInfo(lpTokenInfo[0]),
        getTokenInfo(lpTokenInfo[1]),
        lpTokenInfo[2],
        lpTokenInfo[3],
      ])
    }),
  )

  filteredTokens.forEach((val, idx) => {
    if (results[idx].status === 'rejected') {
      nonLpTokens.push(val.tokenInfo.address)
      return
    }
    const settled = results[idx] as any

    const userReserves = {}
    ;['0', '1', 'reserve0', 'reserve1'].forEach((id) => {
      userReserves[id] = new BigNumber(settled.value[3][id])
        .multipliedBy(val.balance)
        .dividedToIntegerBy(settled.value[4])
        .toString()
    })

    val.tokenInfo = {
      ...val.tokenInfo,
      ...{
        isLpToken: true,
        token0: settled.value[1],
        token1: settled.value[2],
        reserves: userReserves,
      },
    } as any
  })
}

export const getMasterChefPoolBalances = async (
  chefAddress: string,
  safeAddress: string,
): Promise<SafeBalanceResponse> => {
  const web3 = getWeb3ReadOnly()
  const masterChef = await getMasterChefContractInstance(web3, chefAddress)
  const poolLength = await masterChef.methods.poolLength().call()
  const poolIndices = Array.from(Array(Number(poolLength)).keys())
  const poolInfos = await multicall(
    web3,
    poolIndices.map((poolIndex) => masterChef.methods.poolInfo(poolIndex)),
  )
  const userBalances = await multicall(
    web3,
    poolIndices.map((poolIndex) => masterChef.methods.userInfo(poolIndex, safeAddress)),
  )

  const positions = userBalances
    .map(([stakedAmount], index) => {
      if (stakedAmount !== '0') {
        const [lpToken] = poolInfos[index]
        return [lpToken, stakedAmount]
      }
      return null
    })
    .filter((val) => !!val) as any[]

  const result = {} as SafeBalanceResponse
  result.items = await Promise.all(
    positions.map(async (position) => ({
      balance: position[1],
      fiatBalance: '',
      fiatConversion: '0.',
      tokenInfo: await getTokenInfo(position[0]),
    })),
  )

  await fetchLpTokenInfo(result)
  result.items = await Promise.all(
    result.items.map(async (item: any) => {
      const url = (address: string) =>
        `https://api.coingecko.com/api/v3/simple/token_price/dogechain?contract_addresses=${address}&vs_currencies=usd`
      const prices = await Promise.all(
        [item.tokenInfo.token0.address, item.tokenInfo.token1.address].map(async (address: string) => {
          const response = await fetch(url(address))
          const json = await response.json()
          return json[address.toLowerCase()]?.usd
        }),
      )

      const hasPrice = prices.some((price) => !!price)
      if (hasPrice) {
        const [price, info, tokenBalance] = !!prices[0]
          ? [prices[0], item.tokenInfo.token0, item.tokenInfo.reserves[0]]
          : [prices[1], item.tokenInfo.token1, item.tokenInfo.reserves[1]]
        item.fiatBalance = new BigNumber(tokenBalance)
          .dividedBy(10 ** info.decimals)
          .times(parseFloat(price))
          .times(2)
          .toFixed(2)
        item.fiatConversion = new BigNumber(10 ** info.decimals).times(parseFloat(price)).toFixed(2)
      }
      return item
    }),
  )
  result.fiatTotal = result.items
    .reduce((val, prev) => new BigNumber(prev.fiatBalance).plus(val), new BigNumber(0))
    .toFixed(2)

  return result
}

export const getMasterChefStakedTokens = async (
  masterChefAddress: string,
  safeAddress: string,
): Promise<List<Token>> => {
  if (!masterChefAddress) {
    return List<Token>()
  }

  const balances = await getMasterChefPoolBalances(masterChefAddress, safeAddress)
  const tokens = balances.items.map((item) => {
    const token = makeToken({ ...item.tokenInfo }).set('balance', {
      tokenBalance: humanReadableValue(item.balance, Number(item.tokenInfo.decimals)),
      fiatBalance: item.fiatBalance,
    })
    return token
  })
  return List<Token>(tokens)
}

// requires sushi token to be listed on coingecko
export const getSushiBarBalance = async (
  sushiTokenAddress: string,
  xSushiTokenAddress: string,
  safeAddress: string,
): Promise<SafeBalanceResponse> => {
  const web3 = getWeb3ReadOnly()

  const sushiContract = await getERC20TokenContract(sushiTokenAddress)
  const xSushiContract = await getERC20TokenContract(xSushiTokenAddress)
  const xSushiStaked = xSushiContract.methods.balanceOf(safeAddress)
  const sushiInBar = sushiContract.methods.balanceOf(xSushiTokenAddress)
  const xSushiTotalSupply = xSushiContract.methods.totalSupply()
  const sushiDecimals = sushiContract.methods.decimals()

  const multicallResult = await multicall(web3, [xSushiStaked, sushiInBar, xSushiTotalSupply, sushiDecimals])

  if (multicallResult[0] === '0') {
    return {
      fiatTotal: '0',
      items: [],
    } as SafeBalanceResponse
  }

  const rawBalance = new BigNumber(multicallResult[0]).times(multicallResult[1]).dividedToIntegerBy(multicallResult[2])
  const sushiBalance = rawBalance.dividedBy(10 ** multicallResult[3])

  const url = (address: string) =>
    `https://api.coingecko.com/api/v3/simple/token_price/dogechain?contract_addresses=${address}&vs_currencies=usd`
  const response = await fetch(url(sushiTokenAddress))
  const json = await response.json()
  const price = json[sushiTokenAddress.toLowerCase()]?.usd

  return {
    fiatTotal: sushiBalance.times(price).toFixed(2),
    items: [
      {
        balance: multicallResult[0],
        fiatBalance: sushiBalance.times(price).toFixed(2),
        fiatConversion: sushiBalance
          .times(price)
          .dividedBy(multicallResult[0])
          .dividedBy(10 ** multicallResult[3])
          .toFixed(2),
        tokenInfo: await getTokenInfo(xSushiTokenAddress),
      },
    ],
  } as SafeBalanceResponse
}

export const getSushiBarStakedTokens = async (
  sushiTokenAddress: string,
  xSushiTokenAddress: string,
  safeAddress: string,
): Promise<List<Token>> => {
  if (!sushiTokenAddress || !xSushiTokenAddress) {
    return List<Token>()
  }

  const balances = await getSushiBarBalance(sushiTokenAddress, xSushiTokenAddress, safeAddress)
  const tokens = balances.items.map((item) => {
    const token = makeToken({ ...item.tokenInfo }).set('balance', {
      tokenBalance: humanReadableValue(item.balance, Number(item.tokenInfo.decimals)),
      fiatBalance: item.fiatBalance,
    })
    return token
  })
  return List<Token>(tokens)
}

export type MasterChefSTakedTokensOptions = {
  masterChefAddress?: string
  sushiTokenAddress?: string
  xSushiTokenAddress?: string
}

export const useMasterChefStakedTokens = (options: MasterChefSTakedTokensOptions): List<Token> => {
  const { safeAddress } = useSafeAddress()
  const { masterChefAddress, sushiTokenAddress, xSushiTokenAddress } = options

  const [tokens = List<Token>(), setTokens] = useState<List<Token>>()

  useEffect(() => {
    const lookup = async () => {
      const tokens = await getMasterChefStakedTokens(masterChefAddress || '', safeAddress)
      const barTokens = await getSushiBarStakedTokens(sushiTokenAddress || '', xSushiTokenAddress || '', safeAddress)
      setTokens(List<Token>([...barTokens, ...tokens]))
    }
    lookup()
  }, [masterChefAddress, safeAddress, sushiTokenAddress, xSushiTokenAddress, setTokens])

  return tokens
}
