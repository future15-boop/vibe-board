export default function TopNav() {
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
          <a href="#" className="body-sm" style={{ letterSpacing: '.5px' }}>로그인</a>
          <a href="#apply" className="btn btn--light btn--sm">수강신청</a>
          <button className="nav__burger" aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
  )
}
