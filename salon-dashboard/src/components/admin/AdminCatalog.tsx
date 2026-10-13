import { FormEvent, useEffect, useState } from 'react';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { Hairstyle, HairstyleCategory, HairstyleGender } from '../../types/admin';
import { StatusPill } from './AdminParts';

type FormState = {
  name: string;
  imageUrl: string;
  description: string;
  categoryId: string;
  gender: HairstyleGender;
};

const EMPTY_FORM: FormState = { name: '', imageUrl: '', description: '', categoryId: '', gender: 'UNISEX' };
const COLUMNS = '0.7fr 1.6fr 1fr 0.8fr 0.8fr 1fr';

export function AdminCatalog() {
  const at = useAdminT();
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [categories, setCategories] = useState<HairstyleCategory[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number>();
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const categoryName_ = (id?: number) => categories.find((category) => category.id === id)?.name || '—';

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
    setForm({
      name: item.name,
      imageUrl: item.imageUrl || '',
      description: item.description || '',
      categoryId: item.categoryId ? String(item.categoryId) : '',
      gender: item.gender || 'UNISEX'
    });
    setNotice(undefined);
  };

  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY_FORM);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    setNotice(undefined);
    const payload = {
      name: form.name.trim(),
      imageUrl: form.imageUrl.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      gender: form.gender
    };
    try {
      if (editingId) {
        await adminApi.updateHairstyle(editingId, { ...payload, status: 'ACTIVE' });
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
              <p>{at('ctImageHint')}</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={submit}>
            <label>
              {at('ctName')}
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              {at('ctImage')}
              <input
                value={form.imageUrl}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                type="url"
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
            <label className="full">
              {at('ctDescription')}
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            {form.imageUrl && <img className="admin-preview" src={form.imageUrl} alt="" />}
            <div className="row-actions">
              <button className="solid-button" disabled={saving}>
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
              {hairstyles.map((item) => (
                <div className="table-row" key={item.id} style={{ gridTemplateColumns: COLUMNS }}>
                  <span>{item.imageUrl ? <img className="admin-thumb" src={item.imageUrl} alt={item.name} /> : null}</span>
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
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
