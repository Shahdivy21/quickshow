import React from 'react'
import FeaturedSection from '../components/FeaturedSection'
import TrailersSection from '../components/TrailersSection'
import HeroSlider from '../components/HeroSlider'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const { showsLoading } = useAuth();

  if (showsLoading) {
    return <Loading />;
  }

  return (
    <>
      <HeroSlider/>
      <FeaturedSection />
      <TrailersSection/>
    </>
  )
}

export default Home
