import * as React from 'react'
import { SVGProps } from 'react'
const SvgFeather = (props: SVGProps<SVGSVGElement>) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M20.24 12.24C21.3658 11.1142 21.9983 9.58718 21.9983 7.995C21.9983 6.40282 21.3658 4.87584 20.24 3.75C19.1142 2.62416 17.5872 1.99166 15.995 1.99166C14.4028 1.99166 12.8758 2.62416 11.75 3.75L5 10.5V19H13.5L20.24 12.24Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M16 8L2 22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.5 15H9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export default SvgFeather
