import React, { useState, useRef, useCallback } from 'react';
import { useProduct } from '../hook/useProduct.js';

const CreateProduct = () => {
  const { handleCreateProduct } = useProduct();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceCurrency: 'USD',
    priceAmount: '',
  });
  const [images, setImages]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  /* ── handlers ───────────────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const processFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!validFiles.length) return;
    setImages((prev) => [...prev, ...validFiles]);
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPreviews((prev) => [...prev, { url: reader.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileChange  = (e)  => processFiles(e.target.files);
  const handleDrop        = (e)  => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); };
  const handleDragOver    = (e)  => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave   = ()   => setIsDragging(false);
  const removeImage       = (i)  => {
    setImages((prev)   => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.title.trim()) return setError('Product title is required.');
    if (!formData.priceAmount || Number(formData.priceAmount) <= 0) return setError('Please enter a valid price.');

    const data = new FormData();
    data.append('title',         formData.title);
    data.append('description',   formData.description);
    data.append('priceCurrency', formData.priceCurrency);
    data.append('priceAmount',   formData.priceAmount);
    images.forEach((img) => data.append('images', img));

    try {
      setIsSubmitting(true);
      await handleCreateProduct(data);
      setFormData({ title: '', description: '', priceCurrency: 'USD', priceAmount: '' });
      setImages([]);
      setPreviews([]);
    } catch (err) {
      setError(err?.message || 'Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'د.إ' };

  /* ── shared class fragments ─────────────────────────────────────────── */
  const inputCls =
    'w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 ' +
    'placeholder:text-zinc-600 outline-none transition-all duration-200 ' +
    'focus:border-yellow-400/60 focus:ring-2 focus:ring-yellow-400/20 focus:bg-yellow-400/5';

  const cardCls =
    'bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7 ' +
    'backdrop-blur-md transition-colors duration-300 hover:border-yellow-400/20';

  const sectionLabelCls =
    'flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase ' +
    'text-yellow-400 mb-5';

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen bg-[#0a0b0e] font-['Inter',sans-serif] text-zinc-100 antialiased"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(234,179,8,0.09) 0%, transparent 60%), ' +
          'radial-gradient(ellipse 60% 50% at 80% 100%, rgba(202,138,4,0.07) 0%, transparent 55%)',
      }}
    >

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-6 py-10 pb-20">

        {/* Page heading */}
        <div className="mb-9">
          <h1
            className="text-4xl font-bold tracking-tight leading-tight"
            style={{
              background: 'linear-gradient(135deg, #fef3c7 30%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Create a Product
          </h1>
          <p className="text-sm text-zinc-500 mt-2">Fill in the details below to publish your listing.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Two-column grid (desktop) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-6 items-start">

            {/* ══ LEFT ══ */}
            <div className="flex flex-col gap-6">

              {/* Product Info card */}
              <div className={cardCls}>
                <div className={sectionLabelCls}>
                  Product Information
                  <span className="flex-1 h-px bg-yellow-400/20 rounded" />
                </div>

                {/* Title */}
                <div className="mb-5">
                  <label htmlFor="title" className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Product Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="title" name="title" type="text"
                    value={formData.title} onChange={handleChange}
                    placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    className={inputCls}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="description" name="description" rows={5}
                    value={formData.description} onChange={handleChange}
                    placeholder="Describe your product — features, condition, details…"
                    className={`${inputCls} resize-y leading-relaxed`}
                  />
                </div>
              </div>

              {/* Pricing card */}
              <div className={cardCls}>
                <div className={sectionLabelCls}>
                  Pricing
                  <span className="flex-1 h-px bg-yellow-400/20 rounded" />
                </div>

                <div className="grid grid-cols-[1fr_2fr] gap-4 mb-4">

                  {/* Currency select */}
                  <div>
                    <label htmlFor="priceCurrency" className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Currency
                    </label>
                    <div className="relative">
                      <select
                        id="priceCurrency" name="priceCurrency"
                        value={formData.priceCurrency} onChange={handleChange}
                        className={`${inputCls} appearance-none pr-9 cursor-pointer`}
                      >
                        <option value="USD" className='text-black'>USD</option>
                        <option value="EUR" className='text-black'>EUR</option>
                        <option value="GBP" className='text-black'>GBP</option>
                        <option value="INR" className='text-black'>INR</option>
                        <option value="AED" className='text-black'>AED</option>
                      </select>
                      {/* chevron */}
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label htmlFor="priceAmount" className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Amount <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none select-none">
                        {currencySymbol[formData.priceCurrency] ?? '$'}
                      </span>
                      <input
                        id="priceAmount" name="priceAmount"
                        type="number" min="0" step="0.01"
                        value={formData.priceAmount} onChange={handleChange}
                        placeholder="0.00"
                        className={`${inputCls} pl-7`}
                      />
                    </div>
                  </div>
                </div>

                {/* Live price preview */}
                {formData.priceAmount && Number(formData.priceAmount) > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-yellow-400/5 border border-yellow-400/15">
                    <span className="text-xs text-zinc-500">Listing price</span>
                    <span className="text-base font-semibold text-yellow-400">
                      {currencySymbol[formData.priceCurrency]}
                      {Number(formData.priceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ══ RIGHT — sticky on lg ══ */}
            <div className="lg:sticky lg:top-[76px] flex flex-col gap-6">
              <div className={cardCls}>
                <div className={sectionLabelCls}>
                  Product Images
                  {previews.length > 0 && (
                    <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                      {previews.length}
                    </span>
                  )}
                  <span className="flex-1 h-px bg-yellow-400/20 rounded" />
                </div>

                {/* Drop Zone */}
                <div
                  role="button" tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                  className={[
                    'flex flex-col items-center justify-center text-center cursor-pointer select-none',
                    'border-2 border-dashed rounded-2xl py-10 px-5 mb-4 transition-all duration-250',
                    isDragging
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-yellow-400/40 hover:bg-yellow-400/[0.04]',
                  ].join(' ')}
                >
                  {/* Upload icon */}
                  <svg
                    className={`w-11 h-11 mb-3 transition-colors duration-250 ${isDragging ? 'text-yellow-400' : 'text-zinc-600'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 16.5v-9m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.07 11.095H6.75z" />
                  </svg>
                  <p className="text-sm text-zinc-400">
                    Drag &amp; drop images here or{' '}
                    <span className="text-yellow-400 font-medium underline underline-offset-2 cursor-pointer">
                      browse files
                    </span>
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">PNG, JPG, WEBP — up to 10 MB each</p>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

                {/* Preview / placeholder grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  {previews.length > 0
                    ? previews.map((preview, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.07] group">
                        <img src={preview.url} alt={preview.name} className="w-full h-full object-cover block" />
                        <button
                          type="button" onClick={() => removeImage(i)}
                          aria-label={`Remove ${preview.name}`}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/80 text-white
                                     flex items-center justify-center opacity-0 group-hover:opacity-100
                                     scale-75 group-hover:scale-100 transition-all duration-200 border-none cursor-pointer"
                        >
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                    : [0, 1, 2].map((i) => (
                      <div key={i} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                        <svg className="w-6 h-6 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    ))
                  }
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                    <svg width="16" height="16" className="mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <div className="mt-6">
                  <button
                    type="submit" disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-zinc-900 cursor-pointer
                               transition-all duration-200 border-none
                               disabled:opacity-50 disabled:cursor-not-allowed
                               hover:brightness-110  active:translate-y-0 active:brightness-95"
                    style={{
                      background: '#fbbf24',
                      boxShadow: isSubmitting ? 'none' : '0 4px 24px rgba(251,191,36,0.35)',
                    }}
                  >
                    {isSubmitting && (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin mr-2 align-middle" />
                    )}
                    {isSubmitting ? 'Publishing…' : 'Publish Product'}
                  </button>
                  <p className="text-center text-[11px] text-zinc-600 mt-2.5">
                    Your listing will be visible immediately after publishing.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateProduct;
