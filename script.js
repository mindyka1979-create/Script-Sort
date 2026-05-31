document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const sortFilter = document.getElementById('sortFilter');
    const resultsContainer = document.getElementById('resultsContainer');

    let currentResults = [];

    const fetchScriptures = async (query) => {
        resultsContainer.innerHTML = '<div class="status-message">Searching...</div>';
        try {
            // Bible SuperSearch API
            const response = await fetch(`https://api.biblesupersearch.com/api?bible=kjv&search=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.results && Array.isArray(data.results)) {
                // Map API results to a cleaner format
                currentResults = data.results.map(item => {
                    const bookId = item.book_id;
                    const chapter = Object.keys(item.verses.kjv)[0];
                    const verseNum = Object.keys(item.verses.kjv[chapter])[0];
                    const text = item.verses.kjv[chapter][verseNum].text;
                    
                    return {
                        reference: `${item.book_name} ${item.chapter_verse}`,
                        bookName: item.book_name,
                        bookId: bookId, // Canonical order
                        chapter: parseInt(chapter),
                        verse: parseInt(verseNum),
                        text: text.trim()
                    };
                });

                displayResults();
            } else {
                resultsContainer.innerHTML = '<div class="status-message">No results found. Try another keyword.</div>';
            }
        } catch (error) {
            console.error('Error fetching scriptures:', error);
            resultsContainer.innerHTML = '<div class="status-message">Error connecting to the API. Please try again later.</div>';
        }
    };

    const displayResults = () => {
        if (currentResults.length === 0) return;

        // Apply sorting
        const sorted = sortResults([...currentResults]);
        
        // Show first 6 results as requested
        const top6 = sorted.slice(0, 6);

        resultsContainer.innerHTML = '';
        top6.forEach(verse => {
            const card = document.createElement('div');
            card.className = 'verse-card';
            card.innerHTML = `
                <span class="verse-ref">${verse.reference}</span>
                <p class="verse-text">"${verse.text}"</p>
            `;
            resultsContainer.appendChild(card);
        });
    };

    const sortResults = (results) => {
        const sortBy = sortFilter.value;
        
        return results.sort((a, b) => {
            switch (sortBy) {
                case 'az':
                    return a.bookName.localeCompare(b.bookName);
                case 'za':
                    return b.bookName.localeCompare(a.bookName);
                case 'oldest':
                    // Canonical order: Book ID first, then Chapter, then Verse
                    if (a.bookId !== b.bookId) return a.bookId - b.bookId;
                    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                    return a.verse - b.verse;
                case 'newest':
                    if (a.bookId !== b.bookId) return b.bookId - a.bookId;
                    if (a.chapter !== b.chapter) return b.chapter - a.chapter;
                    return b.verse - a.verse;
                default:
                    return 0;
            }
        });
    };

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            fetchScriptures(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                fetchScriptures(query);
            }
        }
    });

    sortFilter.addEventListener('change', () => {
        displayResults();
    });

    // Initial search
    fetchScriptures('faith');
});
