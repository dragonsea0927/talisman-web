import * as React from 'react'
import { Ref, SVGProps, forwardRef } from 'react'

import { IconContext } from '../context'

const SvgAlignLeft = (
  props: Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
    size?: number | string
  },
  ref: Ref<SVGSVGElement>
) => {
  const iconContext = React.useContext(IconContext)
  return (
    <svg
      width={props.size ?? iconContext.size ?? 24}
      height={props.size ?? iconContext.size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
    >
      <path d="M17 10H3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 6H3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 14H3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 18H3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
const ForwardRef = forwardRef(SvgAlignLeft)
export default ForwardRef
