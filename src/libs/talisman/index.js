import * as Account from './account'
import * as Balance from './balances'
import * as Chainmeta from './chainmeta'
import * as Crowdloan from './crowdloan'
import * as Extension from './extension'
import * as Parachain from './parachain'
import Subquery from './subquery'
import { useChainByGenesis as _useChainByGenesis } from './util/hooks'

/* publically exposed hooks */

// account things
export * from './account'

// chainmeta things
export * from './chainmeta'

// extension things
export * from './extension'

// parachain things
export * from './parachain'

// crowdloans stuff
export * from './crowdloan'

export * from './balances'

// subquery pieces
export const useQuery = Subquery.useQuery
export const gql = Subquery.gql

// helpers
export const useChainByGenesis = _useChainByGenesis

/* publically exposed provider */
const Provider = ({ children }) => (
  <Subquery.Provider uri="https://api.subquery.network/sq/subvis-io/kusama-crowdloans-and-auctions-v2">
    <Extension.Provider>
      <Chainmeta.Provider>
        <Account.Provider>
          <Balance.Provider>
            <Parachain.Provider>
              <Crowdloan.Provider>{children}</Crowdloan.Provider>
            </Parachain.Provider>
          </Balance.Provider>
        </Account.Provider>
      </Chainmeta.Provider>
    </Extension.Provider>
  </Subquery.Provider>
)

export default Provider
