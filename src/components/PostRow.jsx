import { CATEGORY_LABEL } from '../data'
import { formatDate } from '../utils'

export default function PostRow({ post, onOpen }) {
  const isNotice = post.category === 'notice'
  return (
    <div
      className={`row${post.pinned ? ' row--pinned' : ''}`}
      onClick={() => onOpen(post)}
    >
      <div className="row__cat">
        <span className="label-up" data-notice={isNotice}>
          {CATEGORY_LABEL[post.category] || post.category?.toUpperCase()}
        </span>
      </div>

      <div className="row__main">
        <div className="row__title">
          {post.pinned && <span className="row__pin">Pin</span>}
          <h3>{post.title}</h3>
          {post.image_url && <span className="row__img" title="이미지 포함" aria-label="이미지 포함">▣</span>}
          {post.replies > 0 && <span className="row__reply">[{post.replies}]</span>}
        </div>
        {post.tags?.length > 0 && (
          <div className="row__tags">
            {post.tags.map((t) => (
              <span className="row__tag" key={t}>#{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="row__author">{post.author}</div>
      <div className="row__date">{formatDate(post.created_at)}</div>
      <div className="row__views">{(post.views ?? 0).toLocaleString()}</div>
    </div>
  )
}
