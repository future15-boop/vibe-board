const STATS = [
  { val: '3,200', unit: '명', label: '누적 수강생' },
  { val: '480', unit: '개', label: '완성 프로젝트' },
  { val: '4.9', unit: '/5', label: '평균 만족도' },
  { val: '92', unit: '%', label: '수료율' },
]

export default function StatsBand() {
  return (
    <section className="stats">
      <div className="wrap" style={{ paddingInline: 0 }}>
        <div className="stats__grid">
          {STATS.map((s) => (
            <div className="stat-cell" key={s.label}>
              <div className="display-sm stat-cell__val">
                {s.val} <span>{s.unit}</span>
              </div>
              <div className="label-up stat-cell__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
