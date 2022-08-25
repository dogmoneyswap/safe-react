import { CSSProperties, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import { List } from 'immutable'
import TableCell from '@material-ui/core/TableCell'
import Tooltip from '@material-ui/core/Tooltip'
import TableContainer from '@material-ui/core/TableContainer'
import TableRow from '@material-ui/core/TableRow'
import { Skeleton } from '@material-ui/lab'

import InfoIcon from 'src/assets/icons/info_red.svg'
import { FixedIcon, Text, Button } from '@gnosis.pm/safe-react-components'

import Img from 'src/components/layout/Img'
import Table from 'src/components/Table'
import { cellWidth } from 'src/components/Table/TableHead'
import Row from 'src/components/layout/Row'
import { BALANCE_ROW_TEST_ID } from 'src/routes/safe/components/Balances'
import AssetTableCell from 'src/routes/safe/components/Balances/AssetTableCell'
import {
  BALANCE_TABLE_ASSET_ID,
  BALANCE_TABLE_BALANCE_ID,
  BALANCE_TABLE_VALUE_ID,
  generateColumns,
  getBalanceData,
  BalanceData,
  generateMobileColumns,
  BALANCE_TABLE_MOBILE_ID,
} from 'src/routes/safe/components/Balances/dataFetcher'
import { makeStyles } from '@material-ui/core/styles'
import { styles } from './styles'
import { currentCurrencySelector } from 'src/logic/currencyValues/store/selectors'
import { trackEvent } from 'src/utils/googleTagManager'
import { ASSETS_EVENTS } from 'src/utils/events/assets'
import { isMobile } from 'react-device-detect'
import Col from 'src/components/layout/Col'
import { Token } from 'src/logic/tokens/store/model/token'
import BigNumber from 'bignumber.js'
import { useMasterChefStakedTokens } from 'src/logic/tokens/store/actions/fetchTokenInfo'
import { useHistory } from 'react-router-dom'
import { getSafeAppUrl } from 'src/routes/routes'
import useSafeAddress from 'src/logic/currentSession/hooks/useSafeAddress'

const StyledButton = styled(Button)`
  &&.MuiButton-root {
    margin: 4px 12px 4px 0px;
    padding: 0 12px;
    min-width: auto;
  }
  svg {
    margin: 0 6px 0 0;
  }
`

const StakedAssetsText = styled.div`
  color: #4c4c4c;
  font-size: 1.17em;
  margin-block-start: 1em;
  margin-block-end: 1em;
  margin-inline-start: 0px;
  margin-inline-end: 0p;
`

const useStyles = makeStyles(styles)

type Props = {
  masterChefAddress: string
  masterChefName: string
  style?: CSSProperties
}

type CurrencyTooltipProps = {
  valueWithCurrency: string
  balanceWithSymbol: string
}

const CurrencyTooltip = (props: CurrencyTooltipProps): React.ReactElement | null => {
  const { balanceWithSymbol, valueWithCurrency } = props
  const classes = useStyles()
  const balance = balanceWithSymbol.replace(/[^\d.-]/g, '')
  const value = valueWithCurrency.replace(/[^\d.-]/g, '')
  if (!Number(value) && Number(balance)) {
    return (
      <Tooltip placement="top" title="Value may be zero due to missing token price information">
        <span>
          <Img className={classes.tooltipInfo} alt="Info Tooltip" height={16} src={InfoIcon} />
        </span>
      </Tooltip>
    )
  }
  return null
}

const Coins = (props: Props): React.ReactElement => {
  const { masterChefAddress, masterChefName, style } = props
  const history = useHistory()
  const routeParams = useSafeAddress()
  const classes = useStyles()
  const columns = isMobile ? generateMobileColumns() : generateColumns()
  const autoColumns = columns.filter((c) => !c.custom)
  const selectedCurrency = useSelector(currentCurrencySelector)

  const safeTokens = useMasterChefStakedTokens({
    masterChefAddress,
    sushiTokenAddress: '0x93C8a00416dD8AB9701fa15CA120160172039851',
    xSushiTokenAddress: '0xC5c70fA7A518bE9229eB0Dc84e70a91683694562',
  })

  const differingTokens = useMemo(() => safeTokens.size, [safeTokens])
  useEffect(() => {
    // Safe does not have any tokens until fetching is complete
    if (differingTokens > 0) {
      trackEvent({ ...ASSETS_EVENTS.DIFFERING_TOKENS, label: differingTokens })
    }
  }, [differingTokens])

  const navigate = (token: Token) => {
    if (token.isLpToken) {
      history.push(getSafeAppUrl('https://app.dogmoney.money/farm?filter=portfolio', routeParams))
    } else {
      history.push(getSafeAppUrl('https://app.dogmoney.money/stake', routeParams))
    }
  }

  const filteredData: List<BalanceData> = useMemo(
    () => getBalanceData(safeTokens, selectedCurrency),
    [safeTokens, selectedCurrency],
  )

  if (filteredData.size == 0) return null as any

  return (
    <TableContainer style={style}>
      <StakedAssetsText>{masterChefName}</StakedAssetsText>
      <Table columns={columns} data={filteredData} defaultRowsPerPage={100} label="Balances" size={filteredData.size}>
        {(sortedData) =>
          sortedData.map((row, index) => (
            <TableRow className={classes.hide} data-testid={BALANCE_ROW_TEST_ID} key={index} tabIndex={-1}>
              {autoColumns.map((column) => {
                const { align, id, width } = column
                let cellItem
                switch (id) {
                  case BALANCE_TABLE_ASSET_ID: {
                    cellItem = <AssetTableCell asset={row[id]} />
                    break
                  }
                  case BALANCE_TABLE_BALANCE_ID: {
                    const asset = row['asset'] as Token
                    cellItem = (
                      <div data-testid={`balance-${row[BALANCE_TABLE_ASSET_ID].symbol}`}>
                        <div>{row[id]}</div>
                        {asset.isLpToken && (
                          <div>
                            {`${new BigNumber(asset.reserves![0]).times(`1e-${asset.token0!.decimals!}`).toFixed(2)} ${
                              asset.token0!.symbol
                            } +
                            ${new BigNumber(asset.reserves![1]).times(`1e-${asset.token1!.decimals!}`).toFixed(2)} ${
                              asset.token1!.symbol
                            }`}
                          </div>
                        )}
                      </div>
                    )
                    break
                  }
                  case BALANCE_TABLE_VALUE_ID: {
                    // If there are no values for that row but we have balances, we display as '0.00 {CurrencySelected}'
                    // In case we don't have balances, we display a skeleton
                    const showCurrencyValueRow = row[id] || row[BALANCE_TABLE_BALANCE_ID]
                    const valueWithCurrency = row[id] ? row[id] : `0.00 ${selectedCurrency}`
                    cellItem =
                      showCurrencyValueRow && selectedCurrency ? (
                        <div className={classes.currencyValueRow}>
                          {valueWithCurrency}
                          <CurrencyTooltip
                            valueWithCurrency={valueWithCurrency}
                            balanceWithSymbol={row[BALANCE_TABLE_BALANCE_ID]}
                          />
                        </div>
                      ) : (
                        <Skeleton animation="wave" />
                      )
                    break
                  }
                  case BALANCE_TABLE_MOBILE_ID: {
                    const showCurrencyValueRow = row.value || row.balance
                    const valueWithCurrency = row.value ? row.value : `0.00 ${selectedCurrency}`
                    const asset = row['asset'] as Token
                    cellItem = (
                      <Row align="center">
                        <Col middle="xs">
                          <div data-testid={`balance-${row[BALANCE_TABLE_ASSET_ID].symbol}`}>
                            <AssetTableCell asset={row.asset} />
                            <div>
                              BALANCE: <span style={{ marginLeft: 5 }}>{row.balance}</span>
                            </div>
                            {asset.isLpToken && (
                              <div>
                                {`${new BigNumber(asset.reserves![0])
                                  .times(`1e-${asset.token0!.decimals!}`)
                                  .toFixed(2)} ${asset.token0!.symbol} /
                                  ${new BigNumber(asset.reserves![1])
                                    .times(`1e-${asset.token1!.decimals!}`)
                                    .toFixed(2)} ${asset.token1!.symbol}`}
                              </div>
                            )}
                            {showCurrencyValueRow && selectedCurrency ? (
                              <div>
                                VALUE:
                                <span style={{ marginLeft: 5 }}>
                                  {valueWithCurrency}
                                  <CurrencyTooltip
                                    valueWithCurrency={valueWithCurrency}
                                    balanceWithSymbol={row.balance}
                                  />
                                </span>
                              </div>
                            ) : (
                              <Skeleton animation="wave" />
                            )}
                          </div>
                        </Col>
                        <Col xs={3}>
                          <div className={classes.actions}>
                            <StyledButton color="primary" onClick={() => navigate(asset)} size="md" variant="contained">
                              <Text size="md" color="white">
                                View on <br /> DogMoney
                              </Text>
                            </StyledButton>
                          </div>
                        </Col>
                      </Row>
                    )
                    break
                  }
                  default: {
                    cellItem = null
                    break
                  }
                }
                return (
                  <TableCell align={align} component="td" key={id} style={cellWidth(width)}>
                    {cellItem}
                  </TableCell>
                )
              })}
              {!isMobile && (
                <TableCell component="td">
                  <Row align="end" className={classes.actions}>
                    <StyledButton
                      color="primary"
                      onClick={() => navigate(row['asset'] as Token)}
                      size="md"
                      variant="contained"
                    >
                      <FixedIcon type="arrowSentWhite" />
                      <Text size="xl" color="white">
                        View on DogMoney
                      </Text>
                    </StyledButton>
                  </Row>
                </TableCell>
              )}
            </TableRow>
          ))
        }
      </Table>
    </TableContainer>
  )
}

export default Coins
