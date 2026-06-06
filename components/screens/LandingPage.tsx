'use client'

import { Play, Mic, Zap, Film, ChevronRight, Star, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/voxreel/Logo'
import { VideoPreviewPhoneFrame } from '@/components/voxreel/VideoPreviewPhoneFrame'

interface LandingPageProps {
  onGetStarted: () => void
}

const features = [
  { icon: Mic, title: 'Voice to Story', desc: 'Record your story. Our AI understands emotion, pacing, and narrative arc.' },
  { icon: Film, title: 'Cinematic Scenes', desc: 'Auto-matched B-roll clips, motion presets, and cinematic color grades.' },
  { icon: Zap, title: 'One-Tap Render', desc: 'Export 9:16 vertical reels for TikTok, Reels, and Shorts instantly.' },
]

const testimonials = [
  { name: 'Maya Chen', handle: '@mayastories', quote: '3M views on my first VoxReel. It felt like a film crew in my pocket.', stars: 5 },
  { name: 'Jordan Reeves', handle: '@jreeves_creates', quote: 'The emotion matching is insane. Every scene hits exactly right.', stars: 5 },
  { name: 'Sofia Morales', handle: '@sofiavoices', quote: "I went from 2K to 180K followers in 6 weeks. VoxReel changed my life.", stars: 5 },
]

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4" style={{ backgroundColor: 'rgba(7,8,10,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(37,42,51,0.5)' }}>
        <Logo size="sm" />
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          <a href="#features" className="text-sm text-secondary-text hover:text-foreground transition-colors">Features</a>
          <a href="#examples" className="text-sm text-secondary-text hover:text-foreground transition-colors">Examples</a>
          <a href="#pricing" className="text-sm text-secondary-text hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <button
          onClick={onGetStarted}
          className="text-sm font-semibold px-4 py-2 rounded-xl text-foreground transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #D64545, #B03030)' }}
        >
          Start Free
        </button>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background radial glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(214,69,69,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.07) 0%, transparent 70%)' }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(244,241,234,1) 1px, transparent 1px), linear-gradient(90deg, rgba(244,241,234,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgba(214,69,69,0.1)', border: '1px solid rgba(214,69,69,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-accent animate-pulse" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-widest uppercase text-red-accent">AI Cinematic Studio</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tight text-balance mb-6">
                Turn voice{' '}
                <span className="relative inline-block">
                  <span className="text-foreground">stories</span>
                  <span
                    className="absolute bottom-1 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #D64545, #7C5CFF)' }}
                    aria-hidden="true"
                  />
                </span>{' '}
                into cinematic{' '}
                <span style={{ WebkitTextStroke: '1px rgba(214,69,69,0.8)', color: 'transparent' }}>reels.</span>
              </h1>

              <p className="text-lg text-secondary-text leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 text-pretty">
                Record your story. VoxReel analyzes emotion, matches cinematic footage, and renders premium vertical videos — in minutes, not hours.
              </p>

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button
                  onClick={onGetStarted}
                  className="flex items-center gap-3 px-7 py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 w-full sm:w-auto justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #D64545, #B03030)',
                    boxShadow: '0 0 30px rgba(214,69,69,0.4)',
                  }}
                >
                  <Mic className="w-5 h-5" />
                  Record Your First Story
                </button>
                <button className="flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-secondary-text hover:text-foreground transition-colors text-base">
                  <Play className="w-4 h-4" />
                  Watch Demo
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 mt-8 justify-center lg:justify-start">
                <div className="flex -space-x-2" aria-hidden="true">
                  {['#D64545', '#7C5CFF', '#D6B36A', '#5CAF7C'].map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-background" style={{ backgroundColor: c, zIndex: 4 - i }} />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5" aria-label="5 stars">
                    {[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 text-gold-accent fill-current" style={{ color: '#D6B36A' }} />)}
                  </div>
                  <p className="text-xs text-secondary-text mt-0.5">Loved by <strong className="text-foreground">12,000+</strong> creators</p>
                </div>
              </div>
            </div>

            {/* Right — phone preview */}
            <div className="relative flex-shrink-0">
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(214,69,69,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} aria-hidden="true" />
                <VideoPreviewPhoneFrame />
              </div>

              {/* Floating metric cards */}
              <div
                className="absolute -left-6 top-1/4 px-3 py-2 rounded-xl hidden lg:block"
                style={{ backgroundColor: '#111318', border: '1px solid #252A33', backdropFilter: 'blur(8px)' }}
                aria-hidden="true"
              >
                <p className="text-[10px] text-secondary-text uppercase tracking-wide">Emotion Detected</p>
                <p className="text-sm font-bold" style={{ color: '#D64545' }}>Betrayal · 82%</p>
              </div>

              <div
                className="absolute -right-6 bottom-1/3 px-3 py-2 rounded-xl hidden lg:block"
                style={{ backgroundColor: '#111318', border: '1px solid #252A33' }}
                aria-hidden="true"
              >
                <p className="text-[10px] text-secondary-text uppercase tracking-wide">Clip Match</p>
                <p className="text-sm font-bold" style={{ color: '#D6B36A' }}>92% · Perfect</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-3">How It Works</p>
            <h2 className="text-4xl font-bold text-foreground text-balance">Three steps to cinematic.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-border group hover:border-red-accent/30 transition-all duration-300"
                  style={{ backgroundColor: '#111318' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(214,69,69,0.12)', border: '1px solid rgba(214,69,69,0.2)' }}
                  >
                    <Icon className="w-5 h-5 text-red-accent" />
                  </div>
                  <div className="text-xs font-bold text-secondary-text tracking-widest uppercase mb-2">Step {i + 1}</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-secondary-text leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6" style={{ borderTop: '1px solid #252A33' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Creators love VoxReel</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-border"
                style={{ backgroundColor: '#111318' }}
              >
                <div className="flex items-center gap-0.5 mb-3" aria-label={`${t.stars} stars`}>
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-current" style={{ color: '#D6B36A' }} />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-secondary-text">{t.handle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6" style={{ borderTop: '1px solid #252A33' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-3">Simple pricing</h2>
            <p className="text-secondary-text">Start free. Scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Starter', price: 'Free', reels: '3 reels/mo', features: ['Basic styles', '720p export', 'Watermark'] },
              { name: 'Creator', price: '$19', reels: '30 reels/mo', features: ['All styles', '4K export', 'No watermark', 'Priority render'], highlight: true },
              { name: 'Studio', price: '$49', reels: 'Unlimited', features: ['Custom styles', '4K export', 'API access', 'Team seats'] },
            ].map((plan) => (
              <div
                key={plan.name}
                className="p-6 rounded-2xl border transition-all"
                style={{
                  backgroundColor: plan.highlight ? 'rgba(214,69,69,0.06)' : '#111318',
                  borderColor: plan.highlight ? '#D64545' : '#252A33',
                  boxShadow: plan.highlight ? '0 0 30px rgba(214,69,69,0.1)' : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-secondary-text uppercase tracking-wide">{plan.name}</p>
                  {plan.highlight && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#D64545', color: '#fff' }}>Popular</span>
                  )}
                </div>
                <div className="mb-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.price !== 'Free' && <span className="text-secondary-text text-sm">/mo</span>}
                </div>
                <p className="text-xs text-secondary-text mb-5">{plan.reels}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGetStarted}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                  style={plan.highlight
                    ? { background: 'linear-gradient(135deg, #D64545, #B03030)', color: '#fff' }
                    : { backgroundColor: '#1A1E26', color: '#F4F1EA', border: '1px solid #252A33' }
                  }
                >
                  Get Started <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 text-center" style={{ borderTop: '1px solid #252A33' }}>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
          Your story deserves to be a film.
        </h2>
        <p className="text-secondary-text mb-8 max-w-md mx-auto">Start recording. VoxReel handles the rest.</p>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #D64545, #B03030)', boxShadow: '0 0 40px rgba(214,69,69,0.4)' }}
        >
          <Mic className="w-5 h-5" />
          Start Creating Free
        </button>
      </section>
    </div>
  )
}
