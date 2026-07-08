import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, CATEGORY_LABEL, contentFor } from '../data'
import { boardApi } from '../api/board'
import { formatDate, validateImage } from '../utils'
import { useAuth } from '../context/AuthContext'

export default function DetailModal({ post, signal, onClose, onAddComment, onUpdate, onDelete }) {
  const { profile } = useAuth()
  const isNotice = post.category === 'notice'
  const isOwner = Boolean(profile && post.user_id && post.user_id === profile.id)
  const [mode, setMode] = useState('view') // view | edit | delete

  // 댓글
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [name, setName] = useState(profile?.name || '')
  const [text, setText] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [copied, setCopied] = useState(false)

  // ESC 로 닫기
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // 열려 있는 동안 문서 제목을 글 제목으로 (브라우저 탭/일부 크롤러)
  useEffect(() => {
    const prev = document.title
    document.title = `${post.title} — VIBE CODING`
    return () => {
      document.title = prev
    }
  }, [post.title])

  async function share() {
    const url = `${window.location.origin}/post/${post.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }
    } catch {
      /* 사용자가 취소 등 */
    }
  }

  // 댓글 로딩 (열릴 때 + 실시간 signal 변경 시)
  useEffect(() => {
    let alive = true
    boardApi
      .listComments(post.id)
      .then((list) => alive && setComments(list))
      .catch(() => {})
      .finally(() => alive && setLoadingComments(false))
    return () => {
      alive = false
    }
  }, [post.id, signal])

  async function submitComment(e) {
    e.preventDefault()
    if (commenting || !name.trim() || !text.trim()) return
    setCommenting(true)
    try {
      await onAddComment(post.id, { author: name.trim(), text: text.trim() })
      setText('')
      const list = await boardApi.listComments(post.id)
      setComments(list)
    } catch {
      /* 무시 */
    } finally {
      setCommenting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__stripe" />
        <button className="modal__close" onClick={onClose} aria-label="닫기">✕</button>

        <div className="modal__body">
          {mode === 'edit' ? (
            <EditForm
              post={post}
              isOwner={isOwner}
              onCancel={() => setMode('view')}
              onSave={async (data, password) => {
                await onUpdate(post.id, data, password)
                setMode('view')
              }}
            />
          ) : (
            <>
              <div className="label-up modal__cat" data-notice={isNotice}>
                {CATEGORY_LABEL[post.category] || post.category?.toUpperCase()}
              </div>
              <h2 className="display-sm modal__title">{post.title}</h2>

              <div className="modal__meta">
                <span>{post.author}</span>
                <span className="dot" />
                <span>{formatDate(post.created_at)}</span>
                <span className="dot" />
                <span>조회 {post.views.toLocaleString()}</span>
                <span className="dot" />
                <span>댓글 {post.replies}</span>
                <button className="modal__share" onClick={share}>
                  {copied ? '✓ 링크 복사됨' : '↗ 공유'}
                </button>
              </div>

              {post.image_url && (
                <div className="modal__image">
                  <img src={post.image_url} alt={post.title} />
                </div>
              )}

              <div className="modal__content">{contentFor(post)}</div>

              {post.tags?.length > 0 && (
                <div className="modal__tags">
                  {post.tags.map((t) => (
                    <span className="row__tag" key={t}>#{t}</span>
                  ))}
                </div>
              )}

              {/* 수정/삭제 액션 (공지 제외) */}
              {!isNotice && mode === 'view' && (
                <div className="modal__actions">
                  {isOwner && <span className="modal__owner">내 글</span>}
                  <button className="btn btn--outline btn--sm" onClick={() => setMode('edit')}>수정</button>
                  <button className="btn btn--outline btn--sm modal__danger" onClick={() => setMode('delete')}>삭제</button>
                </div>
              )}

              {mode === 'delete' && (
                <DeleteConfirm
                  isOwner={isOwner}
                  onCancel={() => setMode('view')}
                  onConfirm={(password) => onDelete(post.id, password)}
                />
              )}

              {/* 댓글 */}
              <div className="comments">
                <div className="comments__head">
                  <span className="label-up">Comments</span>
                  <span className="count">{comments.length}</span>
                </div>

                {loadingComments ? (
                  <p className="comment__empty">댓글 불러오는 중…</p>
                ) : comments.length > 0 ? (
                  comments.map((c) => (
                    <div className="comment" key={c.id}>
                      <div className="comment__top">
                        <span className="comment__author">{c.author}</span>
                        <span className="comment__date">{formatDate(c.created_at)}</span>
                      </div>
                      <p className="comment__text">{c.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="comment__empty">첫 댓글을 남겨보세요.</p>
                )}

                <form className="comment-form" onSubmit={submitComment}>
                  <input
                    className="comment-form__name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="닉네임"
                  />
                  <input
                    className="comment-form__text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="댓글을 입력하세요"
                  />
                  <button type="submit" className="btn btn--light btn--sm" disabled={commenting}>
                    {commenting ? '등록 중' : '등록'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- 삭제 확인 (소유자면 비번 불필요) ----
function DeleteConfirm({ isOwner, onCancel, onConfirm }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function confirm() {
    if (busy) return
    if (!isOwner && !password) {
      setError('비밀번호를 입력하세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onConfirm(isOwner ? '' : password)
    } catch (e) {
      setError(e.message || '삭제에 실패했습니다.')
      setBusy(false)
    }
  }

  return (
    <div className="confirm">
      <p className="confirm__msg">
        {isOwner ? '정말 삭제할까요? 되돌릴 수 없습니다.' : '정말 삭제할까요? 작성 시 입력한 비밀번호를 입력하세요.'}
      </p>
      <div className="confirm__row">
        {!isOwner && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoComplete="off"
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
          />
        )}
        <button className="btn btn--light btn--sm modal__danger" onClick={confirm} disabled={busy}>
          {busy ? '삭제 중…' : '삭제 확정'}
        </button>
        <button className="btn btn--outline btn--sm" onClick={onCancel} disabled={busy}>취소</button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

// ---- 수정 폼 ----
function EditForm({ post, isOwner, onCancel, onSave }) {
  const writable = CATEGORIES.filter((c) => c.key !== 'all' && c.key !== 'notice')
  const [category, setCategory] = useState(post.category)
  const [title, setTitle] = useState(post.title)
  const [tags, setTags] = useState((post.tags || []).join(', '))
  const [content, setContent] = useState(post.content || '')
  const [password, setPassword] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(post.image_url || null)
  const [removeImage, setRemoveImage] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  function pickImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImage(file)
    if (err) return setError(err)
    setError('')
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    setRemoveImage(false)
  }

  function clearImage() {
    setImageFile(null)
    setPreview(null)
    setRemoveImage(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function save(e) {
    e.preventDefault()
    if (busy) return
    if (!title.trim()) return setError('제목을 입력하세요.')
    if (!isOwner && !password) return setError('수정하려면 비밀번호를 입력하세요.')
    setBusy(true)
    setError('')
    try {
      await onSave(
        {
          category,
          title: title.trim(),
          content: content.trim(),
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          imageFile,
          removeImage,
          currentImageUrl: post.image_url || null,
        },
        isOwner ? '' : password,
      )
    } catch (err) {
      setError(err.message || '수정에 실패했습니다.')
      setBusy(false)
    }
  }

  return (
    <form className="writer writer--flush" onSubmit={save}>
      <h3 className="title-lg">글 수정</h3>
      <div className="writer__row">
        <div className="field" style={{ flex: '0 0 180px' }}>
          <label className="label-up">카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {writable.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        {isOwner ? (
          <div className="field" style={{ flex: '0 0 200px' }}>
            <label className="label-up">권한</label>
            <div className="edit-owner-note">내 글 — 비밀번호 없이 수정</div>
          </div>
        ) : (
          <div className="field" style={{ flex: '0 0 200px' }}>
            <label className="label-up">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="작성 시 비밀번호"
              autoComplete="off"
            />
          </div>
        )}
      </div>
      <div className="writer__row">
        <div className="field">
          <label className="label-up">제목</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>
      <div className="writer__row">
        <div className="field">
          <label className="label-up">태그 (쉼표로 구분)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
      </div>
      <div className="writer__row">
        <div className="field">
          <label className="label-up">내용</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
      </div>
      <div className="writer__row">
        <div className="field">
          <label className="label-up">이미지</label>
          <div className="uploader">
            <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} hidden id="edit-image" />
            <label htmlFor="edit-image" className="btn btn--outline btn--sm uploader__btn">
              {preview ? '이미지 변경' : '이미지 첨부'}
            </label>
            {preview && (
              <div className="uploader__preview">
                <img src={preview} alt="미리보기" />
                <button type="button" className="uploader__remove" onClick={clearImage} aria-label="이미지 제거">✕</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="writer__actions">
        <button type="submit" className="btn btn--light btn--sm" disabled={busy}>
          {busy ? '저장 중…' : '저장'}
        </button>
        <button type="button" className="btn btn--outline btn--sm" onClick={onCancel} disabled={busy}>
          취소
        </button>
      </div>
    </form>
  )
}
