import { useTheme } from '@emotion/react'
import { IconContext } from '@talismn/web-icons/utils'
import { useMemo, type ElementType, type PropsWithChildren, type ReactNode } from 'react'

import { useSurfaceColor } from '..'
import CircularProgressIndicator from '../CircularProgressIndicator'

type ButtonElementType = Extract<React.ElementType, 'button' | 'a'> | ElementType<any>

type PolymorphicButtonProps<T extends ButtonElementType = 'button'> = PropsWithChildren<{
  as?: T
  /**
   * @deprecated use variant components
   */
  variant?:
    | 'outlined'
    | 'text'
    | 'surface'
    /**
     * @deprecated use "surface" variant instead
     */
    | 'secondary'
    /**
     * @deprecated use `Clickable` instead
     */
    | 'noop'
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  disabled?: boolean
  hidden?: boolean
  loading?: boolean
}>

export type ButtonProps<T extends ButtonElementType = 'button'> = PolymorphicButtonProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof PolymorphicButtonProps<T>>

const Button = <T extends ButtonElementType = 'button'>({
  as = 'button' as T,
  variant,
  trailingIcon,
  leadingIcon,
  hidden,
  loading,
  ...props
}: ButtonProps<T>) => {
  const theme = useTheme()

  const disabled = Boolean(props.disabled) || Boolean(hidden) || Boolean(loading)

  const surfaceColor = useSurfaceColor()

  const variantStyle = useMemo(() => {
    switch (variant) {
      case 'secondary':
      case 'surface':
        return {
          backgroundColor: surfaceColor,
          color: theme.color.onSurface,
          ':hover': {
            opacity: 0.6,
          },
        }
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          color: theme.color.onBackground,
          borderStyle: 'solid',
          borderColor: theme.color.onBackground,
          borderWidth: 1,
          ':hover': {
            color: theme.color.background,
            backgroundColor: theme.color.onBackground,
          },
        }
      case 'text':
        return {
          backgroundColor: 'transparent',
          color: theme.color.primary,
        }
      case 'noop':
        return {
          padding: 'none',
          margin: 'none',
          background: 'none',
          border: 'none',
          outline: 'none',
          ':hover': {
            filter: 'brightness(1.5)',
          },
        }
      case undefined:
        return {
          backgroundColor: theme.color.primaryContainer,
          color: theme.color.onPrimary,
          ':hover': {
            opacity: 0.6,
          },
        }
    }
  }, [
    surfaceColor,
    theme.color.background,
    theme.color.onBackground,
    theme.color.onPrimary,
    theme.color.onSurface,
    theme.color.primary,
    theme.color.primaryContainer,
    variant,
  ])

  const variantDisabledStyle = useMemo(() => {
    switch (variant) {
      case undefined:
        return {
          backgroundColor: surfaceColor,
          color: `rgba(255,255,255,${theme.contentAlpha.disabled})`,
        }
      default:
        return { filter: 'grayscale(1) brightness(0.5)' }
    }
  }, [surfaceColor, theme.contentAlpha.disabled, variant])

  const hasLeadingIcon = Boolean(loading) || leadingIcon !== undefined

  const Component = as

  return (
    <Component
      {...(props as any)}
      disabled={disabled}
      css={[
        theme.typography.body,
        {
          textAlign: 'center',
          display: 'inline-block',
          padding: '1.156rem 2.4rem',
          width: 'fit-content',
          border: 'none',
          borderRadius: theme.shape.full,
          cursor: 'pointer',
          transition: '.25s',
          ...variantStyle,
          ...(disabled ? { ':hover': undefined } : {}),
        },
        loading && { cursor: 'wait' },
        props.disabled && [{ cursor: 'not-allowed' }, variantDisabledStyle],
        hidden && { cursor: 'default', pointerEvent: 'none', opacity: 0 },
      ]}
    >
      <div css={{ position: 'relative', display: 'flex' }}>
        {hasLeadingIcon && (
          <span
            css={{ position: 'absolute', top: 0, bottom: 0, left: '-1.6rem', display: 'flex', alignItems: 'center' }}
          >
            <IconContext.Provider value={{ size: '1.6rem' }}>
              {(() => {
                if (loading) {
                  return <CircularProgressIndicator size="1.6rem" />
                }

                if (leadingIcon) {
                  return leadingIcon
                }

                return undefined
              })()}
            </IconContext.Provider>
          </span>
        )}
        <span
          css={[
            { textAlign: 'center', width: 'stretch' },
            hasLeadingIcon && { translate: '0.8rem' },
            trailingIcon && { translate: '-0.8rem' },
            hasLeadingIcon && trailingIcon && { translate: 'revert' },
          ]}
        >
          {props.children}
        </span>
        <IconContext.Provider value={{ size: '1.6rem' }}>
          {trailingIcon && (
            <span
              css={{ position: 'absolute', top: 0, bottom: 0, right: '-1.6rem', display: 'flex', alignItems: 'center' }}
            >
              {trailingIcon}
            </span>
          )}
        </IconContext.Provider>
      </div>
    </Component>
  )
}

export default Button

export const OutlinedButton = <T extends ButtonElementType = 'button'>(props: Omit<ButtonProps<T>, 'variant'>) => (
  // @ts-expect-error
  <Button {...props} variant="outlined" />
)

export const TextButton = <T extends ButtonElementType = 'button'>(props: Omit<ButtonProps<T>, 'variant'>) => (
  // @ts-expect-error
  <Button {...props} variant="text" />
)

export const SurfaceButton = <T extends ButtonElementType = 'button'>(props: Omit<ButtonProps<T>, 'variant'>) => (
  // @ts-expect-error
  <Button {...props} variant="surface" />
)
