import { useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'

// Swiper 기본 스타일 (필수)
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// 슬라이드 데이터 — 바이브코딩 커뮤니티 배너
const SLIDES = [
  {
    id: 1,
    eyebrow: 'Vibe Coding Academy',
    title: 'Code With The Machine',
    desc: 'AI와 함께 코딩하는 새로운 방식. 의도 설계로 아이디어를 제품으로 만듭니다.',
    cta: '4기 수강신청',
    image:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 2,
    eyebrow: 'Real Project',
    title: 'Build What Matters',
    desc: '기획부터 배포까지, 실전 프로젝트로 완성하는 포트폴리오. 480개의 완성작이 증명합니다.',
    cta: '커리큘럼 보기',
    image:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 3,
    eyebrow: 'Community',
    title: 'Join The Grid',
    desc: '3,200명의 수강생과 함께 성장하는 커뮤니티. 질문하고, 공유하고, 함께 만듭니다.',
    cta: '지금 참여하기',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80',
  },
]

// M 삼색 그라디언트 (light blue → dark blue → red)
const M_STRIPE =
  'linear-gradient(90deg,#0066b1 0 33.33%,#1c69d4 33.33% 66.66%,#e22718 66.66%)'

export default function BannerSlider() {
  // 커스텀 내비게이션 화살표를 Swiper에 연결하기 위한 ref
  const prevRef = useRef(null)
  const nextRef = useRef(null)
  // Swiper 인스턴스 + hover 재개 타이머
  const swiperRef = useRef(null)
  const resumeTimer = useRef(null)

  // 마우스를 올리면: 즉시 정지 → 5초 후 자동으로 다시 재생
  function handleMouseEnter() {
    const swiper = swiperRef.current
    if (!swiper?.autoplay) return
    swiper.autoplay.stop()
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => {
      swiper.autoplay.start()
    }, 5000)
  }

  // 마우스가 벗어나면: 대기 타이머 취소 후 곧바로 재생 재개
  function handleMouseLeave() {
    clearTimeout(resumeTimer.current)
    swiperRef.current?.autoplay?.start()
  }

  // 언마운트 시 타이머 정리
  useEffect(() => () => clearTimeout(resumeTimer.current), [])

  return (
    <section
      className="relative mb-6 w-full bg-canvas"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        loop
        speed={800}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        // 자동재생: 4.5초 간격, 사용자 조작 후에도 계속 재생
        // (hover 시 정지/재개는 pauseOnMouseEnter 대신 커스텀 핸들러로 제어)
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        // 커스텀 화살표 연결
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current
          swiper.params.navigation.nextEl = nextRef.current
        }}
        // 하단 페이지네이션 (클릭 가능)
        pagination={{ clickable: true }}
        // 페이지네이션 불릿을 BMW M 스타일로 커스터마이즈
        // (0px 직각 바 / 비활성 흐림 / 활성 = M 삼색)
        className="
          [&_.swiper-pagination]:!bottom-6
          [&_.swiper-pagination-bullet]:!mx-1 [&_.swiper-pagination-bullet]:!h-1
          [&_.swiper-pagination-bullet]:!w-10 [&_.swiper-pagination-bullet]:!rounded-none
          [&_.swiper-pagination-bullet]:!bg-white/30 [&_.swiper-pagination-bullet]:!opacity-100
          [&_.swiper-pagination-bullet-active]:!bg-[image:var(--m-stripe)]
        "
        style={{ '--m-stripe': M_STRIPE }}
      >
        {SLIDES.map((s) => (
          <SwiperSlide key={s.id}>
            <div className="relative h-[360px] w-full md:h-[440px]">
              {/* 배경 사진 */}
              <img
                src={s.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* 가독성용 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/25" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              {/* 콘텐츠 */}
              <div className="relative flex h-full flex-col justify-end px-8 pb-16 md:px-12">
                <div className="mb-5 flex items-center gap-4">
                  <span
                    className="block h-1 w-[120px]"
                    style={{ backgroundImage: M_STRIPE }}
                  />
                  <span className="text-sm font-bold uppercase tracking-machined text-white">
                    {s.eyebrow}
                  </span>
                </div>

                <h2 className="mb-3 max-w-2xl text-4xl font-bold uppercase leading-none tracking-tight text-white md:text-6xl">
                  {s.title}
                </h2>

                <p className="mb-8 max-w-xl text-sm font-light leading-relaxed text-neutral-200 md:text-base">
                  {s.desc}
                </p>

                <div>
                  <button className="inline-flex h-12 items-center gap-2.5 border border-white bg-transparent px-8 text-sm font-bold uppercase tracking-machined text-white transition-colors duration-200 hover:bg-white hover:text-black">
                    {s.cta} <span className="text-base leading-none">→</span>
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 커스텀 내비게이션 화살표 — 원형 48px (BMW M carousel-arrow) */}
      <button
        ref={prevRef}
        aria-label="이전 슬라이드"
        className="absolute left-6 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-surface-card text-xl text-white transition-colors duration-200 hover:bg-surface-elevated"
      >
        ‹
      </button>
      <button
        ref={nextRef}
        aria-label="다음 슬라이드"
        className="absolute right-6 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-surface-card text-xl text-white transition-colors duration-200 hover:bg-surface-elevated"
      >
        ›
      </button>
    </section>
  )
}
