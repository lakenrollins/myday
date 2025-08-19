import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

const SEARCH_HISTORY_KEY = 'pinterest_search_history';
const MAX_HISTORY_ITEMS = 10;

export const SearchProvider = ({ children }) => {
  const [currentSearch, setCurrentSearch] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    category: '',
    user: '',
    dateRange: '',
    sortBy: 'relevance' // relevance, recent, popular
  });
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchCallbacks, setSearchCallbacks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, [searchHistory]);

  const registerSearchCallback = useCallback((callback) => {
    setSearchCallbacks(prev => [...prev, callback]);
  }, []);

  const unregisterSearchCallback = useCallback((callback) => {
    setSearchCallbacks(prev => prev.filter(cb => cb !== callback));
  }, []);

  const addToSearchHistory = (query) => {
    if (!query.trim()) return;
    
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.query !== query.trim());
      const newHistory = [
        { query: query.trim(), timestamp: Date.now() },
        ...filtered
      ];
      return newHistory.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const removeFromSearchHistory = (query) => {
    setSearchHistory(prev => prev.filter(item => item.query !== query));
  };

  const performSearch = async (query, filters = {}) => {
    const searchQuery = query.trim();
    setCurrentSearch(searchQuery);
    setSearchFilters(prev => ({ ...prev, ...filters }));
    setIsSearching(true);

    if (searchQuery) {
      addToSearchHistory(searchQuery);
    }

    const searchParams = {
      query: searchQuery,
      ...searchFilters,
      ...filters
    };

    try {
      await Promise.all(
        searchCallbacks.map(async (callback) => {
          try {
            await callback(searchParams);
          } catch (error) {
            console.error('Search callback error:', error);
          }
        })
      );
    } finally {
      setIsSearching(false);
    }
  };

  const updateFilters = (filters) => {
    setSearchFilters(prev => ({ ...prev, ...filters }));
    if (currentSearch) {
      performSearch(currentSearch, filters);
    }
  };

  const clearSearch = () => {
    setCurrentSearch('');
    setSearchFilters({
      category: '',
      user: '',
      dateRange: '',
      sortBy: 'relevance'
    });
    searchCallbacks.forEach(callback => {
      try {
        callback({ query: '', clear: true });
      } catch (error) {
        console.error('Search callback error:', error);
      }
    });
  };

  const getSearchSuggestions = (query) => {
    if (!query.trim()) return [];
    
    const queryLower = query.toLowerCase();
    return searchHistory
      .filter(item => item.query.toLowerCase().includes(queryLower))
      .slice(0, 5)
      .map(item => item.query);
  };

  const value = {
    currentSearch,
    searchFilters,
    searchHistory,
    isSearching,
    performSearch,
    updateFilters,
    clearSearch,
    registerSearchCallback,
    unregisterSearchCallback,
    addToSearchHistory,
    clearSearchHistory,
    removeFromSearchHistory,
    getSearchSuggestions
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;