'use client';

import { useEffect, useState } from 'react';
import { getFaqCategoriesPublic, getFaqArticlesPublic, searchFaqArticles, voteFaqArticle, FaqCategory, FaqArticle } from '@/lib/api';

export default function FaqPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [articles, setArticles] = useState<FaqArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [cats, arts] = await Promise.all([
        getFaqCategoriesPublic(),
        getFaqArticlesPublic()
      ]);
      setCategories(cats);
      setArticles(arts);
    } catch (error) {
      console.error('Failed to fetch FAQ:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }
    setLoading(true);
    try {
      const results = await searchFaqArticles(searchQuery);
      setArticles(results);
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(articleId: string, helpful: boolean) {
    try {
      await voteFaqArticle(articleId, helpful);
      setUserVotes({ ...userVotes, [articleId]: helpful });
      fetchData();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  }

  const filteredArticles = selectedCategory
    ? articles.filter(a => a.categoryId === selectedCategory)
    : articles;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Help Center & FAQ</h1>
          <p className="text-green-100 mb-6">Find answers to common questions about our agricultural machinery marketplace</p>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-green-800 hover:bg-green-900 rounded-lg"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Browse by Category</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-full ${!selectedCategory ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full ${selectedCategory === cat.id ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No articles found</p>
                <p className="mt-2">Try a different search term or category</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="bg-white rounded-lg shadow">
                    <button
                      onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center"
                    >
                      <span className="font-medium text-gray-900">{article.title}</span>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedArticle === article.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedArticle === article.id && (
                      <div className="px-6 pb-4">
                        <div className="prose max-w-none text-gray-600 mb-4">
                          {article.content}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="text-sm text-gray-500">
                            Was this helpful?
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVote(article.id, true)}
                              disabled={!!userVotes[article.id]}
                              className={`px-3 py-1 rounded text-sm ${
                                userVotes[article.id] === true
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-green-50'
                              }`}
                            >
                              Yes ({article.helpfulCount})
                            </button>
                            <button
                              onClick={() => handleVote(article.id, false)}
                              disabled={!!userVotes[article.id]}
                              className={`px-3 py-1 rounded text-sm ${
                                userVotes[article.id] === false
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-red-50'
                              }`}
                            >
                              No ({article.notHelpfulCount})
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-12 bg-green-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-4">Contact our support team for personalized assistance</p>
          <a
            href="mailto:support@agromarket.com"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
