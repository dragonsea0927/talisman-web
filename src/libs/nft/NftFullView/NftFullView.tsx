import React, {
  cloneElement,
  EmbedHTMLAttributes,
  ImgHTMLAttributes,
  MediaHTMLAttributes,
} from 'react';

// To Do: Put all interfaces within a component for easier access
import { NftPreviewProps } from '../NftView/NftView';

import DualRingLoader from '../DualRingLoader/DualRingLoader';
import PlaceCenter from '../PlaceCenter/PlaceCenter';
import styles from './NftFullView.module.css';
import useNftAsset from '../useNftAsset/useNftAsset';
import '@google/model-viewer';
import { MediaPreviewProps } from '@util/nfts/types';

function MediaPreview(props: MediaPreviewProps) {
  const { contentCategory, ...mediaElementProps } = props;
  const imgProps = mediaElementProps as ImgHTMLAttributes<HTMLImageElement>;

  

  switch (contentCategory) {
    case 'model':
      const modelProps = {
        src: imgProps.src,
        alt: imgProps.alt,
        autoplay: 'true',
        'camera-controls': 'true',
        'shadow-intensity': '1',
        'ar-status': 'not-presenting',
        ...mediaElementProps,
      };
      return (
        <model-viewer
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
          }}
          {...modelProps}
        />
      );
    case 'video':
      const videoProps =
        mediaElementProps as MediaHTMLAttributes<HTMLMediaElement>;
      return (
        <video
          loop
          muted
          playsInline
          preload="metadata"
          controls={true}
          {...videoProps}
        />
      );
    case 'application':
      const { src, ...embedProps } =
        mediaElementProps as EmbedHTMLAttributes<HTMLEmbedElement>;
      return <embed src={`${src}#toolbar=0`} {...embedProps} />;
    default:
      if (!imgProps.src) {
        return null;
      }
      return <img loading="lazy" {...imgProps} />;
  }
}

export function NftFullView(props: NftPreviewProps) {
  const { nft, LoaderComponent, ErrorComponent, ...imageProps } = props;
  const { contentCategory, name, previewSrc, isLoading, error } =
    useNftAsset(nft);

  if (isLoading) {
    return (
      <PlaceCenter className={styles['nft-image-root']}>
        {LoaderComponent || <DualRingLoader style={{ height: 'unset' }} />}
      </PlaceCenter>
    );
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
    );
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
  );
}

export default NftFullView;
