import { ReactComponent as AllAccountsIcon } from '@assets/icons/all-accounts.svg'
import { Button, Pendor } from '@components'
import { ReactComponent as ChevronDown } from '@icons/chevron-down.svg'
import { usePortfolio } from '@libs/portfolio'
import { useActiveAccount, useGuardian } from '@libs/talisman'
import { useChainByGenesis } from '@libs/talisman'
import { Keyring } from '@polkadot/keyring'
import Identicon from '@polkadot/react-identicon'
import { addTokensToBalances, groupBalancesByAddress, useBalances, useChain } from '@talismn/api-react-hooks'
import { addBigNumbers, useFuncMemo } from '@talismn/util'
import { formatCommas, formatCurrency, truncateString } from '@util/helpers'
import { useEffect, useMemo, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

// format an address based on chain ID, derived from genesis ID
// as returned from polkadot.js extension API
const Address = ({ address, genesis, truncate = false }) => {
  const keyring = new Keyring()
  const { id } = useChainByGenesis(genesis)
  const encoded = keyring.encodeAddress(address, id)

  return !!truncate ? truncateString(encoded, truncate[0] || 4, truncate[1] || 4) : encoded
}

const Dropdown = styled(({ className, handleClose, allAccounts, nativeToken, ksmBalancesByAddress }) => {
  const { switchAccount } = useActiveAccount()
  const { accounts } = useGuardian()
  const { totalUsd, totalUsdByAddress } = usePortfolio()

  return (
    <span className={`account-picker ${className}`}>
      {(allAccounts ? [{ name: 'All Accounts' }, ...accounts] : accounts).map(
        ({ address, name, genesisHash }, index) => (
          <div
            key={index}
            className="account"
            onClick={() => {
              switchAccount(address)
              handleClose()
            }}
          >
            <span className="left">
              {address ? (
                <Identicon className="identicon" value={address} theme="polkadot" />
              ) : (
                <Identicon
                  Custom={AllAccountsIcon}
                  className="identicon"
                  value="5DHuDfmwzykE9KVmL87DLjAbfSX7P4f4wDW5CKx8QZnQA4FK"
                  theme="polkadot"
                />
              )}
              <span className="name-address">
                <span className="name">{address ? truncateString(name, 10, 0) : name}</span>
                {address && (
                  <span className="address">
                    <Address address={address} genesis={genesisHash} truncate />
                  </span>
                )}
              </span>
            </span>

            <span className="right">
              {address ? (
                allAccounts ? (
                  <Pendor prefix={!totalUsdByAddress[address] && '-'}>
                    {totalUsdByAddress[address] && formatCurrency(totalUsdByAddress[address])}
                  </Pendor>
                ) : (
                  <Pendor suffix={` ${nativeToken}`}>
                    {ksmBalancesByAddress[address] &&
                      formatCommas(
                        ksmBalancesByAddress[address].map(balance => balance?.tokens).reduce(addBigNumbers, undefined)
                      )}
                  </Pendor>
                )
              ) : (
                <>
                  <Pendor prefix={!totalUsd && '-'}>{totalUsd && formatCurrency(totalUsd)}</Pendor>
                </>
              )}
            </span>
          </div>
        )
      )}
    </span>
  )
})`
  background: rgb(${({ theme }) => theme?.background});
  font-size: 0.8em;
  width: 26em;
  font-size: 1em;
  max-height: 0;
  overflow: hidden;
  overflow-y: auto;
  border-radius: 1.2rem;
  box-shadow: 0 0 1.2rem rgba(0, 0, 0, 0.1);

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  > .account {
    display: flex;
    align-items: center;
    padding: 1.2em;
    width: 100%;
    cursor: pointer;
    justify-content: space-between;
    transition: all 0.15s;

    span {
      display: flex;
      align-items: center;
    }

    .identicon {
      font-size: 2.6em;
    }

    .name-address {
      display: flex;
      align-items: flex-end;
      line-height: 1em;
      * {
        line-height: 1em;
      }
    }

    .name {
      margin-left: 0.4em;
      font-weight: bold;
      letter-spacing: -0.03em;
    }

    .address {
      font-size: 0.85em;
      opacity: 0.5;
      margin-left: 0.6em;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }

  ${({ open }) =>
    !!open &&
    `
      max-height: 40rem;
    `}
`

const Unavailable = styled(({ className }) => {
  return (
    <Button
      className={`account-button ${className}`}
      small
      primary
      onClick={() =>
        window.open(
          'https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd',
          '_blank'
        )
      }
    >
      Install Polkadot.js Extension
    </Button>
  )
})``

const NoAccount = styled(({ className }) => {
  return (
    <Button className={`account-button ${className}`}>
      {`Polkadot{.js}`}
      <br />
      <span className="subtext">Requires Configuration</span>
    </Button>
  )
})`
  text-align: center;
  line-height: 1em;
  display: block;
  padding: 0.6em;
  cursor: default;
  .subtext {
    font-size: 0.7em;
    opacity: 0.7;
    text-transform: uppercase;
    font-weight: var(--font-weight-regular);
  }
`

const Authorized = styled(({ className, narrow, allAccounts }) => {
  const { switchAccount } = useActiveAccount()
  const { accounts } = useGuardian()
  const { hasActiveAccount, address, name } = useActiveAccount()
  const { totalUsd, totalUsdByAddress } = usePortfolio()
  const [open, setOpen] = useState(false)

  const usd = hasActiveAccount ? totalUsdByAddress[address] : totalUsd
  useEffect(() => {
    if (allAccounts) return
    if (hasActiveAccount) return
    switchAccount(accounts[0].address)
  }, [accounts, allAccounts, hasActiveAccount, switchAccount])

  // TODO: Currently we show KSM when allAccounts is false
  // Instead we should maybe have a prop which specifies what
  // balance (KSM/DOT/Parahain N/USD) should be shown for each account

  const chainId = '2'
  const chainIds = useMemo(() => [chainId], []) // 2 is kusama
  const addresses = useMemo(() => accounts.map((account: any) => account.address), [accounts])

  const hasManyAccounts = addresses && addresses.length > 1

  const { nativeToken, tokenDecimals } = useChain(chainId)
  const { balances } = useBalances(addresses, chainIds)

  const ksmBalances = useFuncMemo(addTokensToBalances, balances, nativeToken ? tokenDecimals : undefined)
  const ksmBalancesByAddress = useFuncMemo(groupBalancesByAddress, ksmBalances)

  const delayRef = useRef<NodeJS.Timeout | null>(null)
  const openOnDelay = () => {
    delayRef.current && clearTimeout(delayRef.current)
    delayRef.current = setTimeout(() => setOpen(true), 150)
  }
  const cancelOpen = () => {
    delayRef.current && clearTimeout(delayRef.current)
    setOpen(false)
  }

  return (
    <div className="account-switcher-pill">

      <span
        className={`account-button${hasManyAccounts ? ' has-many-accounts' : ''} ${className}`}
        onMouseEnter={() => narrow && hasManyAccounts && openOnDelay()}
        onMouseLeave={() => cancelOpen()}
      >
        {hasActiveAccount ? (
          <Identicon className="identicon" value={address} theme="polkadot" />
        ) : (
          <Identicon
            className="identicon"
            Custom={AllAccountsIcon}
            value="5DHuDfmwzykE9KVmL87DLjAbfSX7P4f4wDW5CKx8QZnQA4FK"
            theme="polkadot"
          />
        )}
        <span className="selected-account">
          <div>{hasActiveAccount ? name : allAccounts ? 'All Accounts' : 'Loading...'}</div>
          <div>
            {allAccounts ? (
              <Pendor prefix={!usd && '-'}>{usd && formatCurrency(usd)}</Pendor>
            ) : (
              <Pendor suffix={` ${nativeToken}`}>
                {ksmBalancesByAddress[address] &&
                  formatCommas(
                    ksmBalancesByAddress[address].map(balance => balance?.tokens).reduce(addBigNumbers, undefined)
                  )}
              </Pendor>
            )}
          </div>
        </span>

        {narrow ? (
          <ChevronDown style={{ margin: '0 1rem 0 0.8rem', visibility: hasManyAccounts ? 'visible' : 'hidden' }} />
        ) : (
          <Button.Icon className="nav-toggle" onMouseEnter={() => setOpen(true)}>
            <ChevronDown />
          </Button.Icon>
        )}

        <Dropdown
          open={open}
          handleClose={() => setOpen(false)}
          allAccounts={allAccounts}
          nativeToken={nativeToken}
          ksmBalancesByAddress={ksmBalancesByAddress}
        />
      </span>

    </div>

  )
})`
  font-size: inherit;
  display: flex;
  align-items: center;
  padding: 0;
  position: relative;

  > .identicon {
    margin-right: 0.3em;
    > svg {
      width: 2.5em;
      height: 2.5em;
    }
  }

  > .nav-toggle {
    margin-left: 0.5em;
  }

  > .selected-account {
    display: block;
    margin-left: 0.4em;
    > div {
      line-height: 1.3em;
      &:first-child {
        font-weight: var(--font-weight-bold);
        width: 6.7em;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }

      &:last-child {
        opacity: 0.3;
        font-size: 0.9em;
      }
    }
  }

  .identicon {
    cursor: inherit;
  }

  .account-picker {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 10;
  }

  &.has-many-accounts {
    ${props =>
      props.narrow &&
      css`
        cursor: pointer;
      `}
  }
`

const AccountButton = props => {
  const { status } = useActiveAccount()
  switch (status) {
    case 'AUTHORIZED':
      return <Authorized {...props} />
    case 'UNAVAILABLE':
      return <Unavailable {...props} />
    case 'NOACCOUNT':
      return <NoAccount {...props} />
    default:
      return null
  }
}

export default AccountButton
