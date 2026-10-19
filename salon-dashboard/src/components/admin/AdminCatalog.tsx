import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { Hairstyle, HairstyleCategory, HairstyleGender } from '../../types/admin';
import { StatusPill } from './AdminParts';

type FormState = {
  name: string;
  images: string[]; // images[0] là ảnh bìa (BE lưu vào imageUrl), toàn bộ danh sách gửi qua imageUrls
  description: string;
  categoryId: string;
  gender: HairstyleGender;
};

const EMPTY_FORM: FormState = { name: '', images: [], description: '', categoryId: '', gender: 'UNISEX' };
const COLUMNS = '0.9fr 1.6fr 1fr 0.8fr 0.8fr 1fr';
const NAME_MAX = 200; // hairstyles.name VARCHAR(200)
const MAX_IMAGES = 5; // BE: tối đa 5 ảnh / kiểu tóc
const MAX_FILE_BYTES = 5 * 1024 * 1024; // BE: tối đa 5MB / file
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());
const imagesOf = (item: Hairstyle) => (item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : []);

export function AdminCatalog() {
  const at = useAdminT();
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [categories, setCategories] = useState<HairstyleCategory[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number>();
  const [editingItem, setEditingItem] = useState<Hairstyle>();
  const [linkInput, setLinkInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);

  const categoryName_ = (id?: number) => categories.find((category) => category.id === id)?.name || '—';
  const slotsLeft = MAX_IMAGES - form.images.length;

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [items, cats] = await Promise.all([adminApi.getHairstyles(), adminApi.getCategories()]);
      setHairstyles(items);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const startEdit = (item: Hairstyle) => {
    setEditingId(item.id);
    setEditingItem(item);
    setLinkInput('');
    setForm({
      name: item.name,
      images: imagesOf(item),
      description: item.description || '',
      categoryId: item.categoryId ? String(item.categoryId) : '',
      gender: item.gender || 'UNISEX'
    });
    setNotice(undefined);
    setError(undefined);
  };

  const resetForm = () => {
    setEditingId(undefined);
    setEditingItem(undefined);
    setLinkInput('');
    setForm(EMPTY_FORM);
  };

  const addImages = (urls: string[]) => {
    setForm((current) => {
      const merged = [...current.images];
      for (const url of urls) {
        if (merged.length < MAX_IMAGES && !merged.includes(url)) merged.push(url);
      }
      return { ...current, images: merged };
    });
  };

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    if (!isHttpUrl(url)) {
      setError(at('ctImageInvalid'));
      return;
    }
    if (form.images.includes(url)) {
      setError(at('ctImageDuplicate'));
      return;
    }
    if (slotsLeft <= 0) {
      setError(at('ctImageMax', { max: MAX_IMAGES }));
      return;
    }
    setError(undefined);
    addImages([url]);
    setLinkInput('');
  };

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setError(undefined);
    setNotice(undefined);

    if (files.length > slotsLeft) {
      setError(at('ctImageMax', { max: MAX_IMAGES }));
      return;
    }
    const invalid = files.find((file) => !ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_BYTES);
    if (invalid) {
      setError(at('ctImageFileInvalid', { name: invalid.name }));
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await adminApi.uploadHairstyleImage(file));
      }
      addImages(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) =>
    setForm((current) => ({ ...current, images: current.images.filter((_, i) => i !== index) }));

  const makeCover = (index: number) =>
    setForm((current) => {
      const images = [...current.images];
      const [picked] = images.splice(index, 1);
      return { ...current, images: [picked, ...images] };
    });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setNotice(undefined);
    if (form.images.length === 0) {
      setError(at('ctImageRequired'));
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      imageUrl: form.images[0],
      imageUrls: form.images,
      description: form.description.trim() || undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      gender: form.gender
    };
    try {
      if (editingId) {
        await adminApi.updateHairstyle(editingId, { ...payload, status: editingItem?.status || 'ACTIVE' });
      } else {
        await adminApi.createHairstyle(payload);
      }
      setNotice(at('ctSaved'));
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setSaving(false);
    }
  };

  const hide = async (item: Hairstyle) => {
    if (!window.confirm(at('ctHideConfirm', { name: item.name }))) return;
    setError(undefined);
    try {
      await adminApi.updateHairstyle(item.id, {
        name: item.name,
        imageUrl: item.imageUrl || '',
        imageUrls: imagesOf(item), // gửi lại gallery, nếu không BE sẽ thay gallery bằng mỗi ảnh bìa
        description: item.description,
        categoryId: item.categoryId,
        gender: item.gender,
        status: 'INACTIVE'
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    }
  };

  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    setError(undefined);
    setNotice(undefined);
    try {
      await adminApi.createCategory({ name: categoryName.trim() });
      setCategoryName('');
      setNotice(at('ctCategorySaved'));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    }
  };

  const genderLabel = (gender?: string) =>
    gender === 'MALE' ? at('male') : gender === 'FEMALE' ? at('female') : gender === 'UNISEX' ? at('unisex') : '—';

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{at('tabCatalog')}</span>
          <h2>{at('ctTitle')}</h2>
          <p>{at('ctDesc')}</p>
        </div>
        <button className="ghost-button" onClick={() => void load()}>
          {loading ? at('loading') : at('refresh')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      <div className="two-column">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{editingId ? at('ctEditing', { id: editingId }) : at('ctNew')}</h3>
              <p>{at('ctImageHint', { max: MAX_IMAGES })}</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={submit}>
            <label>
              {at('ctName')}
              <input
                value={form.name}
                maxLength={NAME_MAX}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </label>
            <label>
              {at('ctCategory')}
              <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                <option value="">{at('ctNoCategory')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {at('ctGender')}
              <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as HairstyleGender })}>
                <option value="MALE">{at('male')}</option>
                <option value="FEMALE">{at('female')}</option>
                <option value="UNISEX">{at('unisex')}</option>
              </select>
            </label>
            <label className="span-2">
              {at('ctDescription')}
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>

            <div className="span-2 image-manager">
              <div className="image-manager-head">
                <strong>{at('ctImages')}</strong>
                <span className={form.images.length >= MAX_IMAGES ? 'count-full' : ''}>
                  {form.images.length}/{MAX_IMAGES}
                </span>
              </div>

              {form.images.length > 0 && (
                <div className="image-grid">
                  {form.images.map((url, index) => (
                    <div className={`image-tile ${index === 0 ? 'cover' : ''}`} key={url}>
                      <img src={url} alt="" loading="lazy" />
                      {index === 0 && <span className="cover-badge">{at('ctCover')}</span>}
                      <div className="image-tile-actions">
                        {index !== 0 && (
                          <button type="button" className="mini" onClick={() => makeCover(index)}>
                            {at('ctMakeCover')}
                          </button>
                        )}
                        <button type="button" className="mini danger" onClick={() => removeImage(index)}>
                          {at('ctRemoveImage')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="image-add">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(event) => void uploadFiles(event)}
                />
                <button
                  type="button"
                  className="ghost-button"
                  disabled={uploading || slotsLeft <= 0}
                  onClick={() => fileInput.current?.click()}
                >
                  {uploading ? at('ctUploading') : at('ctUpload')}
                </button>
                <input
                  type="url"
                  value={linkInput}
                  disabled={slotsLeft <= 0}
                  placeholder={at('ctLinkPlaceholder')}
                  onChange={(event) => setLinkInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addLink();
                    }
                  }}
                />
                <button type="button" className="ghost-button" disabled={slotsLeft <= 0} onClick={addLink}>
                  {at('ctAddLink')}
                </button>
              </div>
              <small className="field-hint">{at('ctImageRule', { max: MAX_IMAGES })}</small>
            </div>

            <div className="row-actions">
              <button className="solid-button" disabled={saving || uploading}>
                {saving ? at('saving') : at('save')}
              </button>
              {editingId && (
                <button type="button" className="ghost-button" onClick={resetForm}>
                  {at('cancel')}
                </button>
              )}
            </div>
          </form>

          <form className="admin-inline-form" onSubmit={addCategory}>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder={at('ctCategoryName')}
            />
            <button className="ghost-button">{at('ctAdd')}</button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{at('ctList')}</h3>
              <p>{hairstyles.length}</p>
            </div>
          </div>
          {!loading && hairstyles.length === 0 ? (
            <div className="empty-row">{at('ctEmpty')}</div>
          ) : (
            <div className="appointments-table">
              <div className="table-head" style={{ gridTemplateColumns: COLUMNS }}>
                <span />
                <span>{at('ctName')}</span>
                <span>{at('ctCategory')}</span>
                <span>{at('ctGender')}</span>
                <span>{at('status')}</span>
                <span>{at('actions')}</span>
              </div>
              {hairstyles.map((item) => {
                const images = imagesOf(item);
                return (
                  <div className="table-row" key={item.id} style={{ gridTemplateColumns: COLUMNS }}>
                    <span className="thumb-cell">
                      {images[0] ? <img className="admin-thumb" src={images[0]} alt={item.name} /> : null}
                      {images.length > 1 && <em className="thumb-count">+{images.length - 1}</em>}
                    </span>
                    <span>
                      <b>{item.name}</b>
                      <small>#{item.id}</small>
                    </span>
                    <span>{categoryName_(item.categoryId)}</span>
                    <span>{genderLabel(item.gender)}</span>
                    <span>
                      <StatusPill status={item.status} label={item.status ? at(`st_${item.status}`) : '—'} />
                    </span>
                    <span className="row-actions">
                      <button className="mini" onClick={() => startEdit(item)}>{at('edit')}</button>
                      <button className="mini danger" onClick={() => void hide(item)}>{at('ctHide')}</button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
