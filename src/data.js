// 카테고리 정의
export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'notice', label: 'Notice' },
  { key: 'review', label: '강의후기' },
  { key: 'qna', label: 'Q&A' },
  { key: 'project', label: 'Project' },
  { key: 'free', label: 'Free' },
]

export const CATEGORY_LABEL = {
  notice: 'NOTICE',
  review: 'REVIEW',
  qna: 'Q&A',
  project: 'PROJECT',
  free: 'FREE',
}

// 게시판 더미 데이터 — 바이브코딩 교육 커뮤니티
export const POSTS = [
  { id: 101, category: 'notice', pinned: true, title: '[필독] 바이브코딩 4기 수강생 모집 — 얼리버드 마감 D-3', author: 'VIBE 운영팀', date: '2026-07-07', views: 4821, replies: 32, tags: ['모집', '얼리버드'] },
  { id: 100, category: 'notice', pinned: true, title: '커뮤니티 이용 가이드 및 게시판 규칙 안내', author: 'VIBE 운영팀', date: '2026-06-30', views: 2190, replies: 5, tags: ['가이드'] },
  { id: 99, category: 'review', title: '비전공자인데 3주 만에 첫 웹앱 배포했습니다 (실화)', author: '김도현', date: '2026-07-08', views: 1342, replies: 47, tags: ['후기', '비전공자'] },
  { id: 98, category: 'project', title: 'AI 페어프로그래밍으로 만든 가계부 앱 공유합니다', author: 'devlee', date: '2026-07-08', views: 987, replies: 21, tags: ['프로젝트', 'React'] },
  { id: 97, category: 'qna', title: 'Cursor랑 Claude Code 중에 뭐부터 익히는 게 좋을까요?', author: '초코라떼', date: '2026-07-07', views: 1560, replies: 63, tags: ['질문', '툴선택'] },
  { id: 96, category: 'review', title: '4주차 후기 — 프롬프트 설계가 곧 실력이더라구요', author: 'sunny_dev', date: '2026-07-07', views: 720, replies: 14, tags: ['후기'] },
  { id: 95, category: 'project', title: '바이브코딩으로 사내 대시보드 리뉴얼한 사례', author: '박PM', date: '2026-07-06', views: 1105, replies: 19, tags: ['실무', '대시보드'] },
  { id: 94, category: 'qna', title: 'AI가 만든 코드 리뷰는 어떻게 검증하나요?', author: 'jun.kim', date: '2026-07-06', views: 842, replies: 28, tags: ['질문', '코드리뷰'] },
  { id: 93, category: 'free', title: '오늘 스터디에서 나온 명언: "코드보다 의도를 먼저"', author: '민트초코', date: '2026-07-06', views: 433, replies: 11, tags: ['잡담'] },
  { id: 92, category: 'review', title: '수료 후 이직 성공 후기 — 포트폴리오가 핵심', author: 'career_up', date: '2026-07-05', views: 2038, replies: 55, tags: ['후기', '이직'] },
  { id: 91, category: 'project', title: '주말 해커톤: 실시간 협업 화이트보드 만들기', author: 'team_flow', date: '2026-07-05', views: 640, replies: 9, tags: ['해커톤'] },
  { id: 90, category: 'qna', title: 'Vite 빌드 최적화 관련해서 질문 있습니다', author: 'buildmaster', date: '2026-07-04', views: 512, replies: 17, tags: ['질문', 'Vite'] },
  { id: 89, category: 'free', title: '개발 유튜브 추천 좀 받아갑니다 🙏', author: 'watchmore', date: '2026-07-04', views: 388, replies: 24, tags: ['추천'] },
  { id: 88, category: 'review', title: '2기 수료생입니다. 지금은 프리랜서로 일해요', author: '자유코더', date: '2026-07-03', views: 1720, replies: 41, tags: ['후기', '프리랜서'] },
]

// 카테고리별 기본 본문 (게시글에 content가 없을 때 사용)
export const CONTENT_BY_CATEGORY = {
  notice: '안녕하세요, VIBE CODING 운영팀입니다.\n\n자세한 내용은 본문을 확인해 주세요. 문의사항은 커뮤니티 Q&A 또는 고객센터로 남겨주시면 빠르게 답변드리겠습니다.\n\n감사합니다.',
  review: '수강하면서 느낀 점을 솔직하게 정리해봤습니다.\n\n처음엔 막막했지만, AI와 함께 코딩하는 흐름에 익숙해지니 생각보다 빠르게 결과물을 만들 수 있었어요. 무엇보다 "무엇을 만들지"에 집중하게 되는 경험이 좋았습니다.\n\n고민 중이신 분들께 추천드려요!',
  qna: '질문 있어 글 남깁니다.\n\n혹시 비슷한 경험 있으신 분들 조언 부탁드려요. 관련 자료나 예시 코드가 있다면 함께 공유해주시면 정말 감사하겠습니다.\n\n미리 감사합니다 🙏',
  project: '이번에 완성한 프로젝트를 공유합니다.\n\n기획부터 배포까지 전 과정을 바이브코딩 방식으로 진행했고, 데모 링크와 함께 사용한 스택 및 회고를 정리했습니다. 피드백 언제든 환영합니다!',
  free: '가볍게 이야기 나눠요.\n\n요즘 공부하면서 느낀 점, 소소한 팁, 추천하고 싶은 것들을 자유롭게 남겨주세요. 부담 없이 댓글로 함께 수다 떨어요 :)',
}

export function contentFor(post) {
  return post.content || CONTENT_BY_CATEGORY[post.category] || ''
}

// 초기 댓글 시드 (게시글 id 기준)
export const SEED_COMMENTS = {
  101: [
    { id: 1, author: '예비수강생', date: '2026-07-07', text: '얼리버드 혜택 정확히 어떻게 되나요?' },
    { id: 2, author: 'VIBE 운영팀', date: '2026-07-07', text: '수강료 20% 할인 + 1:1 멘토링 2회가 추가됩니다!' },
  ],
  99: [
    { id: 1, author: 'newbie', date: '2026-07-08', text: '저도 비전공자인데 용기 얻고 갑니다 🔥' },
    { id: 2, author: '김도현', date: '2026-07-08', text: '처음이 제일 어렵지 일단 시작해보세요!' },
    { id: 3, author: 'coffee', date: '2026-07-08', text: '어떤 프로젝트로 시작하셨는지 궁금해요' },
  ],
  97: [
    { id: 1, author: 'toolfan', date: '2026-07-07', text: '둘 다 써봤는데 목적이 좀 달라요' },
    { id: 2, author: '초코라떼', date: '2026-07-07', text: '오 어떤 차이인지 좀 더 알려주실 수 있나요?' },
  ],
}
