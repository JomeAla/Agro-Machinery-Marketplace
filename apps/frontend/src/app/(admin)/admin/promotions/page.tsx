'use client';

import { useEffect, useState } from 'react';
import {
  getDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode,
  getFeaturedSlots, createFeaturedSlot, updateFeaturedSlot, deleteFeaturedSlot,
  getBanners, createBanner, updateBanner, deleteBanner,
  getCategoryPromotions, createCategoryPromotion, updateCategoryPromotion, deleteCategoryPromotion,
  DiscountCode, FeaturedSlot, Banner, CategoryPromotion
} from '@/lib/api';

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<'discounts' | 'featured' | 'banners' | 'category'>('discounts');
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [slots, setSlots] = useState<FeaturedSlot[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categoryPromos, setCategoryPromos] = useState<CategoryPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'discounts') setDiscounts(await getDiscountCodes());
      if (activeTab === 'featured') setSlots(await getFeaturedSlots());
      if (activeTab === 'banners') setBanners(await getBanners());
      if (activeTab === 'category') setCategoryPromos(await getCategoryPromotions());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(item?: any, type?: string) {
    setEditingItem(item || null);
    if (type === 'discount') {
      setFormData(item || { code: '', discountType: 'PERCENTAGE', discountValue: 0, isActive: true });
    } else if (type === 'slot') {
      setFormData(item || { name: '', duration: 1, price: 0, isActive: true });
    } else if (type === 'banner') {
      setFormData(item || { title: '', imageUrl: '', position: 'HOME', isActive: true, order: 0 });
    } else if (type === 'category') {
      setFormData(item || { discountType: 'PERCENTAGE', discountValue: 0, isActive: true });
    }
    setShowModal(true);
  }

  async function handleSave() {
    try {
      if (activeTab === 'discounts') {
        if (editingItem) await updateDiscountCode(editingItem.id, formData);
        else await createDiscountCode(formData);
      } else if (activeTab === 'featured') {
        if (editingItem) await updateFeaturedSlot(editingItem.id, formData);
        else await createFeaturedSlot(formData);
      } else if (activeTab === 'banners') {
        if (editingItem) await updateBanner(editingItem.id, formData);
        else await createBanner(formData);
      } else if (activeTab === 'category') {
        if (editingItem) await updateCategoryPromotion(editingItem.id, formData);
        else await createCategoryPromotion(formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return;
    try {
      if (activeTab === 'discounts') await deleteDiscountCode(id);
      else if (activeTab === 'featured') await deleteFeaturedSlot(id);
      else if (activeTab === 'banners') await deleteBanner(id);
      else if (activeTab === 'category') await deleteCategoryPromotion(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Promotions Management</h1>
      </div>

      <div className="mb-4">
        <div className="flex border-b">
          {['discounts', 'featured', 'banners', 'category'].map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 capitalize ${activeTab === tab ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab === 'discounts' ? 'Discount Codes' : tab === 'featured' ? 'Featured Products' : tab === 'banners' ? 'Banners' : 'Category Promotions'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <button onClick={() => openModal()} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Add New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'discounts' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {discounts.map(d => (
                    <tr key={d.id}>
                      <td className="px-6 py-4 font-mono">{d.code}</td>
                      <td className="px-6 py-4">{d.discountType}</td>
                      <td className="px-6 py-4">{d.discountType === 'PERCENTAGE' ? `${d.discountValue}%` : `₦${d.discountValue}`}</td>
                      <td className="px-6 py-4">{d.usedCount}{d.maxUses ? `/${d.maxUses}` : ''}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded ${d.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openModal(d, 'discount')} className="text-blue-600 mr-3">Edit</button>
                        <button onClick={() => handleDelete(d.id)} className="text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'featured' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration (days)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {slots.map(s => (
                    <tr key={s.id}>
                      <td className="px-6 py-4">{s.name}</td>
                      <td className="px-6 py-4">{s.duration}</td>
                      <td className="px-6 py-4">₦{Number(s.price).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openModal(s, 'slot')} className="text-blue-600 mr-3">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'banners' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {banners.map(b => (
                    <tr key={b.id}>
                      <td className="px-6 py-4">{b.title}</td>
                      <td className="px-6 py-4">{b.position}</td>
                      <td className="px-6 py-4"><img src={b.imageUrl} alt="" className="h-12 w-20 object-cover" /></td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded ${b.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {b.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openModal(b, 'banner')} className="text-blue-600 mr-3">Edit</button>
                        <button onClick={() => handleDelete(b.id)} className="text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'category' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categoryPromos.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4">{p.category?.name || '-'}</td>
                      <td className="px-6 py-4">{p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `₦${p.discountValue}`}</td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(p.startsAt).toLocaleDateString()} - {new Date(p.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openModal(p, 'category')} className="text-blue-600 mr-3">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit' : 'Add'} {activeTab === 'discounts' ? 'Discount Code' : activeTab === 'featured' ? 'Featured Slot' : activeTab === 'banners' ? 'Banner' : 'Category Promotion'}
            </h3>
            <div className="space-y-4">
              {activeTab === 'discounts' && (
                <>
                  <div><label className="block text-sm font-medium mb-1">Code</label><input type="text" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Type</label><select value={formData.discountType || 'PERCENTAGE'} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full px-4 py-2 border rounded"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Value</label><input type="number" value={formData.discountValue || 0} onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value)})} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Max Uses</label><input type="number" value={formData.maxUses || ''} onChange={e => setFormData({...formData, maxUses: parseInt(e.target.value) || null})} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="flex items-center"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="mr-2" />Active</label></div>
                </>
              )}
              {activeTab === 'featured' && (
                <>
                  <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Duration (days)</label><input type="number" value={formData.duration || 1} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Price (₦)</label><input type="number" value={formData.price || 0} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="flex items-center"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="mr-2" />Active</label></div>
                </>
              )}
              {activeTab === 'banners' && (
                <>
                  <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Image URL</label><input type="text" value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Link URL</label><input type="text" value={formData.linkUrl || ''} onChange={e => setFormData({...formData, linkUrl: e.target.value})} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Position</label><select value={formData.position || 'HOME'} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-4 py-2 border rounded"><option value="HOME">Home</option><option value="CATEGORY">Category</option><option value="PRODUCT">Product</option></select></div>
                  <div><label className="flex items-center"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="mr-2" />Active</label></div>
                </>
              )}
              {activeTab === 'category' && (
                <>
                  <div><label className="block text-sm font-medium mb-1">Discount Type</label><select value={formData.discountType || 'PERCENTAGE'} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full px-4 py-2 border rounded"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Discount Value</label><input type="number" value={formData.discountValue || 0} onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value)})} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="flex items-center"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="mr-2" />Active</label></div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
