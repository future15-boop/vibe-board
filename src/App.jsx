import { AuthProvider } from './context/AuthContext'
import TopNav from './components/TopNav'
import Hero from './components/Hero'
import StatsBand from './components/StatsBand'
import Board from './components/Board'
import Footer from './components/Footer'

export default function App() {
  return (
    <AuthProvider>
      <TopNav />
      <Hero />
      <hr className="m-stripe" />
      <StatsBand />
      <Board />
      <Footer />
    </AuthProvider>
  )
}
