import { useAuth } from '../context/AuthContext'

export default function TopNav() {
  const { profile, signInWithGoogle, signOut } = useAuth()

  return (
    <header className="nav">
      <div className="wrap nav__inner">
        <a className="brand" href="#top" aria-label="VIBE CODING">
          <span className="brand__stripe" />
          <span className="brand__mark">VIBE<span>.</span>CODING</span>
        </a>
        <nav>
          <ul className="nav__menu">
            <li><a href="#curriculum">Curriculum</a></li>
            <li><a href="#board" data-active="true">Community</a></li>
            <li><a href="#reviews">Reviews</a></li>
            <li><a href="#">Mentors</a></li>
            <li><a href="#">Pricing</a></li>
          </ul>
        </nav>
        <div className="nav__right">
          {profile ? (
            <div className="authbox">
              <span className="authbox__user">
                {profile.avatar && <img className="authbox__avatar" src={profile.avatar} alt="" />}
                <span className="authbox__name">{profile.name}</span>
              </span>
              <button className="authbox__link" onClick={signOut}>로그아웃</button>
            </div>
          ) : (
            <button className="authbox__link" onClick={signInWithGoogle}>
              <span className="authbox__g" aria-hidden>G</span> Google 로그인
            </button>
          )}
          <a href="#apply" className="btn btn--light btn--sm">수강신청</a>
          <button className="nav__burger" aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
  )
}
