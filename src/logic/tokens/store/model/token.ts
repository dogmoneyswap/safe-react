import { TokenType } from '@gnosis.pm/safe-react-gateway-sdk'
import { Record, RecordOf } from 'immutable'

import { BalanceRecord } from 'src/logic/tokens/store/actions/fetchSafeTokens'

export type TokenProps = {
  address: string
  name: string
  symbol: string
  decimals: number | string
  logoUri: string | null
  balance: BalanceRecord
  type?: TokenType
  isLpToken?: boolean
  token0?: TokenProps
  token1?: TokenProps
  reserves?: Array<string>
}

export const makeToken = Record<TokenProps>({
  address: '',
  name: '',
  symbol: '',
  decimals: 0,
  logoUri: '',
  balance: {
    fiatBalance: '0',
    tokenBalance: '0',
  },
  isLpToken: false,
  token0: undefined,
  token1: undefined,
  reserves: undefined,
})
// balance is only set in extendedSafeTokensSelector when we display user's token balances

export type Token = RecordOf<TokenProps>
