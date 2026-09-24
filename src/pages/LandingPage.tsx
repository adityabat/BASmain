import { useState } from 'react'
import { DigitalEmployees } from '../components/landing/DigitalEmployees'
import { LandingContact } from '../components/landing/LandingContact'
import { LandingFaq } from '../components/landing/LandingFaq'
import { LandingFooter } from '../components/landing/LandingFooter'
import { LandingHero } from '../components/landing/LandingHero'
import { SolutionsSection } from '../components/landing/SolutionsSection'
import { TrustSection } from '../components/landing/TrustSection'
import { ProductWorkspace } from '../components/ProductWorkspace'
import { SiteHeader } from '../components/SiteHeader'
import { workflowProducts } from '../data/products'

type LandingPageProps = {
  onGetStarted: () => void
  onSignIn: () => void
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [activeProductId, setActiveProductId] = useState<string | null>(null)
  const activeProduct = workflowProducts.find((p) => p.id === activeProductId) ?? null

  function goHome(hash?: string) {
    setActiveProductId(null)
    window.setTimeout(() => {
      if (hash) {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 0)
  }

  return (
    <div className={`${activeProduct ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col bg-[#f4f7fc] dark:bg-[#070d1a] text-[#0c2348] dark:text-white`}>
      <SiteHeader
        activeProductId={activeProductId}
        onSelectProduct={setActiveProductId}
        onGoHome={goHome}
        onSignIn={onSignIn}
      />

      {activeProduct ? (
        <ProductWorkspace product={activeProduct} onGoHome={() => goHome()} />
      ) : (
        <>
          <LandingHero />
          <DigitalEmployees onSelect={setActiveProductId} />
          <TrustSection />
          <SolutionsSection />
          <LandingContact />
          <LandingFaq />
          <LandingFooter onGetStarted={onGetStarted} onSignIn={onSignIn} />
        </>
      )}
    </div>
  )
}
