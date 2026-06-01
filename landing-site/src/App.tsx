import { useEffect, useMemo, useState } from 'react'
import appleLogo from '../assets/apple-logo.png'
import githubLogo from '../assets/github-icon.webp'
import linuxLogo from '../assets/linux-logo.png'
import windowsLogo from '../assets/windows-logo.svg'

type Platform = 'mac' | 'win' | 'linux' | 'unknown'

type ReleaseAsset = {
  name: string
  browser_download_url: string
}

type ReleaseResponse = {
  tag_name?: string
  assets?: ReleaseAsset[]
}

type SupportedPlatform = Exclude<Platform, 'unknown'>
type Feature = {
  eyebrow: string
  title: string
  body: string
}

const REPO_OWNER = 'Duplad97'
const REPO_NAME = 'gestivo-mono'
const RELEASE_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest`
const RELEASE_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`

const platformMeta: Record<Platform, { label: string; description: string; badge: string }> = {
  mac: {
    label: 'macOS',
    description: 'Universal desktop build for Intel and Apple Silicon Macs.',
    badge: 'macOS'
  },
  win: {
    label: 'Windows',
    description: 'NSIS installer package for 64-bit Windows systems.',
    badge: 'Windows'
  },
  linux: {
    label: 'Linux',
    description: 'Portable AppImage for 64-bit Linux distributions.',
    badge: 'Linux'
  },
  unknown: {
    label: 'Your OS',
    description: 'Choose the installer that matches your operating system.',
    badge: 'Best match'
  }
}

const platformLogos: Record<SupportedPlatform, { src: string; alt: string }> = {
  mac: {
    src: appleLogo,
    alt: 'Apple logo'
  },
  win: {
    src: windowsLogo,
    alt: 'Windows logo'
  },
  linux: {
    src: linuxLogo,
    alt: 'Linux logo'
  }
}

const fallbackPlatformLogo = {
  src: githubLogo,
  alt: 'GitHub logo'
}

const features: Feature[] = [
  {
    eyebrow: 'Gesture Engine',
    title: 'Responsive hand tracking that feels playable.',
    body: 'Gestivo watches live hand landmarks and turns them into stable control signals, so expressive movement stays usable in a real session instead of reading like a demo.'
  },
  {
    eyebrow: 'Studio Flow',
    title: 'A focused interface built for performance, not setup fatigue.',
    body: 'Camera preview, recording, gesture routing, and sound shaping stay in one place, with the heavier controls pushed out of the way until you actually need them.'
  },
  {
    eyebrow: 'Capture',
    title: 'Record the session while the interaction is happening.',
    body: 'Run Gestivo as a live creative instrument, then capture the result as audio or audio-plus-video without breaking the flow between experimentation and output.'
  }
]

const detectPlatform = (): Platform => {
  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes('mac')) {
    return 'mac'
  }

  if (userAgent.includes('win')) {
    return 'win'
  }

  if (userAgent.includes('linux')) {
    return 'linux'
  }

  return 'unknown'
}

const pickBestAsset = (platform: Platform, assets: ReleaseAsset[]): ReleaseAsset | null => {
  if (platform === 'mac') {
    return (
      assets.find((asset) => /mac.*universal.*\.dmg$/i.test(asset.name)) ??
      assets.find((asset) => /mac.*\.dmg$/i.test(asset.name)) ??
      assets.find((asset) => /mac.*\.zip$/i.test(asset.name)) ??
      null
    )
  }

  if (platform === 'win') {
    return assets.find((asset) => /win.*\.exe$/i.test(asset.name)) ?? assets.find((asset) => /\.exe$/i.test(asset.name)) ?? null
  }

  if (platform === 'linux') {
    return assets.find((asset) => /linux.*\.appimage$/i.test(asset.name)) ?? assets.find((asset) => /\.appimage$/i.test(asset.name)) ?? null
  }

  return null
}

function App() {
  const [platform] = useState<Platform>(() => detectPlatform())
  const [release, setRelease] = useState<ReleaseResponse | null>(null)
  const [releaseError, setReleaseError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadLatestRelease = async () => {
      try {
        const response = await fetch(RELEASE_API_URL, {
          headers: {
            Accept: 'application/vnd.github+json'
          }
        })

        if (!response.ok) {
          throw new Error(`GitHub API returned ${response.status}`)
        }

        const payload = (await response.json()) as ReleaseResponse

        if (isMounted) {
          setRelease(payload)
        }
      } catch (error) {
        console.error('Failed to load release metadata.', error)

        if (isMounted) {
          setReleaseError(true)
        }
      }
    }

    void loadLatestRelease()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))

    if (nodes.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            return
          }

          entry.target.classList.remove('is-visible')
        })
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -8% 0px'
      }
    )

    nodes.forEach((node, index) => {
      node.style.setProperty('--reveal-delay', `${index * 80}ms`)
      observer.observe(node)
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  const assets = release?.assets ?? []
  const bestAsset = useMemo(() => pickBestAsset(platform, assets), [assets, platform])
  const platformInfo = platformMeta[platform]
  const platformLogo = platform === 'unknown' ? fallbackPlatformLogo : platformLogos[platform]

  const primaryDownloadHref = bestAsset?.browser_download_url ?? RELEASE_URL
  const primaryDownloadLabel = bestAsset ? `Download for ${platformInfo.label}` : 'Download Latest Release'
  const releaseLabel = release?.tag_name ? `Latest version: ${release.tag_name}` : releaseError ? 'Latest release available on GitHub' : 'Checking latest release'
  const platformHint =
    platform === 'unknown'
      ? 'Choose the build that matches your operating system.'
      : `Recommended download prepared for ${platformInfo.label}.`

  return (
    <main className="site-shell">
      <section className="hero-card">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-copy">
          <div className="hero-topbar">
            <div className="hero-brandline">
              <div className="hero-brand-meta">
                <img className="hero-mark" src="./assets/logo.png" alt="Gestivo icon" />
                <span className="eyebrow">Creative Performance Suite</span>
              </div>
            </div>
            <a className="hero-link" href={`https://github.com/${REPO_OWNER}/${REPO_NAME}`}>
              <img className="hero-link-icon" src={githubLogo} alt="GitHub" />
              <span>Repository</span>
            </a>
          </div>

          <div className="hero-headline-row">
            <h1>Gesture-driven audio control for live creative work.</h1>
            <img className="hero-logo-inline" src="./assets/logo_full.png" alt="Gestivo" />
          </div>
          <p className="hero-text">
            Gestivo brings the visual language of performance into sound control, using webcam-tracked gestures,
            live routing, and recording tools inside a studio surface that stays clean under pressure.
          </p>

          <div className="hero-actions hero-actions-primary">
            <a className="button button-primary button-download" href={primaryDownloadHref}>
              <img className="button-platform-logo" src={platformLogo.src} alt={platformLogo.alt} />
              {primaryDownloadLabel}
            </a>
            <a className="button button-secondary" href={RELEASE_URL}>
              View All Releases
            </a>
          </div>

          <div className="warning-banner">
            <span className="warning-dot" />
            <span>These are unsigned preview builds. Your OS may show a security warning before first launch.</span>
          </div>

          <div className="release-meta">
            <span>{platformHint}</span>
            <span>{releaseLabel}</span>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-label">Recommended build</span>
              <strong>{platformInfo.badge}</strong>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">Release source</span>
              <strong>GitHub Releases</strong>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">Package status</span>
              <strong>Unsigned preview</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid" aria-label="Product features">
        {features.map((feature) => (
          <article key={feature.eyebrow} className="feature-card" data-reveal>
            <span className="card-kicker">{feature.eyebrow}</span>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="cta-band" data-reveal>
        <div className="cta-copy">
          <span className="eyebrow">Desktop Preview</span>
          <h2>Install the build that matches your machine and start experimenting.</h2>
          <p className="section-copy">
            The landing page detects your platform automatically, but every release stays available on GitHub if you want the full asset list.
          </p>
        </div>
        <div className="cta-actions">
          <a className="button button-primary button-download" href={primaryDownloadHref}>
            <img className="button-platform-logo" src={platformLogo.src} alt={platformLogo.alt} />
            {primaryDownloadLabel}
          </a>
          <a className="button button-secondary" href={`https://github.com/${REPO_OWNER}/${REPO_NAME}`}>
            <img className="hero-link-icon" src={githubLogo} alt="GitHub" />
            Source and releases
          </a>
        </div>
      </section>
    </main>
  )
}

export default App
