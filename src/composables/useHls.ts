import { ref, watch, type Ref } from 'vue'
import type HlsType from 'hls.js'
import type { VideoSource } from '../types'

export function useHls(
  videoRef: Ref<HTMLVideoElement | null>,
  currentSource: Ref<VideoSource | undefined>,
  autoPlay: boolean = false
): {
  hls: Ref<HlsType | null>
  initHls: () => Promise<void>
  destroyHls: () => void
} {
  const hls = ref<HlsType | null>(null)
  let Hls: any = null

  const initHls = async () => {
    if (typeof window === 'undefined') return

    if (!Hls) {
      try {
        const m = await import('hls.js')
        Hls = m.default
      } catch (e) {
        // @ts-ignore
        if (window.Hls) Hls = window.Hls
      }
    }

    if (!videoRef.value || !currentSource.value?.url || !Hls) return

    const url = currentSource.value.url
    const isHls = currentSource.value.format === 'hls' || url.includes('.m3u8')

    if (hls.value) {
      hls.value.destroy()
      hls.value = null
    }

    if (isHls && Hls.isSupported()) {
      const hlsInstance = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true
      })
      hlsInstance.loadSource(url)
      hlsInstance.attachMedia(videoRef.value)
      hls.value = hlsInstance
    } else {
      videoRef.value.src = url
    }

    if (autoPlay) {
      videoRef.value.play().catch(() => {})
    }
  }

  watch(() => currentSource.value?.url, () => {
    initHls()
  })

  const destroyHls = () => {
    if (hls.value) {
      hls.value.destroy()
      hls.value = null
    }
  }

  return {
    hls,
    initHls,
    destroyHls
  }
}
