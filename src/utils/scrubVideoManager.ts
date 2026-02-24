type WrapperData = {
  index: number
  wrapper: HTMLElement
  container: HTMLElement
  video: HTMLVideoElement
  top: number
  bottom: number
  objectUrl: string | null
  loadedSource: string | null
}

const SCRUB_PROGRESS_MAX = 0.998
const MIN_SEEK_DELTA_SECONDS = 1 / 120

export class ScrubVideoManager {
  private observer: IntersectionObserver | null = null
  private wrapperDataByIndex = new Map<number, WrapperData>()
  private wrapperIndexByElement = new WeakMap<HTMLElement, number>()
  private nextIndex = 0
  private activeVideoWrapper: number | null = null
  private isListening = false
  private scrollRaf: number | null = null
  private latestScrollY = 0

  register(wrapper: HTMLElement) {
    if (typeof window === 'undefined') return

    const existingIndex = this.wrapperIndexByElement.get(wrapper)
    if (existingIndex !== undefined) {
      this.refreshWrapper(existingIndex)
      this.updateWrapperPositions()
      this.scrubForScrollY(window.scrollY)
      return
    }

    const container = wrapper.querySelector('.scrub-video-container')
    const video = wrapper.querySelector('video')
    if (!(container instanceof HTMLElement) || !(video instanceof HTMLVideoElement)) {
      return
    }

    const index = this.nextIndex++
    wrapper.setAttribute('data-scrub-video-index', String(index))
    this.wrapperIndexByElement.set(wrapper, index)
    this.wrapperDataByIndex.set(index, {
      index,
      wrapper,
      container,
      video,
      top: 0,
      bottom: 0,
      objectUrl: null,
      loadedSource: null,
    })

    this.ensureObserver()
    this.ensureListeners()
    this.observer?.observe(container)
    this.forceLoadVideo(index)
    this.updateWrapperPositions()
    this.scrubForScrollY(window.scrollY)
  }

  unregister(wrapper: HTMLElement) {
    const index = this.wrapperIndexByElement.get(wrapper)
    if (index === undefined) return

    const data = this.wrapperDataByIndex.get(index)
    if (data) {
      this.observer?.unobserve(data.container)
      this.disposeWrapperData(data)
      this.wrapperDataByIndex.delete(index)
    }

    if (this.activeVideoWrapper === index) {
      this.activeVideoWrapper = null
    }

    wrapper.removeAttribute('data-scrub-video-index')
    this.wrapperIndexByElement.delete(wrapper)

    if (this.wrapperDataByIndex.size === 0) {
      this.teardown()
    }
  }

  refreshWrapperPositions() {
    if (typeof window === 'undefined') return
    this.updateWrapperPositions()
  }

  private refreshWrapper(index: number) {
    const data = this.wrapperDataByIndex.get(index)
    if (!data) return

    const container = data.wrapper.querySelector('.scrub-video-container')
    const video = data.wrapper.querySelector('video')
    if (!(container instanceof HTMLElement) || !(video instanceof HTMLVideoElement)) {
      return
    }

    if (data.container !== container) {
      this.observer?.unobserve(data.container)
      data.container = container
      this.observer?.observe(container)
    }

    if (data.video !== video) {
      if (data.objectUrl) {
        URL.revokeObjectURL(data.objectUrl)
      }
      data.video = video
      data.objectUrl = null
      data.loadedSource = null
      this.forceLoadVideo(index)
    }
  }

  private ensureObserver() {
    if (this.observer || typeof window === 'undefined') return

    this.observer = new IntersectionObserver(this.intersectionObserverCallback, {
      threshold: 1,
    })
  }

  private ensureListeners() {
    if (this.isListening || typeof window === 'undefined') return

    this.isListening = true
    document.addEventListener('scroll', this.handleScrollEvent, { passive: true })
    window.addEventListener('resize', this.handleResizeEvent, { passive: true })
  }

  private teardown() {
    if (typeof window === 'undefined') return

    if (this.scrollRaf !== null) {
      window.cancelAnimationFrame(this.scrollRaf)
      this.scrollRaf = null
    }

    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    if (this.isListening) {
      document.removeEventListener('scroll', this.handleScrollEvent)
      window.removeEventListener('resize', this.handleResizeEvent)
      this.isListening = false
    }

    this.wrapperDataByIndex.forEach((data) => this.disposeWrapperData(data))
    this.wrapperDataByIndex.clear()
    this.activeVideoWrapper = null
  }

  private disposeWrapperData(data: WrapperData) {
    if (data.objectUrl) {
      URL.revokeObjectURL(data.objectUrl)
      data.objectUrl = null
    }
    data.loadedSource = null
  }

  private updateWrapperPositions() {
    this.wrapperDataByIndex.forEach((data) => {
      const clientRect = data.wrapper.getBoundingClientRect()
      const top = clientRect.y + window.scrollY
      const bottom = clientRect.bottom - window.innerHeight + window.scrollY

      data.top = top
      data.bottom = bottom
    })
  }

  private intersectionObserverCallback: IntersectionObserverCallback = (entries) => {
    let nextActive = this.activeVideoWrapper

    entries.forEach((entry) => {
      const isWithinViewport = entry.intersectionRatio === 1
      entry.target.classList.toggle('in-view', isWithinViewport)

      const wrapper = entry.target.parentElement
      if (!wrapper) return

      const indexValue = wrapper.getAttribute('data-scrub-video-index')
      if (!indexValue) return

      const index = Number(indexValue)
      if (Number.isNaN(index)) return

      if (isWithinViewport) {
        nextActive = index
        return
      }

      if (nextActive === index) {
        nextActive = null
      }
    })

    this.activeVideoWrapper = nextActive

    if (this.activeVideoWrapper !== null) {
      this.scrubForScrollY(window.scrollY)
    }
  }

  private handleResizeEvent = () => {
    this.updateWrapperPositions()
    this.scrubForScrollY(window.scrollY)
  }

  private handleScrollEvent = () => {
    this.latestScrollY = window.scrollY

    if (this.scrollRaf !== null) {
      return
    }

    this.scrollRaf = window.requestAnimationFrame(() => {
      this.scrollRaf = null
      this.scrubForScrollY(this.latestScrollY)
    })
  }

  private scrubForScrollY(scrollY: number) {
    if (this.activeVideoWrapper === null) return

    const data = this.wrapperDataByIndex.get(this.activeVideoWrapper)
    if (!data || !data.video.duration || Number.isNaN(data.video.duration)) {
      return
    }

    const range = data.bottom - data.top
    if (range <= 0) return

    const progress = Math.max(
      Math.min((scrollY - data.top) / range, SCRUB_PROGRESS_MAX),
      0
    )
    const seekTime = progress * data.video.duration

    if (Math.abs(data.video.currentTime - seekTime) < MIN_SEEK_DELTA_SECONDS) {
      return
    }

    data.video.currentTime = seekTime
  }

  private forceLoadVideo(index: number) {
    const data = this.wrapperDataByIndex.get(index)
    if (!data) return

    const sourcePath = this.getVideoSource(data.video)
    if (!sourcePath || data.loadedSource === sourcePath) {
      return
    }

    data.loadedSource = sourcePath

    fetch(sourcePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to fetch video: ${response.status}`)
        }
        return response.blob()
      })
      .then((blob) => {
        const currentData = this.wrapperDataByIndex.get(index)
        if (!currentData || currentData.video !== data.video) {
          return
        }

        const objectUrl = URL.createObjectURL(blob)

        if (currentData.objectUrl) {
          URL.revokeObjectURL(currentData.objectUrl)
        }

        currentData.objectUrl = objectUrl
        currentData.video.setAttribute('src', objectUrl)
        currentData.video.load()
      })
      .catch(() => {
        // Fallback to browser-managed buffering if fetch/object URL fails.
      })
  }

  private getVideoSource(videoElement: HTMLVideoElement): string | null {
    const sourceTag = videoElement.querySelector('source')
    if (sourceTag?.getAttribute('src')) {
      return sourceTag.getAttribute('src')
    }

    const directSource = videoElement.getAttribute('src')
    if (directSource) return directSource

    return videoElement.currentSrc || null
  }
}

let scrubVideoManagerSingleton: ScrubVideoManager | null = null

export function getScrubVideoManager(): ScrubVideoManager {
  if (!scrubVideoManagerSingleton) {
    scrubVideoManagerSingleton = new ScrubVideoManager()
  }

  return scrubVideoManagerSingleton
}
