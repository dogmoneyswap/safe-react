import { EthHashInfo } from '@gnosis.pm/safe-react-components'
import { ReactElement } from 'react'
import { isMobile } from 'react-device-detect'
import { useSelector } from 'react-redux'
import { copyShortNameSelector, showShortNameSelector } from 'src/logic/appearance/selectors'
import useSafeAddress from 'src/logic/currentSession/hooks/useSafeAddress'
import useEnsName from 'src/logic/hooks/useEnsName'
import { getAvatarFromENS } from 'src/logic/wallets/getWeb3'
import { parsePrefixedAddress } from 'src/utils/prefixedAddress'

type Props = Omit<Parameters<typeof EthHashInfo>[0], 'shouldShowShortName' | 'shouldCopyShortName'>

const PrefixedEthHashInfo = ({
  hash,
  customAvatar,
  customAvatarFallback,
  name,
  shortenHash,
  ...rest
}: Props): ReactElement => {
  const showChainPrefix = useSelector(showShortNameSelector)
  const copyChainPrefix = useSelector(copyShortNameSelector)
  const { address } = parsePrefixedAddress(hash)
  const { shortName } = useSafeAddress()
  const [ensName] = useEnsName(address)
  const ensAvatar = getAvatarFromENS(ensName)

  return (
    <EthHashInfo
      hash={address}
      name={name || ensName}
      shortName={shortName}
      shouldShowShortName={showChainPrefix}
      shouldCopyShortName={copyChainPrefix}
      customAvatar={customAvatar || ensAvatar || undefined}
      shortenHash={shortenHash ? shortenHash : isMobile ? 12 : undefined}
      {...rest}
    />
  )
}

export default PrefixedEthHashInfo
