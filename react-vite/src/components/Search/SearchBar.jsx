import { useState, useRef, useEffect } from 'react';
import { BsSearch, BsX, BsClock, BsFilter } from 'react-icons/bs';
import { useSearch } from '../../context/SearchContext';
import styles from './SearchBar.module.css';

const SearchBar = ({ 
  placeholder = "Search for ideas...", 
  showFilters = true,
  onFocus,
  onBlur 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const {
    currentSearch,
    searchHistory,
    searchFilters,
    isSearching,
    performSearch,
    updateFilters,
    clearSearch,
    getSearchSuggestions,
    removeFromSearchHistory
  } = useSearch();

  useEffect(() => {
    setInputValue(currentSearch);
  }, [currentSearch]);

  const suggestions = getSearchSuggestions(inputValue);
  const recentSearches = searchHistory.slice(0, 5);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(true);
    setSelectedSuggestion(-1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      performSearch(inputValue);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    performSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    const allSuggestions = [...suggestions, ...recentSearches];
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev < allSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev > 0 ? prev - 1 : allSuggestions.length - 1
      );
    } else if (e.key === 'Enter' && selectedSuggestion >= 0) {
      e.preventDefault();
      const selectedItem = allSuggestions[selectedSuggestion];
      handleSuggestionClick(selectedItem);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
    onFocus?.();
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }, 200);
    onBlur?.();
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
    inputRef.current?.focus();
  };

  const handleFilterChange = (filterType, value) => {
    updateFilters({ [filterType]: value });
  };

  return (
    <div className={styles.searchContainer}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <div className={styles.searchInputContainer}>
          <BsSearch className={styles.searchIcon} />
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={styles.searchInput}
            disabled={isSearching}
          />
          
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearButton}
              aria-label="Clear search"
            >
              <BsX />
            </button>
          )}
          
          {showFilters && (
            <button
              type="button"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`${styles.filterButton} ${showFiltersPanel ? styles.active : ''}`}
              aria-label="Search filters"
            >
              <BsFilter />
            </button>
          )}
        </div>

        {isSearching && <div className={styles.loadingBar} />}
      </form>

      {/* Search Suggestions */}
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div ref={suggestionsRef} className={styles.suggestionsPanel}>
          {suggestions.length > 0 && (
            <div className={styles.suggestionGroup}>
              <div className={styles.suggestionGroupTitle}>Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`${styles.suggestionItem} ${
                    selectedSuggestion === index ? styles.selected : ''
                  }`}
                >
                  <BsSearch className={styles.suggestionIcon} />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className={styles.suggestionGroup}>
              <div className={styles.suggestionGroupTitle}>Recent searches</div>
              {recentSearches.map((item, index) => {
                const adjustedIndex = suggestions.length + index;
                return (
                  <div
                    key={`recent-${index}`}
                    className={`${styles.suggestionItem} ${
                      selectedSuggestion === adjustedIndex ? styles.selected : ''
                    }`}
                  >
                    <button
                      onClick={() => handleSuggestionClick(item.query)}
                      className={styles.suggestionButton}
                    >
                      <BsClock className={styles.suggestionIcon} />
                      <span>{item.query}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromSearchHistory(item.query);
                      }}
                      className={styles.removeButton}
                      aria-label="Remove from history"
                    >
                      <BsX />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filters Panel */}
      {showFiltersPanel && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Sort by:</label>
            <select
              value={searchFilters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="relevance">Relevance</option>
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Category:</label>
            <select
              value={searchFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Categories</option>
              <option value="art">Art</option>
              <option value="photography">Photography</option>
              <option value="design">Design</option>
              <option value="fashion">Fashion</option>
              <option value="food">Food</option>
              <option value="travel">Travel</option>
              <option value="nature">Nature</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Date:</label>
            <select
              value={searchFilters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Any time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;