import * as React from 'react'
import { Ref, SVGProps, forwardRef } from 'react'
const SvgChevronUp = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg width={24} height={24} fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props}>
    <path d="m18 15-6-6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ForwardRef = forwardRef(SvgChevronUp)
export default ForwardRef
