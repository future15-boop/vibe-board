export default function Footer() {
  return (
    <>
      <section className="cta" id="apply">
        <div className="wrap">
          <h2 className="display-md">Join The Grid</h2>
          <p className="body-md">
            바이브코딩 4기와 함께 아이디어를 제품으로. 얼리버드 마감까지 D-3.
          </p>
          <a href="#" className="btn btn--outline">지금 수강신청하기 <span className="btn__arrow">→</span></a>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <div className="footer__cols">
            <div className="footer__col">
              <h4>Program</h4>
              <ul>
                <li><a href="#">부트캠프 4기</a></li>
                <li><a href="#">주말 트랙</a></li>
                <li><a href="#">기업 교육</a></li>
                <li><a href="#">커리큘럼</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h4>Community</h4>
              <ul>
                <li><a href="#board">게시판</a></li>
                <li><a href="#">프로젝트 갤러리</a></li>
                <li><a href="#">멘토링</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h4>Support</h4>
              <ul>
                <li><a href="#">자주 묻는 질문</a></li>
                <li><a href="#">문의하기</a></li>
                <li><a href="#">환불 정책</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h4>Company</h4>
              <ul>
                <li><a href="#">소개</a></li>
                <li><a href="#">채용</a></li>
                <li><a href="#">블로그</a></li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <span className="caption">© 2026 VIBE CODING ACADEMY. Code with the machine.</span>
            <span className="caption">KO · 대한민국</span>
          </div>
        </div>
      </footer>
    </>
  )
}
