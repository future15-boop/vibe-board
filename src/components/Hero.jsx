export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap">
        <div className="hero__eyebrow">
          <span className="m-stripe--short" />
          <span className="label-up">Vibe Coding Academy</span>
        </div>
        <h1 className="display-xl">Code With<br />The Machine</h1>
        <p className="body-md">
          AI와 함께 코딩하는 새로운 방식, 바이브코딩. 문법 암기가 아닌 의도 설계로
          아이디어를 실제 제품으로 만드는 실전 커뮤니티에 오신 것을 환영합니다.
        </p>
        <div className="hero__actions">
          <a href="#board" className="btn btn--primary">
            게시판 둘러보기 <span className="btn__arrow">→</span>
          </a>
          <a href="#apply" className="btn btn--outline">4기 수강신청</a>
        </div>
      </div>
    </section>
  )
}
