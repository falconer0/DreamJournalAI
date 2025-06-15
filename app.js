class DreamJournal {
    constructor() {
        this.dreams = this.loadDreams();
        this.initializeEventListeners();
        this.setDefaultDate();
        this.renderDreams();
    }

    loadDreams() {
        const stored = localStorage.getItem('dreamJournal');
        return stored ? JSON.parse(stored) : [];
    }

    saveDreams() {
        localStorage.setItem('dreamJournal', JSON.stringify(this.dreams));
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dreamDate').value = today;
    }

    initializeEventListeners() {
        const form = document.getElementById('dreamForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        const exportJsonBtn = document.getElementById('exportJson');
        const exportCsvBtn = document.getElementById('exportCsv');

        exportJsonBtn.addEventListener('click', () => this.exportJson());
        exportCsvBtn.addEventListener('click', () => this.exportCsv());

        const searchInput = document.getElementById('searchInput');
        const moodFilter = document.getElementById('moodFilter');

        searchInput.addEventListener('input', () => this.filterDreams());
        moodFilter.addEventListener('change', () => this.filterDreams());
    }

    handleSubmit(e) {
        e.preventDefault();

        const dreamData = {
            id: Date.now().toString(),
            date: document.getElementById('dreamDate').value,
            title: document.getElementById('dreamTitle').value,
            content: document.getElementById('dreamContent').value,
            mood: document.getElementById('dreamMood').value,
            createdAt: new Date().toISOString()
        };

        this.addDream(dreamData);
        this.clearForm();
        this.renderDreams();
    }

    addDream(dream) {
        this.dreams.unshift(dream);
        this.saveDreams();
    }

    clearForm() {
        document.getElementById('dreamTitle').value = '';
        document.getElementById('dreamContent').value = '';
        document.getElementById('dreamMood').value = '';
        this.setDefaultDate();
    }

    renderDreams(filteredDreams = null) {
        const container = document.getElementById('dreamsList');
        const dreamsToShow = filteredDreams || this.dreams;

        if (this.dreams.length === 0) {
            container.innerHTML = '<p class="no-dreams">No dreams recorded yet. Start by recording your first dream!</p>';
            this.renderAnalysis();
            return;
        }

        if (dreamsToShow.length === 0) {
            container.innerHTML = '<p class="no-dreams">No dreams match your search criteria.</p>';
            return;
        }

        const dreamsHTML = dreamsToShow.map(dream => `
            <div class="dream-item" data-id="${dream.id}">
                <h3>${dream.title}</h3>
                <div class="dream-meta">
                    ${this.formatDate(dream.date)} ${dream.mood ? `• ${dream.mood}` : ''}
                </div>
                <div class="dream-content">${dream.content}</div>
                <button class="delete-btn" onclick="dreamJournal.deleteDream('${dream.id}')">Delete</button>
            </div>
        `).join('');

        container.innerHTML = dreamsHTML;

        if (!filteredDreams) {
            this.renderAnalysis();
        }
    }

    filterDreams() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const moodFilter = document.getElementById('moodFilter').value;

        const filtered = this.dreams.filter(dream => {
            const matchesSearch = dream.title.toLowerCase().includes(searchTerm) ||
                                dream.content.toLowerCase().includes(searchTerm);
            const matchesMood = !moodFilter || dream.mood === moodFilter;

            return matchesSearch && matchesMood;
        });

        this.renderDreams(filtered);
    }

    deleteDream(dreamId) {
        if (confirm('Are you sure you want to delete this dream?')) {
            this.dreams = this.dreams.filter(dream => dream.id !== dreamId);
            this.saveDreams();

            // Clear filters and re-render
            document.getElementById('searchInput').value = '';
            document.getElementById('moodFilter').value = '';
            this.renderDreams();
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    renderAnalysis() {
        const container = document.getElementById('analysisContent');

        if (this.dreams.length === 0) {
            container.innerHTML = '<p class="no-analysis">Record some dreams to see analysis!</p>';
            return;
        }

        const stats = this.calculateStats();
        const moodData = this.getMoodAnalysis();

        container.innerHTML = `
            <div class="analysis-stats">
                <div class="stat-card">
                    <h4>Total Dreams</h4>
                    <div class="value">${stats.total}</div>
                </div>
                <div class="stat-card">
                    <h4>This Month</h4>
                    <div class="value">${stats.thisMonth}</div>
                </div>
                <div class="stat-card">
                    <h4>Average Length</h4>
                    <div class="value">${stats.avgLength}</div>
                </div>
                <div class="stat-card">
                    <h4>Most Common Mood</h4>
                    <div class="value">${stats.topMood || 'N/A'}</div>
                </div>
            </div>

            <div class="mood-chart">
                <h3>Mood Distribution</h3>
                ${moodData.map(mood => `
                    <div class="mood-item">
                        <span>${mood.name} (${mood.count})</span>
                        <div class="mood-bar" style="width: ${mood.percentage}%"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    calculateStats() {
        const total = this.dreams.length;
        const thisMonth = this.dreams.filter(dream => {
            const dreamDate = new Date(dream.date);
            const now = new Date();
            return dreamDate.getMonth() === now.getMonth() &&
                   dreamDate.getFullYear() === now.getFullYear();
        }).length;

        const avgLength = Math.round(
            this.dreams.reduce((sum, dream) => sum + dream.content.length, 0) / total
        );

        const moodCounts = {};
        this.dreams.forEach(dream => {
            if (dream.mood) {
                moodCounts[dream.mood] = (moodCounts[dream.mood] || 0) + 1;
            }
        });

        const topMood = Object.keys(moodCounts).reduce((a, b) =>
            moodCounts[a] > moodCounts[b] ? a : b, null
        );

        return { total, thisMonth, avgLength, topMood };
    }

    getMoodAnalysis() {
        const moodCounts = {};
        let totalWithMood = 0;

        this.dreams.forEach(dream => {
            if (dream.mood) {
                moodCounts[dream.mood] = (moodCounts[dream.mood] || 0) + 1;
                totalWithMood++;
            }
        });

        return Object.entries(moodCounts)
            .map(([mood, count]) => ({
                name: mood,
                count,
                percentage: Math.round((count / totalWithMood) * 100)
            }))
            .sort((a, b) => b.count - a.count);
    }

    exportJson() {
        if (this.dreams.length === 0) {
            alert('No dreams to export!');
            return;
        }

        const data = {
            exportDate: new Date().toISOString(),
            dreams: this.dreams
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        this.downloadFile(blob, 'dreams-export.json');
    }

    exportCsv() {
        if (this.dreams.length === 0) {
            alert('No dreams to export!');
            return;
        }

        const headers = ['Date', 'Title', 'Content', 'Mood', 'Created At'];
        const csvData = [
            headers.join(','),
            ...this.dreams.map(dream => [
                dream.date,
                `"${dream.title.replace(/"/g, '""')}"`,
                `"${dream.content.replace(/"/g, '""')}"`,
                dream.mood || '',
                dream.createdAt
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvData], { type: 'text/csv' });
        this.downloadFile(blob, 'dreams-export.csv');
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the application
const dreamJournal = new DreamJournal();