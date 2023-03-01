import * as React from 'react'
import { Ref, SVGProps, forwardRef } from 'react'
const SvgCornerLeftDown = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg width={24} height={24} fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props}>
    <path d="m14 15-5 5-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M20 4h-7a4 4 0 0 0-4 4v12"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const ForwardRef = forwardRef(SvgCornerLeftDown)
export default ForwardRef
