import { ReactElement } from 'react'
import { Button } from '@material-ui/core'
import { Text } from '@gnosis.pm/safe-react-components'
import { switchWalletChain } from 'src/logic/wallets/utils/network'
import ChainIndicator from 'src/components/ChainIndicator'
import { useSelector } from 'react-redux'
import { currentChainId } from 'src/logic/config/store/selectors'
import { isMobile } from 'react-device-detect'
import styled from 'styled-components'
import { screenSm } from 'src/theme/variables'

const StyledButton = styled(Button)`
  @media (min-width: ${screenSm}px) {
    padding: 15px;
  }
  padding: 5px;
`

const WalletSwitch = (): ReactElement => {
  const chainId = useSelector(currentChainId)
  return (
    <StyledButton variant="outlined" size="medium" color="primary" onClick={switchWalletChain}>
      <Text size="lg">
        {`Switch ${isMobile ? '' : 'wallet '}to `}
        <ChainIndicator chainId={chainId} hideCircle={isMobile} />
      </Text>
    </StyledButton>
  )
}

export default WalletSwitch
