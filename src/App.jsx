import TopNav from './components/TopNav'
import Hero from './components/Hero'
import StatsBand from './components/StatsBand'
import Board from './components/Board'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <TopNav />
      <Hero />
      <hr className="m-stripe" />
      <StatsBand />
      <Board />
      <Footer />
    </>
  )
}
