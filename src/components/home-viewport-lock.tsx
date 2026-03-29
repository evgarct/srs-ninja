'use client'

import { useEffect } from 'react'

export function HomeViewportLock() {
  useEffect(() => {
    const htmlStyle = document.documentElement.style
    const bodyStyle = document.body.style

    const previousHtmlOverscroll = htmlStyle.overscrollBehaviorY
    const previousHtmlOverflow = htmlStyle.overflow
    const previousBodyOverscroll = bodyStyle.overscrollBehaviorY
    const previousBodyOverflow = bodyStyle.overflow
    const previousBodyPosition = bodyStyle.position
    const previousBodyInset = bodyStyle.inset
    const previousBodyWidth = bodyStyle.width

    htmlStyle.overscrollBehaviorY = 'none'
    htmlStyle.overflow = 'hidden'
    bodyStyle.overscrollBehaviorY = 'none'
    bodyStyle.overflow = 'hidden'
    bodyStyle.position = 'fixed'
    bodyStyle.inset = '0'
    bodyStyle.width = '100%'

    return () => {
      htmlStyle.overscrollBehaviorY = previousHtmlOverscroll
      htmlStyle.overflow = previousHtmlOverflow
      bodyStyle.overscrollBehaviorY = previousBodyOverscroll
      bodyStyle.overflow = previousBodyOverflow
      bodyStyle.position = previousBodyPosition
      bodyStyle.inset = previousBodyInset
      bodyStyle.width = previousBodyWidth
    }
  }, [])

  return null
}
