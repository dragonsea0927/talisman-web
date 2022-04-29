import '@google/model-viewer'

import { MediaPreviewProps } from '@util/nfts/types'
import React, { EmbedHTMLAttributes, ImgHTMLAttributes, MediaHTMLAttributes, cloneElement } from 'react'

import DualRingLoader from '../DualRingLoader/DualRingLoader'
import { NftPreviewProps } from '../NftView/NftView'
import PlaceCenter from '../PlaceCenter/PlaceCenter'
import useNftAsset from '../useNftAsset/useNftAsset'
import styles from './NftPreview.module.css'

export function MediaPreview(props: MediaPreviewProps) {
  const { contentCategory, ...mediaElementProps } = props
  const imgProps = mediaElementProps as ImgHTMLAttributes<HTMLImageElement>

  switch (contentCategory) {
    case 'model':
      const modelProps = {
        'src': imgProps.src,
        'alt': imgProps.alt,
        'autoplay': 'true',
        'camera-controls': 'true',
        'shadow-intensity': '1',
        'ar-status': 'not-presenting',
        ...mediaElementProps,
      }
      return (
        <model-viewer
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
          }}
          {...modelProps}
        />
      )
    case 'video':
      const videoProps = mediaElementProps as MediaHTMLAttributes<HTMLMediaElement>
      return (
        <video
          onMouseOver={event => {
            event.target.play()
          }}
          onMouseOut={event => {
            event.target.pause()
            event.target.currentTime = 0
          }}
          loop
          muted
          // autoPlay
          playsInline
          preload="metadata"
          controlsList="nodownload"
          {...videoProps}
        />
      )
    case 'application':
      const { src, ...embedProps } = mediaElementProps as EmbedHTMLAttributes<HTMLEmbedElement>
      return <embed src={`${src}#toolbar=0`} {...embedProps} />
    default:
      if (!imgProps.src) {
        return null
      }
      return <img loading="lazy" alt={imgProps.alt} {...imgProps} />
  }
}

export function NftPreview(props: NftPreviewProps) {
  const { nft, LoaderComponent, ErrorComponent, ...imageProps } = props
  const { contentCategory, name, previewSrc, isLoading, error } = useNftAsset(nft)

  if (isLoading) {
    return (
      <PlaceCenter className={styles['nft-image-root']}>
        {LoaderComponent || <DualRingLoader style={{ height: 'unset' }} />}
      </PlaceCenter>
    )
  }
  if (error) {
    return (
      <PlaceCenter className={styles['nft-image-root']}>
        {ErrorComponent ? (
          cloneElement(ErrorComponent, {
            error,
          })
        ) : (
          <span>{error?.message}</span>
        )}
      </PlaceCenter>
    )
  }
  return (
    <div className={styles['nft-image-root']}>
      <MediaPreview
        contentCategory={contentCategory}
        src={previewSrc}
        alt={name}
        className={styles['nft-image-content']}
        {...imageProps}
      />
    </div>
  )
}

export default NftPreview
