import { createAction } from 'redux-actions'

import { PROVIDER_ACTIONS } from 'src/logic/wallets/store/actions'
import { ProviderEnsPayload, ProviderEnsAvatarPayload } from 'src/logic/wallets/store/reducer'

export const updateProviderEns = createAction<ProviderEnsPayload>(PROVIDER_ACTIONS.ENS)
export const updateProviderEnsAvatar = createAction<ProviderEnsAvatarPayload>(PROVIDER_ACTIONS.ENS_AVATAR)
