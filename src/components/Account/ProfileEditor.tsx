import { useRef, useState } from 'react';
import { Camera, Loader2, CheckCircle, AlertTriangle, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB — matches the bucket's server-side limit
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const PHONE_PATTERN = /^[0-9+()\-\s]{0,20}$/; // matches the DB check constraint

interface FormState {
  full_name: string;
  roll_no: string;
  register_no: string;
  department: string;
  phone: string;
}

export default function ProfileEditor() {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    full_name: profile?.full_name ?? '',
    roll_no: profile?.roll_no ?? '',
    register_no: profile?.register_no ?? '',
    department: profile?.department ?? '',
    phone: profile?.phone ?? '',
  });
  const [newEmail, setNewEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !supabase || !user) return;
    setError(null);
    setSuccess(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a PNG, JPEG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('That image is larger than 2MB — please choose a smaller one.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      // Stored under a folder named after the user's own id — this is what
      // the storage RLS policies check, so no one else can overwrite it.
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache-bust so the new photo shows immediately instead of a stale
      // cached copy at the same URL.
      const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess('Profile photo updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setError(null);
    setSuccess(null);

    if (form.phone && !PHONE_PATTERN.test(form.phone)) {
      setError('Phone number can only contain digits, spaces, +, -, and parentheses.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim() || null,
          roll_no: form.roll_no.trim() || null,
          register_no: form.register_no.trim() || null,
          department: form.department.trim() || null,
          phone: form.phone.trim() || null,
        })
        .eq('id', user.id);
      if (updateError) throw updateError;

      // Changing the login email goes through Supabase Auth's own
      // confirmation flow — it does NOT take effect until the user clicks
      // the confirmation link, and profiles.email stays as the old,
      // verified address until then (kept in sync by a DB trigger).
      if (newEmail.trim() && newEmail.trim() !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: newEmail.trim() });
        if (emailError) throw emailError;
        setSuccess('Details saved. Check your new email address to confirm the email change.');
      } else {
        setSuccess('Profile details saved.');
      }

      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  const avatarUrl = profile?.avatar_url;

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--text-primary)', marginBottom: '1.125rem' }}>
        My Profile
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--border)',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserIcon size={30} style={{ color: 'var(--accent)' }} />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            aria-label="Change profile photo"
            title="Change profile photo"
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#fff',
              border: '2px solid var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {uploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handlePhotoSelected}
            style={{ display: 'none' }}
          />
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, minWidth: 180 }}>
          PNG, JPEG, WebP, or GIF. Max 2MB. Stored in your account's private storage folder — only you can
          replace it.
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Full name
          <input
            className="input-field"
            style={{ width: '100%', marginTop: '0.375rem', padding: '0.625rem 0.75rem' }}
            value={form.full_name}
            maxLength={120}
            onChange={(e) => update('full_name', e.target.value)}
            placeholder="Your full name"
          />
        </label>

        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Roll number
          <input
            className="input-field"
            style={{ width: '100%', marginTop: '0.375rem', padding: '0.625rem 0.75rem' }}
            value={form.roll_no}
            maxLength={40}
            onChange={(e) => update('roll_no', e.target.value)}
            placeholder="e.g. 21CS045"
          />
        </label>

        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Register number
          <input
            className="input-field"
            style={{ width: '100%', marginTop: '0.375rem', padding: '0.625rem 0.75rem' }}
            value={form.register_no}
            maxLength={40}
            onChange={(e) => update('register_no', e.target.value)}
            placeholder="e.g. 950821104045"
          />
        </label>

        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Department
          <input
            className="input-field"
            style={{ width: '100%', marginTop: '0.375rem', padding: '0.625rem 0.75rem' }}
            value={form.department}
            maxLength={120}
            onChange={(e) => update('department', e.target.value)}
            placeholder="e.g. CSBS"
          />
        </label>

        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Phone number
          <input
            className="input-field"
            style={{ width: '100%', marginTop: '0.375rem', padding: '0.625rem 0.75rem' }}
            value={form.phone}
            maxLength={20}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="e.g. +91 98765 43210"
          />
        </label>

        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Email
          <input
            type="email"
            className="input-field"
            style={{ width: '100%', marginTop: '0.375rem', padding: '0.625rem 0.75rem' }}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 400, marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
            Changing this sends a confirmation link to the new address before it takes effect.
          </span>
        </label>

        {error && (
          <p style={{ gridColumn: '1 / -1', fontSize: '0.8125rem', color: 'var(--red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <AlertTriangle size={14} /> {error}
          </p>
        )}
        {success && (
          <p style={{ gridColumn: '1 / -1', fontSize: '0.8125rem', color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <CheckCircle size={14} /> {success}
          </p>
        )}

        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="btn-primary" disabled={saving} style={{ justifyContent: 'center', minWidth: 160 }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
