import { ReactElement } from 'react'
import { ExplorerButton } from '@gnosis.pm/safe-react-components'
import styled from 'styled-components'

import Block from 'src/components/layout/Block'
import Img from 'src/components/layout/Img'
import Paragraph from 'src/components/layout/Paragraph'
import { setImageToPlaceholder } from 'src/routes/safe/components/Balances/utils'
import { getExplorerInfo } from 'src/config'
import { BalanceData } from '../dataFetcher'
import { getNativeCurrencyAddress } from 'src/config/utils'

const StyledParagraph = styled(Paragraph)`
  margin-left: 10px;
  margin-right: 10px;
`

const StyledImg = styled(Img)`
  border-radius: 50%;
`

const AssetTableCell = ({ asset }: { asset: BalanceData['asset'] }): ReactElement => {
  const isNativeCurrency = asset.address === getNativeCurrencyAddress()
  return asset.isLpToken ? (
    <Block justify="left">
      <StyledImg
        alt={asset.token0!.name}
        height={26}
        onError={setImageToPlaceholder}
        src={asset.token0!.logoUri || ''}
      />
      <StyledImg
        alt={asset.token1!.name}
        height={26}
        onError={setImageToPlaceholder}
        src={asset.token1!.logoUri || ''}
        style={{ marginLeft: -10 }}
      />
      <div>
        <StyledParagraph noMargin size="lg">
          {`${asset.token0!.symbol}/${asset.token1!.symbol}`}
        </StyledParagraph>
        <StyledParagraph noMargin size="lg">
          {asset.name}
        </StyledParagraph>
      </div>
      {!isNativeCurrency && <ExplorerButton explorerUrl={getExplorerInfo(asset.address)} />}
    </Block>
  ) : (
    <Block justify="left">
      <StyledImg alt={asset.name} height={26} onError={setImageToPlaceholder} src={asset.logoUri || ''} />
      <StyledParagraph noMargin size="lg">
        {asset.name}
      </StyledParagraph>
      {!isNativeCurrency && <ExplorerButton explorerUrl={getExplorerInfo(asset.address)} />}
    </Block>
  )
}

export default AssetTableCell
