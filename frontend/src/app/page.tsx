'use client'

import { useState } from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import WhySignSpeak from '../components/WhySignSpeak'
import HowItWorks from '../components/HowItWorks'
import SignSpeakInAction from '../components/SignSpeakInAction'
import KeyFeatures from '../components/KeyFeatures'
import OurMission from '../components/OurMission'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <WhySignSpeak />
      <HowItWorks />
      <SignSpeakInAction />
      <KeyFeatures />
      <OurMission />
      <Footer />
    </main>
  )
}