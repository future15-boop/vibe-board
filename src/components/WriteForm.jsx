import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../data'
import { validateImage } from '../utils'
import { useAuth } from '../context/AuthContext'

export default function WriteForm({ onSubmit, onCancel }) {
  const { profile } = useAuth()
  const loggedIn = Boolean(profile)
  const [category, setCategory] = useState('qna')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState(profile?.name || '')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [password, setPassword] = useState('')

  // 로그인 사용자는 작성자명을 프로필 이름으로 프리필
  useEffect(() => {
    if (profile?.name) setAuthor((a) => a || profile.name)
  }, [profile])
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)

  const writable = CATEGORIES.filter((c) => c.key !== 'all' && c.key !== 'notice')

  function pickImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImage(file)
    if (err) {
      setError(err)
      return
    }
    setError('')
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    if (!title.trim() || !author.trim()) {
      setError('제목과 작성자는 필수입니다.')
      return
    }
    // 비로그인: 비밀번호 필수 / 로그인: 선택(입력 시 4자+)
    if (!loggedIn && password.length < 4) {
      setError('비밀번호는 4자 이상 입력하세요. (수정/삭제 시 필요)')
      return
    }
    if (loggedIn && password.length > 0 && password.length < 4) {
      setError('비밀번호를 쓰려면 4자 이상 입력하세요. (비우면 계정 소유로 관리됩니다)')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await onSubmit({
        category,
        title: title.trim(),
        author: author.trim(),
        content: content.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        password,
        imageFile,
      })
    } catch (err) {
      setError(err.message || '등록에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <form className="writer" onSubmit={handleSubmit}>
      <h3 className="title-lg">글쓰기</h3>
      <div className="writer__row">
        <div className="field" style={{ flex: '0 0 180px' }}>
          <label className="label-up">카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {writable.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label-up">작성자</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="닉네임" />
        </div>
        <div className="field" style={{ flex: '0 0 200px' }}>
          <label className="label-up">비밀번호{loggedIn ? ' (선택)' : ''}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={loggedIn ? '비우면 계정으로 관리' : '수정/삭제용 (4자+)'}
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="writer__row">
        <div className="field">
          <label className="label-up">제목</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" />
        </div>
      </div>
      <div className="writer__row">
        <div className="field">
          <label className="label-up">태그 (쉼표로 구분)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="예: 질문, React" />
        </div>
      </div>
      <div className="writer__row">
        <div className="field">
          <label className="label-up">내용</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요" />
        </div>
      </div>

      <div className="writer__row">
        <div className="field">
          <label className="label-up">이미지 (선택)</label>
          <div className="uploader">
            <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} hidden id="write-image" />
            <label htmlFor="write-image" className="btn btn--outline btn--sm uploader__btn">
              이미지 첨부
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
        <button type="submit" className="btn btn--light btn--sm" disabled={submitting}>
          {submitting ? '등록 중…' : '등록'}
        </button>
        <button type="button" className="btn btn--outline btn--sm" onClick={onCancel} disabled={submitting}>
          취소
        </button>
      </div>
    </form>
  )
}
