import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getMenuAdmin, createMenuItem, updateMenuItem, deleteMenuItem } from '../utils/api';
import { uploadToCloudinary } from '../utils/cloudinary';

const EMPTY_FORM = { name: '', price: '', category: 'monmoi', description: '', available: true, image: '' };
const CATS = ['che', 'suachua', 'caramen', 'monmoi', 'douong', 'doanutat', 'pizza', 'mycay'];
const CAT_LABELS = {
  che: 'Chè',
  suachua: 'Sữa Chua',
  caramen: 'Caramen',
  monmoi: 'Món Mới',
  douong: 'Đồ Uống',
  doanutat: 'Đồ Ăn Vặt',
  pizza: 'Pizza',
  mycay: 'Mỳ Cay',
};

function ImagePreview({ src, alt, size = 56 }) {
  if (src) {
    return <img src={src} alt={alt} style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />;
  }

  return (
    <div style={{ width: size, height: size, borderRadius: 8, border: '1px dashed var(--border)', background: 'var(--bg-card2)' }} />
  );
}

export default function AdminPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      const data = await getMenuAdmin();
      setItems(data);
    } catch {
      toast.error('Không tải được menu');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(item) {
    setForm({
      name: item.name || '',
      price: item.price?.toString?.() || '',
      category: item.category || 'chips',
      description: item.description || '',
      available: item.available ?? true,
      image: item.image || '',
    });
    setEditing(item._id);
    setShowForm(true);
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(true);
  }

  async function handleImageChange(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh');
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await uploadToCloudinary(file);
      setForm((prev) => ({ ...prev, image: imageUrl }));
      toast.success('Đã upload ảnh');
    } catch (error) {
      toast.error(error.message || 'Lỗi upload ảnh');
    } finally {
      setUploading(false);
    }
  }

  const DEFAULT_IMAGE =
  'https://res.cloudinary.com/dwsenlr3e/image/upload/v1781184723/numcni08x4jcyaqmcgjp.jpg';

  async function handleSave() {
  if (!form.name || !form.price) {
    return toast.error('Nhập tên và giá');
  }

  try {
    const payload = {
      ...form,
      image: form.image || DEFAULT_IMAGE, // nếu không upload ảnh
      price: parseInt(form.price, 10),
    };

    if (editing) {
      const updated = await updateMenuItem(editing, payload);
      setItems((prev) => prev.map((i) => (i._id === editing ? updated : i)));
      toast.success('Đã cập nhật món');
    } else {
      const created = await createMenuItem(payload);
      setItems((prev) => [...prev, created]);
      toast.success('Đã thêm món mới');
    }

    setShowForm(false);
  } catch (err) {
    toast.error(err.response?.data?.message || 'Lỗi lưu món');
  }
}

  async function handleDelete(id) {
    if (!confirm('Xóa món này?')) return;
    try {
      await deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success('Đã xóa');
    } catch {
      toast.error('Lỗi xóa món');
    }
  }

  const sortedItems = useMemo(() => items.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name)), [items]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>⚙️ Quản lý thực đơn</h2>
        <button onClick={openNew} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700 }}>
          + Thêm món
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 20, overflowX: 'auto' }}>
          <div style={{ minWidth: 640 }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>{editing ? 'Sửa món' : 'Thêm món mới'}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Tên món *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Tên món ăn"
                  style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Giá (VNĐ) *</label>
                <input
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  type="number"
                  placeholder="15000"
                  style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Danh mục</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 14 }}
                >
                  {CATS.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Ảnh món</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                  disabled={uploading}
                  style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14, opacity: uploading ? 0.6 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}
                />
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ImagePreview src={form.image} alt={form.name || 'preview'} />
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
                    {uploading ? '⏳ Đang upload...' : 'Upload trực tiếp lên Cloudinary'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Mô tả</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn"
                style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 14 }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.available} onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))} />
              Còn phục vụ
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{ padding: '9px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 14 }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 14 }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflowX: 'auto', overflowY: 'hidden' }}>
        <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card2)' }}>
              {['', 'Tên món', 'Danh mục', 'Giá', 'Trạng thái', 'Thao tác'].map((h) => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr key={item._id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <ImagePreview src={item.image} alt={item.name} size={44} />
                </td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{CAT_LABELS[item.category]}</td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{item.price.toLocaleString('vi-VN')}₫</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: item.available ? 'rgba(99,153,34,0.15)' : 'rgba(226,75,74,0.15)', color: item.available ? '#639922' : '#E24B4A', fontWeight: 600 }}>
                    {item.available ? 'Còn món' : 'Hết'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => openEdit(item)}
                    style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 12 }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'rgba(226,75,74,0.15)', color: '#E24B4A', fontSize: 12, fontWeight: 600 }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
