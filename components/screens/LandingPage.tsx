'use client'

import { Mic, Film, Zap, ArrowRight, Star } from 'lucide-react'
import { Logo } from '@/components/voxreel/Logo'
import { VideoPreviewPhoneFrame } from '@/components/voxreel/VideoPreviewPhoneFrame'

interface LandingPageProps {
  onGetStarted: () => void
}

const features = [
  { icon: Mic, title: 'Voice to Story', desc: 'Record your story. Our AI understands emotion, pacing, and narrative arc.' },
  { icon: Film, title: 'Cinematic Scenes', desc: 'Auto-matched B-roll, cinematic color grades, and motion presets.' },
  { icon: Zap, title: 'One-Tap Render', desc: 'Export 9:16 reels for TikTok, Reels, and Shorts — in minutes.' },
]

const testimonials = [
  { name: 'Maya Chen', handle: '@mayastories', quote: '3M views on my first VoxReel. Felt like a film crew in my pocket.', stars: 5 },
  { name: 'Jordan Reeves', handle: '@jreeves_creates', quote: 'The emotion matching is uncanny. Every scene hits exactly right.', stars: 5 },
  { name: 'Sofia Morales', handle: '@sofiavoices', quote: 'From 2K to 180K followers in six weeks. VoxReel changed everything.', stars: 5 },
]

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: 'rgba(6,7,8,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(28,32,41,0.6)',
        }}
      >
        <Logo size="sm" />
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {['Features', 'Examples', 'Pricing'].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-secondary-text hover:text-foreground transition-colors tracking-wide">
              {l}
            </a>
          ))}
        </nav>
        <button
          onClick={onGetStarted}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl text-foreground border border-border hover:border-foreground/30 hover:bg-muted transition-all"
        >
          Sign In
        </button>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-0 left-0 right-0 h-[70vh]"
            style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(196,60,60,0.06) 0%, transparent 65%)' }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[40vh]"
            style={{ background: 'radial-gradient(ellipse at 40% 100%, rgba(107,79,232,0.05) 0%, transparent 65%)' }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              {/* Eyebrow */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
                style={{ backgroundColor: 'rgba(196,60,60,0.08)', border: '1px solid rgba(196,60,60,0.2)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-accent animate-pulse" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: '#C43C3C' }}>
                  AI Cinematic Studio
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-[68px] font-bold text-foreground leading-[1.04] tracking-tight text-balance mb-6">
                Turn voice into{' '}
                <br className="hidden lg:block" />
                <span className="relative inline-block">
                  cinematic reels.
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, rgba(196,60,60,0.7), rgba(107,79,232,0.5), transparent)' }}
                    aria-hidden="true"
                  />
                </span>
              </h1>

              <p className="text-lg leading-relaxed max-w-md mx-auto lg:mx-0 mb-10 text-pretty" style={{ color: '#7A8394' }}>
                Record your story. VoxReel analyzes emotion, matches cinematic footage, and renders premium vertical videos — in minutes.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-10">
                <button
                  onClick={onGetStarted}
                  className="flex items-center gap-2.5 px-7 py-4 rounded-2xl font-semibold text-white text-[15px] transition-all hover:opacity-92 active:scale-[0.98] w-full sm:w-auto justify-center"
                  style={{
                    backgroundColor: '#C43C3C',
                    boxShadow: '0 0 32px rgba(196,60,60,0.35)',
                  }}
                >
                  <Mic className="w-4.5 h-4.5" />
                  Start Recording Free
                </button>
                <button
                  onClick={onGetStarted}
                  className="flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-[15px] border border-border hover:border-foreground/20 hover:bg-muted transition-all w-full sm:w-auto justify-center"
                  style={{ color: '#7A8394' }}
                >
                  Watch a Demo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2" aria-hidden="true">
                  {['#C43C3C', '#6B4FE8', '#C9A45A', '#4A8F6A'].map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2"
                      style={{ backgroundColor: c, borderColor: '#060708', zIndex: 4 - i }}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5" aria-label="5 star rating">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" style={{ color: '#C9A45A' }} />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: '#7A8394' }}>
                    <strong className="text-foreground font-semibold">12,000+</strong> creators worldwide
                  </p>
                </div>
              </div>
            </div>

            {/* Right — phone, centered and immersive */}
            <div className="relative flex-shrink-0 flex flex-col items-center">
              {/* Outer glow ring */}
              <div
                className="absolute pointer-events-none"
                style={{
                  inset: -48,
                  background: 'radial-gradient(ellipse at center, rgba(196,60,60,0.1) 0%, transparent 65%)',
                  filter: 'blur(8px)',
                }}
                aria-hidden="true"
              />

              <VideoPreviewPhoneFrame />

              {/* Floating cards */}
              <div
                className="absolute -left-8 top-[20%] px-3.5 py-2.5 rounded-2xl hidden lg:block"
                style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                aria-hidden="true"
              >
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#7A8394' }}>Emotion</p>
                <p className="text-sm font-bold" style={{ color: '#C43C3C' }}>Betrayal · 82%</p>
              </div>

              <div
                className="absolute -right-8 bottom-[28%] px-3.5 py-2.5 rounded-2xl hidden lg:block"
                style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                aria-hidden="true"
              >
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#7A8394' }}>Clip Match</p>
                <p className="text-sm font-bold" style={{ color: '#C9A45A' }}>92% · Perfect</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6" style={{ borderTop: '1px solid #1C2029' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.14em] mb-4" style={{ color: '#7A8394' }}>How It Works</p>
            <h2 className="text-4xl font-bold text-foreground text-balance">Three steps to cinematic.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="p-8 rounded-2xl"
                  style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: '#141720', border: '1px solid #1C2029' }}
                  >
                    <Icon className="w-4.5 h-4.5 text-foreground" />
                  </div>
                  <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-3" style={{ color: '#7A8394' }}>Step {i + 1}</p>
                  <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#7A8394' }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 px-6" style={{ borderTop: '1px solid #1C2029' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-14">What creators say</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-7 rounded-2xl flex flex-col gap-4"
                style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029' }}
              >
                <div className="flex gap-0.5" aria-label={`${t.stars} stars`}>
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-current" style={{ color: '#C9A45A' }} />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#7A8394' }}>{t.handle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-6" style={{ borderTop: '1px solid #1C2029' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-3">Simple pricing</h2>
            <p style={{ color: '#7A8394' }}>Start free. Scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Starter', price: 'Free', reels: '3 reels / month', features: ['Basic styles', '720p export', 'Watermark'], highlight: false },
              { name: 'Creator', price: '$19', reels: '30 reels / month', features: ['All styles', '4K export', 'No watermark', 'Priority render'], highlight: true },
              { name: 'Studio', price: '$49', reels: 'Unlimited', features: ['Custom styles', '4K export', 'API access', 'Team seats'], highlight: false },
            ].map((plan) => (
              <div
                key={plan.name}
                className="p-7 rounded-2xl"
                style={{
                  backgroundColor: plan.highlight ? 'rgba(196,60,60,0.05)' : '#0E0F14',
                  border: plan.highlight ? '1px solid rgba(196,60,60,0.3)' : '1px solid #1C2029',
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: '#7A8394' }}>{plan.name}</p>
                  {plan.highlight && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(196,60,60,0.15)', color: '#C43C3C', border: '1px solid rgba(196,60,60,0.25)' }}
                    >
                      Most Popular
                    </span>
                  )}
                </div>
                <div className="mb-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.price !== 'Free' && <span className="text-sm ml-1" style={{ color: '#7A8394' }}>/mo</span>}
                </div>
                <p className="text-xs mb-7" style={{ color: '#7A8394' }}>{plan.reels}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: plan.highlight ? '#C43C3C' : '#7A8394' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGetStarted}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                  style={plan.highlight
                    ? { backgroundColor: '#C43C3C', color: '#fff' }
                    : { backgroundColor: '#141720', color: '#F0EDE6', border: '1px solid #1C2029' }
                  }
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-6 text-center" style={{ borderTop: '1px solid #1C2029' }}>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-5" style={{ color: '#7A8394' }}>Ready?</p>
        <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance leading-[1.04]">
          Your story deserves<br />to be a film.
        </h2>
        <p className="mb-10 max-w-sm mx-auto" style={{ color: '#7A8394' }}>Start recording. VoxReel handles the rest.</p>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-white text-base transition-all hover:opacity-92 active:scale-[0.98]"
          style={{ backgroundColor: '#C43C3C', boxShadow: '0 0 40px rgba(196,60,60,0.3)' }}
        >
          <Mic className="w-4.5 h-4.5" />
          Start Creating Free
        </button>
      </section>
    </div>
  )
}
