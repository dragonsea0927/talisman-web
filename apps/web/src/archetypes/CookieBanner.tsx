import BaseCookieBanner from '@components/recipes/CookieBanner'
import posthog from 'posthog-js'
import { useCallback, useEffect, useState } from 'react'

const GDPR_TIMEZONES = [
  'Europe/Vienna',
  'Europe/Brussels',
  'Europe/Sofia',
  'Europe/Zagreb',
  'Asia/Famagusta',
  'Asia/Nicosia',
  'Europe/Prague',
  'Europe/Copenhagen',
  'Europe/Tallinn',
  'Europe/Helsinki',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Busingen',
  'Europe/Athens',
  'Europe/Budapest',
  'Europe/Dublin',
  'Europe/Rome',
  'Europe/Riga',
  'Europe/Vilnius',
  'Europe/Luxembourg',
  'Europe/Malta',
  'Europe/Amsterdam',
  'Europe/Warsaw',
  'Atlantic/Azores',
  'Atlantic/Madeira',
  'Europe/Lisbon',
  'Europe/Bucharest',
  'Europe/Bratislava',
  'Europe/Ljubljana',
  'Africa/Ceuta',
  'Atlantic/Canary',
  'Europe/Madrid',
  'Europe/Stockholm',
]

const isGdprComplianceRequired = GDPR_TIMEZONES.includes(Intl.DateTimeFormat().resolvedOptions().timeZone)

const CookieBanner = () => {
  const [visible, setVisible] = useState(
    isGdprComplianceRequired && !posthog.has_opted_in_capturing() && !posthog.has_opted_out_capturing()
  )

  // When user is no longer in a GDPR compliance country
  useEffect(() => {
    if (!isGdprComplianceRequired) {
      posthog.clear_opt_in_out_capturing()
    }
  }, [])

  return (
    <div css={{ position: 'fixed', right: '1.5rem', bottom: '2.4rem', zIndex: 11 }}>
      <BaseCookieBanner
        privacyPolicyHref="https://docs.talisman.xyz/talisman/prepare-for-your-journey/privacy-policy"
        visible={visible}
        onAccept={useCallback(() => {
          posthog.opt_in_capturing()
          setVisible(false)
        }, [])}
        onReject={useCallback(() => {
          posthog.opt_in_capturing()
          setVisible(false)
        }, [])}
        onDismiss={useCallback(() => setVisible(false), [])}
      />
    </div>
  )
}

export default CookieBanner
