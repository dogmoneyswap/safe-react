import { useEffect, useState } from 'react'
import { reverseENSLookup } from '../wallets/getWeb3'

const _cache = {}

const useCachedState = <T>(key: string): [T | undefined, React.Dispatch<React.SetStateAction<T>>] => {
  const [cache, setCache] = useState<T>()

  useEffect(() => {
    const saved = _cache[key]
    if (saved) setCache(saved)
  }, [key, setCache])

  useEffect(() => {
    _cache[key] = cache
  }, [key, cache])

  return [cache, setCache]
}

const useEnsName = (address: string): [string] => {
  const [ensName = '', setEnsName] = useCachedState<string>(`ensName.${address}`)

  useEffect(() => {
    const lookup = async () => {
      const name = await reverseENSLookup(address)
      setEnsName(name)
    }
    lookup()
  }, [address, setEnsName])

  return [ensName]
}

export default useEnsName
